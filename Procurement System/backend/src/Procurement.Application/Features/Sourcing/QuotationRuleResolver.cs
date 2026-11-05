using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Sourcing;

internal static class QuotationRuleResolver
{
    public static async Task<QuotationRules> ResolveAsync(
        IProcurementDbContext db, long policyVersionId, long spendSubHeadId, decimal groupAmount, bool isEmergency, bool isStarVendor, CancellationToken ct)
    {
        var rules = await db.QuotationRules
            .Where(r => r.PolicyVersionId == policyVersionId && (r.SpendSubHeadId == null || r.SpendSubHeadId == spendSubHeadId))
            .OrderBy(r => r.Priority)
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            if (rule.MinAmount != null && groupAmount < rule.MinAmount) continue;
            if (rule.MaxAmount != null && groupAmount >= rule.MaxAmount) continue;
            if (rule.StarVendor != null && rule.StarVendor != isStarVendor) continue;
            if (rule.Emergency != null && rule.Emergency != isEmergency) continue;
            return rule;
        }

        throw new Common.Exceptions.BusinessRuleException("No quotation rule matched this group; check the policy configuration.");
    }
}
