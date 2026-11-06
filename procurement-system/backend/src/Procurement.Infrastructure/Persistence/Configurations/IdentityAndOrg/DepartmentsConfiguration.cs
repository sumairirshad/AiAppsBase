using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class DepartmentsConfiguration : IEntityTypeConfiguration<Departments>
{
    public void Configure(EntityTypeBuilder<Departments> b)
    {
        b.ToTable("Departments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(20).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.ParentId);
        b.Property(x => x.HodUserId);
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.Code).IsUnique();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.HodUserId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
