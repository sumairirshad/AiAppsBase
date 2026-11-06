using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class CategoriesConfiguration : IEntityTypeConfiguration<Categories>
{
    public void Configure(EntityTypeBuilder<Categories> b)
    {
        b.ToTable("Categories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(30).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.ParentId);
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.Code).IsUnique();
        b.HasOne<Categories>().WithMany().HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
