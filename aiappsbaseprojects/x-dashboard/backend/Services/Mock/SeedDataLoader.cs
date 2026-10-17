using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using XDashboard.Api.Options;

namespace XDashboard.Api.Services.Mock;

public class SeedDataLoader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly string _seedDirectory;

    public SeedDataLoader(IHostEnvironment environment, IOptions<MockDataOptions> options)
    {
        _seedDirectory = Path.Combine(environment.ContentRootPath, options.Value.SeedDirectory);
    }

    public T Load<T>(string fileName) where T : new()
    {
        var path = Path.Combine(_seedDirectory, fileName);
        if (!File.Exists(path))
        {
            return new T();
        }

        var json = File.ReadAllText(path);
        return JsonSerializer.Deserialize<T>(json, JsonOptions) ?? new T();
    }
}
