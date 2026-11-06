// Generates C# Domain entities + EF Core configurations + lookup seed data
// from schema.js. Run: node generate.js
const fs = require("fs");
const path = require("path");
const { lookups, entities } = require("./schema");

const ROOT = path.resolve(__dirname, "../../backend/src");
const DOMAIN = path.join(ROOT, "Procurement.Domain");
const INFRA = path.join(ROOT, "Procurement.Infrastructure");

const AUDIT_COLS = ["CreatedAt", "CreatedBy", "UpdatedAt", "UpdatedBy"];

function pascalModule(m) {
  return m.replace(/&/g, "And").replace(/[^A-Za-z0-9]+/g, " ")
    .split(" ").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join("");
}

function csType(sqlType) {
  const t = sqlType.trim();
  let m;
  if (/^BIGINT/.test(t)) return { clr: "long", value: true };
  if (/^SMALLINT/.test(t)) return { clr: "short", value: true };
  if (/^TINYINT$/.test(t)) return { clr: "byte", value: true };
  if (/^INT$/.test(t)) return { clr: "int", value: true };
  if (/^BIT$/.test(t)) return { clr: "bool", value: true };
  if ((m = t.match(/^DECIMAL\((\d+),(\d+)\)$/))) return { clr: "decimal", value: true, dbType: `decimal(${m[1]},${m[2]})` };
  if ((m = t.match(/^VARCHAR\((\d+)\)$/))) return { clr: "string", value: false, maxLength: +m[1] };
  if ((m = t.match(/^NVARCHAR\((\d+)\)$/))) return { clr: "string", value: false, maxLength: +m[1] };
  if (/^NVARCHAR\(MAX\)$/.test(t)) return { clr: "string", value: false, maxLength: null, unbounded: true };
  if ((m = t.match(/^CHAR\((\d+)\)$/))) return { clr: "string", value: false, maxLength: +m[1], fixedLen: true };
  if ((m = t.match(/^VARBINARY\((\d+)\)$/))) return { clr: "byte[]", value: false, maxLength: +m[1] };
  if (/^DATE$/.test(t)) return { clr: "DateOnly", value: true };
  if ((m = t.match(/^DATETIME2\((\d+)\)$/))) return { clr: "DateTime", value: true, dbType: `datetime2(${m[1]})` };
  if (/^UNIQUEIDENTIFIER$/.test(t)) return { clr: "Guid", value: true };
  if (/^ROWVERSION$/.test(t)) return { clr: "byte[]", value: false, rowVersion: true };
  throw new Error("Unmapped SQL type: " + sqlType);
}

function propName(n) { return n; }

function bracket(expr) {
  return expr.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (w) => (w === "true" || w === "false" ? w : `[${w}]`));
}

function emitProperty(c) {
  const t = csType(c.type);
  const nullable = !!c.nullable && !c.pk;
  let clr = t.clr;
  if (nullable) {
    if (t.value) clr += "?";
    else if (clr !== "byte[]") clr += "?";
  }
  let init = "";
  if (!nullable && t.clr === "string") init = " = string.Empty;";
  else if (!nullable && t.clr === "byte[]") init = " = System.Array.Empty<byte>();";
  else if (!nullable && t.clr === "bool" && c.default) init = ` = ${c.default === "1" ? "true" : "false"};`;
  return `    public ${clr} ${c.name} { get; set; }${init}`;
}

