using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PrBillsConfiguration : IEntityTypeConfiguration<PrBills>
{
    public void Configure(EntityTypeBuilder<PrBills> b)
    {
        b.ToTable("PrBills");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.BillingPeriod).HasMaxLength(30).IsRequired();
        b.Property(x => x.BillAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.Purpose).HasMaxLength(300).IsRequired();
        b.Property(x => x.DueDate).IsRequired();
        b.Property(x => x.BillDocumentId).IsRequired();
        b.Property(x => x.PayeeVendorId);
        b.HasIndex(x => x.PrId).IsUnique();
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.BillDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.PayeeVendorId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
