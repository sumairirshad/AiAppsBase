using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class LocationsConfiguration : IEntityTypeConfiguration<Locations>
{
    public void Configure(EntityTypeBuilder<Locations> b)
    {
        b.ToTable("Locations");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(20).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Address).HasMaxLength(300);
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.Code).IsUnique();
    }
}
