using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PolicySettingsConfiguration : IEntityTypeConfiguration<PolicySettings>
{
    public void Configure(EntityTypeBuilder<PolicySettings> b)
    {
        b.ToTable("PolicySettings");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PolicyVersionId).IsRequired();
        b.Property(x => x.SettingKey).HasMaxLength(60).IsRequired();
        b.Property(x => x.ValueType).HasMaxLength(10).IsRequired();
        b.Property(x => x.Value).HasMaxLength(100).IsRequired();
        b.Property(x => x.Description).HasMaxLength(300).IsRequired();
        b.HasOne<PolicyVersions>().WithMany().HasForeignKey(x => x.PolicyVersionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
