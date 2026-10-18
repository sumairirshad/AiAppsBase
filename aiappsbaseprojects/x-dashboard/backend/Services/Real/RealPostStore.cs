using System.Net;
using XDashboard.Api.Models;
using XDashboard.Api.Services.Abstractions;
using XDashboard.Api.Services.X;

namespace XDashboard.Api.Services.Real;

/// <summary>
/// Backs the Posts page with the connected account's real posts via the X API v2 tweet
/// endpoints. "Posts" and "Shorts" (see RealShortStore) share the same underlying X post
/// timeline -- X has no separate concept of either -- so each store fetches the timeline and
/// filters to the posts without attached video (Posts) or with it (Shorts).
/// </summary>
public class RealPostStore : IPostStore
{
    private const int TimelinePageSize = 100;

    private readonly IXApiClient _xApiClient;

    public RealPostStore(IXApiClient xApiClient)
    {
        _xApiClient = xApiClient;
    }

    public async Task<IReadOnlyList<Post>> GetPostsAsync(CancellationToken cancellationToken = default)
    {
        var me = await _xApiClient.GetMeAsync(cancellationToken);
        var page = await _xApiClient.GetUserTweetsAsync(me.Id, null, TimelinePageSize, cancellationToken);

        return page.Tweets
            .Where(tweet => !IsVideoTweet(tweet, page.MediaByKey))
            .Select(tweet => MapToPost(tweet, page.MediaByKey, me.Username, me.PinnedTweetId))
            .OrderByDescending(post => post.CreatedAt)
            .ToList();
    }

    public async Task<Post?> GetPostByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        var result = await _xApiClient.GetTweetAsync(id, cancellationToken);
        if (result is null)
        {
            return null;
        }

        var me = await _xApiClient.GetMeAsync(cancellationToken);
        var (tweet, mediaByKey) = result.Value;
        return MapToPost(tweet, mediaByKey, me.Username, me.PinnedTweetId);
    }

    public async Task<Post> CreatePostAsync(CreatePostRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Type == PostType.Image && request.MediaIds.Count == 0)
        {
            throw new XFeatureNotSupportedException(
                "Upload at least one image via POST /api/media before creating an image post.");
        }

        var created = await _xApiClient.CreateTweetAsync(request.Text, request.MediaIds, cancellationToken);
        return await FetchCreatedPostAsync(created.Id, cancellationToken);
    }

    public Task<Post?> UpdatePostAsync(string id, UpdatePostRequest request, CancellationToken cancellationToken = default)
    {
        throw new XFeatureNotSupportedException(
            "X does not support editing a published post's text or media. Delete this post and create a new one instead.");
    }

    public async Task<bool> DeletePostAsync(string id, CancellationToken cancellationToken = default)
    {
        try
        {
            await _xApiClient.DeleteTweetAsync(id, cancellationToken);
            return true;
        }
        catch (XApiException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task<Post?> SetPinnedAsync(string id, CancellationToken cancellationToken = default)
    {
        var me = await _xApiClient.GetMeAsync(cancellationToken);

        if (string.Equals(me.PinnedTweetId, id, StringComparison.Ordinal))
        {
            await _xApiClient.UnpinTweetAsync(me.Id, id, cancellationToken);
        }
        else
        {
            await _xApiClient.PinTweetAsync(me.Id, id, cancellationToken);
        }

        return await GetPostByIdAsync(id, cancellationToken);
    }

    public async Task<Post> AddPublishedPostAsync(PostType type, string text, List<string> mediaIds, CancellationToken cancellationToken = default)
    {
        var created = await _xApiClient.CreateTweetAsync(text, mediaIds, cancellationToken);
        return await FetchCreatedPostAsync(created.Id, cancellationToken);
    }

    private async Task<Post> FetchCreatedPostAsync(string tweetId, CancellationToken cancellationToken)
    {
        var me = await _xApiClient.GetMeAsync(cancellationToken);
        var result = await _xApiClient.GetTweetAsync(tweetId, cancellationToken);
        if (result is null)
        {
            // X's read-after-write can briefly lag right after a create; return what we know
            // rather than failing a request that actually succeeded on X's side.
            return new Post { Id = tweetId, AuthorHandle = me.Username, CreatedAt = DateTimeOffset.UtcNow };
        }

        var (tweet, mediaByKey) = result.Value;
        return MapToPost(tweet, mediaByKey, me.Username, me.PinnedTweetId);
    }

    internal static bool IsVideoTweet(XTweet tweet, Dictionary<string, XMedia> mediaByKey)
    {
        if (tweet.Attachments?.MediaKeys is null)
        {
            return false;
        }

        return tweet.Attachments.MediaKeys.Any(key =>
            mediaByKey.TryGetValue(key, out var media) &&
            (media.Type == "video" || media.Type == "animated_gif"));
    }

    private static Post MapToPost(XTweet tweet, Dictionary<string, XMedia> mediaByKey, string authorHandle, string? pinnedTweetId)
    {
        var imageUrls = new List<string>();
        if (tweet.Attachments?.MediaKeys is not null)
        {
            foreach (var key in tweet.Attachments.MediaKeys)
            {
                if (!mediaByKey.TryGetValue(key, out var media))
                {
                    continue;
                }

                var url = media.Type == "photo" ? media.Url : media.PreviewImageUrl;
                if (!string.IsNullOrEmpty(url))
                {
                    imageUrls.Add(url);
                }
            }
        }

        return new Post
        {
            Id = tweet.Id,
            AuthorHandle = authorHandle,
            Type = imageUrls.Count > 0 ? PostType.Image : PostType.Text,
            Text = tweet.Text,
            ImageUrls = imageUrls,
            CreatedAt = tweet.CreatedAt,
            Likes = tweet.PublicMetrics?.LikeCount ?? 0,
            Reposts = tweet.PublicMetrics?.RetweetCount ?? 0,
            Replies = tweet.PublicMetrics?.ReplyCount ?? 0,
            Views = tweet.PublicMetrics?.ImpressionCount ?? 0,
            IsPinned = tweet.Id == pinnedTweetId,
        };
    }
}
