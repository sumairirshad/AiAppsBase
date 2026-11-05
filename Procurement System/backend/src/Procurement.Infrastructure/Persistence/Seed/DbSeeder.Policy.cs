using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

public static partial class DbSeeder
{
    private static async Task<PolicyVersions> SeedPolicyAsync(
        ProcurementDbContext db, Dictionary<string, Roles> roles, Dictionary<string, SpendSubHeads> subHeads, long systemUserId)
    {
        if (await db.PolicyVersions.AnyAsync())
        {
            return await db.PolicyVersions.OrderByDescending(p => p.VersionNo).FirstAsync();
        }

        var approvedStatus = await db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.Approved);
        var policy = new PolicyVersions
        {
            VersionNo = 1,
            EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow),
            StatusId = approvedStatus.Id,
            ApprovedBy = systemUserId,
            ChangeReason = "Initial policy baseline",
            CreatedByUserId = systemUserId,
            CreatedAt = DateTime.UtcNow,
        };
        db.PolicyVersions.Add(policy);
        await db.SaveChangesAsync();

        void AddBand(decimal min, decimal? max, int seq, string roleCode)
        {
            db.ApprovalBands.Add(new ApprovalBands
            {
                PolicyVersionId = policy.Id, MinAmount = min, MaxAmount = max, Sequence = seq,
                RoleId = roles[roleCode].Id, CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow,
            });
        }
        AddBand(0, 1_000_000m, 1, RoleCodes.Hod);
        AddBand(1_000_000.01m, 5_000_000m, 1, RoleCodes.Hod);
        AddBand(1_000_000.01m, 5_000_000m, 2, RoleCodes.Finance);
        AddBand(5_000_000.01m, null, 1, RoleCodes.Hod);
        AddBand(5_000_000.01m, null, 2, RoleCodes.Finance);
        AddBand(5_000_000.01m, null, 3, RoleCodes.Audit);

        void AddRule(string? subHeadCode, decimal? min, decimal? max, bool? star, bool? emergency, byte requiredQuotes, int priority, string description)
        {
            db.QuotationRules.Add(new QuotationRules
            {
                PolicyVersionId = policy.Id,
                SpendSubHeadId = subHeadCode == null ? null : subHeads[subHeadCode].Id,
                MinAmount = min, MaxAmount = max, StarVendor = star, Emergency = emergency,
                RequiredQuotes = requiredQuotes, Priority = priority, Description = description,
                CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow,
            });
        }
        AddRule(SpendSubHeadCodes.AprFault, null, null, null, true, 0, 10, "Emergency Fault: no star-vendor or 3-quote requirement");
        AddRule(SpendSubHeadCodes.AprFault, 250_000m, null, null, null, 3, 20, "Group amount at or above PKR 250,000: 3 quotations from 3 distinct vendors");
        AddRule(SpendSubHeadCodes.AprProject, 250_000m, null, null, null, 3, 20, "Group amount at or above PKR 250,000: 3 quotations from 3 distinct vendors");
        AddRule(SpendSubHeadCodes.AprFault, 0, 250_000m, true, null, 1, 30, "Below threshold, star vendor: 1 quotation");
        AddRule(SpendSubHeadCodes.AprProject, 0, 250_000m, true, null, 1, 30, "Below threshold, star vendor: 1 quotation");
        AddRule(SpendSubHeadCodes.AprFault, 0, 250_000m, false, null, 3, 40, "Below threshold, not a star vendor: 3 quotations");
        AddRule(SpendSubHeadCodes.AprProject, 0, 250_000m, false, null, 3, 40, "Below threshold, not a star vendor: 3 quotations");
        AddRule(SpendSubHeadCodes.PreCycFixed, null, null, null, null, 1, 50, "Recurring items: 1 suitability-verification quotation");
        AddRule(SpendSubHeadCodes.PreCycUsage, null, null, null, null, 0, 60, "No quotation");
        AddRule(SpendSubHeadCodes.PrePolicy, null, null, null, null, 0, 60, "No quotation");

        void AddSetting(string key, string type, string value, string description)
        {
            db.PolicySettings.Add(new PolicySettings
            {
                PolicyVersionId = policy.Id, SettingKey = key, ValueType = type, Value = value, Description = description,
                CreatedByUserId = systemUserId, CreatedAt = DateTime.UtcNow,
            });
        }
        AddSetting(PolicySettingKeys.OpdQuoteExceptionThreshold, "Amount", "1000000", "Higher-than-lowest quote on a PR above this needs OPD");
        AddSetting(PolicySettingKeys.OverBudgetOpdThreshold, "Amount", "200000", "Over-budget amount above which OPD must approve");
        AddSetting(PolicySettingKeys.QuoteThreshold, "Amount", "250000", "3-quote threshold per sourcing group");
        AddSetting(PolicySettingKeys.StarVendorMinScore, "Percent", "80", "Overall score at or above this (with delivery history) = star vendor");
        AddSetting(PolicySettingKeys.VendorWeightOnTime, "Percent", "40", "Weight of on-time delivery in vendor score");
        AddSetting(PolicySettingKeys.VendorWeightPrice, "Percent", "30", "Weight of price in vendor score");
        AddSetting(PolicySettingKeys.VendorWeightQuality, "Percent", "30", "Weight of quality in vendor score");
        AddSetting(PolicySettingKeys.DuplicateItemLocationBlock, "Bool", "true", "Block a second open PR for the same item at the same location");
        AddSetting(PolicySettingKeys.HighQuoteAlert, "Bool", "true", "Alert HOD, Procurement, Finance, Audit, OPD on a higher-than-lowest quote");
        AddSetting(PolicySettingKeys.BudgetCheckAllPrs, "Bool", "false", "If true, Finance checks budget on every PR");
        AddSetting(PolicySettingKeys.DefaultEscalationDays, "Days", "3", "Fallback days before a task escalates");
        AddSetting(PolicySettingKeys.TentativeMinorPct, "Percent", "10", "Up to this variance, Procurement adjusts the final cost");
        AddSetting(PolicySettingKeys.TentativeMajorPct, "Percent", "50", "At/above this variance, back to the Requestor");
        AddSetting(PolicySettingKeys.SplitWindowDays, "Days", "14", "Split-purchase detection window");
        AddSetting(PolicySettingKeys.SurveyStaleDays, "Days", "90", "Market survey stale after");
        AddSetting(PolicySettingKeys.OnUsageHistoryDays, "Days", "365", "On-Usage bills shown to Audit against this many days of history");
        AddSetting(PolicySettingKeys.EmergencyWatchHours, "Hours", "24", "Emergency PR idle watch before escalating to OPD");

        await db.SaveChangesAsync();
        return policy;
    }
}
