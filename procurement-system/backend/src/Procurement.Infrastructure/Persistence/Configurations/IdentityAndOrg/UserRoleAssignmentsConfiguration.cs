using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class UserRoleAssignmentsConfiguration : IEntityTypeConfiguration<UserRoleAssignments>
{
    public void Configure(EntityTypeBuilder<UserRoleAssignments> b)
    {
        b.ToTable("UserRoleAssignments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.UserId).IsRequired();
        b.Property(x => x.RoleId).IsRequired();
        b.Property(x => x.DepartmentId);
        b.Property(x => x.LocationId);
        b.Property(x => x.ValidFrom).IsRequired();
        b.Property(x => x.ValidTo);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Locations>().WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
