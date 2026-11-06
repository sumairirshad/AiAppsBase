using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class RolesConfiguration : IEntityTypeConfiguration<Roles>
{
    public void Configure(EntityTypeBuilder<Roles> b)
    {
        b.ToTable("Roles");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(30).IsRequired();
        b.Property(x => x.Name).HasMaxLength(60).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
    }
}
