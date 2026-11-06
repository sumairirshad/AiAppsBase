using MediatR;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Common;

// Every module that needs a file (quotations, contracts, signed contracts, security cheques,
// GRN delivery notes, bills, payment proofs, vendor documents) goes through this one command -
// Documents/DocumentLinks hold only metadata (BR-011), the bytes live in IFileStorageService.
public record UploadDocumentCommand(long ActorUserId, Stream Content, string FileName, string ContentType, string DocumentTypeCode) : IRequest<long>;

public class UploadDocumentHandler : IRequestHandler<UploadDocumentCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IFileStorageService _storage;
    private readonly LookupCache _lookups;

    public UploadDocumentHandler(IApplicationDbContext db, IFileStorageService storage, LookupCache lookups)
    {
        _db = db;
        _storage = storage;
        _lookups = lookups;
    }

    public async Task<long> Handle(UploadDocumentCommand request, CancellationToken ct)
    {
        var stored = await _storage.SaveAsync(request.Content, request.FileName, ct);
        var documentTypeId = await _lookups.IdAsync<DocumentTypes, short>(request.DocumentTypeCode, ct);

        var document = new Documents
        {
            StorageKey = stored.StorageKey,
            FileName = request.FileName,
            ContentType = request.ContentType,
            SizeBytes = stored.SizeBytes,
            Sha256 = stored.Sha256,
            DocumentTypeId = documentTypeId,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<Documents>().Add(document);
        await _db.SaveChangesAsync(ct);
        return document.Id;
    }
}

public record LinkDocumentCommand(long DocumentId, string EntityTypeCode, long EntityId, long ActorUserId) : IRequest;

public class LinkDocumentHandler : IRequestHandler<LinkDocumentCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly LookupCache _lookups;

    public LinkDocumentHandler(IApplicationDbContext db, LookupCache lookups)
    {
        _db = db;
        _lookups = lookups;
    }

    public async Task Handle(LinkDocumentCommand request, CancellationToken ct)
    {
        var entityTypeId = await _lookups.IdAsync<Domain.Entities.EntityTypes, short>(request.EntityTypeCode, ct);
        _db.Set<DocumentLinks>().Add(new DocumentLinks
        {
            DocumentId = request.DocumentId,
            EntityTypeId = entityTypeId,
            EntityId = request.EntityId,
            CreatedBy = request.ActorUserId,
        });
        await _db.SaveChangesAsync(ct);
    }
}
