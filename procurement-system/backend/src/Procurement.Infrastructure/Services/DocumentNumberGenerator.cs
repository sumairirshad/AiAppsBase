using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Infrastructure.Services;

public class DocumentNumberGenerator : IDocumentNumberGenerator
{
    private static readonly Dictionary<DocumentSequence, (string Sequence, string Prefix, int Pad)> Map = new()
    {
        [DocumentSequence.Pr] = ("seq_pr", "PR", 5),
        [DocumentSequence.Po] = ("seq_po", "PO", 5),
        [DocumentSequence.Mpo] = ("seq_mpo", "MPO", 5),
        [DocumentSequence.Grn] = ("seq_grn", "GRN", 5),
        [DocumentSequence.Inv] = ("seq_inv", "INV", 5),
        [DocumentSequence.Vr] = ("seq_vr", "VR", 4),
        [DocumentSequence.Rp] = ("seq_rp", "RP", 4),
    };

    private readonly ProcurementDbContext _db;

    public DocumentNumberGenerator(ProcurementDbContext db) => _db = db;

    public async Task<string> NextAsync(DocumentSequence sequence, CancellationToken ct = default)
    {
        var (seq, prefix, pad) = Map[sequence];
        var connection = _db.Database.GetDbConnection();
        var wasClosed = connection.State != System.Data.ConnectionState.Open;
        if (wasClosed) await connection.OpenAsync(ct);
        try
        {
            using var cmd = connection.CreateCommand();
            cmd.CommandText = $"SELECT NEXT VALUE FOR [{seq}]";
            var result = await cmd.ExecuteScalarAsync(ct);
            var next = Convert.ToInt32(result);
            var year = DateTime.UtcNow.Year;
            return $"{prefix}-{year}-{next.ToString().PadLeft(pad, '0')}";
        }
        finally
        {
            if (wasClosed) await connection.CloseAsync();
        }
    }
}
