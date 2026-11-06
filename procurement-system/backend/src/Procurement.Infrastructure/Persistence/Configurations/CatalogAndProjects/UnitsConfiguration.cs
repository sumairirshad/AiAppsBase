using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class UnitsConfiguration : IEntityTypeConfiguration<Units>
{
    public void Configure(EntityTypeBuilder<Units> b)
    {
        b.ToTable("Units");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(10).IsRequired();
        b.Property(x => x.Name).HasMaxLength(50).IsRequired();
        b.Property(x => x.Precision).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.HasIndex(x => x.Code).IsUnique();
    }
}
