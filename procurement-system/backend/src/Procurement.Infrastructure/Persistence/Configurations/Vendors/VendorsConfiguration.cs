using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class VendorsConfiguration : IEntityTypeConfiguration<Vendors>
{
    public void Configure(EntityTypeBuilder<Vendors> b)
    {
        b.ToTable("Vendors");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.VendorCode).HasMaxLength(20).IsRequired();
        b.Property(x => x.LegalName).HasMaxLength(200).IsRequired();
        b.Property(x => x.Ntn).HasMaxLength(20).IsRequired();
        b.Property(x => x.Strn).HasMaxLength(20);
        b.Property(x => x.VendorStatusId).IsRequired();
        b.Property(x => x.HasDeliveryHistory).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.BlacklistReason).HasMaxLength(500);
        b.Property(x => x.RowVer).IsRequired().IsRowVersion();
        b.Property(x => x.OnTimeScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.PriceScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.QualityScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.OverallScore).HasColumnType("decimal(5,2)");
        b.Property(x => x.IsStarVendor).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.ScoreUpdatedAt).HasColumnType("datetime2(0)");
        b.HasIndex(x => x.VendorCode).IsUnique();
        b.HasIndex(x => x.Ntn).IsUnique();
        b.HasOne<VendorStatuses>().WithMany().HasForeignKey(x => x.VendorStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
