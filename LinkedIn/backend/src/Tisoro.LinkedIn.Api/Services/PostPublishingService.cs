using Microsoft.EntityFrameworkCore;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Models;
using Tisoro.LinkedIn.Api.Services.LinkedIn;

namespace Tisoro.LinkedIn.Api.Services;

public interface IPostPublishingService
{
    /// <summary>
    /// Publishes one post now: uploads any not-yet-uploaded media, calls the
    /// LinkedIn Posts API, and updates the post's status accordingly. Never
    /// throws — every failure is captured onto the post itself (PublishError,
    /// Status = Failed) so a scheduled batch run or a manual "publish now"
    /// click both get a clean result instead of an unhandled exception.
    /// </summary>
    Task<PublishResult> PublishAsync(Guid postId, CancellationToken cancellationToken = default);
}

public sealed record PublishResult(bool Success, string? Error);

public sealed class PostPublishingService : IPostPublishingService
{
    private readonly AppDbContext _db;
    private readonly ILinkedInApiClient _apiClient;
    private readonly ITokenEncryptionService _tokenEncryption;
    private readonly ILogger<PostPublishingService> _logger;

    public PostPublishingService(
        AppDbContext db,
        ILinkedInApiClient apiClient,
        ITokenEncryptionService tokenEncryption,
        ILogger<PostPublishingService> logger)
    {
        _db = db;
        _apiClient = apiClient;
        _tokenEncryption = tokenEncryption;
        _logger = logger;
    }

    public async Task<PublishResult> PublishAsync(Guid postId, CancellationToken cancellationToken = default)
    {
        var post = await _db.Posts
            .Include(p => p.Media).ThenInclude(m => m.MediaAsset)
            .FirstOrDefaultAsync(p => p.Id == postId, cancellationToken);

        if (post is null)
        {
            return new PublishResult(false, "Post not found.");
        }

        var connection = await _db.LinkedInConnections
            .Where(c => c.IsActive)
            .OrderByDescending(c => c.ConnectedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (connection is null)
        {
            return await FailAsync(post, "No active LinkedIn connection. Connect the Tisoro LinkedIn Page first.", cancellationToken);
        }

        var accessToken = _tokenEncryption.Decrypt(connection.AccessTokenEncrypted);
        if (accessToken is null)
        {
            return await FailAsync(post, "The stored LinkedIn access token could not be decrypted. Reconnect LinkedIn.", cancellationToken);
        }

        if (connection.AccessTokenExpiresAt <= DateTimeOffset.UtcNow)
        {
            return await FailAsync(post, "The LinkedIn access token has expired. Reconnect LinkedIn.", cancellationToken);
        }

        post.Status = PostStatus.Publishing;
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            var mediaUrns = new List<string>();
            foreach (var postMedia in post.Media.OrderBy(m => m.SortOrder))
            {
                var asset = postMedia.MediaAsset;
                if (string.IsNullOrEmpty(asset.LinkedInAssetUrn))
                {
                    var bytes = await File.ReadAllBytesAsync(asset.StoragePath, cancellationToken);
                    asset.LinkedInAssetUrn = asset.Kind switch
                    {
                        MediaKind.Image => await _apiClient.UploadImageAsync(connection.OrganizationUrn, accessToken, bytes),
                        MediaKind.Document => await _apiClient.UploadDocumentAsync(connection.OrganizationUrn, accessToken, bytes),
                        MediaKind.Video => await _apiClient.UploadVideoAsync(connection.OrganizationUrn, accessToken, bytes),
                        _ => throw new InvalidOperationException($"Unsupported media kind: {asset.Kind}"),
                    };
                    await _db.SaveChangesAsync(cancellationToken);
                }
                mediaUrns.Add(asset.LinkedInAssetUrn);
            }

            var spec = new PostPublishSpec
            {
                AuthorUrn = connection.OrganizationUrn,
                ContentType = post.ContentType,
                Body = post.Body,
                Title = post.Title,
                ExternalLinkUrl = post.ExternalLinkUrl,
                MediaUrns = mediaUrns,
            };

            var postUrn = await _apiClient.CreatePostAsync(spec, accessToken);

            post.Status = PostStatus.Published;
            post.LinkedInPostUrn = postUrn;
            post.PublishedAt = DateTimeOffset.UtcNow;
            post.PublishError = null;
            post.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Published post {PostId} as {PostUrn}", post.Id, postUrn);
            return new PublishResult(true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish post {PostId}", post.Id);
            return await FailAsync(post, ex.Message, cancellationToken);
        }
    }

    private async Task<PublishResult> FailAsync(Post post, string error, CancellationToken cancellationToken)
    {
        post.Status = PostStatus.Failed;
        post.PublishError = error;
        post.PublishAttempts += 1;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return new PublishResult(false, error);
    }
}
