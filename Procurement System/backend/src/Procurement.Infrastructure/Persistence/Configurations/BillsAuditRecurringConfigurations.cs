using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class SupplierInvoicesConfiguration : IEntityTypeConfiguration<SupplierInvoices>
{
    public void Configure(EntityTypeBuilder<SupplierInvoices> builder)
    {
        builder.HasIndex(s => s.InvoiceNo).IsUnique();
        builder.HasIndex(s => new { s.VendorId, s.VendorRefNormalized }).IsUnique();
        builder.Property(s => s.CurrencyCode).HasMaxLength(3);
        builder.HasOne<Currencies>().WithMany().HasForeignKey(s => s.CurrencyCode);
        builder.Property(s => s.IsFullyPaid)
            .HasComputedColumnSql("CASE WHEN [PaidAmount] >= [Total] THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END", stored: true);
    }
}

public class MonthEndAuditsConfiguration : IEntityTypeConfiguration<MonthEndAudits>
{
    public void Configure(EntityTypeBuilder<MonthEndAudits> builder)
    {
        builder.HasIndex(m => m.Period).IsUnique();
        builder.Property(m => m.Period).HasMaxLength(7);
    }
}

public class RecurringPlansConfiguration : IEntityTypeConfiguration<RecurringPlans>
{
    public void Configure(EntityTypeBuilder<RecurringPlans> builder) => builder.HasIndex(p => p.PlanNo).IsUnique();
}

public class RecurringPlanLinesConfiguration : IEntityTypeConfiguration<RecurringPlanLines>
{
    public void Configure(EntityTypeBuilder<RecurringPlanLines> builder) =>
        builder.Property(l => l.Qty).HasColumnType("decimal(18,3)");
}

public class RecurringOccurrencesConfiguration : IEntityTypeConfiguration<RecurringOccurrences>
{
    public void Configure(EntityTypeBuilder<RecurringOccurrences> builder)
    {
        builder.HasIndex(o => new { o.PlanId, o.OccurrenceKey }).IsUnique();
        builder.HasOne(o => o.GeneratedPr).WithMany().HasForeignKey(o => o.GeneratedPrId);
    }
}

public class NotificationsConfiguration : IEntityTypeConfiguration<Notifications>
{
    public void Configure(EntityTypeBuilder<Notifications> builder) => builder.HasIndex(n => n.DedupeKey).IsUnique();
}
