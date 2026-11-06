using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class VendorContactsConfiguration : IEntityTypeConfiguration<VendorContacts>
{
    public void Configure(EntityTypeBuilder<VendorContacts> b)
    {
        b.ToTable("VendorContacts");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.VendorId).IsRequired();
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.Property(x => x.Email).HasMaxLength(150);
        b.Property(x => x.Phone).HasMaxLength(30);
        b.Property(x => x.IsPrimary).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.HasOne<Vendors>().WithMany().HasForeignKey(x => x.VendorId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
