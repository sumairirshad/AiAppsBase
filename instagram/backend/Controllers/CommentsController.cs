using Instagram.Api.Models.Requests;
using Instagram.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Instagram.Api.Controllers;

[ApiController]
[Route("api/comments")]
[Authorize]
public class CommentsController(ICommentModerationService commentService) : ControllerBase
{
    [HttpGet("media/{mediaId}")]
    public async Task<IActionResult> GetComments(string mediaId, [FromQuery] Guid accountId, CancellationToken ct) =>
        Ok(await commentService.GetCommentsAsync(accountId, mediaId, ct));

    [HttpPost("{commentId}/reply")]
    public async Task<IActionResult> Reply(string commentId, [FromBody] CommentReplyRequest request, CancellationToken ct)
    {
        var replyId = await commentService.ReplyAsync(request.AccountId, commentId, request.Message, ct);
        return Ok(new { replyId });
    }

    [HttpPatch("{commentId}/visibility")]
    public async Task<IActionResult> SetVisibility(string commentId, [FromBody] CommentVisibilityRequest request, CancellationToken ct)
    {
        await commentService.SetHiddenAsync(request.AccountId, commentId, request.Hidden, ct);
        return NoContent();
    }

    [HttpDelete("{commentId}")]
    public async Task<IActionResult> Delete(string commentId, [FromQuery] Guid accountId, CancellationToken ct)
    {
        await commentService.DeleteAsync(accountId, commentId, ct);
        return NoContent();
    }
}
