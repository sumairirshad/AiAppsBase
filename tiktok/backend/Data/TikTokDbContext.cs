using Microsoft.EntityFrameworkCore;
using TikTok.Api.Entities;

namespace TikTok.Api.Data;

public class TikTokDbContext : DbContext
{
    public TikTokDbContext(DbContextOptions<TikTokDbContext> options) : base(options)
    {
    }

    public DbSet<ConnectedAccount> ConnectedAccounts => Set<ConnectedAccount>();
    public DbSet<PublishingJob> PublishingJobs => Set<PublishingJob>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<VideoStatsSnapshot> VideoStatsSnapshots => Set<VideoStatsSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ConnectedAccount>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasIndex(a => a.OpenId).IsUnique();
            entity.Property(a => a.OpenId).HasMaxLength(128).IsRequired();
            entity.Property(a => a.Username).HasMaxLength(256).IsRequired();
            entity.Property(a => a.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(a => a.EncryptedAccessToken).IsRequired();
            entity.Property(a => a.EncryptedRefreshToken).IsRequired();
        });

        modelBuilder.Entity<PublishingJob>(entity =>
        {
            entity.HasKey(j => j.Id);
            entity.Property(j => j.Caption).HasMaxLength(2200).IsRequired();
            entity.Property(j => j.Title).HasMaxLength(150);
            entity.Property(j => j.Hashtags).HasMaxLength(500);
            entity.Property(j => j.ContentType).HasConversion<string>().HasMaxLength(32);
            entity.Property(j => j.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(j => j.RequestedVisibility).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(j => new { j.Status, j.ScheduledAt });
            entity.HasOne(j => j.ConnectedAccount)
                .WithMany(a => a.PublishingJobs)
                .HasForeignKey(j => j.ConnectedAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MediaAsset>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.SourceUrl).HasMaxLength(2048).IsRequired();
            entity.Property(m => m.MediaType).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(m => new { m.PublishingJobId, m.Order }).IsUnique();
            entity.HasOne(m => m.PublishingJob)
                .WithMany(j => j.MediaAssets)
                .HasForeignKey(m => m.PublishingJobId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VideoStatsSnapshot>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.TikTokVideoId).HasMaxLength(128).IsRequired();
            entity.HasIndex(s => new { s.ConnectedAccountId, s.TikTokVideoId, s.CapturedAt });
            entity.HasOne(s => s.ConnectedAccount)
                .WithMany(a => a.StatsSnapshots)
                .HasForeignKey(s => s.ConnectedAccountId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
