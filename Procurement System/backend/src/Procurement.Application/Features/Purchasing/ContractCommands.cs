using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Features.Requisitions;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Purchasing;

public record IssueContractCommand(long PoId, long SignedDocumentId, string ChequeNo, string ChequeBank, decimal ChequeAmount, long ChequeDocumentId) : IRequest;

public class IssueContractCommandHandler : IRequestHandler<IssueContractCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public IssueContractCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(IssueContractCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may upload the signed contract and security cheque.");
        }

        var contract = await _db.Contracts.FirstOrDefaultAsync(c => c.PoId == request.PoId, ct)
            ?? throw new NotFoundException("Contract", request.PoId);
        var heldStatus = await _db.SecurityDepositStatuses.FirstAsync(s => s.Code == SecurityDepositStatusCodes.Held, ct);

        contract.SignedDocumentId = request.SignedDocumentId;
        contract.ChequeNo = request.ChequeNo;
        contract.ChequeBank = request.ChequeBank;
        contract.ChequeAmount = request.ChequeAmount;
        contract.ChequeDocumentId = request.ChequeDocumentId;
        contract.ChequeStatusId = heldStatus.Id;
        contract.UpdatedByUserId = _currentUser.UserId;
        contract.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}

public record CompleteContractIssuanceCommand(long PrId) : IRequest;

/// <summary>Once every non-recurring PO for the PR has both its signed contract and security cheque uploaded,
/// activates those POs and advances the PR to receiving.</summary>
public class CompleteContractIssuanceCommandHandler : IRequestHandler<CompleteContractIssuanceCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public CompleteContractIssuanceCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(CompleteContractIssuanceCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may complete contract issuance.");
        }

        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        var pos = await _db.PurchaseOrders.Where(p => p.PrId == pr.Id).ToListAsync(ct);
        var recurringType = await _db.PoTypes.FirstAsync(t => t.Code == PoTypeCodes.Recurring, ct);
        var contracts = await _db.Contracts.Where(c => pos.Select(p => p.Id).Contains(c.PoId)).ToListAsync(ct);

        var activeStatus = await _db.PoStatuses.FirstAsync(s => s.Code == PoStatusCodes.Active, ct);
        var now = DateTime.UtcNow;

        foreach (var po in pos)
        {
            if (po.PoTypeId == recurringType.Id)
            {
                po.PoStatusId = activeStatus.Id;
                continue;
            }

            var contract = contracts.First(c => c.PoId == po.Id);
            if (contract.SignedDocumentId == null || contract.ChequeNo == null)
            {
                throw new BusinessRuleException($"PO {po.PoNumber} is missing its signed contract or security cheque.");
            }
            po.PoStatusId = activeStatus.Id;
        }

        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Procurement, ct)).Id;
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, null, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);
        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = now;

        await _db.SaveChangesAsync(ct);
    }
}

public record ListPurchaseOrdersForPrQuery(long PrId) : IRequest<List<PurchaseOrderDto>>;

public class ListPurchaseOrdersForPrQueryHandler : IRequestHandler<ListPurchaseOrdersForPrQuery, List<PurchaseOrderDto>>
{
    private readonly IProcurementDbContext _db;
    public ListPurchaseOrdersForPrQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<PurchaseOrderDto>> Handle(ListPurchaseOrdersForPrQuery request, CancellationToken ct)
    {
        var pos = await _db.PurchaseOrders.Where(p => p.PrId == request.PrId).ToListAsync(ct);
        var vendors = await _db.Vendors.ToDictionaryAsync(v => v.Id, ct);
        var poTypes = await _db.PoTypes.ToDictionaryAsync(t => t.Id, ct);
        var poStatuses = await _db.PoStatuses.ToDictionaryAsync(s => s.Id, ct);
        var contracts = await _db.Contracts.Where(c => pos.Select(p => p.Id).Contains(c.PoId)).ToListAsync(ct);
        var lines = await (
            from l in _db.PoLines
            join pl in _db.PrLines on l.PrLineId equals pl.Id
            join i in _db.Items on pl.ItemId equals i.Id
            where pos.Select(p => p.Id).Contains(l.PoId)
            select new { l.PoId, Dto = new PoLineDto(l.Id, l.PrLineId, i.Name, l.Qty, l.UnitPrice, l.LineTotal, l.AcceptedQty, l.OutstandingQty) }
        ).ToListAsync(ct);

        return pos.Select(po =>
        {
            var contract = contracts.FirstOrDefault(c => c.PoId == po.Id);
            return new PurchaseOrderDto(
                po.Id, po.PoNumber, po.VendorId, vendors[po.VendorId].LegalName, poTypes[po.PoTypeId].Code, poStatuses[po.PoStatusId].Code,
                po.Total, po.DeliveryDate, po.AdvanceAmount ?? 0, po.AdvancePaid,
                contract?.SignedDocumentId != null, contract?.ChequeNo != null,
                lines.Where(l => l.PoId == po.Id).Select(l => l.Dto).ToList());
        }).ToList();
    }
}
