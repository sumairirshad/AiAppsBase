using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class VendorsConfiguration : IEntityTypeConfiguration<Vendors>
{
    public void Configure(EntityTypeBuilder<Vendors> builder)
    {
        builder.HasIndex(v => v.VendorCode).IsUnique();
        builder.HasIndex(v => v.Ntn).IsUnique();
        builder.Property(v => v.RowVer).IsRowVersion();
        builder.Property(v => v.OnTimeScore).HasColumnType("decimal(5,2)");
        builder.Property(v => v.PriceScore).HasColumnType("decimal(5,2)");
        builder.Property(v => v.QualityScore).HasColumnType("decimal(5,2)");
        builder.Property(v => v.OverallScore).HasColumnType("decimal(5,2)");
    }
}

public class VendorCategoriesConfiguration : IEntityTypeConfiguration<VendorCategories>
{
    public void Configure(EntityTypeBuilder<VendorCategories> builder) =>
        builder.HasIndex(vc => new { vc.VendorId, vc.CategoryId }).IsUnique();
}

public class VendorRegistrationRequestsConfiguration : IEntityTypeConfiguration<VendorRegistrationRequests>
{
    public void Configure(EntityTypeBuilder<VendorRegistrationRequests> builder) =>
        builder.HasIndex(v => v.RequestNo).IsUnique();
}

public class DocumentsConfiguration : IEntityTypeConfiguration<Documents>
{
    public void Configure(EntityTypeBuilder<Documents> builder) => builder.HasIndex(d => d.StorageKey).IsUnique();
}
