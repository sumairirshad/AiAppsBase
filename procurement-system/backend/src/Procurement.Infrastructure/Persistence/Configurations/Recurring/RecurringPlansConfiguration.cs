using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class RecurringPlansConfiguration : IEntityTypeConfiguration<RecurringPlans>
{
    public void Configure(EntityTypeBuilder<RecurringPlans> b)
    {
        b.ToTable("RecurringPlans");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PlanNo).HasMaxLength(20).IsRequired();
        b.Property(x => x.RecurringPlanTypeId).IsRequired();
        b.Property(x => x.SpendSubHeadId).IsRequired();
        b.Property(x => x.DepartmentId).IsRequired();
        b.Property(x => x.LocationId).IsRequired();
        b.Property(x => x.OwnerUserId).IsRequired();
        b.Property(x => x.FrequencyId).IsRequired();
        b.Property(x => x.GenerationDay).IsRequired();
        b.Property(x => x.DueOffsetDays).IsRequired().HasDefaultValueSql("10").ValueGeneratedNever();
        b.Property(x => x.StartDate).IsRequired();
        b.Property(x => x.EndDate);
        b.Property(x => x.CurrentVersionNo).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.Property(x => x.StatusId).IsRequired();
        b.Property(x => x.NextRunDate);
        b.Property(x => x.VendorId);
        b.Property(x => x.FixedAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.ApprovedBy);
        b.HasIndex(x => x.PlanNo).IsUnique();
        b.HasOne<RecurringPlanTypes>().WithMany().HasForeignKey(x => x.RecurringPlanTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<SpendSubHeads>().WithMany().HasForeignKey(x => x.SpendSubHeadId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Locations>().WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<RecurringFrequencies>().WithMany().HasForeignKey(x => x.FrequencyId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<ApprovalRequestStatuses>().WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
