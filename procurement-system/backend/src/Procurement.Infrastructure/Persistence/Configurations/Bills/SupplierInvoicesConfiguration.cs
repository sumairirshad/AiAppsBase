using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class SupplierInvoicesConfiguration : IEntityTypeConfiguration<SupplierInvoices>
{
    public void Configure(EntityTypeBuilder<SupplierInvoices> b)
    {
        b.ToTable("SupplierInvoices");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.InvoiceNo).HasMaxLength(30).IsRequired();
        b.Property(x => x.VendorId).IsRequired();
        b.Property(x => x.VendorInvoiceRef).HasMaxLength(60).IsRequired();
        b.Property(x => x.VendorRefNormalized).HasMaxLength(60).IsRequired();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.PoId);
        b.Property(x => x.InvoiceDate).IsRequired();
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsFixedLength().IsRequired();
        b.Property(x => x.Total).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.DocumentId).IsRequired();
        b.Property(x => x.UploadedBy).IsRequired();
        b.Property(x => x.ForwardedToFinanceAt).HasColumnType("datetime2(0)");
        b.Property(x => x.ForwardedBy);
        b.Property(x => x.BillStatus).HasMaxLength(20).IsRequired();
        b.Property(x => x.FinancePortalRef).HasMaxLength(60);
        b.Property(x => x.PaidAmount).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.IsFullyPaid).IsRequired().HasComputedColumnSql("[PaidAmount] >= [Total]", stored: false);
        b.Property(x => x.PaidAt).HasColumnType("datetime2(0)");
        b.Property(x => x.ProofDocumentId);
        b.HasIndex(x => x.InvoiceNo).IsUnique();
        b.HasIndex(x => new { x.VendorId, x.VendorRefNormalized }).IsUnique();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PurchaseOrders>().WithMany().HasForeignKey(x => x.PoId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Currencies>().WithMany().HasForeignKey(x => x.CurrencyCode).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.UploadedBy).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ForwardedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.ProofDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
