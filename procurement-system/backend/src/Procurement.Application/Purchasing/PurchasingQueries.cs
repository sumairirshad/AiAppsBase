using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Purchasing;

public record PoLineDto(long Id, long PrLineId, long ItemId, string ItemName, decimal Qty, decimal UnitPrice, decimal LineTotal, decimal AcceptedQty, decimal OutstandingQty);
public record ContractDto(long Id, string ContractTypeCode, DateOnly? StartDate, DateOnly? EndDate, long? GeneratedDocumentId, long? SignedDocumentId, string? CountryOfOrigin, string? Incoterms, string? ChequeNo, decimal? ChequeAmount);
public record PurchaseOrderDto(long Id, string PoNumber, long VendorId, string VendorName, string PoTypeCode, string PoStatusCode, decimal Total, DateOnly DeliveryDate, string? PaymentTerms, DateTime? IssuedAt, List<PoLineDto> Lines, ContractDto? Contract);

// Needed by every downstream screen (contract generation/activation, GRN entry, amendments) -
// none of them can work from the create-PO response alone (it only returns ids, and doesn't
// survive a page refresh or a different user picking up the task). GRN in particular needs
// real PoLineIds + OutstandingQty to build a valid RecordGrnCommand without guessing at
// foreign keys.
public record GetPurchaseOrdersForPrQuery(long PrId) : IRequest<List<PurchaseOrderDto>>;

public class PurchasingQueryHandlers : IRequestHandler<GetPurchaseOrdersForPrQuery, List<PurchaseOrderDto>>
{
    private readonly IApplicationDbContext _db;

    public PurchasingQueryHandlers(IApplicationDbContext db) => _db = db;

    public async Task<List<PurchaseOrderDto>> Handle(GetPurchaseOrdersForPrQuery request, CancellationToken ct)
    {
        var pos = await _db.PurchaseOrders.Where(p => p.PrId == request.PrId).OrderBy(p => p.Id).ToListAsync(ct);
        if (pos.Count == 0) return new List<PurchaseOrderDto>();
        var poIds = pos.Select(p => p.Id).ToList();

        var vendors = await _db.Vendors.Where(v => pos.Select(p => p.VendorId).Contains(v.Id)).ToDictionaryAsync(v => v.Id, ct);
        var poTypes = await _db.PoTypes.ToDictionaryAsync(t => t.Id, t => t.Code, ct);
        var poStatuses = await _db.PoStatuses.ToDictionaryAsync(s => s.Id, s => s.Code, ct);

        var lines = await _db.Set<PoLines>().Where(l => poIds.Contains(l.PoId))
            .Join(_db.PrLines, l => l.PrLineId, pl => pl.Id, (l, pl) => new { l, pl.ItemId })
            .Join(_db.Items, x => x.ItemId, i => i.Id, (x, i) => new { x.l, x.ItemId, i.Name })
            .Select(x => new { x.l.PoId, Line = new PoLineDto(x.l.Id, x.l.PrLineId, x.ItemId, x.Name, x.l.Qty, x.l.UnitPrice, x.l.LineTotal, x.l.AcceptedQty, x.l.OutstandingQty) })
            .ToListAsync(ct);

        var contracts = await _db.Set<Contracts>().Where(c => poIds.Contains(c.PoId)).ToListAsync(ct);
        var contractTypes = await _db.ContractTypes.ToDictionaryAsync(t => t.Id, t => t.Code, ct);

        return pos.Select(po =>
        {
            var vendor = vendors[po.VendorId];
            var poLines = lines.Where(x => x.PoId == po.Id).Select(x => x.Line).ToList();
            var contract = contracts.FirstOrDefault(c => c.PoId == po.Id);
            var contractDto = contract is null ? null : new ContractDto(
                contract.Id, contractTypes.GetValueOrDefault(contract.ContractTypeId, "Unknown"), contract.StartDate, contract.EndDate,
                contract.GeneratedDocumentId, contract.SignedDocumentId, contract.CountryOfOrigin, contract.Incoterms, contract.ChequeNo, contract.ChequeAmount);

            return new PurchaseOrderDto(
                po.Id, po.PoNumber, po.VendorId, vendor.LegalName, poTypes.GetValueOrDefault(po.PoTypeId, "Unknown"),
                poStatuses.GetValueOrDefault(po.PoStatusId, "Unknown"), po.Total, po.DeliveryDate, po.PaymentTerms, po.IssuedAt, poLines, contractDto);
        }).ToList();
    }
}
