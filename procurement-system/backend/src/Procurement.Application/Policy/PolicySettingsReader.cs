using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Policy;

public class PolicySettingsReader : IPolicySettingsReader
{
    private readonly IApplicationDbContext _db;

    public PolicySettingsReader(IApplicationDbContext db) => _db = db;

    private async Task<string?> GetRawAsync(long policyVersionId, string key, CancellationToken ct) =>
        (await _db.PolicySettings.FirstOrDefaultAsync(s => s.PolicyVersionId == policyVersionId && s.SettingKey == key, ct))?.Value;

    public async Task<decimal> GetDecimalAsync(long policyVersionId, string settingKey, decimal fallback, CancellationToken ct = default)
    {
        var raw = await GetRawAsync(policyVersionId, settingKey, ct);
        return raw is not null && decimal.TryParse(raw, out var value) ? value : fallback;
    }

    public async Task<bool> GetBoolAsync(long policyVersionId, string settingKey, bool fallback, CancellationToken ct = default)
    {
        var raw = await GetRawAsync(policyVersionId, settingKey, ct);
        return raw is not null && bool.TryParse(raw, out var value) ? value : fallback;
    }

    public async Task<int> GetIntAsync(long policyVersionId, string settingKey, int fallback, CancellationToken ct = default)
    {
        var raw = await GetRawAsync(policyVersionId, settingKey, ct);
        return raw is not null && int.TryParse(raw, out var value) ? value : fallback;
    }
}
