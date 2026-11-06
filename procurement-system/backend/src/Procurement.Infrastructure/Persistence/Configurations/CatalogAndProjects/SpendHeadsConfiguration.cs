using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class SpendHeadsConfiguration : IEntityTypeConfiguration<SpendHeads>
{
    public void Configure(EntityTypeBuilder<SpendHeads> b)
    {
        b.ToTable("SpendHeads");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Code).HasMaxLength(20).IsRequired();
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.ApprovalMode).HasMaxLength(20).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
    }
}
