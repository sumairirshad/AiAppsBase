using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Sourcing;

// BR-026/027/028: required quotation count per sourcing group, first match by Priority wins.
// Only Sourcing-mode PRs (Fault/Project) and the Cyclic-Fixed items-plan verification quote
// ever reach this; bill-route PRs never create a sourcing group at all.
public class QuotationRuleResolver
{
    private readonly IApplicationDbContext _db;

    public QuotationRuleResolver(IApplicationDbContext db) => _db = db;

    public async Task<(byte RequiredQuotes, long RuleId, string Description)> ResolveAsync(
        long policyVersionId, decimal groupAmount, bool isStarVendorKnown, bool? isStarVendor, bool isEmergency, bool isRecurringItemsVerification, CancellationToken ct = default)
    {
        var rules = await _db.QuotationRules.Where(r => r.PolicyVersionId == policyVersionId).OrderBy(r => r.Priority).ToListAsync(ct);

        foreach (var rule in rules)
        {
            if (rule.Emergency == true && !isEmergency) continue;
            if (rule.Emergency == false && isEmergency) continue;
            if (isEmergency && rule.Emergency != true) continue; // emergency always matches its own rule first (lowest priority number)

            var isUnfiltered = rule.MinAmount is null && rule.MaxAmount is null && rule.StarVendor is null && rule.Emergency is null;
            if (isRecurringItemsVerification)
            {
                // The dedicated "recurring items -> 1 quote" rule has no amount/star filter by
                // design (see Infrastructure/Persistence/Seed/PolicySeeder.cs); any rule that
                // does carry one does not apply to a recurring-items verification quote.
                if (!isUnfiltered) continue;
                return (rule.RequiredQuotes, rule.Id, rule.Description);
            }
            // An unfiltered rule (recurring items, bills) only ever applies through the
            // dedicated flag above - never as an accidental fallback for a Sourcing-mode PR
            // whose star-vendor status happens to be unknown at this point.
            if (isUnfiltered) continue;

            if (rule.MinAmount.HasValue && groupAmount < rule.MinAmount) continue;
            if (rule.MaxAmount.HasValue && groupAmount >= rule.MaxAmount) continue;
            if (rule.StarVendor.HasValue && isStarVendorKnown && rule.StarVendor != isStarVendor) continue;
            if (rule.StarVendor.HasValue && !isStarVendorKnown) continue;

            return (rule.RequiredQuotes, rule.Id, rule.Description);
        }

        return (3, 0, "Default: no matching rule, falling back to 3 quotations.");
    }
}
