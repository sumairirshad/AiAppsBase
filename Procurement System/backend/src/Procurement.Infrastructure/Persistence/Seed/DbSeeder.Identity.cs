using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

public static partial class DbSeeder
{
    public const string DevSeedPassword = "Passw0rd!";

    private static async Task<Dictionary<string, Roles>> SeedRolesAndPermissionsAsync(ProcurementDbContext db)
    {
        if (!await db.Roles.AnyAsync())
        {
            db.Roles.AddRange(
                new Roles { Code = RoleCodes.Requestor, Name = "Requestor" },
                new Roles { Code = RoleCodes.Hod, Name = "Head of Department" },
                new Roles { Code = RoleCodes.Procurement, Name = "Procurement" },
                new Roles { Code = RoleCodes.Finance, Name = "Finance" },
                new Roles { Code = RoleCodes.Audit, Name = "Audit" },
                new Roles { Code = RoleCodes.Opd, Name = "OPD" },
                new Roles { Code = RoleCodes.SysAdmin, Name = "System Administrator" },
                new Roles { Code = RoleCodes.System, Name = "System" });
            await db.SaveChangesAsync();
        }

        var roles = await db.Roles.ToDictionaryAsync(r => r.Code);

        if (!await db.Permissions.AnyAsync())
        {
            string[] permissionCodes =
            {
                "PR.CREATE", "PR.SUBMIT", "PR.APPROVE", "PR.REJECT", "PR.RETURN", "PR.VIEW_ALL", "PR.VIEW_OWN_DEPT", "PR.ACKNOWLEDGE",
                "VENDOR.REGISTER", "VENDOR.DECIDE", "VENDOR.APPROVE", "VENDOR.BLACKLIST",
                "SOURCING.MANAGE", "SOURCING.QUOTE_ACCEPT", "SOURCING.QUOTE_OVERRIDE",
                "PO.CREATE", "PO.AMEND", "CONTRACT.MANAGE", "GRN.CREATE",
                "BILL.UPLOAD", "BILL.FORWARD",
                "AUDIT.QUERY", "AUDIT.STAMP", "AUDIT.MONTHEND",
                "BUDGET.CHECK", "BUDGET.OPD_EXCEPTION",
                "ADMIN.USERS", "ADMIN.ROLES", "ADMIN.POLICY", "ADMIN.LOCATIONS", "ADMIN.FORCE_REVERT", "ADMIN.VOID", "ADMIN.RECURRING_PLANS",
            };
            foreach (var code in permissionCodes)
            {
                db.Permissions.Add(new Permissions { Code = code, Description = SeedHelpers.Humanize(code.Replace('.', ' ').Replace('_', ' ')) });
            }
            await db.SaveChangesAsync();

            var permissions = await db.Permissions.ToDictionaryAsync(p => p.Code);
            void Grant(string roleCode, params string[] permCodes)
            {
                foreach (var pc in permCodes)
                {
                    db.RolePermissions.Add(new RolePermissions { RoleId = roles[roleCode].Id, PermissionId = permissions[pc].Id });
                }
            }

            Grant(RoleCodes.Requestor, "PR.CREATE", "PR.SUBMIT", "PR.ACKNOWLEDGE", "VENDOR.REGISTER", "PR.VIEW_OWN_DEPT");
            Grant(RoleCodes.Hod, "PR.APPROVE", "PR.REJECT", "PR.RETURN", "PR.VIEW_OWN_DEPT", "VENDOR.APPROVE");
            Grant(RoleCodes.Procurement, "PR.CREATE", "PR.SUBMIT", "VENDOR.REGISTER", "VENDOR.DECIDE", "VENDOR.BLACKLIST",
                "SOURCING.MANAGE", "SOURCING.QUOTE_OVERRIDE", "PO.CREATE", "PO.AMEND", "CONTRACT.MANAGE", "GRN.CREATE",
                "BILL.UPLOAD", "BILL.FORWARD", "PR.VIEW_ALL");
            Grant(RoleCodes.Finance, "PR.APPROVE", "PR.REJECT", "BUDGET.CHECK", "PR.VIEW_ALL");
            Grant(RoleCodes.Audit, "PR.APPROVE", "PR.REJECT", "SOURCING.QUOTE_ACCEPT", "AUDIT.QUERY", "AUDIT.STAMP", "AUDIT.MONTHEND", "PR.VIEW_ALL");
            Grant(RoleCodes.Opd, "PR.CREATE", "PR.SUBMIT", "BUDGET.OPD_EXCEPTION", "SOURCING.QUOTE_ACCEPT", "ADMIN.POLICY",
                "ADMIN.LOCATIONS", "ADMIN.FORCE_REVERT", "ADMIN.VOID", "ADMIN.RECURRING_PLANS", "PR.VIEW_ALL");
            Grant(RoleCodes.SysAdmin, "ADMIN.USERS", "ADMIN.ROLES", "ADMIN.POLICY", "ADMIN.LOCATIONS", "PR.VIEW_ALL");

            await db.SaveChangesAsync();
        }

        return roles;
    }

