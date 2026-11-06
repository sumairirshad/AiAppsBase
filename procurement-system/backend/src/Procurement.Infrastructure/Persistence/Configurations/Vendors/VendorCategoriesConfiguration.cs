using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class VendorCategoriesConfiguration : IEntityTypeConfiguration<VendorCategories>
{
    public void Configure(EntityTypeBuilder<VendorCategories> b)
    {
        b.ToTable("VendorCategories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.VendorId).IsRequired();
        b.Property(x => x.CategoryId).IsRequired();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Categories>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
