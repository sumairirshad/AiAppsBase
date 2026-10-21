using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Tisoro.LinkedIn.Api.Dtos;
using Xunit;

namespace Tisoro.LinkedIn.Api.Tests.Integration;

/// <summary>
/// End-to-end tests against the real app and a real Postgres database
/// (see CustomWebApplicationFactory) — the same thing the manual smoke test
/// covered by hand during development, now codified as regression coverage.
/// </summary>
public class ApiIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Converters = { new JsonStringEnumConverter() },
        PropertyNameCaseInsensitive = true,
    };

    private readonly CustomWebApplicationFactory _factory;

    public ApiIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

    private HttpClient CreateClient() => _factory.CreateClient();

    private async Task<string> LoginAsync(HttpClient client)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = CustomWebApplicationFactory.AdminEmail,
            password = CustomWebApplicationFactory.AdminPassword,
        });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>(JsonOptions);
        return body!.Token;
    }

    [Fact]
    public async Task Login_succeeds_with_the_seeded_admin_credentials()
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = CustomWebApplicationFactory.AdminEmail,
            password = CustomWebApplicationFactory.AdminPassword,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>(JsonOptions);
        Assert.False(string.IsNullOrEmpty(body!.Token));
    }

    [Fact]
    public async Task Login_fails_with_the_wrong_password()
    {
        var client = CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = CustomWebApplicationFactory.AdminEmail,
            password = "definitely-wrong",
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Posts_endpoint_rejects_an_unauthenticated_request()
    {
        var client = CreateClient();
        var response = await client.GetAsync("/api/posts");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Creates_reads_and_deletes_a_draft_text_post()
    {
        var client = CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var marker = Guid.NewGuid();
        var createResponse = await client.PostAsJsonAsync("/api/posts", new
        {
            contentType = "Text",
            body = $"Integration test post {marker}",
            mediaAssetIds = Array.Empty<Guid>(),
        });

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<PostResponse>(JsonOptions);
        Assert.NotNull(created);
        Assert.Equal("Draft", created!.Status.ToString());
        Assert.Contains(marker.ToString(), created.Body);

        var getResponse = await client.GetAsync($"/api/posts/{created.Id}");
        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);

        var deleteResponse = await client.DeleteAsync($"/api/posts/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        var getAfterDelete = await client.GetAsync($"/api/posts/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getAfterDelete.StatusCode);
    }

    [Theory]
    [InlineData("MultiImage", 1)]
    [InlineData("Image", 2)]
    [InlineData("Video", 0)]
    public async Task Rejects_a_post_with_the_wrong_media_count_for_its_content_type(string contentType, int mediaCount)
    {
        var client = CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var mediaIds = Enumerable.Range(0, mediaCount).Select(_ => Guid.NewGuid()).ToArray();
        var response = await client.PostAsJsonAsync("/api/posts", new
        {
            contentType,
            body = "test",
            mediaAssetIds = mediaIds,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Publishing_without_a_linkedin_connection_fails_clearly_and_marks_the_post_failed()
    {
        var client = CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var createResponse = await client.PostAsJsonAsync("/api/posts", new
        {
            contentType = "Text",
            body = $"Publish-now test {Guid.NewGuid()}",
            mediaAssetIds = Array.Empty<Guid>(),
        });
        var created = await createResponse.Content.ReadFromJsonAsync<PostResponse>(JsonOptions);

        var publishResponse = await client.PostAsync($"/api/posts/{created!.Id}/publish-now", null);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, publishResponse.StatusCode);

        var getResponse = await client.GetAsync($"/api/posts/{created.Id}");
        var post = await getResponse.Content.ReadFromJsonAsync<PostResponse>(JsonOptions);
        Assert.Equal("Failed", post!.Status.ToString());
        Assert.False(string.IsNullOrEmpty(post.PublishError));

        await client.DeleteAsync($"/api/posts/{created.Id}");
    }

    [Fact]
    public async Task Linkedin_status_reports_not_connected_when_no_connection_exists_yet()
    {
        var client = CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await client.GetAsync("/api/linkedin/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var status = await response.Content.ReadFromJsonAsync<LinkedInStatusResponse>(JsonOptions);
        Assert.False(status!.Connected);
    }

    [Fact]
    public async Task Engagement_target_and_task_round_trip()
    {
        var client = CreateClient();
        var token = await LoginAsync(client);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var targetResponse = await client.PostAsJsonAsync("/api/engagement/targets", new
        {
            name = $"Test Target {Guid.NewGuid()}",
            linkedInProfileUrl = "https://www.linkedin.com/in/example",
        });
        Assert.Equal(HttpStatusCode.OK, targetResponse.StatusCode);
        var target = await targetResponse.Content.ReadFromJsonAsync<EngagementTargetResponse>(JsonOptions);

        var taskResponse = await client.PostAsJsonAsync("/api/engagement/tasks", new
        {
            engagementTargetId = target!.Id,
            actionType = "Comment",
            suggestedText = "Great milestone!",
        });
        Assert.Equal(HttpStatusCode.OK, taskResponse.StatusCode);
        var task = await taskResponse.Content.ReadFromJsonAsync<EngagementTaskResponse>(JsonOptions);
        Assert.Equal("Pending", task!.Status.ToString());

        var completeResponse = await client.PostAsync($"/api/engagement/tasks/{task.Id}/complete", null);
        Assert.Equal(HttpStatusCode.OK, completeResponse.StatusCode);
        var completed = await completeResponse.Content.ReadFromJsonAsync<EngagementTaskResponse>(JsonOptions);
        Assert.Equal("Done", completed!.Status.ToString());

        await client.DeleteAsync($"/api/engagement/targets/{target.Id}");
    }
}
