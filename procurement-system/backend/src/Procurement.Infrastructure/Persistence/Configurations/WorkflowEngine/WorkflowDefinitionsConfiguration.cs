using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class WorkflowDefinitionsConfiguration : IEntityTypeConfiguration<WorkflowDefinitions>
{
    public void Configure(EntityTypeBuilder<WorkflowDefinitions> b)
    {
        b.ToTable("WorkflowDefinitions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(40).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.EntityTypeId).IsRequired();
        b.Property(x => x.Version).IsRequired();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.Property(x => x.ActiveFrom).IsRequired();
        b.Property(x => x.ActiveTo);
        b.HasOne<EntityTypes>().WithMany().HasForeignKey(x => x.EntityTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
