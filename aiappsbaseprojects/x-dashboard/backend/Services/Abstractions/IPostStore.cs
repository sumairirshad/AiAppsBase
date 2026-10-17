using XDashboard.Api.Models;

namespace XDashboard.Api.Services.Abstractions;

public interface IPostStore
{
    Task<IReadOnlyList<Post>> GetPostsAsync(CancellationToken cancellationToken = default);
    Task<Post?> GetPostByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<Post> CreatePostAsync(CreatePostRequest request, CancellationToken cancellationToken = default);
    Task<Post?> UpdatePostAsync(string id, UpdatePostRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeletePostAsync(string id, CancellationToken cancellationToken = default);
    Task<Post?> SetPinnedAsync(string id, CancellationToken cancellationToken = default);
    Task<Post> AddPublishedPostAsync(PostType type, string text, List<string> imageUrls, CancellationToken cancellationToken = default);
}
