using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class GoodsReceiptsConfiguration : IEntityTypeConfiguration<GoodsReceipts>
{
    public void Configure(EntityTypeBuilder<GoodsReceipts> b)
    {
        b.ToTable("GoodsReceipts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.GrnNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.PoId).IsRequired();
        b.Property(x => x.ReceivedOn).IsRequired();
        b.Property(x => x.DeliveryNoteNo).HasMaxLength(40).IsRequired();
        b.Property(x => x.ReceivedBy).IsRequired();
        b.Property(x => x.IsLate).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.DeliveryNoteDocumentId);
        b.Property(x => x.OnTime);
        b.Property(x => x.QualityRating);
        b.Property(x => x.AcknowledgedBy);
        b.Property(x => x.AcknowledgedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.AckRemarks).HasMaxLength(500);
        b.Property(x => x.AckStatus).HasMaxLength(15);
        b.Property(x => x.DisputeReason).HasMaxLength(500);
        b.HasIndex(x => x.GrnNumber).IsUnique();
        b.HasOne<PurchaseOrders>().WithMany().HasForeignKey(x => x.PoId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ReceivedBy).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.DeliveryNoteDocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.AcknowledgedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