    private static async Task<Dictionary<string, Departments>> SeedDepartmentsAndLocationsAsync(ProcurementDbContext db, long systemUserId)
    {
        if (!await db.Departments.AnyAsync(d => d.Code == "OPD"))
        {
            db.Departments.AddRange(
                new Departments { Code = "OPD", Name = "Office of the President & Director", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow },
                new Departments { Code = "PROC", Name = "Procurement", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow },
                new Departments { Code = "FIN", Name = "Finance", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow },
                new Departments { Code = "AUD", Name = "Audit", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow },
                new Departments { Code = "IT", Name = "Information Technology", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow },
                new Departments { Code = "HR", Name = "Human Resources", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }

        if (!await db.Locations.AnyAsync())
        {
            db.Locations.AddRange(
                new Locations { Code = "CREST", Name = "Crest Tower", Address = "Crest Tower, Karachi", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow },
                new Locations { Code = "CEOHOUSE", Name = "CEO House", Address = "CEO House, Karachi", IsActive = true, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }

        return await db.Departments.ToDictionaryAsync(d => d.Code);
    }

    private static async Task SeedUsersAsync(ProcurementDbContext db, Dictionary<string, Roles> roles, Dictionary<string, Departments> departments, long systemUserId)
    {
        if (await db.Users.AnyAsync(u => u.Id != systemUserId)) return;

        string Hash(string plain) => BCrypt.Net.BCrypt.HashPassword(plain);

        Users Make(string empNo, string name, string email, string deptCode) => new Users
        {
            EmployeeNo = empNo,
            DisplayName = name,
            Email = email,
            DepartmentId = departments[deptCode].Id,
            PasswordHash = Hash(DevSeedPassword),
            IsActive = true,
            CreatedByUserId = systemUserId,
            CreatedAt = DateTime.UtcNow,
        };

        var opdUser = Make("EMP-OPD-001", "Imran OPD Lead", "opd@procurement.local", "OPD");
        var procUser = Make("EMP-PROC-001", "Procurement Officer", "procurement@procurement.local", "PROC");
        var procHod = Make("EMP-PROC-002", "Procurement HOD", "hod.procurement@procurement.local", "PROC");
        var financeUser = Make("EMP-FIN-001", "Finance Officer", "finance@procurement.local", "FIN");
        var auditUser = Make("EMP-AUD-001", "Audit Officer", "audit@procurement.local", "AUD");
        var itHod = Make("EMP-IT-001", "IT HOD", "hod.it@procurement.local", "IT");
        var itRequestor = Make("EMP-IT-002", "IT Requestor", "requestor.it@procurement.local", "IT");
        var sysAdmin = Make("EMP-SYS-001", "System Administrator", "sysadmin@procurement.local", "OPD");

        db.Users.AddRange(opdUser, procUser, procHod, financeUser, auditUser, itHod, itRequestor, sysAdmin);
        await db.SaveChangesAsync();

        departments["PROC"].HodUserId = procHod.Id;
        departments["IT"].HodUserId = itHod.Id;
        await db.SaveChangesAsync();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        void Assign(Users user, string roleCode, long? deptId)
        {
            db.UserRoleAssignments.Add(new UserRoleAssignments
            {
                UserId = user.Id,
                RoleId = roles[roleCode].Id,
                DepartmentId = deptId,
                ValidFrom = today,
                CreatedByUserId = systemUserId,
                CreatedAt = DateTime.UtcNow,
            });
        }

        Assign(opdUser, RoleCodes.Opd, null);
        Assign(procUser, RoleCodes.Procurement, departments["PROC"].Id);
        Assign(procHod, RoleCodes.Hod, departments["PROC"].Id);
        Assign(financeUser, RoleCodes.Finance, departments["FIN"].Id);
        Assign(auditUser, RoleCodes.Audit, departments["AUD"].Id);
        Assign(itHod, RoleCodes.Hod, departments["IT"].Id);
        Assign(itRequestor, RoleCodes.Requestor, departments["IT"].Id);
        Assign(sysAdmin, RoleCodes.SysAdmin, null);
        await db.SaveChangesAsync();

        foreach (var (user, deptCode) in new[] { (opdUser, "OPD"), (procUser, "PROC"), (procHod, "PROC"), (financeUser, "FIN"), (auditUser, "AUD"), (itHod, "IT"), (itRequestor, "IT"), (sysAdmin, "OPD") })
        {
            db.UserDepartmentAccess.Add(new UserDepartmentAccess
            {
                UserId = user.Id,
                DepartmentId = departments[deptCode].Id,
                CanRaisePr = true,
                CreatedByUserId = systemUserId,
                CreatedAt = DateTime.UtcNow,
            });
        }
        await db.SaveChangesAsync();
    }
}
