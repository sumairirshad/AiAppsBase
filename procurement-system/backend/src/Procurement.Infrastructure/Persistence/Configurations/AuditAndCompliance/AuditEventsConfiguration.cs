using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class AuditEventsConfiguration : IEntityTypeConfiguration<AuditEvents>
{
    public void Configure(EntityTypeBuilder<AuditEvents> b)
    {
        b.ToTable("AuditEvents");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.OccurredAt).HasColumnType("datetime2(3)").IsRequired();
        b.Property(x => x.ActorUserId);
        b.Property(x => x.ActorRoleId);
        b.Property(x => x.Action).HasMaxLength(60).IsRequired();
        b.Property(x => x.EntityTypeId).IsRequired();
        b.Property(x => x.EntityId);
        b.Property(x => x.Outcome).HasMaxLength(10).IsRequired();
        b.Property(x => x.BeforeJson);
        b.Property(x => x.AfterJson);
        b.Property(x => x.CorrelationId).IsRequired();
        b.Property(x => x.IpAddress).HasMaxLength(45);
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.ActorUserId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.ActorRoleId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<EntityTypes>().WithMany().HasForeignKey(x => x.EntityTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
