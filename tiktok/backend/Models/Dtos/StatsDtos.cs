namespace TikTok.Api.Models.Dtos;

public record VideoStatDto(
    string TikTokVideoId,
    string? Title,
    long ViewCount,
    long LikeCount,
    long CommentCount,
    long ShareCount,
    DateTimeOffset CapturedAt
);

public record ApiErrorResponse(string Message, string? Detail = null);
