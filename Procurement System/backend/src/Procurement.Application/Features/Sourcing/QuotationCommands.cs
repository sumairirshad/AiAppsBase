using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Features.Requisitions;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Sourcing;

public record AddQuotationCommand(
    long SourcingGroupId, long VendorId, string QuotationNo, DateOnly QuotationDate, long DocumentId,
    List<QuotationLineInput> Lines) : IRequest<long>;

public class AddQuotationCommandHandler : IRequestHandler<AddQuotationCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public AddQuotationCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(AddQuotationCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may enter quotations.");
        }

        var group = await _db.SourcingGroups.FirstOrDefaultAsync(g => g.Id == request.SourcingGroupId, ct)
            ?? throw new NotFoundException("SourcingGroup", request.SourcingGroupId);

        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == request.VendorId, ct)
            ?? throw new NotFoundException("Vendor", request.VendorId);
        var approvedStatus = await _db.VendorStatuses.FirstAsync(s => s.Code == VendorStatusCodes.Approved, ct);
        if (vendor.VendorStatusId != approvedStatus.Id)
        {
            throw new BusinessRuleException("Only an approved, non-blacklisted vendor may submit a quotation.");
        }
        if (group.CategoryId != null && !await _db.VendorCategories.AnyAsync(vc => vc.VendorId == vendor.Id && vc.CategoryId == group.CategoryId, ct))
        {
            throw new BusinessRuleException("This vendor is not registered to supply this item category.");
        }

        var now = DateTime.UtcNow;
        var total = request.Lines.Sum(l => l.Qty * l.UnitPrice - l.Discount);
        var taxTotal = request.Lines.Sum(l => l.Tax);

        var quotation = new Quotations
        {
            PrId = group.PrId,
            VendorId = vendor.Id,
            QuotationNo = request.QuotationNo,
            QuotationDate = request.QuotationDate,
            CurrencyCode = "PKR",
            Total = total + taxTotal,
            DocumentId = request.DocumentId,
            SourcingGroupId = group.Id,
            TaxTotal = taxTotal,
            ComparableTotal = total,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.Quotations.Add(quotation);
        await _db.SaveChangesAsync(ct);

        foreach (var line in request.Lines)
        {
            _db.QuotationLines.Add(new QuotationLines
            {
                QuotationId = quotation.Id,
                PrLineId = line.PrLineId,
                Qty = line.Qty,
                UnitPrice = line.UnitPrice,
                Tax = line.Tax,
                Discount = line.Discount,
                DeliveryDays = line.DeliveryDays,
            });
        }

        await _db.SaveChangesAsync(ct);
        return quotation.Id;
    }
}

public record ListSourcingGroupsQuery(long PrId) : IRequest<List<SourcingGroupDto>>;

public class ListSourcingGroupsQueryHandler : IRequestHandler<ListSourcingGroupsQuery, List<SourcingGroupDto>>
{
    private readonly IProcurementDbContext _db;
    public ListSourcingGroupsQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<SourcingGroupDto>> Handle(ListSourcingGroupsQuery request, CancellationToken ct)
    {
        var groups = await _db.SourcingGroups.Where(g => g.PrId == request.PrId).OrderBy(g => g.GroupNo).ToListAsync(ct);
        var categories = await _db.Categories.ToDictionaryAsync(c => c.Id, ct);
        var lines = await _db.PrLines.Where(l => l.PrId == request.PrId && l.SourcingGroupId != null).ToListAsync(ct);
        var quotations = await _db.Quotations.Where(q => q.PrId == request.PrId).ToListAsync(ct);

        return groups.Select(g => new SourcingGroupDto(
            g.Id, g.GroupNo, g.CategoryId, g.CategoryId != null ? categories[g.CategoryId.Value].Name : null,
            g.GroupAmount, g.RequiredQuotes, quotations.Where(q => q.SourcingGroupId == g.Id).Select(q => q.VendorId).Distinct().Count(),
            g.RecommendedQuotationId, g.SelectedQuotationId, g.SelectionJustification,
            lines.Where(l => l.SourcingGroupId == g.Id).Select(l => l.Id).ToList())).ToList();
    }
}

public record ListQuotationsForGroupQuery(long SourcingGroupId) : IRequest<List<QuotationDto>>;

public class ListQuotationsForGroupQueryHandler : IRequestHandler<ListQuotationsForGroupQuery, List<QuotationDto>>
{
    private readonly IProcurementDbContext _db;
    public ListQuotationsForGroupQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<QuotationDto>> Handle(ListQuotationsForGroupQuery request, CancellationToken ct)
    {
        var group = await _db.SourcingGroups.FirstOrDefaultAsync(g => g.Id == request.SourcingGroupId, ct)
            ?? throw new NotFoundException("SourcingGroup", request.SourcingGroupId);
        var quotations = await _db.Quotations.Where(q => q.SourcingGroupId == group.Id).ToListAsync(ct);
        var vendors = await _db.Vendors.ToDictionaryAsync(v => v.Id, ct);

        return quotations.OrderBy(q => q.ComparableTotal).Select(q => new QuotationDto(
            q.Id, q.VendorId, vendors[q.VendorId].LegalName, q.QuotationNo, q.QuotationDate, q.Total, q.TaxTotal,
            q.ComparableTotal, q.Id == group.RecommendedQuotationId)).ToList();
    }
}

public record CompleteQuotationsCommand(long PrId) : IRequest;

/// <summary>Marks the lowest-ComparableTotal quotation as Recommended for every group once each group has
/// met its required distinct-vendor quote count (0-required groups, e.g. emergency Fault, are satisfied
/// automatically), then advances the PR to quote review.</summary>
public class CompleteQuotationsCommandHandler : IRequestHandler<CompleteQuotationsCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly Workflow.IWorkflowEngine _workflowEngine;

    public CompleteQuotationsCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, Workflow.IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(CompleteQuotationsCommand request, CancellationToken ct)
    {
        var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.PrId, ct)
            ?? throw new NotFoundException("PurchaseRequisition", request.PrId);
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may complete quotation collection.");
        }

        var groups = await _db.SourcingGroups.Where(g => g.PrId == pr.Id).ToListAsync(ct);
        foreach (var group in groups)
        {
            if (group.RequiredQuotes == 0)
            {
                continue;
            }

            var quotations = await _db.Quotations.Where(q => q.SourcingGroupId == group.Id).ToListAsync(ct);
            var distinctVendors = quotations.Select(q => q.VendorId).Distinct().Count();
            if (distinctVendors < group.RequiredQuotes)
            {
                throw new BusinessRuleException($"Group {group.GroupNo} needs {group.RequiredQuotes} quotations from distinct vendors (has {distinctVendors}).");
            }

            var lowest = quotations.OrderBy(q => q.ComparableTotal).First();
            group.RecommendedQuotationId = lowest.Id;
            group.UpdatedByUserId = _currentUser.UserId;
            group.UpdatedAt = DateTime.UtcNow;
        }

        var actorRoleId = (await _db.Roles.FirstAsync(r => r.Code == RoleCodes.Procurement, ct)).Id;
        var result = await _workflowEngine.AdvanceAsync(pr.WorkflowInstanceId!.Value, ActionTypeCodes.Complete, _currentUser.UserId, actorRoleId, null, new Dictionary<string, object> { ["Amount"] = pr.EstimatedAmount }, ct);
        await PrWorkflowResultApplier.ApplyAsync(_db, pr, result, ct);

        pr.UpdatedByUserId = _currentUser.UserId;
        pr.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