function genEntity(table, nsBase, moduleFolder, hasAudit) {
  const skip = hasAudit ? AUDIT_COLS : [];
  const baseClass = hasAudit ? "AuditableEntity" : null;
  const lines = [];
  // Flat namespace (folders below are disk-only organization): a module folder
  // sharing its name with one of its own tables (Documents, Vendors, Notifications)
  // would otherwise collide with that type name in C#'s namespace resolution.
  lines.push(`namespace ${nsBase}.Entities;`);
  lines.push("");
  if (hasAudit) lines.push(`using ${nsBase}.Common;`);
  if (hasAudit) lines.push("");
  lines.push(`public class ${table.name}${baseClass ? " : " + baseClass : ""}`);
  lines.push("{");
  for (const c of table.columns) {
    if (skip.includes(c.name)) continue;
    lines.push(emitProperty(c));
  }
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

function resolveParent(ref) {
  const [tbl, column] = ref.split(".");
  return { tbl, column };
}

function genConfiguration(table, nsBase, moduleFolder, hasAudit) {
  const skip = hasAudit ? AUDIT_COLS : [];
  const lines = [];
  lines.push("using Microsoft.EntityFrameworkCore;");
  lines.push("using Microsoft.EntityFrameworkCore.Metadata.Builders;");
  lines.push(`using ${nsBase}.Entities;`);
  lines.push("");
  lines.push(`namespace Procurement.Infrastructure.Persistence.Configurations;`);
  lines.push("");
  lines.push(`public class ${table.name}Configuration : IEntityTypeConfiguration<${table.name}>`);
  lines.push("{");
  lines.push(`    public void Configure(EntityTypeBuilder<${table.name}> b)`);
  lines.push("    {");
  lines.push(`        b.ToTable("${table.name}");`);

  const pkCol = table.columns.find((c) => c.pk);
  lines.push(`        b.HasKey(x => x.${pkCol.name});`);
  if (/IDENTITY/.test(pkCol.type)) {
    lines.push(`        b.Property(x => x.${pkCol.name}).UseIdentityColumn();`);
  } else {
    lines.push(`        b.Property(x => x.${pkCol.name}).ValueGeneratedNever();`);
  }

  for (const c of table.columns) {
    if (c.pk || skip.includes(c.name)) continue;
    const t = csType(c.type);
    const propAccess = `x => x.${c.name}`;
    let line = `        b.Property(${propAccess})`;
    if (t.dbType) line += `.HasColumnType("${t.dbType}")`;
    if (t.maxLength && !t.fixedLen) line += `.HasMaxLength(${t.maxLength})`;
    if (t.fixedLen) line += `.HasMaxLength(${t.maxLength}).IsFixedLength()`;
    if (!c.nullable) line += `.IsRequired()`;
    if (c.default) line += `.HasDefaultValueSql("${c.default.replace(/"/g, '\\"')}")`;
    if (c.computed) line += `.HasComputedColumnSql("${bracket(c.computed)}", stored: false)`;
    if (t.rowVersion) line += `.IsRowVersion()`;
    // Literal (non-function) defaults: always send the CLR value on insert rather than
    // letting EF's generated-value sentinel logic silently swap an explicit false/0 for the
    // DB default (see https://aka.ms/efcore-docs-default-values).
    if (c.default && !/\(\)$/.test(c.default)) line += `.ValueGeneratedNever()`;
    line += ";";
    lines.push(line);
  }

  // unique single-column
  for (const c of table.columns) {
    if (c.unique && !c.pk && !skip.includes(c.name)) lines.push(`        b.HasIndex(x => x.${c.name}).IsUnique();`);
  }
  if (table.compositeUnique) {
    for (const cols of table.compositeUnique) {
      lines.push(`        b.HasIndex(x => new { ${cols.map((x) => "x." + x).join(", ")} }).IsUnique();`);
    }
  }
  if (table.unique) {
    lines.push(`        b.HasIndex(x => new { ${table.unique.map((x) => "x." + x).join(", ")} }).IsUnique();`);
  }

  // foreign keys (CreatedBy/UpdatedBy are configured once, generically, in ProcurementDbContext)
  const fkCols = table.columns.filter((c) => c.fk && !skip.includes(c.name));
  for (const c of fkCols) {
    const { tbl } = resolveParent(c.fk);
    const nav = `x => x.${c.name}`;
    lines.push(`        b.HasOne<${tbl}>().WithMany().HasForeignKey(${nav}).OnDelete(DeleteBehavior.NoAction)${c.nullable ? ".IsRequired(false)" : ".IsRequired()"};`);
  }

  lines.push("    }");
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

function writeFile(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

const allTables = [];

// ---- Lookups ----
for (const t of lookups) {
  const moduleFolder = "Lookups";
  const nsBase = "Procurement.Domain";
  writeFile(
    path.join(DOMAIN, "Entities", moduleFolder, `${t.name}.cs`),
    genEntity(t, nsBase, moduleFolder, false)
  );
  writeFile(
    path.join(INFRA, "Persistence", "Configurations", moduleFolder, `${t.name}Configuration.cs`),
    genConfiguration(t, nsBase, moduleFolder, false)
  );
  allTables.push({ ...t, moduleFolder, hasAudit: false });
}

// ---- Entities ----
for (const t of entities) {
  const moduleFolder = pascalModule(t.module);
  const nsBase = "Procurement.Domain";
  const hasAudit = AUDIT_COLS.every((a) => t.columns.some((c) => c.name === a));
  writeFile(
    path.join(DOMAIN, "Entities", moduleFolder, `${t.name}.cs`),
    genEntity(t, nsBase, moduleFolder, hasAudit)
  );
  writeFile(
    path.join(INFRA, "Persistence", "Configurations", moduleFolder, `${t.name}Configuration.cs`),
    genConfiguration(t, nsBase, moduleFolder, hasAudit)
  );
  allTables.push({ ...t, moduleFolder, hasAudit });
}

// ---- AuditableEntity base ----
writeFile(
  path.join(DOMAIN, "Common", "AuditableEntity.cs"),
  `namespace Procurement.Domain.Common;

public abstract class AuditableEntity
{
    public DateTime CreatedAt { get; set; }
    public long CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public long? UpdatedBy { get; set; }
}
`
);

// ---- DbContext: OnModelCreating applies all configurations + configures CreatedBy/UpdatedBy FKs generically ----
const allModuleFolders = [...new Set(allTables.map((t) => t.moduleFolder))];
const dbSetLines = allTables.map((t) => `    public DbSet<${t.name}> ${t.name} => Set<${t.name}>();`).join("\n");

writeFile(
  path.join(INFRA, "Persistence", "ProcurementDbContext.cs"),
  `using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Entities;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Persistence;

public class ProcurementDbContext : DbContext, IApplicationDbContext
{
    public ProcurementDbContext(DbContextOptions<ProcurementDbContext> options) : base(options) { }

${dbSetLines}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProcurementDbContext).Assembly);

        // Every AuditableEntity gets CreatedBy/UpdatedBy -> Users.Id, configured once here
        // instead of repeating it in every generated *Configuration class.
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(Procurement.Domain.Common.AuditableEntity).IsAssignableFrom(entityType.ClrType)) continue;

            // Self-referencing on Users (who created/updated this user) is fine: SQL Server
            // checks FK constraints at statement completion, so a bootstrap admin row can
            // reference its own just-inserted Id in the same INSERT.
            modelBuilder.Entity(entityType.ClrType)
                .HasOne(typeof(Users)).WithMany()
                .HasForeignKey("CreatedBy")
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired();

            modelBuilder.Entity(entityType.ClrType)
                .HasOne(typeof(Users)).WithMany()
                .HasForeignKey("UpdatedBy")
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
        }

        // Document numbering sequences (PR-/PO-/MPO-/GRN-/INV-/VR-/RP- + year), read via
        // IDocumentNumberGenerator - never generated client-side.
        modelBuilder.HasSequence<int>("seq_pr").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_po").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_mpo").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_grn").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_inv").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_vr").StartsAt(1).IncrementsBy(1);
        modelBuilder.HasSequence<int>("seq_rp").StartsAt(1).IncrementsBy(1);
    }
}
`
);

// ---- Lookup seed data (idempotent runtime seeder input) ----
function seedEntry(seed, sortOrder) {
  if (typeof seed === "string") return { code: seed, name: humanize(seed), sortOrder, terminal: false };
  return { code: seed.code, name: humanize(seed.code), sortOrder, terminal: !!seed.terminal };
}
function humanize(code) {
  return code.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (s) => s.toUpperCase());
}

const lookupSeedLines = [];
for (const t of lookups) {
  if (t.pkIsCode) continue; // Currencies handled separately below
  const rows = t.seeds.map((s, i) => seedEntry(s, (i + 1) * 10));
  lookupSeedLines.push(`        yield return new LookupSeed("${t.name}", new LookupRow[] {`);
  for (const r of rows) {
    lookupSeedLines.push(`            new("${r.code}", "${r.name}", ${r.sortOrder}, ${r.terminal}),`);
  }
  lookupSeedLines.push("        });");
}

writeFile(
  path.join(INFRA, "Persistence", "Seed", "LookupSeedData.cs"),
  `namespace Procurement.Infrastructure.Persistence.Seed;

public record LookupRow(string Code, string Name, short SortOrder, bool IsTerminal);
public record LookupSeed(string TableName, LookupRow[] Rows);

// Generated from tools/schema/schema.js - do not hand-edit; re-run generate.js instead.
public static class LookupSeedData
{
    public static IEnumerable<LookupSeed> All()
    {
${lookupSeedLines.join("\n")}
        yield return new LookupSeed("Currencies", new LookupRow[] {
            new("PKR", "Pakistani Rupee", 10, false),
            new("USD", "US Dollar", 20, false),
            new("AED", "UAE Dirham", 30, false),
        });
    }
}
`
);

// ---- IApplicationDbContext (Application layer's view of the data store) ----
const APP = path.join(ROOT, "Procurement.Application");
const iDbSetLines = allTables.map((t) => `    DbSet<${t.name}> ${t.name} { get; }`).join("\n");
writeFile(
  path.join(APP, "Common", "Interfaces", "IApplicationDbContext.cs"),
  `using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Entities;

namespace Procurement.Application.Common.Interfaces;

// Mirrors ProcurementDbContext's DbSets so Application handlers can query/persist without
// taking a compile-time dependency on Procurement.Infrastructure.
public interface IApplicationDbContext
{
    DbSet<T> Set<T>() where T : class;

${iDbSetLines}

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
`
);

console.log(`Generated ${allTables.length} tables (${lookups.length} lookups + ${entities.length} entities).`);
console.log("Module folders:", allModuleFolders.join(", "));
