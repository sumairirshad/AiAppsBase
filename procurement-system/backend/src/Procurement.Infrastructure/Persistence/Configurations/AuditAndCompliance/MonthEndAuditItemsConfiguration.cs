using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class MonthEndAuditItemsConfiguration : IEntityTypeConfiguration<MonthEndAuditItems>
{
    public void Configure(EntityTypeBuilder<MonthEndAuditItems> b)
    {
        b.ToTable("MonthEndAuditItems");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.MonthEndAuditId).IsRequired();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.BillId);
        b.Property(x => x.WasPreAudited).IsRequired();
        b.Property(x => x.Finding).HasMaxLength(500);
        b.HasOne<MonthEndAudits>().WithMany().HasForeignKey(x => x.MonthEndAuditId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<SupplierInvoices>().WithMany().HasForeignKey(x => x.BillId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
