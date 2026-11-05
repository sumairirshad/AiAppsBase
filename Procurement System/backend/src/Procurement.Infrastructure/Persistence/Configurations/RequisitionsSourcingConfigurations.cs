using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PurchaseRequisitionsConfiguration : IEntityTypeConfiguration<PurchaseRequisitions>
{
    public void Configure(EntityTypeBuilder<PurchaseRequisitions> builder)
    {
        builder.HasIndex(p => p.PrNumber).IsUnique();
        builder.Property(p => p.RowVer).IsRowVersion();
        builder.Property(p => p.TentativeVariancePct).HasColumnType("decimal(7,2)");
        builder.Property(p => p.CurrencyCode).HasMaxLength(3);
        builder.HasOne<Currencies>().WithMany().HasForeignKey(p => p.CurrencyCode);
        builder.HasOne(p => p.RecurringOccurrence).WithMany().HasForeignKey(p => p.RecurringOccurrenceId);
    }
}

public class PrLinesConfiguration : IEntityTypeConfiguration<PrLines>
{
    public void Configure(EntityTypeBuilder<PrLines> builder)
    {
        builder.Property(l => l.Qty).HasColumnType("decimal(18,3)");
        builder.Property(l => l.AcceptedQty).HasColumnType("decimal(18,3)");
        builder.Property(l => l.LineTotal).HasComputedColumnSql("[Qty] * [EstUnitPrice]", stored: true);
        builder.HasOne(l => l.AwardedQuotationLine).WithMany().HasForeignKey(l => l.AwardedQuotationLineId);
    }
}

public class QuotationLinesConfiguration : IEntityTypeConfiguration<QuotationLines>
{
    public void Configure(EntityTypeBuilder<QuotationLines> builder)
    {
        builder.Property(l => l.Qty).HasColumnType("decimal(18,3)");
        builder.HasOne(l => l.PrLine).WithMany().HasForeignKey(l => l.PrLineId);
    }
}

public class QuotationsConfiguration : IEntityTypeConfiguration<Quotations>
{
    public void Configure(EntityTypeBuilder<Quotations> builder)
    {
        builder.Property(q => q.CurrencyCode).HasMaxLength(3);
        builder.HasOne<Currencies>().WithMany().HasForeignKey(q => q.CurrencyCode);
        builder.HasOne(q => q.SourcingGroup).WithMany(g => g.Quotations).HasForeignKey(q => q.SourcingGroupId);
    }
}

public class SourcingGroupsConfiguration : IEntityTypeConfiguration<SourcingGroups>
{
    public void Configure(EntityTypeBuilder<SourcingGroups> builder)
    {
        builder.HasOne(g => g.RecommendedQuotation).WithMany().HasForeignKey(g => g.RecommendedQuotationId);
        builder.HasOne(g => g.SelectedQuotation).WithMany().HasForeignKey(g => g.SelectedQuotationId);
        builder.HasMany(g => g.Lines).WithOne(l => l.SourcingGroup).HasForeignKey(l => l.SourcingGroupId);
    }
}

public class PrBudgetChecksConfiguration : IEntityTypeConfiguration<PrBudgetChecks>
{
    public void Configure(EntityTypeBuilder<PrBudgetChecks> builder) =>
        builder.Property(b => b.OverBudgetAmount)
            .HasComputedColumnSql("CASE WHEN [PrAmount] > ISNULL([AvailableAmount], 0) THEN [PrAmount] - ISNULL([AvailableAmount], 0) ELSE 0 END", stored: true);
}

public class AiChecksConfiguration : IEntityTypeConfiguration<AiChecks>
{
    public void Configure(EntityTypeBuilder<AiChecks> builder) =>
        builder.Property(a => a.Confidence).HasColumnType("decimal(5,2)");
}
