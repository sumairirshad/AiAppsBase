using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PurchaseOrdersConfiguration : IEntityTypeConfiguration<PurchaseOrders>
{
    public void Configure(EntityTypeBuilder<PurchaseOrders> b)
    {
        b.ToTable("PurchaseOrders");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PoNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.VendorId).IsRequired();
        b.Property(x => x.PoTypeId).IsRequired();
        b.Property(x => x.PoStatusId).IsRequired();
        b.Property(x => x.ReplacesPoId);
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsFixedLength().IsRequired();
        b.Property(x => x.SubTotal).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.TaxTotal).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.Total).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.RetentionPct).HasColumnType("decimal(5,2)");
        b.Property(x => x.DeliveryDate).IsRequired();
        b.Property(x => x.PaymentTerms).HasMaxLength(300);
        b.Property(x => x.IdempotencyKey).IsRequired();
        b.Property(x => x.IssuedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.RowVer).IsRequired().IsRowVersion();
        b.Property(x => x.PoBaseNumber).HasMaxLength(16).IsRequired();
        b.Property(x => x.PoSuffix).HasMaxLength(1).IsFixedLength();
        b.Property(x => x.AdvanceTypeId).IsRequired();
        b.Property(x => x.AdvancePct).HasColumnType("decimal(5,2)");
        b.Property(x => x.AdvanceAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.AdvancePaid).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.DispatchChannelId);
        b.Property(x => x.DispatchedAt).HasColumnType("datetime2(0)");
        b.HasIndex(x => x.PoNumber).IsUnique();
        b.HasIndex(x => x.IdempotencyKey).IsUnique();
        b.HasIndex(x => new { x.PoBaseNumber, x.PoSuffix }).IsUnique();
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PoTypes>().WithMany().HasForeignKey(x => x.PoTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PoStatuses>().WithMany().HasForeignKey(x => x.PoStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PurchaseOrders>().WithMany().HasForeignKey(x => x.ReplacesPoId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Currencies>().WithMany().HasForeignKey(x => x.CurrencyCode).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<AdvanceTypes>().WithMany().HasForeignKey(x => x.AdvanceTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<DispatchChannels>().WithMany().HasForeignKey(x => x.DispatchChannelId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
