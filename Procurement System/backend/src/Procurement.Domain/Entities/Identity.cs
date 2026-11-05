namespace Procurement.Domain.Entities;

public class Departments : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public long? ParentId { get; set; }
    public Departments? Parent { get; set; }
    public long? HodUserId { get; set; }
    public Users? HodUser { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Departments> Children { get; set; } = new List<Departments>();
    public ICollection<Users> Users { get; set; } = new List<Users>();
}

public class Locations : AuditableEntity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}

public class Users : AuditableEntity
{
    public string EmployeeNo { get; set; } = default!;
    public string DisplayName { get; set; } = default!;
    public string Email { get; set; } = default!;
    public long DepartmentId { get; set; }
    public Departments Department { get; set; } = default!;
    public string? PasswordHash { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<UserRoleAssignments> RoleAssignments { get; set; } = new List<UserRoleAssignments>();
    public ICollection<UserDepartmentAccess> DepartmentAccess { get; set; } = new List<UserDepartmentAccess>();
}

public class Roles : Entity
{
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;

    public ICollection<RolePermissions> RolePermissions { get; set; } = new List<RolePermissions>();
}

public class Permissions : Entity
{
    public string Code { get; set; } = default!;
    public string Description { get; set; } = default!;
}

public class RolePermissions : Entity
{
    public long RoleId { get; set; }
    public Roles Role { get; set; } = default!;
    public long PermissionId { get; set; }
    public Permissions Permission { get; set; } = default!;
}

public class UserRoleAssignments : AuditableEntity
{
    public long UserId { get; set; }
    public Users User { get; set; } = default!;
    public long RoleId { get; set; }
    public Roles Role { get; set; } = default!;
    public long? DepartmentId { get; set; }
    public Departments? Department { get; set; }
    public long? LocationId { get; set; }
    public Locations? Location { get; set; }
    public DateOnly ValidFrom { get; set; }
    public DateOnly? ValidTo { get; set; }
}

public class UserDepartmentAccess : AuditableEntity
{
    public long UserId { get; set; }
    public Users User { get; set; } = default!;
    public long DepartmentId { get; set; }
    public Departments Department { get; set; } = default!;
    public bool CanRaisePr { get; set; } = true;
}
