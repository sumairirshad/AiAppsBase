using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Sourcing;

public record QuotationLineDto(long Id, long QuotationId, long PrLineId, string ItemName, decimal Qty, decimal UnitPrice, decimal Tax, decimal Discount, int? DeliveryDays);
public record QuotationDto(long Id, long VendorId, string VendorName, bool IsStarVendor, string QuotationNo, DateOnly QuotationDate, decimal Total, decimal TaxTotal, decimal ComparableTotal, long DocumentId, List<QuotationLineDto> Lines);
public record SourcingGroupLineDto(long Id, long ItemId, string ItemName, decimal Qty, string UnitCode, long? SuggestedVendorId, long? AwardedVendorId);
public record SourcingGroupDto(long Id, long PrId, int GroupNo, decimal GroupAmount, byte RequiredQuotes, long? RecommendedQuotationId, long? SelectedQuotationId, string? SelectionJustification, List<SourcingGroupLineDto> Lines, List<QuotationDto> Quotations);

// The frontend's sourcing workbench (Procurement: group -> quote -> select) and Audit's
// quote review both need the real state of a PR's sourcing groups and their quotations -
// without this, a client has no way to discover group/quotation ids except by remembering
// the ones returned from the create/add commands, which breaks on refresh or for anyone
// other than the actor who made the call.
public record GetSourcingGroupsForPrQuery(long PrId) : IRequest<List<SourcingGroupDto>>;

public class SourcingQueryHandlers : IRequestHandler<GetSourcingGroupsForPrQuery, List<SourcingGroupDto>>
{
    private readonly IApplicationDbContext _db;

    public SourcingQueryHandlers(IApplicationDbContext db) => _db = db;

    public async Task<List<SourcingGroupDto>> Handle(GetSourcingGroupsForPrQuery request, CancellationToken ct)
    {
        var groups = await _db.Set<SourcingGroups>().Where(g => g.PrId == request.PrId).OrderBy(g => g.GroupNo).ToListAsync(ct);
        if (groups.Count == 0) return new List<SourcingGroupDto>();
        var groupIds = groups.Select(g => g.Id).ToList();

        var lines = await _db.PrLines.Where(l => l.SourcingGroupId != null && groupIds.Contains(l.SourcingGroupId.Value))
            .Join(_db.Items, l => l.ItemId, i => i.Id, (l, i) => new { l, i.Name })
            .Join(_db.Set<Units>(), x => x.l.UnitId, u => u.Id, (x, u) => new { x.l.SourcingGroupId, Line = new SourcingGroupLineDto(x.l.Id, x.l.ItemId, x.Name, x.l.Qty, u.Code, x.l.SuggestedVendorId, x.l.AwardedVendorId) })
            .ToListAsync(ct);

        var quotations = await _db.Quotations.Where(q => groupIds.Contains(q.SourcingGroupId)).ToListAsync(ct);
        var quotationIds = quotations.Select(q => q.Id).ToList();
        var vendors = await _db.Vendors.Where(v => quotations.Select(q => q.VendorId).Contains(v.Id)).ToDictionaryAsync(v => v.Id, ct);

        var quoteLines = await _db.Set<QuotationLines>().Where(ql => quotationIds.Contains(ql.QuotationId))
            .Join(_db.PrLines, ql => ql.PrLineId, l => l.Id, (ql, l) => new { ql, l.ItemId })
            .Join(_db.Items, x => x.ItemId, i => i.Id, (x, i) => new QuotationLineDto(x.ql.Id, x.ql.QuotationId, x.ql.PrLineId, i.Name, x.ql.Qty, x.ql.UnitPrice, x.ql.Tax, x.ql.Discount, x.ql.DeliveryDays))
            .ToListAsync(ct);

        return groups.Select(g =>
        {
            var groupQuotations = quotations.Where(q => q.SourcingGroupId == g.Id).Select(q =>
            {
                var vendor = vendors[q.VendorId];
                var qLines = quoteLines.Where(l => l.QuotationId == q.Id).ToList();
                return new QuotationDto(q.Id, q.VendorId, vendor.LegalName, vendor.IsStarVendor, q.QuotationNo, q.QuotationDate, q.Total, q.TaxTotal, q.ComparableTotal, q.DocumentId, qLines);
            }).ToList();

            var groupLines = lines.Where(x => x.SourcingGroupId == g.Id).Select(x => x.Line).ToList();
            return new SourcingGroupDto(g.Id, g.PrId, g.GroupNo, g.GroupAmount, g.RequiredQuotes, g.RecommendedQuotationId, g.SelectedQuotationId, g.SelectionJustification, groupLines, groupQuotations);
        }).ToList();
    }
}
