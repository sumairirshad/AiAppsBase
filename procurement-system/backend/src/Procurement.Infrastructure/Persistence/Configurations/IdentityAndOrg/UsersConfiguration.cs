using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class UsersConfiguration : IEntityTypeConfiguration<Users>
{
    public void Configure(EntityTypeBuilder<Users> b)
    {
        b.ToTable("Users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.EmployeeNo).HasMaxLength(20).IsRequired();
        b.Property(x => x.DisplayName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Email).HasMaxLength(150).IsRequired();
        b.Property(x => x.DepartmentId).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(256);
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.EmployeeNo).IsUnique();
        b.HasIndex(x => x.Email).IsUnique();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
