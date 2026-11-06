using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ProjectsConfiguration : IEntityTypeConfiguration<Projects>
{
    public void Configure(EntityTypeBuilder<Projects> b)
    {
        b.ToTable("Projects");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.ProjectCode).HasMaxLength(20).IsRequired();
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.OwnerDepartmentId).IsRequired();
        b.Property(x => x.ManagerUserId);
        b.Property(x => x.ContractProvided).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.ProjectCode).IsUnique();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.OwnerDepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ManagerUserId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
