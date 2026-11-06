namespace Procurement.Application.Common.Interfaces;

public enum DocumentSequence { Pr, Po, Mpo, Grn, Inv, Vr, Rp }

// Numbers are always issued by a SQL Server SEQUENCE on the server - never guessed or
// incremented client-side. Format: "{Prefix}-{Year}-{N:D5}" (PO additionally gets a
// per-vendor letter suffix appended by the caller, e.g. "PO-2026-01077A").
public interface IDocumentNumberGenerator
{
    Task<string> NextAsync(DocumentSequence sequence, CancellationToken ct = default);
}
