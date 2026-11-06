using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PoAmendmentsConfiguration : IEntityTypeConfiguration<PoAmendments>
{
    public void Configure(EntityTypeBuilder<PoAmendments> b)
    {
        b.ToTable("PoAmendments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PoId).IsRequired();
        b.Property(x => x.AmendmentNo).IsRequired();
        b.Property(x => x.AmendmentTypeId).IsRequired();
        b.Property(x => x.OldValue).HasMaxLength(200).IsRequired();
        b.Property(x => x.NewValue).HasMaxLength(200).IsRequired();
        b.Property(x => x.IsEscalation).IsRequired();
        b.Property(x => x.Reason).HasMaxLength(500).IsRequired();
        b.Property(x => x.ApprovedBy);
        b.HasOne<PurchaseOrders>().WithMany().HasForeignKey(x => x.PoId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<AmendmentTypes>().WithMany().HasForeignKey(x => x.AmendmentTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
