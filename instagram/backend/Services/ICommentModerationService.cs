using Instagram.Api.Models.Dtos;

namespace Instagram.Api.Services;

public interface ICommentModerationService
{
    Task<IReadOnlyList<CommentDto>> GetCommentsAsync(Guid accountId, string mediaId, CancellationToken ct);
    Task<string> ReplyAsync(Guid accountId, string commentId, string message, CancellationToken ct);
    Task SetHiddenAsync(Guid accountId, string commentId, bool hidden, CancellationToken ct);
    Task DeleteAsync(Guid accountId, string commentId, CancellationToken ct);
}
