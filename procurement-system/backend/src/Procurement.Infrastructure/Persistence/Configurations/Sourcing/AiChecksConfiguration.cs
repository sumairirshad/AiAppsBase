using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class AiChecksConfiguration : IEntityTypeConfiguration<AiChecks>
{
    public void Configure(EntityTypeBuilder<AiChecks> b)
    {
        b.ToTable("AiChecks");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.CheckTypeId).IsRequired();
        b.Property(x => x.EntityTypeId).IsRequired();
        b.Property(x => x.EntityId).IsRequired();
        b.Property(x => x.Outcome).HasMaxLength(20).IsRequired();
        b.Property(x => x.ResultJson);
        b.Property(x => x.CheckedAt).HasColumnType("datetime2(0)").IsRequired();
        b.Property(x => x.Confidence).HasColumnType("decimal(5,2)");
        b.Property(x => x.Disposition).HasMaxLength(15);
        b.Property(x => x.ReviewedBy);
        b.HasOne<AiCheckTypes>().WithMany().HasForeignKey(x => x.CheckTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<EntityTypes>().WithMany().HasForeignKey(x => x.EntityTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ReviewedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
