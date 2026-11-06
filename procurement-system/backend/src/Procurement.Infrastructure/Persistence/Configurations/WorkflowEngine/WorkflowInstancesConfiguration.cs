using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class WorkflowInstancesConfiguration : IEntityTypeConfiguration<WorkflowInstances>
{
    public void Configure(EntityTypeBuilder<WorkflowInstances> b)
    {
        b.ToTable("WorkflowInstances");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.DefinitionId).IsRequired();
        b.Property(x => x.EntityTypeId).IsRequired();
        b.Property(x => x.EntityId).IsRequired();
        b.Property(x => x.CurrentStageId);
        b.Property(x => x.Status).HasMaxLength(20).IsRequired();
        b.Property(x => x.PolicyVersionId).IsRequired();
        b.Property(x => x.StartedAt).HasColumnType("datetime2(0)").IsRequired();
        b.Property(x => x.CompletedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.RowVer).IsRequired().IsRowVersion();
        b.HasOne<WorkflowDefinitions>().WithMany().HasForeignKey(x => x.DefinitionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<EntityTypes>().WithMany().HasForeignKey(x => x.EntityTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<WorkflowStages>().WithMany().HasForeignKey(x => x.CurrentStageId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<PolicyVersions>().WithMany().HasForeignKey(x => x.PolicyVersionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
