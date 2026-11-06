using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class GoodsReceiptLinesConfiguration : IEntityTypeConfiguration<GoodsReceiptLines>
{
    public void Configure(EntityTypeBuilder<GoodsReceiptLines> b)
    {
        b.ToTable("GoodsReceiptLines");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.GrnId).IsRequired();
        b.Property(x => x.PoLineId).IsRequired();
        b.Property(x => x.DeliveredQty).HasColumnType("decimal(18,3)").IsRequired();
        b.Property(x => x.AcceptedQty).HasColumnType("decimal(18,3)").IsRequired();
        b.Property(x => x.RejectedQty).HasColumnType("decimal(18,3)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.RejectReason).HasMaxLength(300);
        b.Property(x => x.EvidenceDocumentId);
        b.HasOne<GoodsReceipts>().WithMany().HasForeignKey(x => x.GrnId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PoLines>().WithMany().HasForeignKey(x => x.PoLineId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.EvidenceDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
