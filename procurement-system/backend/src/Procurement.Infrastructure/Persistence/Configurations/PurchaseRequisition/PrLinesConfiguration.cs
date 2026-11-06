using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PrLinesConfiguration : IEntityTypeConfiguration<PrLines>
{
    public void Configure(EntityTypeBuilder<PrLines> b)
    {
        b.ToTable("PrLines");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.LineNo).IsRequired();
        b.Property(x => x.ItemId).IsRequired();
        b.Property(x => x.Description).HasMaxLength(300);
        b.Property(x => x.Qty).HasColumnType("decimal(18,3)").IsRequired();
        b.Property(x => x.UnitId).IsRequired();
        b.Property(x => x.EstUnitPrice).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.LineTotal).HasColumnType("decimal(18,2)").IsRequired().HasComputedColumnSql("[Qty] * [EstUnitPrice]", stored: false);
        b.Property(x => x.SuggestedVendorId);
        b.Property(x => x.SourcingGroupId);
        b.Property(x => x.LocationId).IsRequired();
        b.Property(x => x.AcceptedQty).HasColumnType("decimal(18,3)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.AwardedVendorId);
        b.Property(x => x.AwardedQuotationLineId);
        b.Property(x => x.OverrideReason).HasMaxLength(500);
        b.Property(x => x.MarketPriceAtRequest).HasColumnType("decimal(18,2)");
        b.Property(x => x.LastPaidPriceAtRequest).HasColumnType("decimal(18,2)");
        b.Property(x => x.PriceWarningPct).HasColumnType("decimal(7,2)");
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Items>().WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Units>().WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.SuggestedVendorId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<SourcingGroups>().WithMany().HasForeignKey(x => x.SourcingGroupId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Locations>().WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.AwardedVendorId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<QuotationLines>().WithMany().HasForeignKey(x => x.AwardedQuotationLineId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
