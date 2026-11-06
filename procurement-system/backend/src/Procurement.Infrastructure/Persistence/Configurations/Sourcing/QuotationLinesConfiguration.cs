using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class QuotationLinesConfiguration : IEntityTypeConfiguration<QuotationLines>
{
    public void Configure(EntityTypeBuilder<QuotationLines> b)
    {
        b.ToTable("QuotationLines");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.QuotationId).IsRequired();
        b.Property(x => x.PrLineId).IsRequired();
        b.Property(x => x.Qty).HasColumnType("decimal(18,3)").IsRequired();
        b.Property(x => x.UnitPrice).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.Tax).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.Discount).HasColumnType("decimal(18,2)").IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.DeliveryDays);
        b.HasOne<Quotations>().WithMany().HasForeignKey(x => x.QuotationId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PrLines>().WithMany().HasForeignKey(x => x.PrLineId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
