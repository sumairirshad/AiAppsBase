using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Common.Numbering;

public static class DocumentNumberGenerator
{
    public static async Task<string> NextAsync(IProcurementDbContext db, string sequenceName, string prefix, int digits, CancellationToken ct)
    {
        var value = await db.GetNextSequenceValueAsync(sequenceName, ct);
        var year = DateTime.UtcNow.Year;
        return $"{prefix}-{year}-{value.ToString().PadLeft(digits, '0')}";
    }
}
