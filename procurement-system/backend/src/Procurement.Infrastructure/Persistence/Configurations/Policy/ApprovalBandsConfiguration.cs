using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ApprovalBandsConfiguration : IEntityTypeConfiguration<ApprovalBands>
{
    public void Configure(EntityTypeBuilder<ApprovalBands> b)
    {
        b.ToTable("ApprovalBands");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PolicyVersionId).IsRequired();
        b.Property(x => x.MinAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.MaxAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.Sequence).IsRequired();
        b.Property(x => x.RoleId).IsRequired();
        b.Property(x => x.SpendSubHeadId);
        b.HasOne<PolicyVersions>().WithMany().HasForeignKey(x => x.PolicyVersionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<SpendSubHeads>().WithMany().HasForeignKey(x => x.SpendSubHeadId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
