using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

// Demo/dev data: departments, locations, a category/item tree, a few vendors in different
// states, and one login per role so the delivered system is usable out of the box. Everything
// here is additive and idempotent (checked by Code/Email before insert) so it is safe next to
// real data a user later enters - this seeder simply stops finding anything to add.
public class DemoDataSeeder
{
    public const string DemoPassword = "Passw0rd!1";

    private readonly ProcurementDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ILogger<DemoDataSeeder> _logger;

    public DemoDataSeeder(ProcurementDbContext db, IPasswordHasher hasher, ILogger<DemoDataSeeder> logger)
    {
        _db = db;
        _hasher = hasher;
        _logger = logger;
    }

    public async Task<Dictionary<string, long>> SeedDepartmentsAndLocationsAsync(long systemUserId, CancellationToken ct = default)
    {
        var departments = new (string Code, string Name)[]
        {
            ("OPD", "Office of the Procurement Director"),
            ("PROC", "Procurement"),
            ("FIN", "Finance"),
            ("AUDIT", "Audit"),
            ("IT", "Information Technology"),
            ("ENG", "Engineering & Facilities"),
        };
        foreach (var (code, name) in departments)
        {
            if (await _db.Departments.AnyAsync(d => d.Code == code, ct)) continue;
            _db.Departments.Add(new Departments { Code = code, Name = name, CreatedBy = systemUserId });
        }
        await _db.SaveChangesAsync(ct);

        var locations = new (string Code, string Name, string Address)[]
        {
            ("HQ", "Head Office", "Crest Tower, Karachi"),
            ("SITE", "Site Office", "CEO House, Lahore"),
        };
        foreach (var (code, name, address) in locations)
        {
            if (await _db.Locations.AnyAsync(l => l.Code == code, ct)) continue;
            _db.Locations.Add(new Locations { Code = code, Name = name, Address = address, CreatedBy = systemUserId });
        }
        await _db.SaveChangesAsync(ct);

        return await _db.Departments.ToDictionaryAsync(d => d.Code, d => d.Id, ct);
    }

