using Instagram.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Instagram.Api.Data;

public class InstagramDbContext(DbContextOptions<InstagramDbContext> options) : DbContext(options)
{
    public DbSet<ConnectedAccount> ConnectedAccounts => Set<ConnectedAccount>();
    public DbSet<PublishingJob> PublishingJobs => Set<PublishingJob>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<InsightsSnapshot> InsightsSnapshots => Set<InsightsSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ConnectedAccount>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.PlatformUserId).IsUnique();
            entity.Property(e => e.PlatformUserId).HasMaxLength(64);
            entity.Property(e => e.Username).HasMaxLength(64);
            entity.Property(e => e.GrantedScopes).HasMaxLength(512);
        });

        modelBuilder.Entity<PublishingJob>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ContentType).HasConversion<string>().HasMaxLength(32);
            entity.Property(e => e.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(e => new { e.Status, e.ScheduledAt });
            entity.HasOne(e => e.ConnectedAccount)
                .WithMany(a => a.PublishingJobs)
                .HasForeignKey(e => e.ConnectedAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MediaAsset>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MediaKind).HasConversion<string>().HasMaxLength(16);
            entity.HasOne(e => e.PublishingJob)
                .WithMany(j => j.MediaAssets)
                .HasForeignKey(e => e.PublishingJobId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.PublishingJobId, e.SortOrder });
        });

        modelBuilder.Entity<InsightsSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MetricName).HasMaxLength(64);
            entity.HasOne(e => e.ConnectedAccount)
                .WithMany(a => a.InsightsSnapshots)
                .HasForeignKey(e => e.ConnectedAccountId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.ConnectedAccountId, e.MetricName, e.CapturedAt });
        });
    }
}
