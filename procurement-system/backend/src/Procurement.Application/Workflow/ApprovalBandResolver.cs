using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Workflow;

public class ApprovalBandResolver : IApprovalBandResolver
{
    private readonly IApplicationDbContext _db;

    public ApprovalBandResolver(IApplicationDbContext db) => _db = db;

    public async Task<IReadOnlyList<ApprovalBandStep>> ResolveAsync(long policyVersionId, decimal amount, long? spendSubHeadId, CancellationToken ct = default)
    {
        var bands = await _db.ApprovalBands
            .Where(b => b.PolicyVersionId == policyVersionId)
            .Where(b => b.MinAmount <= amount && (b.MaxAmount == null || amount <= b.MaxAmount))
            .Where(b => b.SpendSubHeadId == null || b.SpendSubHeadId == spendSubHeadId)
            .Join(_db.Roles, b => b.RoleId, r => r.Id, (b, r) => new ApprovalBandStep(b.Sequence, r.Id, r.Code))
            .ToListAsync(ct);

        // A sub-head-specific row (e.g. "OPD also approves Projects above 50 lac") augments
        // the generic band rather than replacing it, and the same role is never asked twice.
        return bands
            .GroupBy(b => b.RoleId)
            .Select(g => g.OrderBy(x => x.Sequence).First())
            .OrderBy(b => b.Sequence)
            .ToList();
    }
}
