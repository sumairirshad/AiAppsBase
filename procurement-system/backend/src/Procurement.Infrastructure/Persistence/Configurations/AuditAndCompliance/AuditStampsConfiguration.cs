using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class AuditStampsConfiguration : IEntityTypeConfiguration<AuditStamps>
{
    public void Configure(EntityTypeBuilder<AuditStamps> b)
    {
        b.ToTable("AuditStamps");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.PrId).IsRequired();
        b.Property(x => x.PaymentVerified).IsRequired();
        b.Property(x => x.DeliveryVerified).IsRequired();
        b.Property(x => x.StampedBy).IsRequired();
        b.Property(x => x.StampedAt).HasColumnType("datetime2(0)").IsRequired();
        b.Property(x => x.Remarks).HasMaxLength(500);
        b.HasIndex(x => x.PrId).IsUnique();
        b.HasOne<PurchaseRequisitions>().WithMany().HasForeignKey(x => x.PrId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.StampedBy).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
