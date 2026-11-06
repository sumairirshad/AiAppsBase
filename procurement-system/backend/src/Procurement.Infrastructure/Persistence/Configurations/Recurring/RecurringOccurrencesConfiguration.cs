using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class RecurringOccurrencesConfiguration : IEntityTypeConfiguration<RecurringOccurrences>
{
    public void Configure(EntityTypeBuilder<RecurringOccurrences> b)
    {
        b.ToTable("RecurringOccurrences");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PlanId).IsRequired();
        b.Property(x => x.PlanVersionNo).IsRequired();
        b.Property(x => x.OccurrenceKey).HasMaxLength(20).IsRequired();
        b.Property(x => x.ScheduledFor).IsRequired();
        b.Property(x => x.OccurrenceStatusId).IsRequired();
        b.Property(x => x.GeneratedPrId);
        b.Property(x => x.GeneratedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.Error).HasMaxLength(500);
        b.HasIndex(x => new { x.PlanId, x.OccurrenceKey }).IsUnique();
        b.HasOne<RecurringPlans>().WithMany().HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<OccurrenceStatuses>().WithMany().HasForeignKey(x => x.OccurrenceStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.GeneratedPrId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
