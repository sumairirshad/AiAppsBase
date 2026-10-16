using GbpDashboard.Api.Dtos;
using GbpDashboard.Api.Models;
using GbpDashboard.Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace GbpDashboard.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IBusinessProfileRepository _profileRepository;
    private readonly IPostRepository _postRepository;
    private readonly IMediaRepository _mediaRepository;

    public DashboardController(
        IBusinessProfileRepository profileRepository,
        IPostRepository postRepository,
        IMediaRepository mediaRepository)
    {
        _profileRepository = profileRepository;
        _postRepository = postRepository;
        _mediaRepository = mediaRepository;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<DashboardOverviewDto>> GetOverview()
    {
        var profile = await _profileRepository.GetAsync();
        var posts = await _postRepository.GetAllAsync();
        var media = await _mediaRepository.GetAllAsync();

        var overview = new DashboardOverviewDto
        {
            Profile = profile,
            TotalPosts = posts.Count,
            ScheduledPostsCount = posts.Count(p => p.Status == PostStatus.Scheduled),
            PublishedPostsCount = posts.Count(p => p.Status == PostStatus.Published),
            DraftPostsCount = posts.Count(p => p.Status == PostStatus.Draft),
            MediaCount = media.Count,
            RecentPosts = posts.Take(5).ToList(),
            UpcomingScheduledPosts = posts
                .Where(p => p.Status == PostStatus.Scheduled)
                .OrderBy(p => p.ScheduledAt)
                .ToList()
        };

        return Ok(overview);
    }
}
