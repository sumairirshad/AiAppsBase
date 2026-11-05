using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PurchaseOrdersConfiguration : IEntityTypeConfiguration<PurchaseOrders>
{
    public void Configure(EntityTypeBuilder<PurchaseOrders> builder)
    {
        builder.HasIndex(p => p.PoNumber).IsUnique();
        builder.HasIndex(p => p.IdempotencyKey).IsUnique();
        builder.HasIndex(p => new { p.PoBaseNumber, p.PoSuffix }).IsUnique();
        builder.Property(p => p.RowVer).IsRowVersion();
        builder.Property(p => p.RetentionPct).HasColumnType("decimal(5,2)");
        builder.Property(p => p.AdvancePct).HasColumnType("decimal(5,2)");
        builder.Property(p => p.CurrencyCode).HasMaxLength(3);
        builder.HasOne<Currencies>().WithMany().HasForeignKey(p => p.CurrencyCode);
    }
}

public class PoLinesConfiguration : IEntityTypeConfiguration<PoLines>
{
    public void Configure(EntityTypeBuilder<PoLines> builder)
    {
        builder.Property(l => l.Qty).HasColumnType("decimal(18,3)");
        builder.Property(l => l.AcceptedQty).HasColumnType("decimal(18,3)");
        builder.Property(l => l.LineTotal).HasComputedColumnSql("[Qty] * [UnitPrice]", stored: true);
        builder.Property(l => l.OutstandingQty).HasComputedColumnSql("[Qty] - [AcceptedQty]", stored: true);
    }
}

public class GoodsReceiptsConfiguration : IEntityTypeConfiguration<GoodsReceipts>
{
    public void Configure(EntityTypeBuilder<GoodsReceipts> builder) => builder.HasIndex(g => g.GrnNumber).IsUnique();
}

public class GoodsReceiptLinesConfiguration : IEntityTypeConfiguration<GoodsReceiptLines>
{
    public void Configure(EntityTypeBuilder<GoodsReceiptLines> builder)
    {
        builder.Property(l => l.DeliveredQty).HasColumnType("decimal(18,3)");
        builder.Property(l => l.AcceptedQty).HasColumnType("decimal(18,3)");
        builder.Property(l => l.RejectedQty).HasColumnType("decimal(18,3)");
    }
}

public class ContractTemplatesConfiguration : IEntityTypeConfiguration<ContractTemplates>
{
    public void Configure(EntityTypeBuilder<ContractTemplates> builder) => builder.HasIndex(c => c.Code).IsUnique();
}
