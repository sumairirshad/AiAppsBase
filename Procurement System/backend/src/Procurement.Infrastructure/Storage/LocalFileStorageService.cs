using Microsoft.Extensions.Configuration;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Storage;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _rootPath;

    public LocalFileStorageService(IConfiguration configuration)
    {
        var configuredPath = configuration["FileStorage:RootPath"] ?? "App_Data/uploads";
        _rootPath = Path.IsPathRooted(configuredPath) ? configuredPath : Path.Combine(AppContext.BaseDirectory, configuredPath);
        Directory.CreateDirectory(_rootPath);
    }

    public async Task<string> SaveAsync(Stream content, string storageKey, CancellationToken ct)
    {
        var fullPath = ResolvePath(storageKey);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);
        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream, ct);
        return storageKey;
    }

    public Task<Stream> OpenReadAsync(string storageKey, CancellationToken ct)
    {
        Stream stream = File.OpenRead(ResolvePath(storageKey));
        return Task.FromResult(stream);
    }

    private string ResolvePath(string storageKey)
    {
        var safeKey = storageKey.Replace("..", string.Empty);
        return Path.Combine(_rootPath, safeKey);
    }
}
