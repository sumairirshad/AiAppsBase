using Instagram.Api.Clients;
using Instagram.Api.Models.Dtos;

namespace Instagram.Api.Services;

public class CommentModerationService(IInstagramGraphClient graphClient, IAccountService accountService)
    : ICommentModerationService
{
    public async Task<IReadOnlyList<CommentDto>> GetCommentsAsync(Guid accountId, string mediaId, CancellationToken ct)
    {
        var accessToken = await accountService.GetDecryptedAccessTokenAsync(accountId, ct);
        var response = await graphClient.GetCommentsAsync(mediaId, accessToken, ct);

        return response.Data
            .Select(c => new CommentDto(c.Id, c.Text, c.Username, c.Timestamp, c.Hidden ?? false))
            .ToList();
    }

    public async Task<string> ReplyAsync(Guid accountId, string commentId, string message, CancellationToken ct)
    {
        var accessToken = await accountService.GetDecryptedAccessTokenAsync(accountId, ct);
        return await graphClient.PostCommentReplyAsync(commentId, accessToken, message, ct);
    }

    public async Task SetHiddenAsync(Guid accountId, string commentId, bool hidden, CancellationToken ct)
    {
        var accessToken = await accountService.GetDecryptedAccessTokenAsync(accountId, ct);
        await graphClient.SetCommentHiddenAsync(commentId, accessToken, hidden, ct);
    }

    public async Task DeleteAsync(Guid accountId, string commentId, CancellationToken ct)
    {
        var accessToken = await accountService.GetDecryptedAccessTokenAsync(accountId, ct);
        await graphClient.DeleteCommentAsync(commentId, accessToken, ct);
    }
}
