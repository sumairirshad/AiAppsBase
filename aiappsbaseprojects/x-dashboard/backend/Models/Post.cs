namespace XDashboard.Api.Models;

public class Post
{
    public string Id { get; set; } = string.Empty;
    public string AuthorHandle { get; set; } = string.Empty;
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public int Likes { get; set; }
    public int Reposts { get; set; }
    public int Replies { get; set; }
    public int Views { get; set; }
    public bool IsPinned { get; set; }
}

public class CreatePostRequest
{
    public PostType Type { get; set; } = PostType.Text;
    public string Text { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
}

public class UpdatePostRequest
{
    public string Text { get; set; } = string.Empty;
    public List<string> ImageUrls { get; set; } = new();
}
