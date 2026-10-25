using System.Net;

namespace TikTok.Api.Tests.TestSupport;

public class FakeHttpMessageHandler : HttpMessageHandler
{
    private readonly Queue<Func<HttpRequestMessage, HttpResponseMessage>> _responders = new();
    public List<HttpRequestMessage> Requests { get; } = new();

    public FakeHttpMessageHandler Enqueue(HttpStatusCode statusCode, string jsonBody)
    {
        _responders.Enqueue(_ => new HttpResponseMessage(statusCode)
        {
            Content = new StringContent(jsonBody, System.Text.Encoding.UTF8, "application/json")
        });
        return this;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Requests.Add(request);
        if (_responders.Count == 0)
        {
            throw new InvalidOperationException("No more queued responses for FakeHttpMessageHandler.");
        }

        return Task.FromResult(_responders.Dequeue()(request));
    }
}
