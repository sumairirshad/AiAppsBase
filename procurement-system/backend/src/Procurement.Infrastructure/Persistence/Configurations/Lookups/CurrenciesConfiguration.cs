using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class CurrenciesConfiguration : IEntityTypeConfiguration<Currencies>
{
    public void Configure(EntityTypeBuilder<Currencies> b)
    {
        b.ToTable("Currencies");
        b.HasKey(x => x.Code);
        b.Property(x => x.Code).HasMaxLength(3).IsFixedLength().ValueGeneratedNever();
        b.Property(x => x.Name).HasMaxLength(50).IsRequired();
        b.Property(x => x.IsActive).IsRequired().HasDefaultValueSql("1").ValueGeneratedNever();
    }
}
