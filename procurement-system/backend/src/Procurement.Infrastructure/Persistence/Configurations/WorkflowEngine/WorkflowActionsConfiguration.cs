using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class WorkflowActionsConfiguration : IEntityTypeConfiguration<WorkflowActions>
{
    public void Configure(EntityTypeBuilder<WorkflowActions> b)
    {
        b.ToTable("WorkflowActions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.InstanceId).IsRequired();
        b.Property(x => x.TaskId);
        b.Property(x => x.ActionTypeId).IsRequired();
        b.Property(x => x.ActorUserId).IsRequired();
        b.Property(x => x.ActorRoleId).IsRequired();
        b.Property(x => x.FromStageId);
        b.Property(x => x.ToStageId);
        b.Property(x => x.Remarks).HasMaxLength(1000);
        b.Property(x => x.PolicyVersionId).IsRequired();
        b.Property(x => x.CorrelationId).IsRequired();
        b.Property(x => x.ActedAt).HasColumnType("datetime2(0)").IsRequired();
        b.HasOne<WorkflowInstances>().WithMany().HasForeignKey(x => x.InstanceId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<WorkflowTasks>().WithMany().HasForeignKey(x => x.TaskId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<ActionTypes>().WithMany().HasForeignKey(x => x.ActionTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.ActorRoleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<WorkflowStages>().WithMany().HasForeignKey(x => x.FromStageId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<WorkflowStages>().WithMany().HasForeignKey(x => x.ToStageId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<PolicyVersions>().WithMany().HasForeignKey(x => x.PolicyVersionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
