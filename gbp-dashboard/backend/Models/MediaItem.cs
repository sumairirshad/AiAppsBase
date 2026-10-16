namespace GbpDashboard.Api.Models;

public enum MediaType
{
    Photo,
    Video
}

public enum MediaCategory
{
    Interior,
    Exterior,
    Product,
    Team,
    Food,
    Other
}

public class MediaItem
{
    public string Id { get; set; } = string.Empty;
    public MediaType Type { get; set; } = MediaType.Photo;
    public MediaCategory Category { get; set; } = MediaCategory.Other;
    public string Url { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public DateTimeOffset UploadedAt { get; set; } = DateTimeOffset.UtcNow;
}
