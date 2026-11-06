using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Infrastructure.Services;

// Dev/default implementation: files on local disk under the configured root. Swap for a blob
// storage implementation behind the same IFileStorageService interface in production - nothing
// else in the app needs to change, since only Documents.StorageKey ever leaves this class.
public class LocalFileStorageService : IFileStorageService
{
    private readonly string _root;

    public LocalFileStorageService(IConfiguration configuration)
    {
        // A relative default so local dev (Windows, macOS, Linux) just works; docker-compose
        // overrides this to an absolute, volume-mounted container path.
        _root = configuration["FileStorage:RootPath"] ?? Path.Combine(AppContext.BaseDirectory, "filestorage");
        Directory.CreateDirectory(_root);
    }

    public async Task<StoredFile> SaveAsync(Stream content, string fileName, CancellationToken ct = default)
    {
        var storageKey = $"{DateTime.UtcNow:yyyy/MM/dd}/{Guid.NewGuid():N}_{Path.GetFileName(fileName)}";
        var fullPath = Path.Combine(_root, storageKey.Replace('/', Path.DirectorySeparatorChar));
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        using var sha256 = SHA256.Create();
        await using var output = File.Create(fullPath);
        await using var hashing = new CryptoStream(output, sha256, CryptoStreamMode.Write);
        await content.CopyToAsync(hashing, ct);
        await hashing.FlushAsync(ct);

        var size = new FileInfo(fullPath).Length;
        return new StoredFile(storageKey, size, Convert.ToHexString(sha256.Hash!));
    }

    public Task<Stream> OpenAsync(string storageKey, CancellationToken ct = default)
    {
        var fullPath = Path.Combine(_root, storageKey.Replace('/', Path.DirectorySeparatorChar));
        return Task.FromResult<Stream>(File.OpenRead(fullPath));
    }
}
