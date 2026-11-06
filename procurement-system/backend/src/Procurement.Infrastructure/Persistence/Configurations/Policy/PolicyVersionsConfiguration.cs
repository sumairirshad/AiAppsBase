using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PolicyVersionsConfiguration : IEntityTypeConfiguration<PolicyVersions>
{
    public void Configure(EntityTypeBuilder<PolicyVersions> b)
    {
        b.ToTable("PolicyVersions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.VersionNo).IsRequired();
        b.Property(x => x.EffectiveFrom).IsRequired();
        b.Property(x => x.EffectiveTo);
        b.Property(x => x.StatusId).IsRequired();
        b.Property(x => x.ApprovedBy);
        b.Property(x => x.ChangeReason).HasMaxLength(500).IsRequired();
        b.HasIndex(x => x.VersionNo).IsUnique();
        b.HasOne<ApprovalRequestStatuses>().WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
