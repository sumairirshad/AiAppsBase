using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class SpendSubHeadsConfiguration : IEntityTypeConfiguration<SpendSubHeads>
{
    public void Configure(EntityTypeBuilder<SpendSubHeads> b)
    {
        b.ToTable("SpendSubHeads");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.SpendHeadId).IsRequired();
        b.Property(x => x.Code).HasMaxLength(20).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.ProcurementModeId).IsRequired();
        b.Property(x => x.AllowsTentative).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.WorkflowDefinitionId).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.HasOne<SpendHeads>().WithMany().HasForeignKey(x => x.SpendHeadId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<ProcurementModes>().WithMany().HasForeignKey(x => x.ProcurementModeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<WorkflowDefinitions>().WithMany().HasForeignKey(x => x.WorkflowDefinitionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
