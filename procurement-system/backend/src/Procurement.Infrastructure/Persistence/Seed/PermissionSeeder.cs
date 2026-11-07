using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

// The Role Action Matrix from the business requirements, as data (RolePermissions), per
// PROJECT.md's "Identity & Org: RolePermissions" note. This is the coarse "can this role ever
// do this" layer; which specific record and when is still gated by the workflow task/scope
// checks in IWorkflowEngine.
public class PermissionSeeder
{
    public static readonly (string Code, string Description)[] Permissions =
    {
        ("PR.CREATE", "Raise a purchase requisition"),
        ("PR.APPROVE", "Approve, return or reject a PR at an approval stage"),
        ("PR.REFER", "Refer a PR to OPD with a remark (Finance only)"),
        ("PR.ACKNOWLEDGE", "Acknowledge delivery and rate the vendor"),
        ("PR.BILL_UPLOAD", "Upload the period's bill on a Cyclic Fixed (bill) recurring PR"),
        ("PR.FORCE_REVERT", "Force-revert a PR (OPD only)"),
        ("PR.VOID", "Void a PR (OPD only)"),
        ("VENDOR.REGISTER", "Register a vendor"),
        ("VENDOR.VET", "Procurement accept/reject a vendor registration"),
        ("VENDOR.APPROVE", "Procurement-HOD approve/reject a vendor registration"),
        ("VENDOR.BLACKLIST", "Blacklist or reinstate a vendor"),
        ("MARKETSURVEY.MANAGE", "Enter market guidance survey prices"),
        ("CATALOG.MANAGE", "Manage departments, categories, items, units and projects"),
        ("SOURCING.GROUP", "Accept a PR and group its lines for sourcing"),
        ("SOURCING.QUOTE", "Enter quotations against a sourcing group"),
        ("SOURCING.SELECT", "Select the quote for a sourcing group"),
        ("SOURCING.OVERRIDE", "Override a suggested vendor with a reason"),
        ("SOURCING.QUOTE_REVIEW", "Accept the recommended quote or approve a justified higher one"),
        ("PO.CREATE", "Create purchase orders"),
        ("PO.AMEND", "Amend purchase order terms"),
        ("CONTRACT.MANAGE", "Generate contracts and upload the signed contract and cheque"),
        ("GRN.RECORD", "Record a goods receipt"),
        ("BILL.UPLOAD", "Upload a vendor bill against a PO"),
        ("BILL.FORWARD", "Forward a bill to the Finance Portal"),
        ("AUDIT.QUERY", "Raise an audit query or hold"),
        ("AUDIT.STAMP", "Verify paid and received, and stamp a PR"),
        ("AUDIT.MONTHEND", "Run the month-end expense audit"),
        ("ITEMREQUEST.DECIDE", "Approve or reject a new item/category request"),
        ("OPD.POLICY", "Change approval bands, quotation rules and policy settings"),
        ("OPD.LOCATIONS", "Add or change locations"),
        ("OPD.RECURRING", "Set up and approve recurring plans"),
        ("OPD.USERS", "Manage departments, users and department access"),
        ("ADMIN.USERS", "System administration: users and roles"),
        ("ADMIN.ROLES", "System administration: roles and permissions"),
    };

    private static readonly Dictionary<string, string[]> RoleMap = new()
    {
        ["REQUESTOR"] = new[] { "PR.CREATE", "PR.ACKNOWLEDGE", "PR.BILL_UPLOAD", "VENDOR.REGISTER" },
        ["HOD"] = new[] { "PR.APPROVE", "VENDOR.REGISTER", "VENDOR.APPROVE" },
        ["PROCUREMENT"] = new[]
        {
            "SOURCING.GROUP", "SOURCING.QUOTE", "SOURCING.SELECT", "SOURCING.OVERRIDE", "PO.CREATE", "PO.AMEND",
            "CONTRACT.MANAGE", "GRN.RECORD", "BILL.UPLOAD", "BILL.FORWARD", "VENDOR.VET", "VENDOR.BLACKLIST",
            "MARKETSURVEY.MANAGE", "VENDOR.REGISTER", "CATALOG.MANAGE",
        },
        ["FINANCE"] = new[] { "PR.APPROVE", "PR.REFER" },
        ["AUDIT"] = new[] { "PR.APPROVE", "AUDIT.QUERY", "AUDIT.STAMP", "AUDIT.MONTHEND", "SOURCING.QUOTE_REVIEW" },
        ["OPD"] = new[]
        {
            "PR.CREATE", "PR.APPROVE", "PR.FORCE_REVERT", "PR.VOID", "PR.BILL_UPLOAD", "VENDOR.REGISTER", "ITEMREQUEST.DECIDE",
            "OPD.POLICY", "OPD.LOCATIONS", "OPD.RECURRING", "OPD.USERS", "CATALOG.MANAGE",
        },
        ["SYSADMIN"] = new[] { "ADMIN.USERS", "ADMIN.ROLES" },
    };

    private readonly ProcurementDbContext _db;
    private readonly ILogger<PermissionSeeder> _logger;

    public PermissionSeeder(ProcurementDbContext db, ILogger<PermissionSeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var existingCodes = await _db.Permissions.Select(p => p.Code).ToListAsync(ct);
        foreach (var (code, description) in Permissions)
        {
            if (existingCodes.Contains(code)) continue;
            _db.Permissions.Add(new Domain.Entities.Permissions { Code = code, Description = description });
        }
        await _db.SaveChangesAsync(ct);

        var permissionIds = await _db.Permissions.ToDictionaryAsync(p => p.Code, p => p.Id, ct);
        var roleIds = await _db.Roles.ToDictionaryAsync(r => r.Code, r => r.Id, ct);
        var existingPairs = (await _db.RolePermissions.ToListAsync(ct)).Select(rp => (rp.RoleId, rp.PermissionId)).ToHashSet();

        foreach (var (roleCode, codes) in RoleMap)
        {
            if (!roleIds.TryGetValue(roleCode, out var roleId)) continue;
            foreach (var code in codes)
            {
                var permissionId = permissionIds[code];
                if (existingPairs.Contains((roleId, permissionId))) continue;
                _db.RolePermissions.Add(new Domain.Entities.RolePermissions { RoleId = roleId, PermissionId = permissionId });
            }
        }
        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded {Count} permissions and the role action matrix.", Permissions.Length);
    }
}
