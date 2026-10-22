using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using XDashboard.Api.Models;

namespace XDashboard.Api.Tests.Integration;

/// <summary>
/// Scheduling, posting, and error-handling through real HTTP requests against the real app.
/// The X data layer is the project's own Fakes (see XDashboardWebApplicationFactory) standing in
/// for the real X API -- the scheduling logic itself (InMemorySchedulerStore,
/// SchedulerPublishingService's due-post query) and the controllers/validation/exception
/// middleware are all real.
/// </summary>
public class SchedulerAndPostsTests : IClassFixture<XDashboardWebApplicationFactory>
{
    // The server serializes enums as strings (see Program.cs's AddJsonOptions), but
    // System.Net.Http.Json's ReadFromJsonAsync uses plain default options unless told otherwise
    // -- without this, every response containing a PostType/ScheduleStatus fails to deserialize
    // here, even though the server's own JSON is correct.
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() },
        PropertyNameCaseInsensitive = true,
    };

    private readonly XDashboardWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public SchedulerAndPostsTests(XDashboardWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateScheduledPost_InThePast_IsRejected()
    {
        var response = await _client.PostAsJsonAsync("/api/scheduler", new
        {
            type = "Text",
            text = "hello",
            mediaIds = Array.Empty<string>(),
            scheduledFor = DateTimeOffset.UtcNow.AddMinutes(-5),
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateScheduledPost_WithNoTextAndNoMedia_IsRejected()
    {
        var response = await _client.PostAsJsonAsync("/api/scheduler", new
        {
            type = "Text",
            text = "",
            mediaIds = Array.Empty<string>(),
            scheduledFor = DateTimeOffset.UtcNow.AddHours(1),
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ScheduledPost_FullLifecycle_CreateListGetPublishNow()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/scheduler", new
        {
            type = "Text",
            text = $"lifecycle test {Guid.NewGuid()}",
            mediaIds = Array.Empty<string>(),
            scheduledFor = DateTimeOffset.UtcNow.AddHours(1),
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<ScheduledPost>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal(ScheduleStatus.Scheduled, created!.Status);

        var listResponse = await _client.GetAsync("/api/scheduler");
        var list = await listResponse.Content.ReadFromJsonAsync<List<ScheduledPost>>(JsonOptions);
        Assert.Contains(list!, s => s.Id == created.Id);

        var getResponse = await _client.GetAsync($"/api/scheduler/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var publishResponse = await _client.PostAsync($"/api/scheduler/{created.Id}/publish-now", content: null);
        Assert.Equal(HttpStatusCode.OK, publishResponse.StatusCode);
        var published = await publishResponse.Content.ReadFromJsonAsync<ScheduledPost>(JsonOptions);
        Assert.Equal(ScheduleStatus.Published, published!.Status);
        Assert.False(string.IsNullOrEmpty(published.PublishedPostId));
        Assert.Contains(_factory.PostStore.Posts, p => p.Id == published.PublishedPostId);
    }

    [Fact]
    public async Task ScheduledPost_PublishNow_WhenXRejectsIt_RecordsFailureInsteadOfThrowing()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/scheduler", new
        {
            type = "Text",
            text = $"will fail to publish {Guid.NewGuid()}",
            mediaIds = Array.Empty<string>(),
            scheduledFor = DateTimeOffset.UtcNow.AddHours(1),
        });
        var created = (await createResponse.Content.ReadFromJsonAsync<ScheduledPost>(JsonOptions))!;

        _factory.PostStore.AddPublishedPostException = new InvalidOperationException("X API error (403): duplicate content");
        try
        {
            var publishResponse = await _client.PostAsync($"/api/scheduler/{created.Id}/publish-now", content: null);

            Assert.Equal(HttpStatusCode.OK, publishResponse.StatusCode);
            var result = await publishResponse.Content.ReadFromJsonAsync<ScheduledPost>(JsonOptions);
            Assert.Equal(ScheduleStatus.Failed, result!.Status);
            Assert.Contains("duplicate content", result.FailureReason);
        }
        finally
        {
            _factory.PostStore.AddPublishedPostException = null;
        }
    }

    [Fact]
    public async Task CancelScheduledPost_RemovesIt_AndSecondCancelReturns404()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/scheduler", new
        {
            type = "Text",
            text = $"to cancel {Guid.NewGuid()}",
            mediaIds = Array.Empty<string>(),
            scheduledFor = DateTimeOffset.UtcNow.AddHours(1),
        });
        var created = (await createResponse.Content.ReadFromJsonAsync<ScheduledPost>(JsonOptions))!;

        var firstCancel = await _client.DeleteAsync($"/api/scheduler/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, firstCancel.StatusCode);

        var secondCancel = await _client.DeleteAsync($"/api/scheduler/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, secondCancel.StatusCode);
    }

    [Fact]
    public async Task PublishNow_OnUnknownScheduledPost_Returns404()
    {
        var response = await _client.PostAsync("/api/scheduler/does-not-exist/publish-now", content: null);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreatePost_TextTypeWithNoText_IsRejected()
    {
        var response = await _client.PostAsJsonAsync("/api/posts", new { type = "Text", text = "", mediaIds = Array.Empty<string>() });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreatePost_ImageTypeWithNoMedia_IsRejected()
    {
        var response = await _client.PostAsJsonAsync("/api/posts", new { type = "Image", text = "caption", mediaIds = Array.Empty<string>() });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreatePost_ThenGetDeletePinRoundTrip()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/posts", new { type = "Text", text = $"a real post {Guid.NewGuid()}", mediaIds = Array.Empty<string>() });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = (await createResponse.Content.ReadFromJsonAsync<Post>(JsonOptions))!;

        var pinResponse = await _client.PostAsync($"/api/posts/{created.Id}/pin", content: null);
        Assert.Equal(HttpStatusCode.OK, pinResponse.StatusCode);
        var pinned = await pinResponse.Content.ReadFromJsonAsync<Post>(JsonOptions);
        Assert.True(pinned!.IsPinned);

        var deleteResponse = await _client.DeleteAsync($"/api/posts/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getAfterDelete = await _client.GetAsync($"/api/posts/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);
    }

    [Fact]
    public async Task UpdatePost_ReturnsConflict_BecauseXHasNoEditEndpoint()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/posts", new { type = "Text", text = $"immutable {Guid.NewGuid()}", mediaIds = Array.Empty<string>() });
        var created = (await createResponse.Content.ReadFromJsonAsync<Post>(JsonOptions))!;

        var updateResponse = await _client.PutAsJsonAsync($"/api/posts/{created.Id}", new { text = "edited" });

        Assert.Equal(HttpStatusCode.Conflict, updateResponse.StatusCode);
        var body = await updateResponse.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(JsonOptions);
        Assert.Equal("not_supported_by_x_api", body.GetProperty("code").GetString());
    }

    [Fact]
    public async Task GetPost_UnknownId_Returns404()
    {
        var response = await _client.GetAsync("/api/posts/does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateShort_WithoutCaption_IsRejected()
    {
        var response = await _client.PostAsJsonAsync("/api/shorts", new { mediaId = "m1", caption = "" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateShort_WithoutMediaId_IsRejected()
    {
        var response = await _client.PostAsJsonAsync("/api/shorts", new { mediaId = "", caption = "a caption" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateShort_ThenDelete_RoundTrips()
    {
        var createResponse = await _client.PostAsJsonAsync("/api/shorts", new { mediaId = "m1", caption = $"short {Guid.NewGuid()}" });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = (await createResponse.Content.ReadFromJsonAsync<Short>(JsonOptions))!;

        var deleteResponse = await _client.DeleteAsync($"/api/shorts/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getAfterDelete = await _client.GetAsync($"/api/shorts/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);
    }

    [Fact]
    public async Task DashboardSummary_ReflectsConnectedAccountAndRealCounts()
    {
        _factory.XApiClient.Me = new XDashboard.Api.Services.X.XUser
        {
            Id = "dash-user",
            Username = "dashhandle",
            Name = "Dash Handle",
            PublicMetrics = new XDashboard.Api.Services.X.XUserPublicMetrics { TweetCount = 42 },
        };

        var response = await _client.GetAsync("/api/dashboard/summary");

        response.EnsureSuccessStatusCode();
        var summary = await response.Content.ReadFromJsonAsync<DashboardSummary>(JsonOptions);
        Assert.Equal("dashhandle", summary!.Handle);
        Assert.Equal(42, summary.TotalPosts);
    }

    [Fact]
    public async Task UnexpectedException_IsNeverABareUnparseableResponse()
    {
        // Simulates a genuinely unanticipated failure -- not one of the app's own typed X
        // exceptions -- reaching the exception middleware, e.g. a bug or a dependency throwing
        // something this app has no specific handling for. The frontend's ApiErrorState always
        // expects a { message, code } JSON body; this must never degrade to a bare 500 it can't
        // parse a message out of.
        using var freshFactory = new XDashboardWebApplicationFactory();
        freshFactory.XApiClient.Me = new XDashboard.Api.Services.X.XUser { Id = "u3", Username = "boom-test" };
        var client = freshFactory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var loginResponse = await client.GetAsync("/api/auth/x/login");
        var state = System.Web.HttpUtility.ParseQueryString(loginResponse.Headers.Location!.Query)["state"]!;
        await client.GetAsync($"/api/auth/x/callback?code=code&state={state}");

        freshFactory.XApiClient.GetMeException = new InvalidCastException("simulated unanticipated bug");

        var response = await client.GetAsync("/api/auth/x/status");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(JsonOptions);
        Assert.Equal("internal_error", body.GetProperty("code").GetString());
        Assert.False(string.IsNullOrEmpty(body.GetProperty("message").GetString()));
    }
}
