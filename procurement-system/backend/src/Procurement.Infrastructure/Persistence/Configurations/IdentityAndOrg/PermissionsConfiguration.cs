using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class PermissionsConfiguration : IEntityTypeConfiguration<Permissions>
{
    public void Configure(EntityTypeBuilder<Permissions> b)
    {
        b.ToTable("Permissions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(60).IsRequired();
        b.Property(x => x.Description).HasMaxLength(200).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
    }
}
