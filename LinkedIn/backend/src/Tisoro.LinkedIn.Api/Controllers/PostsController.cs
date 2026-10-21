using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tisoro.LinkedIn.Api.Data;
using Tisoro.LinkedIn.Api.Dtos;
using Tisoro.LinkedIn.Api.Models;
using Tisoro.LinkedIn.Api.Services;

namespace Tisoro.LinkedIn.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/posts")]
public sealed class PostsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IPostPublishingService _publisher;
    private readonly ILogger<PostsController> _logger;

    public PostsController(AppDbContext db, IPostPublishingService publisher, ILogger<PostsController> logger)
    {
        _db = db;
        _publisher = publisher;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<PostResponse>>> List(
        [FromQuery] PostStatus? status,
        [FromQuery] DateTimeOffset? from,
        [FromQuery] DateTimeOffset? to)
    {
        var query = _db.Posts.Include(p => p.Media).ThenInclude(m => m.MediaAsset).AsQueryable();

        if (status is not null) query = query.Where(p => p.Status == status);
        if (from is not null) query = query.Where(p => p.ScheduledAt == null || p.ScheduledAt >= from);
        if (to is not null) query = query.Where(p => p.ScheduledAt == null || p.ScheduledAt <= to);

        var posts = await query.OrderByDescending(p => p.ScheduledAt ?? p.CreatedAt).ToListAsync();
        return Ok(posts.Select(PostResponse.FromEntity).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PostResponse>> Get(Guid id)
    {
        var post = await _db.Posts.Include(p => p.Media).ThenInclude(m => m.MediaAsset)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (post is null) return NotFound();
        return Ok(PostResponse.FromEntity(post));
    }

    [HttpPost]
    public async Task<ActionResult<PostResponse>> Create([FromBody] CreatePostRequest request)
    {
        var validation = await ValidateAsync(request);
        if (validation is not null) return BadRequest(new { error = validation });

        var post = new Post
        {
            Id = Guid.NewGuid(),
            ContentType = request.ContentType,
            Title = request.Title,
            Body = request.Body,
            ExternalLinkUrl = request.ExternalLinkUrl,
            CaptionTemplateId = request.CaptionTemplateId,
            ScheduledAt = request.ScheduledAt,
            Status = request.ScheduledAt is null ? PostStatus.Draft : PostStatus.Scheduled,
        };

        for (var i = 0; i < request.MediaAssetIds.Count; i++)
        {
            post.Media.Add(new PostMedia { Id = Guid.NewGuid(), MediaAssetId = request.MediaAssetIds[i], SortOrder = i });
        }

        _db.Posts.Add(post);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = post.Id }, PostResponse.FromEntity(await ReloadAsync(post.Id)));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PostResponse>> Update(Guid id, [FromBody] UpdatePostRequest request)
    {
        var post = await _db.Posts.Include(p => p.Media).FirstOrDefaultAsync(p => p.Id == id);
        if (post is null) return NotFound();

        if (post.Status is PostStatus.Published or PostStatus.Publishing)
        {
            return BadRequest(new { error = "A published or currently-publishing post can't be edited." });
        }

        var validation = await ValidateAsync(request);
        if (validation is not null) return BadRequest(new { error = validation });

        post.ContentType = request.ContentType;
        post.Title = request.Title;
        post.Body = request.Body;
        post.ExternalLinkUrl = request.ExternalLinkUrl;
        post.CaptionTemplateId = request.CaptionTemplateId;
        post.ScheduledAt = request.ScheduledAt;
        post.Status = request.ScheduledAt is null ? PostStatus.Draft : PostStatus.Scheduled;
        post.UpdatedAt = DateTimeOffset.UtcNow;

        _db.PostMedia.RemoveRange(post.Media);
        post.Media.Clear();
        for (var i = 0; i < request.MediaAssetIds.Count; i++)
        {
            post.Media.Add(new PostMedia { Id = Guid.NewGuid(), PostId = post.Id, MediaAssetId = request.MediaAssetIds[i], SortOrder = i });
        }

        await _db.SaveChangesAsync();
        return Ok(PostResponse.FromEntity(await ReloadAsync(post.Id)));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        if (post.Status is PostStatus.Published or PostStatus.Publishing)
        {
            return BadRequest(new { error = "A published or currently-publishing post can't be deleted." });
        }

        _db.Posts.Remove(post);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:guid}/publish-now")]
    public async Task<ActionResult<PostResponse>> PublishNow(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        if (post.Status is PostStatus.Published or PostStatus.Publishing)
        {
            return BadRequest(new { error = "This post has already been published or is currently publishing." });
        }

        var result = await _publisher.PublishAsync(id);
        var updated = await ReloadAsync(id);

        if (!result.Success)
        {
            return UnprocessableEntity(new { error = result.Error, post = PostResponse.FromEntity(updated) });
        }
        return Ok(PostResponse.FromEntity(updated));
    }

    [HttpPost("{id:guid}/retry")]
    public async Task<ActionResult<PostResponse>> Retry(Guid id)
    {
        var post = await _db.Posts.FindAsync(id);
        if (post is null) return NotFound();
        if (post.Status != PostStatus.Failed)
        {
            return BadRequest(new { error = "Only a failed post can be retried." });
        }

        post.Status = PostStatus.Scheduled;
        post.ScheduledAt ??= DateTimeOffset.UtcNow;
        post.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(PostResponse.FromEntity(await ReloadAsync(id)));
    }

    private async Task<Post> ReloadAsync(Guid id) =>
        await _db.Posts.Include(p => p.Media).ThenInclude(m => m.MediaAsset).FirstAsync(p => p.Id == id);

    /// <summary>Validates content-type-specific media requirements documented in the content playbook (e.g. multi-image albums need 2-20 images).</summary>
    private async Task<string?> ValidateAsync(CreatePostRequest request)
    {
        if (request.ContentType == PostContentType.ArticleLink && string.IsNullOrWhiteSpace(request.ExternalLinkUrl))
        {
            return "An article-link post requires an external link URL.";
        }

        var requiredKind = request.ContentType switch
        {
            PostContentType.Image => MediaKind.Image,
            PostContentType.MultiImage => MediaKind.Image,
            PostContentType.Video => MediaKind.Video,
            PostContentType.Document => MediaKind.Document,
            _ => (MediaKind?)null,
        };

        switch (request.ContentType)
        {
            case PostContentType.Image when request.MediaAssetIds.Count != 1:
                return "An image post requires exactly one image.";
            case PostContentType.MultiImage when request.MediaAssetIds.Count is < 2 or > 20:
                return "A multi-image album post requires between 2 and 20 images.";
            case PostContentType.Video when request.MediaAssetIds.Count != 1:
                return "A video post requires exactly one video.";
            case PostContentType.Document when request.MediaAssetIds.Count != 1:
                return "A document post requires exactly one document.";
            case PostContentType.Document when string.IsNullOrWhiteSpace(request.Title):
                return "A document post requires a title.";
            case PostContentType.Text or PostContentType.ArticleLink when request.MediaAssetIds.Count > 0:
                return "Text and article-link posts don't take media attachments.";
        }

        if (requiredKind is not null && request.MediaAssetIds.Count > 0)
        {
            var kinds = await _db.MediaAssets
                .Where(m => request.MediaAssetIds.Contains(m.Id))
                .Select(m => new { m.Id, m.Kind })
                .ToListAsync();

            if (kinds.Count != request.MediaAssetIds.Distinct().Count())
            {
                return "One or more referenced media assets do not exist.";
            }
            if (kinds.Any(k => k.Kind != requiredKind))
            {
                return $"All media attached to this post must be of kind {requiredKind}.";
            }
        }

        return null;
    }
}
