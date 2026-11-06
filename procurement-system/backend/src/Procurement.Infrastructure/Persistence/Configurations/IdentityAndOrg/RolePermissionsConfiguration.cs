using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class RolePermissionsConfiguration : IEntityTypeConfiguration<RolePermissions>
{
    public void Configure(EntityTypeBuilder<RolePermissions> b)
    {
        b.ToTable("RolePermissions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.RoleId).IsRequired();
        b.Property(x => x.PermissionId).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Permissions>().WithMany().HasForeignKey(x => x.PermissionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
