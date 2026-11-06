using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Policy;
using Procurement.Application.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Sourcing;

// BR-026: Procurement accepts the PR and groups its lines (by category, by default) for
// sourcing; the required quotation count is then resolved per group.
public record AcceptAndGroupCommand(long ActorUserId, long PrId) : IRequest<List<long>>;

public class AcceptAndGroupHandler : IRequestHandler<AcceptAndGroupCommand, List<long>>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly QuotationRuleResolver _ruleResolver;

    public AcceptAndGroupHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, QuotationRuleResolver ruleResolver)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _ruleResolver = ruleResolver;
    }

    public async Task<List<long>> Handle(AcceptAndGroupCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "SOURCING.GROUP", ct);
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new InvalidOperationException("PR not found.");
        var pendingProcurementStatus = await _lookups.IdAsync<PrStatuses, short>("PendingProcurement", ct);
        if (pr.PrStatusId != pendingProcurementStatus)
            throw new InvalidOperationException("This PR is not awaiting Procurement acceptance.");

        var lines = await _db.PrLines.Where(l => l.PrId == pr.Id).ToListAsync(ct);
        var itemCategories = await _db.Items.Where(i => lines.Select(l => l.ItemId).Contains(i.Id)).ToDictionaryAsync(i => i.Id, i => i.CategoryId, ct);
        var byCategory = lines.GroupBy(l => itemCategories[l.ItemId]);

        var policyVersionId = pr.PolicyVersionId ?? await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var groupIds = new List<long>();
        var groupNo = 1;

        foreach (var categoryGroup in byCategory)
        {
            var groupAmount = categoryGroup.Sum(l => l.Qty * l.EstUnitPrice);

            // The group's star-vendor status is only knowable from the suggested vendor
            // ranked onto its lines at PR creation (BR-025); below the quote threshold this
            // decides 1 quote vs 3, so every line in the group must agree, not just the first.
            var suggestedVendorIds = categoryGroup.Where(l => l.SuggestedVendorId.HasValue).Select(l => l.SuggestedVendorId!.Value).Distinct().ToList();
            bool isStarVendorKnown = false, isStarVendor = false;
            if (suggestedVendorIds.Count == 1)
            {
                var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == suggestedVendorIds[0], ct);
                if (vendor is not null) { isStarVendorKnown = true; isStarVendor = vendor.IsStarVendor; }
            }

            var (requiredQuotes, ruleId, _) = await _ruleResolver.ResolveAsync(
                policyVersionId, groupAmount, isStarVendorKnown, isStarVendor, pr.IsEmergency, isRecurringItemsVerification: false, ct);

            var group = new SourcingGroups
            {
                PrId = pr.Id,
                GroupNo = groupNo++,
                CategoryId = categoryGroup.Key,
                GroupAmount = groupAmount,
                RequiredQuotes = requiredQuotes,
                QuotationRuleId = ruleId == 0 ? (await _db.QuotationRules.OrderBy(r => r.Priority).FirstAsync(ct)).Id : ruleId,
                CreatedBy = request.ActorUserId,
            };
            _db.Set<SourcingGroups>().Add(group);
            await _db.SaveChangesAsync(ct);

            foreach (var line in categoryGroup)
            {
                var prLine = lines.First(l => l.Id == line.Id);
                prLine.SourcingGroupId = group.Id;
            }
            groupIds.Add(group.Id);
        }

        pr.RequiredQuotes = (byte)byCategory.Max(g => g.Count());
        pr.PrStatusId = await _lookups.IdAsync<PrStatuses, short>("PendingQuotations", ct);
        pr.UpdatedBy = request.ActorUserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return groupIds;
    }
}

public record QuotationLineInput(long PrLineId, decimal Qty, decimal UnitPrice, decimal Tax, decimal Discount);

public record AddQuotationCommand(long ActorUserId, long SourcingGroupId, long VendorId, string QuotationNo, DateOnly QuotationDate, decimal TaxTotal, long DocumentId, List<QuotationLineInput> Lines) : IRequest<long>;

public class AddQuotationHandler : IRequestHandler<AddQuotationCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public AddQuotationHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(AddQuotationCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "SOURCING.QUOTE", ct);
        var group = await _db.Set<SourcingGroups>().FirstOrDefaultAsync(g => g.Id == request.SourcingGroupId, ct)
            ?? throw new InvalidOperationException("Sourcing group not found.");

        var vendorStatus = await _db.Vendors.Where(v => v.Id == request.VendorId)
            .Join(_db.VendorStatuses, v => v.VendorStatusId, s => s.Id, (v, s) => s.Code).FirstOrDefaultAsync(ct);
        if (vendorStatus != "Approved")
            throw new InvalidOperationException("Only an approved, non-blacklisted vendor may be quoted.");

        var comparableTotal = request.Lines.Sum(l => l.Qty * l.UnitPrice - l.Discount);
        var quotation = new Quotations
        {
            PrId = group.PrId,
            VendorId = request.VendorId,
            QuotationNo = request.QuotationNo,
            QuotationDate = request.QuotationDate,
            CurrencyCode = "PKR",
            Total = comparableTotal + request.TaxTotal,
            TaxTotal = request.TaxTotal,
            ComparableTotal = comparableTotal,
            SourcingGroupId = group.Id,
            DocumentId = request.DocumentId,
            CreatedBy = request.ActorUserId,
        };
        _db.Quotations.Add(quotation);
        await _db.SaveChangesAsync(ct);

        foreach (var line in request.Lines)
        {
            _db.Set<QuotationLines>().Add(new QuotationLines
            {
                QuotationId = quotation.Id,
                PrLineId = line.PrLineId,
                Qty = line.Qty,
                UnitPrice = line.UnitPrice,
                Tax = line.Tax,
                Discount = line.Discount,
            });
        }
        await _db.SaveChangesAsync(ct);

        // BR-029: the lowest quote is always the recommended one, recomputed as quotes come in.
        var allQuotes = await _db.Quotations.Where(q => q.SourcingGroupId == group.Id).ToListAsync(ct);
        var lowest = allQuotes.OrderBy(q => q.ComparableTotal).First();
        group.RecommendedQuotationId = lowest.Id;
        await _db.SaveChangesAsync(ct);

        return quotation.Id;
    }
}

public record OverrideSuggestedVendorCommand(long ActorUserId, long PrLineId, long NewVendorId, string Reason) : IRequest;

public class OverrideSuggestedVendorHandler : IRequestHandler<OverrideSuggestedVendorCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public OverrideSuggestedVendorHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task Handle(OverrideSuggestedVendorCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "SOURCING.OVERRIDE", ct);
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("A reason is required to override the suggested vendor.");

        var line = await _db.PrLines.FirstOrDefaultAsync(l => l.Id == request.PrLineId, ct)
            ?? throw new InvalidOperationException("PR line not found.");
        line.AwardedVendorId = request.NewVendorId;
        line.OverrideReason = request.Reason;
        line.UpdatedBy = request.ActorUserId;
        line.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
