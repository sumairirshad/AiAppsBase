using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class QuotationRulesConfiguration : IEntityTypeConfiguration<QuotationRules>
{
    public void Configure(EntityTypeBuilder<QuotationRules> b)
    {
        b.ToTable("QuotationRules");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PolicyVersionId).IsRequired();
        b.Property(x => x.SpendSubHeadId);
        b.Property(x => x.MinAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.MaxAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.StarVendor);
        b.Property(x => x.Emergency);
        b.Property(x => x.RequiredQuotes).IsRequired();
        b.Property(x => x.Priority).IsRequired();
        b.Property(x => x.Description).HasMaxLength(300).IsRequired();
        b.HasOne<PolicyVersions>().WithMany().HasForeignKey(x => x.PolicyVersionId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<SpendSubHeads>().WithMany().HasForeignKey(x => x.SpendSubHeadId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
