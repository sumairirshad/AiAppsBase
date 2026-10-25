using System.Net;
using Instagram.Api.Clients;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Instagram.Api.Tests.Clients;

public class RetryHandlerTests
{
    [Fact]
    public async Task SendAsync_OnTransient503_RetriesAndEventuallySucceeds()
    {
        var attempts = 0;
        var inner = new FakeHttpMessageHandler(_ =>
        {
            attempts++;
            return attempts < 3
                ? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                : new HttpResponseMessage(HttpStatusCode.OK);
        });

        var retryHandler = new RetryHandler(NullLogger<RetryHandler>.Instance) { InnerHandler = inner };
        using var client = new HttpClient(retryHandler);

        var response = await client.GetAsync("https://graph.instagram.test/x");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, attempts);
    }

    [Fact]
    public async Task SendAsync_OnPersistent429_StopsAfterMaxAttempts()
    {
        var attempts = 0;
        var inner = new FakeHttpMessageHandler(_ =>
        {
            attempts++;
            return new HttpResponseMessage(HttpStatusCode.TooManyRequests);
        });

        var retryHandler = new RetryHandler(NullLogger<RetryHandler>.Instance) { InnerHandler = inner };
        using var client = new HttpClient(retryHandler);

        var response = await client.GetAsync("https://graph.instagram.test/x");

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        Assert.Equal(3, attempts);
    }
}
