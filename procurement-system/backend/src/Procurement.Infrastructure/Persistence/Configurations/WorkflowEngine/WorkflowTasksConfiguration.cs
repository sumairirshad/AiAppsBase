using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class WorkflowTasksConfiguration : IEntityTypeConfiguration<WorkflowTasks>
{
    public void Configure(EntityTypeBuilder<WorkflowTasks> b)
    {
        b.ToTable("WorkflowTasks");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.InstanceId).IsRequired();
        b.Property(x => x.StageId).IsRequired();
        b.Property(x => x.AssignedRoleId).IsRequired();
        b.Property(x => x.AssignedUserId);
        b.Property(x => x.ScopeDepartmentId);
        b.Property(x => x.TaskStatusId).IsRequired();
        b.Property(x => x.DueAt).HasColumnType("datetime2(0)");
        b.Property(x => x.CompletedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.EscalatedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.EscalatedToRoleId);
        b.HasOne<WorkflowInstances>().WithMany().HasForeignKey(x => x.InstanceId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<WorkflowStages>().WithMany().HasForeignKey(x => x.StageId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.AssignedRoleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.AssignedUserId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Departments>().WithMany().HasForeignKey(x => x.ScopeDepartmentId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<TaskStatuses>().WithMany().HasForeignKey(x => x.TaskStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.EscalatedToRoleId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
