using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Common.Policy;

public static class PolicyVersionResolver
{
    public static async Task<PolicyVersions> GetCurrentAsync(IProcurementDbContext db, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return await db.PolicyVersions
            .Where(p => p.EffectiveFrom <= today && (p.EffectiveTo == null || p.EffectiveTo >= today))
            .OrderByDescending(p => p.VersionNo)
            .FirstAsync(ct);
    }

    public static async Task<Dictionary<string, string>> GetSettingsAsync(IProcurementDbContext db, long policyVersionId, CancellationToken ct) =>
        await db.PolicySettings.Where(p => p.PolicyVersionId == policyVersionId).ToDictionaryAsync(p => p.SettingKey, p => p.Value, ct);
}
