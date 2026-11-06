using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

// Policy Version 1: the default approval bands / quotation rules / settings from the business
// requirements (BR-015, BR-018, BR-027, DEC-001..017). Only ever runs when PolicyVersions is
// empty - once OPD starts versioning policy, this seeder gets out of the way.
public class PolicySeeder
{
    private readonly ProcurementDbContext _db;
    private readonly ILogger<PolicySeeder> _logger;

    public PolicySeeder(ProcurementDbContext db, ILogger<PolicySeeder> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<long> SeedAsync(long systemUserId, CancellationToken ct = default)
    {
        var existing = await _db.PolicyVersions.OrderByDescending(p => p.VersionNo).FirstOrDefaultAsync(ct);
        if (existing is not null) return existing.Id;

        var statusApproved = await RequireLookupId<ApprovalRequestStatuses, short>("Approved", ct);
        var roleHod = await RequireLookupId<Roles, long>("HOD", ct);
        var roleFinance = await RequireLookupId<Roles, long>("FINANCE", ct);
        var roleAudit = await RequireLookupId<Roles, long>("AUDIT", ct);

        var version = new PolicyVersions
        {
            VersionNo = 1,
            EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow),
            StatusId = statusApproved,
            ApprovedBy = systemUserId,
            ChangeReason = "Initial policy baseline from the business requirements register.",
            CreatedBy = systemUserId,
        };
        _db.PolicyVersions.Add(version);
        await _db.SaveChangesAsync(ct);

        _db.ApprovalBands.AddRange(
            new ApprovalBands { PolicyVersionId = version.Id, MinAmount = 0, MaxAmount = 1_000_000, Sequence = 1, RoleId = roleHod, CreatedBy = systemUserId },
            new ApprovalBands { PolicyVersionId = version.Id, MinAmount = 1_000_000.01m, MaxAmount = 5_000_000, Sequence = 1, RoleId = roleHod, CreatedBy = systemUserId },
            new ApprovalBands { PolicyVersionId = version.Id, MinAmount = 1_000_000.01m, MaxAmount = 5_000_000, Sequence = 2, RoleId = roleFinance, CreatedBy = systemUserId },
            new ApprovalBands { PolicyVersionId = version.Id, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 1, RoleId = roleHod, CreatedBy = systemUserId },
            new ApprovalBands { PolicyVersionId = version.Id, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 2, RoleId = roleFinance, CreatedBy = systemUserId },
            new ApprovalBands { PolicyVersionId = version.Id, MinAmount = 5_000_000.01m, MaxAmount = null, Sequence = 3, RoleId = roleAudit, CreatedBy = systemUserId }
        );

        _db.QuotationRules.AddRange(
            new QuotationRules { PolicyVersionId = version.Id, Emergency = true, RequiredQuotes = 0, Priority = 10, Description = "Emergency Fault: no minimum, any approved vendor that can supply.", CreatedBy = systemUserId },
            new QuotationRules { PolicyVersionId = version.Id, MinAmount = 250_000, RequiredQuotes = 3, Priority = 20, Description = "At or above the quotation threshold: 3 distinct vendors.", CreatedBy = systemUserId },
            new QuotationRules { PolicyVersionId = version.Id, MaxAmount = 250_000, StarVendor = true, RequiredQuotes = 1, Priority = 30, Description = "Below threshold, star vendor: 1 quotation.", CreatedBy = systemUserId },
            new QuotationRules { PolicyVersionId = version.Id, MaxAmount = 250_000, StarVendor = false, RequiredQuotes = 3, Priority = 40, Description = "Below threshold, not a star vendor (includes new vendors): 3 quotations.", CreatedBy = systemUserId },
            new QuotationRules { PolicyVersionId = version.Id, RequiredQuotes = 1, Priority = 50, Description = "Recurring items plan: 1 verification quotation.", CreatedBy = systemUserId },
            new QuotationRules { PolicyVersionId = version.Id, RequiredQuotes = 0, Priority = 60, Description = "Bills and policy claims: no quotation.", CreatedBy = systemUserId }
        );

        var settings = new (string Key, string Type, string Value, string Description)[]
        {
            ("OPD_QUOTE_EXCEPTION_THRESHOLD", "Amount", "1000000", "Above this amount, a higher-than-lowest quote needs OPD approval."),
            ("QUOTE_THRESHOLD", "Amount", "250000", "At/above this amount a sourcing group needs 3 distinct-vendor quotations."),
            ("STAR_VENDOR_MIN_SCORE", "Percent", "80", "Minimum overall score (with delivery history) to be a star vendor."),
            ("VENDOR_WEIGHT_ONTIME", "Percent", "40", "Weight of on-time delivery in the vendor score."),
            ("VENDOR_WEIGHT_PRICE", "Percent", "30", "Weight of price competitiveness in the vendor score."),
            ("VENDOR_WEIGHT_QUALITY", "Percent", "30", "Weight of quality rating in the vendor score."),
            ("DUPLICATE_ITEM_LOCATION_BLOCK", "Bool", "true", "Block a second open PR for the same item at the same location."),
            ("HIGH_QUOTE_ALERT", "Bool", "true", "Notify HOD/Procurement/Finance/Audit/OPD whenever a higher-than-lowest quote is chosen."),
            ("DEFAULT_ESCALATION_DAYS", "Days", "3", "Fallback escalation window for a stage with none configured."),
            ("TENTATIVE_MINOR_PCT", "Percent", "10", "Final-cost variance up to this percent: Procurement adjusts."),
            ("TENTATIVE_MAJOR_PCT", "Percent", "50", "Final-cost variance at/above this percent: back to the Requestor for full re-approval."),
            ("SPLIT_WINDOW_DAYS", "Days", "14", "Window for flagging a possible split purchase."),
            ("OVER_MARKET_WARN_PCT", "Percent", "0", "Warn when the PR line estimate is more than this percent above market guidance."),
            ("SURVEY_STALE_DAYS", "Days", "90", "A market survey older than this is treated as stale and ignored for the warning."),
            ("ONUSAGE_HISTORY_DAYS", "Days", "365", "Comparison window for Cyclic On-Usage bills (last 12 months)."),
            ("EMERGENCY_WATCH_HOURS", "Hours", "24", "An emergency Fault PR not handled within this window escalates to OPD."),
        };
        foreach (var (key, type, value, description) in settings)
        {
            _db.PolicySettings.Add(new PolicySettings
            {
                PolicyVersionId = version.Id,
                SettingKey = key,
                ValueType = type,
                Value = value,
                Description = description,
                CreatedBy = systemUserId,
            });
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded policy version 1 (approval bands, quotation rules, {Count} settings).", settings.Length);
        return version.Id;
    }

    private async Task<TId> RequireLookupId<T, TId>(string code, CancellationToken ct) where T : class
    {
        var set = _db.Set<T>();
        var prop = typeof(T).GetProperty("Code") ?? throw new InvalidOperationException($"{typeof(T).Name} has no Code property.");
        foreach (var entity in await set.ToListAsync(ct))
        {
            if (string.Equals((string?)prop.GetValue(entity), code, StringComparison.OrdinalIgnoreCase))
            {
                var idProp = typeof(T).GetProperty("Id") ?? throw new InvalidOperationException($"{typeof(T).Name} has no Id property.");
                var rawId = idProp.GetValue(entity) ?? throw new InvalidOperationException($"{typeof(T).Name}.Id was null.");
                return (TId)Convert.ChangeType(rawId, typeof(TId));
            }
        }
        throw new InvalidOperationException($"Lookup {typeof(T).Name} has no row with Code '{code}'. Seed lookups before policy.");
    }
}
