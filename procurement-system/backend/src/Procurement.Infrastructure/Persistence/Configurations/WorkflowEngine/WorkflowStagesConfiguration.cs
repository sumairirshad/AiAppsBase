using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class WorkflowStagesConfiguration : IEntityTypeConfiguration<WorkflowStages>
{
    public void Configure(EntityTypeBuilder<WorkflowStages> b)
    {
        b.ToTable("WorkflowStages");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.DefinitionId).IsRequired();
        b.Property(x => x.StageCode).HasMaxLength(40).IsRequired();
        b.Property(x => x.Sequence).IsRequired();
        b.Property(x => x.StageTypeId).IsRequired();
        b.Property(x => x.RoleId);
        b.Property(x => x.PrStatusId);
        b.Property(x => x.ConditionExpr).HasMaxLength(300);
        b.Property(x => x.IsOptional).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.EscalationDays);
        b.Property(x => x.EscalateToRoleId);
        b.Property(x => x.ScopeType).HasMaxLength(15).IsRequired().HasDefaultValueSql("'None'").ValueGeneratedNever();
        b.Property(x => x.ScopeDepartmentId);
        b.HasOne<WorkflowDefinitions>().WithMany().HasForeignKey(x => x.DefinitionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<StageTypes>().WithMany().HasForeignKey(x => x.StageTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<PrStatuses>().WithMany().HasForeignKey(x => x.PrStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.EscalateToRoleId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.ScopeDepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
