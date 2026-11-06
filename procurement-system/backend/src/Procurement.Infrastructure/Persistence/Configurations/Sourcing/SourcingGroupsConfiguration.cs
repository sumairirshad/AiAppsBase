using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class SourcingGroupsConfiguration : IEntityTypeConfiguration<SourcingGroups>
{
    public void Configure(EntityTypeBuilder<SourcingGroups> b)
    {
        b.ToTable("SourcingGroups");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.GroupNo).IsRequired();
        b.Property(x => x.CategoryId);
        b.Property(x => x.GroupAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(x => x.RequiredQuotes).IsRequired();
        b.Property(x => x.QuotationRuleId).IsRequired();
        b.Property(x => x.RecommendedQuotationId);
        b.Property(x => x.SelectedQuotationId);
        b.Property(x => x.SelectionJustification).HasMaxLength(500);
        b.Property(x => x.SelectedBy);
        b.Property(x => x.OpdDecisionBy);
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Categories>().WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<QuotationRules>().WithMany().HasForeignKey(x => x.QuotationRuleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Quotations>().WithMany().HasForeignKey(x => x.RecommendedQuotationId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Quotations>().WithMany().HasForeignKey(x => x.SelectedQuotationId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.SelectedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.OpdDecisionBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
