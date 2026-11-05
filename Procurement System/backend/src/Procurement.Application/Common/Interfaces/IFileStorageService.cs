namespace Procurement.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(Stream content, string storageKey, CancellationToken ct);
    Task<Stream> OpenReadAsync(string storageKey, CancellationToken ct);
}
