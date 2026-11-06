using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PoLinesConfiguration : IEntityTypeConfiguration<PoLines>
{
    public void Configure(EntityTypeBuilder<PoLines> b)
    {
        b.ToTable("PoLines");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PoId).IsRequired();
        b.Property(x => x.PrLineId).IsRequired();
        b.Property(x => x.QuotationLineId);
        b.Property(x => x.Qty).HasColumnType("decimal(18,3)").IsRequired();
        b.Property(x => x.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.LineTotal).HasColumnType("decimal(18,2)").IsRequired().HasComputedColumnSql("[Qty] * [UnitPrice]", stored: false);
        b.Property(x => x.AcceptedQty).HasColumnType("decimal(18,3)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.OutstandingQty).HasColumnType("decimal(18,3)").IsRequired().HasComputedColumnSql("[Qty] - [AcceptedQty]", stored: false);
        b.HasOne<PurchaseOrders>().WithMany().HasForeignKey(x => x.PoId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PrLines>().WithMany().HasForeignKey(x => x.PrLineId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<QuotationLines>().WithMany().HasForeignKey(x => x.QuotationLineId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
