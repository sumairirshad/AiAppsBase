using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ItemsConfiguration : IEntityTypeConfiguration<Items>
{
    public void Configure(EntityTypeBuilder<Items> b)
    {
        b.ToTable("Items");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(30).IsRequired();
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.CategoryId).IsRequired();
        b.Property(x => x.UnitId).IsRequired();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.Code).IsUnique();
        b.HasOne<Categories>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Units>().WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
