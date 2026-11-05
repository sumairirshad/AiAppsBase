using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class UsersConfiguration : IEntityTypeConfiguration<Users>
{
    public void Configure(EntityTypeBuilder<Users> builder)
    {
        builder.HasIndex(u => u.EmployeeNo).IsUnique();
        builder.HasIndex(u => u.Email).IsUnique();
    }
}

public class RolesConfiguration : IEntityTypeConfiguration<Roles>
{
    public void Configure(EntityTypeBuilder<Roles> builder) => builder.HasIndex(r => r.Code).IsUnique();
}

public class PermissionsConfiguration : IEntityTypeConfiguration<Permissions>
{
    public void Configure(EntityTypeBuilder<Permissions> builder) => builder.HasIndex(p => p.Code).IsUnique();
}

public class RolePermissionsConfiguration : IEntityTypeConfiguration<RolePermissions>
{
    public void Configure(EntityTypeBuilder<RolePermissions> builder) =>
        builder.HasIndex(rp => new { rp.RoleId, rp.PermissionId }).IsUnique();
}

public class DepartmentsConfiguration : IEntityTypeConfiguration<Departments>
{
    public void Configure(EntityTypeBuilder<Departments> builder)
    {
        builder.HasIndex(d => d.Code).IsUnique();
        builder.HasOne(d => d.HodUser).WithMany().HasForeignKey(d => d.HodUserId);
    }
}

public class LocationsConfiguration : IEntityTypeConfiguration<Locations>
{
    public void Configure(EntityTypeBuilder<Locations> builder) => builder.HasIndex(l => l.Code).IsUnique();
}

public class UnitsConfiguration : IEntityTypeConfiguration<Units>
{
    public void Configure(EntityTypeBuilder<Units> builder) => builder.HasIndex(u => u.Code).IsUnique();
}

public class CategoriesConfiguration : IEntityTypeConfiguration<Categories>
{
    public void Configure(EntityTypeBuilder<Categories> builder) => builder.HasIndex(c => c.Code).IsUnique();
}

public class ItemsConfiguration : IEntityTypeConfiguration<Items>
{
    public void Configure(EntityTypeBuilder<Items> builder) => builder.HasIndex(i => i.Code).IsUnique();
}

public class SpendHeadsConfiguration : IEntityTypeConfiguration<SpendHeads>
{
    public void Configure(EntityTypeBuilder<SpendHeads> builder) => builder.HasIndex(s => s.Code).IsUnique();
}

public class SpendSubHeadsConfiguration : IEntityTypeConfiguration<SpendSubHeads>
{
    public void Configure(EntityTypeBuilder<SpendSubHeads> builder) => builder.HasIndex(s => s.Code).IsUnique();
}

public class DepartmentCategoriesConfiguration : IEntityTypeConfiguration<DepartmentCategories>
{
    public void Configure(EntityTypeBuilder<DepartmentCategories> builder) =>
        builder.HasIndex(dc => new { dc.DepartmentId, dc.CategoryId }).IsUnique();
}

public class PolicyVersionsConfiguration : IEntityTypeConfiguration<PolicyVersions>
{
    public void Configure(EntityTypeBuilder<PolicyVersions> builder) => builder.HasIndex(p => p.VersionNo).IsUnique();
}

public class WorkflowInstancesConfiguration : IEntityTypeConfiguration<WorkflowInstances>
{
    public void Configure(EntityTypeBuilder<WorkflowInstances> builder) => builder.Property(w => w.RowVer).IsRowVersion();
}
