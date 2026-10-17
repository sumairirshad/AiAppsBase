namespace XDashboard.Api.Models;

public class Short
{
    public string Id { get; set; } = string.Empty;
    public string VideoUrl { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Hashtags { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public TimeSpan Duration { get; set; }
}

public class CreateShortRequest
{
    public string FileName { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Hashtags { get; set; } = new();
}
