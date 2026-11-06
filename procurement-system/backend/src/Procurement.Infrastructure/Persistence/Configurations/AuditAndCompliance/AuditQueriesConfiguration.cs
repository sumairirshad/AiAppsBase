using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class AuditQueriesConfiguration : IEntityTypeConfiguration<AuditQueries>
{
    public void Configure(EntityTypeBuilder<AuditQueries> b)
    {
        b.ToTable("AuditQueries");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.EntityTypeId).IsRequired();
        b.Property(x => x.EntityId).IsRequired();
        b.Property(x => x.RaisedBy).IsRequired();
        b.Property(x => x.AssignedRoleId).IsRequired();
        b.Property(x => x.AssignedUserId);
        b.Property(x => x.QueryText).HasMaxLength(2000).IsRequired();
        b.Property(x => x.ResponseText).HasMaxLength(2000);
        b.Property(x => x.QueryStatusId).IsRequired();
        b.Property(x => x.RespondedAt).HasColumnType("datetime2(0)");
        b.HasOne<EntityTypes>().WithMany().HasForeignKey(x => x.EntityTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.RaisedBy).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.AssignedRoleId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.AssignedUserId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<QueryStatuses>().WithMany().HasForeignKey(x => x.QueryStatusId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