    public async Task SeedRemainingAsync(long systemUserId, CancellationToken ct = default)
    {
        var dept = await _db.Departments.ToDictionaryAsync(d => d.Code, d => d.Id, ct);
        var loc = await _db.Locations.ToDictionaryAsync(l => l.Code, l => l.Id, ct);
        var roles = await _db.Roles.ToDictionaryAsync(r => r.Code, r => r.Id, ct);

        // ---- Units ----
        var units = new (string Code, string Name)[] { ("EA", "Each"), ("BOX", "Box"), ("KG", "Kilogram"), ("BAG", "Bag"), ("SVC", "Service") };
        foreach (var (code, name) in units)
        {
            if (await _db.Units.AnyAsync(u => u.Code == code, ct)) continue;
            _db.Units.Add(new Domain.Entities.Units { Code = code, Name = name });
        }
        await _db.SaveChangesAsync(ct);
        var unitIds = await _db.Units.ToDictionaryAsync(u => u.Code, u => u.Id, ct);

        // ---- Categories (2-level tree) ----
        if (!await _db.Categories.AnyAsync(ct))
        {
            var itEquip = new Categories { Code = "IT-EQUIP", Name = "IT Equipment", CreatedBy = systemUserId };
            var officeSupp = new Categories { Code = "OFFICE-SUPP", Name = "Office Supplies", CreatedBy = systemUserId };
            var civilWorks = new Categories { Code = "CIVIL-WORKS", Name = "Civil & Facility Works", CreatedBy = systemUserId };
            _db.Categories.AddRange(itEquip, officeSupp, civilWorks);
            await _db.SaveChangesAsync(ct);

            _db.Categories.AddRange(
                new Categories { Code = "IT-EQUIP-COMP", Name = "Computers & Peripherals", ParentId = itEquip.Id, CreatedBy = systemUserId },
                new Categories { Code = "OFFICE-SUPP-STATIONERY", Name = "Stationery", ParentId = officeSupp.Id, CreatedBy = systemUserId },
                new Categories { Code = "CIVIL-WORKS-AC", Name = "AC & Generator Maintenance", ParentId = civilWorks.Id, CreatedBy = systemUserId }
            );
            await _db.SaveChangesAsync(ct);
        }
        var cat = await _db.Categories.ToDictionaryAsync(c => c.Code, c => c.Id, ct);

        // ---- Department <-> Category access ----
        var deptCategoryPairs = new (string Dept, string Cat)[]
        {
            ("IT", "IT-EQUIP"), ("IT", "IT-EQUIP-COMP"), ("IT", "OFFICE-SUPP"), ("IT", "OFFICE-SUPP-STATIONERY"),
            ("ENG", "CIVIL-WORKS"), ("ENG", "CIVIL-WORKS-AC"),
            ("PROC", "IT-EQUIP"), ("PROC", "IT-EQUIP-COMP"), ("PROC", "OFFICE-SUPP"), ("PROC", "OFFICE-SUPP-STATIONERY"),
            ("PROC", "CIVIL-WORKS"), ("PROC", "CIVIL-WORKS-AC"),
        };
        foreach (var (d, c) in deptCategoryPairs)
        {
            if (!dept.ContainsKey(d) || !cat.ContainsKey(c)) continue;
            var exists = await _db.DepartmentCategories.AnyAsync(x => x.DepartmentId == dept[d] && x.CategoryId == cat[c], ct);
            if (!exists) _db.DepartmentCategories.Add(new DepartmentCategories { DepartmentId = dept[d], CategoryId = cat[c] });
        }
        await _db.SaveChangesAsync(ct);

        // ---- Items ----
        if (!await _db.Items.AnyAsync(ct))
        {
            _db.Items.AddRange(
                new Items { Code = "ITM-LAPTOP", Name = "Business Laptop (Core i5, 16GB)", CategoryId = cat["IT-EQUIP-COMP"], UnitId = unitIds["EA"], CreatedBy = systemUserId },
                new Items { Code = "ITM-PRINTER-TONER", Name = "Laser Printer Toner Cartridge", CategoryId = cat["IT-EQUIP-COMP"], UnitId = unitIds["EA"], CreatedBy = systemUserId },
                new Items { Code = "ITM-A4-PAPER", Name = "A4 Paper (Ream)", CategoryId = cat["OFFICE-SUPP-STATIONERY"], UnitId = unitIds["BOX"], CreatedBy = systemUserId },
                new Items { Code = "ITM-AC-REPAIR", Name = "Split AC Repair Service", CategoryId = cat["CIVIL-WORKS-AC"], UnitId = unitIds["SVC"], CreatedBy = systemUserId },
                new Items { Code = "ITM-GENERATOR-SVC", Name = "Generator Maintenance Service", CategoryId = cat["CIVIL-WORKS-AC"], UnitId = unitIds["SVC"], CreatedBy = systemUserId }
            );
            await _db.SaveChangesAsync(ct);
        }

        // ---- Vendors ----
        if (!await _db.Vendors.AnyAsync(ct))
        {
            var statuses = await _db.VendorStatuses.ToDictionaryAsync(s => s.Code, s => s.Id, ct);
            var star = new Vendors
            {
                VendorCode = "VEN-0001", LegalName = "Al-Falah Traders (Pvt) Ltd", Ntn = "1234567-8",
                VendorStatusId = statuses["Approved"], HasDeliveryHistory = true,
                OnTimeScore = 95, PriceScore = 85, QualityScore = 90, OverallScore = 90.5m, IsStarVendor = true,
                CreatedBy = systemUserId,
            };
            var approved = new Vendors
            {
                VendorCode = "VEN-0002", LegalName = "Zafar Electronics & Supplies", Ntn = "2234567-8",
                VendorStatusId = statuses["Approved"], HasDeliveryHistory = true,
                OnTimeScore = 70, PriceScore = 65, QualityScore = 72, OverallScore = 69.1m, IsStarVendor = false,
                CreatedBy = systemUserId,
            };
            var newVendor = new Vendors
            {
                VendorCode = "VEN-0003", LegalName = "New Horizon Supplies", Ntn = "3234567-8",
                VendorStatusId = statuses["Approved"], HasDeliveryHistory = false, IsStarVendor = false,
                CreatedBy = systemUserId,
            };
            var blacklisted = new Vendors
            {
                VendorCode = "VEN-0004", LegalName = "Crescent General Order Suppliers", Ntn = "4234567-8",
                VendorStatusId = statuses["Blacklisted"], HasDeliveryHistory = true,
                BlacklistReason = "Repeated late delivery and a rejected bank-title mismatch.",
                CreatedBy = systemUserId,
            };
            _db.Vendors.AddRange(star, approved, newVendor, blacklisted);
            await _db.SaveChangesAsync(ct);

            _db.VendorCategories.AddRange(
                new VendorCategories { VendorId = star.Id, CategoryId = cat["IT-EQUIP-COMP"] },
                new VendorCategories { VendorId = star.Id, CategoryId = cat["OFFICE-SUPP-STATIONERY"] },
                new VendorCategories { VendorId = approved.Id, CategoryId = cat["IT-EQUIP-COMP"] },
                new VendorCategories { VendorId = newVendor.Id, CategoryId = cat["CIVIL-WORKS-AC"] },
                new VendorCategories { VendorId = blacklisted.Id, CategoryId = cat["IT-EQUIP-COMP"] }
            );

            _db.VendorBankAccounts.AddRange(
                new VendorBankAccounts { VendorId = star.Id, BankName = "Habib Bank Ltd", AccountTitle = "Al-Falah Traders (Pvt) Ltd", AccountNoEncrypted = Convert.FromBase64String("QUxGQUxBSC0wMDE="), AccountNoMasked = "****1234", TitleMatchesLegalName = true, IsActive = true, CreatedBy = systemUserId },
                new VendorBankAccounts { VendorId = approved.Id, BankName = "United Bank Ltd", AccountTitle = "Zafar Electronics & Supplies", AccountNoEncrypted = Convert.FromBase64String("WkFGQVItMDAy"), AccountNoMasked = "****5678", TitleMatchesLegalName = true, IsActive = true, CreatedBy = systemUserId }
            );
            await _db.SaveChangesAsync(ct);
        }

        // ---- Demo users (one per role, one extra HOD so Procurement has its own HOD) ----
        var demoUsers = new (string EmployeeNo, string Name, string Email, string DeptCode, string RoleCode, long? ScopeDeptId)[]
        {
            ("EMP-1001", "Ali Raza (Requestor)", "requestor@procurement.local", "IT", "REQUESTOR", null),
            ("EMP-1002", "Bilal Ahmed (HOD - IT)", "hod.it@procurement.local", "IT", "HOD", dept.GetValueOrDefault("IT")),
            ("EMP-1003", "Sana Malik (Procurement HOD)", "hod.procurement@procurement.local", "PROC", "HOD", dept.GetValueOrDefault("PROC")),
            ("EMP-1004", "Usman Tariq (Procurement)", "procurement@procurement.local", "PROC", "PROCUREMENT", null),
            ("EMP-1005", "Ayesha Khan (Finance)", "finance@procurement.local", "FIN", "FINANCE", null),
            ("EMP-1006", "Hassan Siddiqui (Audit)", "audit@procurement.local", "AUDIT", "AUDIT", null),
            ("EMP-1007", "Farah Jamil (OPD)", "opd@procurement.local", "OPD", "OPD", null),
            ("EMP-1008", "System Administrator", "sysadmin@procurement.local", "OPD", "SYSADMIN", null),
            ("EMP-1009", "Nadia Qureshi (HOD - Engineering)", "hod.eng@procurement.local", "ENG", "HOD", dept.GetValueOrDefault("ENG")),
        };

        foreach (var (empNo, name, email, deptCode, roleCode, scopeDeptId) in demoUsers)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
            if (user is null)
            {
                user = new Users
                {
                    EmployeeNo = empNo,
                    DisplayName = name,
                    Email = email,
                    DepartmentId = dept[deptCode],
                    PasswordHash = _hasher.Hash(DemoPassword),
                    CreatedBy = systemUserId,
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync(ct);
            }

            var hasRole = await _db.UserRoleAssignments.AnyAsync(
                a => a.UserId == user.Id && a.RoleId == roles[roleCode] && a.DepartmentId == scopeDeptId, ct);
            if (!hasRole)
            {
                _db.UserRoleAssignments.Add(new UserRoleAssignments
                {
                    UserId = user.Id,
                    RoleId = roles[roleCode],
                    DepartmentId = scopeDeptId,
                    ValidFrom = DateOnly.FromDateTime(DateTime.UtcNow),
                    CreatedBy = systemUserId,
                });
            }

            var hasOwnDeptAccess = await _db.UserDepartmentAccess.AnyAsync(a => a.UserId == user.Id && a.DepartmentId == dept[deptCode], ct);
            if (!hasOwnDeptAccess)
            {
                _db.UserDepartmentAccess.Add(new UserDepartmentAccess { UserId = user.Id, DepartmentId = dept[deptCode], CreatedBy = systemUserId });
            }

            // OPD can raise a PR for (and therefore needs declared access to) any department.
            if (roleCode == "OPD")
            {
                foreach (var d in dept.Values)
                {
                    if (await _db.UserDepartmentAccess.AnyAsync(a => a.UserId == user.Id && a.DepartmentId == d, ct)) continue;
                    _db.UserDepartmentAccess.Add(new UserDepartmentAccess { UserId = user.Id, DepartmentId = d, CreatedBy = systemUserId });
                }
            }
        }
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Seeded demo org data: {Departments} departments, {Users} users.", dept.Count, demoUsers.Length);
    }
}
