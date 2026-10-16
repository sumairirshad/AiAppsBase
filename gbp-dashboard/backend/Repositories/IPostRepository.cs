using GbpDashboard.Api.Models;

namespace GbpDashboard.Api.Repositories;

public interface IPostRepository
{
    Task<List<Post>> GetAllAsync();
    Task<Post?> GetByIdAsync(string id);
    Task<Post> CreateAsync(Post post);
    Task<Post?> UpdateAsync(string id, Post post);
    Task<bool> DeleteAsync(string id);
}
