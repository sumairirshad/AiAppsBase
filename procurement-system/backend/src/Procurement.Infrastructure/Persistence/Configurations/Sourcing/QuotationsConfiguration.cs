using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class QuotationsConfiguration : IEntityTypeConfiguration<Quotations>
{
    public void Configure(EntityTypeBuilder<Quotations> b)
    {
        b.ToTable("Quotations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.VendorId).IsRequired();
        b.Property(x => x.QuotationNo).HasMaxLength(40).IsRequired();
        b.Property(x => x.QuotationDate).IsRequired();
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsFixedLength().IsRequired();
        b.Property(x => x.Total).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.ValidUntil);
        b.Property(x => x.DocumentId).IsRequired();
        b.Property(x => x.SourcingGroupId).IsRequired();
        b.Property(x => x.TaxTotal).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.ComparableTotal).HasColumnType("decimal(18,2)").IsRequired();
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Currencies>().WithMany().HasForeignKey(x => x.CurrencyCode).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Documents>().WithMany().HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<SourcingGroups>().WithMany().HasForeignKey(x => x.SourcingGroupId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
