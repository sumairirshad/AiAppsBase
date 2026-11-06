using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class MonthEndAuditsConfiguration : IEntityTypeConfiguration<MonthEndAudits>
{
    public void Configure(EntityTypeBuilder<MonthEndAudits> b)
    {
        b.ToTable("MonthEndAudits");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.Period).HasMaxLength(7).IsFixedLength().IsRequired();
        b.Property(x => x.StatusId).IsRequired();
        b.Property(x => x.StartedBy).IsRequired();
        b.Property(x => x.CompletedBy);
        b.Property(x => x.CompletedAt).HasColumnType("datetime2(0)");
        b.Property(x => x.Summary).HasMaxLength(1000);
        b.HasIndex(x => x.Period).IsUnique();
        b.HasOne<MonthEndAuditStatuses>().WithMany().HasForeignKey(x => x.StatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.StartedBy).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.CompletedBy).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
    }
}
