namespace Procurement.Application.Common.Interfaces;

public record StoredFile(string StorageKey, long SizeBytes, string Sha256);

// Files live outside the database (BR-011 / architecture spec): this just persists bytes
// somewhere durable (local disk in dev, swap for blob storage in production behind the same
// interface) and gives back a storage key; Documents.StorageKey is all the DB ever holds.
public interface IFileStorageService
{
    Task<StoredFile> SaveAsync(Stream content, string fileName, CancellationToken ct = default);
    Task<Stream> OpenAsync(string storageKey, CancellationToken ct = default);
}
