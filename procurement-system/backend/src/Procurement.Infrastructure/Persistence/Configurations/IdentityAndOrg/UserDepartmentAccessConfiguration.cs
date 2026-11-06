using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class UserDepartmentAccessConfiguration : IEntityTypeConfiguration<UserDepartmentAccess>
{
    public void Configure(EntityTypeBuilder<UserDepartmentAccess> b)
    {
        b.ToTable("UserDepartmentAccess");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.UserId).IsRequired();
        b.Property(x => x.DepartmentId).IsRequired();
        b.Property(x => x.CanRaisePr).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
