using Microsoft.EntityFrameworkCore;
using Tisoro.LinkedIn.Api.Models;

namespace Tisoro.LinkedIn.Api.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<OAuthState> OAuthStates => Set<OAuthState>();
    public DbSet<LinkedInConnection> LinkedInConnections => Set<LinkedInConnection>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<PostMedia> PostMedia => Set<PostMedia>();
    public DbSet<CaptionTemplate> CaptionTemplates => Set<CaptionTemplate>();
    public DbSet<EngagementTarget> EngagementTargets => Set<EngagementTarget>();
    public DbSet<EngagementTask> EngagementTasks => Set<EngagementTask>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AdminUser>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(320).IsRequired();
            e.Property(x => x.FullName).HasMaxLength(200).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<OAuthState>(e =>
        {
            e.HasIndex(x => x.State).IsUnique();
            e.Property(x => x.State).HasMaxLength(128).IsRequired();
        });

        modelBuilder.Entity<LinkedInConnection>(e =>
        {
            e.Property(x => x.OrganizationUrn).HasMaxLength(200).IsRequired();
            e.Property(x => x.OrganizationName).HasMaxLength(300);
            e.Property(x => x.MemberUrn).HasMaxLength(200);
            e.Property(x => x.AccessTokenEncrypted).IsRequired();
        });

        modelBuilder.Entity<MediaAsset>(e =>
        {
            e.Property(x => x.Kind).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.OriginalFileName).HasMaxLength(500).IsRequired();
            e.Property(x => x.ContentType).HasMaxLength(200).IsRequired();
            e.Property(x => x.StoragePath).HasMaxLength(1000).IsRequired();
            e.Property(x => x.LinkedInAssetUrn).HasMaxLength(300);
        });

        modelBuilder.Entity<Post>(e =>
        {
            e.Property(x => x.ContentType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Title).HasMaxLength(255);
            e.Property(x => x.Body).HasMaxLength(3000).IsRequired();
            e.Property(x => x.ExternalLinkUrl).HasMaxLength(2000);
            e.Property(x => x.LinkedInPostUrn).HasMaxLength(300);
            e.HasIndex(x => new { x.Status, x.ScheduledAt });
            e.HasOne(x => x.CaptionTemplate)
                .WithMany()
                .HasForeignKey(x => x.CaptionTemplateId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PostMedia>(e =>
        {
            e.HasOne(x => x.Post)
                .WithMany(p => p.Media)
                .HasForeignKey(x => x.PostId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.MediaAsset)
                .WithMany(m => m.PostMedia)
                .HasForeignKey(x => x.MediaAssetId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(x => new { x.PostId, x.MediaAssetId }).IsUnique();
        });

        modelBuilder.Entity<CaptionTemplate>(e =>
        {
            e.Property(x => x.ContentType).HasConversion<string>().HasMaxLength(30);
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.TemplateBody).IsRequired();
        });

        modelBuilder.Entity<EngagementTarget>(e =>
        {
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.LinkedInProfileUrl).HasMaxLength(500);
        });

        modelBuilder.Entity<EngagementTask>(e =>
        {
            e.Property(x => x.ActionType).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
            e.Property(x => x.SourcePostUrl).HasMaxLength(500);
            e.HasOne(x => x.Target)
                .WithMany(t => t.Tasks)
                .HasForeignKey(x => x.EngagementTargetId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasIndex(x => x.Status);
        });
    }
}
