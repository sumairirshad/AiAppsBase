namespace Instagram.Api.Models.Dtos;

public record MetricDto(string Name, long Value, DateTimeOffset CapturedAt);

public record CommentDto(string Id, string Text, string? Username, DateTimeOffset? Timestamp, bool Hidden);
