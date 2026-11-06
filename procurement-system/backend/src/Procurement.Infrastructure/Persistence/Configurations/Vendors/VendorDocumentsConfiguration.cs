using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class VendorDocumentsConfiguration : IEntityTypeConfiguration<VendorDocuments>
{
    public void Configure(EntityTypeBuilder<VendorDocuments> b)
    {
        b.ToTable("VendorDocuments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.VendorId).IsRequired();
        b.Property(x => x.DocumentId).IsRequired();
        b.Property(x => x.ExpiryDate);
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
