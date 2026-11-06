using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class RecurringPlanLinesConfiguration : IEntityTypeConfiguration<RecurringPlanLines>
{
    public void Configure(EntityTypeBuilder<RecurringPlanLines> b)
    {
        b.ToTable("RecurringPlanLines");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PlanId).IsRequired();
        b.Property(x => x.ItemId).IsRequired();
        b.Property(x => x.Qty).HasColumnType("decimal(18,3)").IsRequired();
        b.Property(x => x.UnitId).IsRequired();
        b.Property(x => x.AgreedPrice).HasColumnType("decimal(18,2)");
        b.HasOne<RecurringPlans>().WithMany().HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Items>().WithMany().HasForeignKey(x => x.ItemId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Units>().WithMany().HasForeignKey(x => x.UnitId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
