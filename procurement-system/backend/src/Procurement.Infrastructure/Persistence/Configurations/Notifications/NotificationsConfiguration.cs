using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Configurations;

public class NotificationsConfiguration : IEntityTypeConfiguration<Notifications>
{
    public void Configure(EntityTypeBuilder<Notifications> b)
    {
        b.ToTable("Notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityColumn();
        b.Property(x => x.UserId);
        b.Property(x => x.RoleId);
        b.Property(x => x.EntityTypeId).IsRequired();
        b.Property(x => x.EntityId).IsRequired();
        b.Property(x => x.Message).HasMaxLength(300).IsRequired();
        b.Property(x => x.IsRead).IsRequired().HasDefaultValueSql("0").ValueGeneratedNever();
        b.Property(x => x.CreatedAt).HasColumnType("datetime2(0)").IsRequired();
        b.Property(x => x.NotificationTypeId).IsRequired();
        b.Property(x => x.Channel).HasMaxLength(10).IsRequired().HasDefaultValueSql("'InApp'").ValueGeneratedNever();
        b.Property(x => x.DedupeKey).HasMaxLength(100).IsRequired();
        b.Property(x => x.SentAt).HasColumnType("datetime2(0)");
        b.HasIndex(x => x.DedupeKey).IsUnique();
        b.HasOne<Users>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<Roles>().WithMany().HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.NoAction).IsRequired(false);
        b.HasOne<EntityTypes>().WithMany().HasForeignKey(x => x.EntityTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
        b.HasOne<NotificationTypes>().WithMany().HasForeignKey(x => x.NotificationTypeId).OnDelete(DeleteBehavior.NoAction).IsRequired();
    }
}
