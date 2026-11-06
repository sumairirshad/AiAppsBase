using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PurchaseRequisitionsConfiguration : IEntityTypeConfiguration<PurchaseRequisitions>
{
    public void Configure(EntityTypeBuilder<PurchaseRequisitions> b)
    {
        b.ToTable("PurchaseRequisitions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PrNumber).HasMaxLength(20).IsRequired();
        b.Property(x => x.RequesterId).IsRequired();
        b.Property(x => x.DepartmentId).IsRequired();
        b.Property(x => x.LocationId).IsRequired();
        b.Property(x => x.SpendSubHeadId).IsRequired();
        b.Property(x => x.ProjectId);
        b.Property(x => x.CostTypeId).IsRequired();
        b.Property(x => x.IsEmergency).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.EmergencyJustification).HasMaxLength(500);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.EstimatedAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.ApprovedAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.FinalAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsFixedLength().IsRequired().HasDefaultValueSql("'PKR'").ValueGeneratedNever();
        b.Property(x => x.RequiredQuotes);
        b.Property(x => x.PrStatusId).IsRequired();
        b.Property(x => x.WorkflowInstanceId);
        b.Property(x => x.PolicyVersionId);
        b.Property(x => x.RecurringOccurrenceId);
        b.Property(x => x.SubmittedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.ClosedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.RowVer).IsRequired().IsRowVersion();
        b.Property(x => x.RaisedOnBehalf).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.TentativeVariancePct).HasColumnType("decimal(7,2)");
        b.HasIndex(x => x.PrNumber).IsUnique();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.RequesterId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Locations>().WithMany().HasForeignKey(x => x.LocationId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<SpendSubHeads>().WithMany().HasForeignKey(x => x.SpendSubHeadId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Projects>().WithMany().HasForeignKey(x => x.ProjectId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<CostTypes>().WithMany().HasForeignKey(x => x.CostTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Currencies>().WithMany().HasForeignKey(x => x.CurrencyCode).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PrStatuses>().WithMany().HasForeignKey(x => x.PrStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<WorkflowInstances>().WithMany().HasForeignKey(x => x.WorkflowInstanceId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<PolicyVersions>().WithMany().HasForeignKey(x => x.PolicyVersionId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<RecurringOccurrences>().WithMany().HasForeignKey(x => x.RecurringOccurrenceId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
