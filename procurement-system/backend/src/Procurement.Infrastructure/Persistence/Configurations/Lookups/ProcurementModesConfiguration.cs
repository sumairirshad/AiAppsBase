using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class ProcurementModesConfiguration : IEntityTypeConfiguration<ProcurementModes>
{
    public void Configure(EntityTypeBuilder<ProcurementModes> b)
    {
        b.ToTable("ProcurementModes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(40).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.SortOrder).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
        b.HasIndex(x => x.Code).IsUnique();
    }
}
