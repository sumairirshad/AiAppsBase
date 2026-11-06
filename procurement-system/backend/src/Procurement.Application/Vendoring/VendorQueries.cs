using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Vendoring;

public record VendorDto(long Id, string VendorCode, string LegalName, string StatusCode, bool IsStarVendor, decimal? OverallScore, string? BlacklistReason);
public record VendorSuggestionDto(long VendorId, string LegalName, bool IsStarVendor, decimal? OverallScore, int Rank);
public record PendingVendorRegistrationDto(long Id, string RequestNo, string LegalName, string StatusCode, DateTime CreatedAt, long ProposedByUserId);

public record ListVendorsQuery : IRequest<List<VendorDto>>;

// BR-021/025: approved, non-blacklisted vendors of the item's category, ranked by score -
// never a per-item list, and a department only ever sees a vendor through a category it
// shares with it (enforced by the caller passing the department-filtered categoryId).
public record SuggestVendorsForCategoryQuery(long CategoryId) : IRequest<List<VendorSuggestionDto>>;

public record ListPendingVendorRegistrationsQuery(string StatusCode) : IRequest<List<PendingVendorRegistrationDto>>;

public class VendorQueryHandlers :
    IRequestHandler<ListVendorsQuery, List<VendorDto>>,
    IRequestHandler<SuggestVendorsForCategoryQuery, List<VendorSuggestionDto>>,
    IRequestHandler<ListPendingVendorRegistrationsQuery, List<PendingVendorRegistrationDto>>
{
    private readonly IApplicationDbContext _db;

    public VendorQueryHandlers(IApplicationDbContext db) => _db = db;

    public async Task<List<VendorDto>> Handle(ListVendorsQuery request, CancellationToken ct) =>
        await _db.Vendors.Join(_db.VendorStatuses, v => v.VendorStatusId, s => s.Id,
                (v, s) => new VendorDto(v.Id, v.VendorCode, v.LegalName, s.Code, v.IsStarVendor, v.OverallScore, v.BlacklistReason))
            .OrderBy(v => v.LegalName).ToListAsync(ct);

    public async Task<List<VendorSuggestionDto>> Handle(SuggestVendorsForCategoryQuery request, CancellationToken ct)
    {
        var candidates = await _db.VendorCategories.Where(vc => vc.CategoryId == request.CategoryId)
            .Join(_db.Vendors, vc => vc.VendorId, v => v.Id, (vc, v) => v)
            .Join(_db.VendorStatuses, v => v.VendorStatusId, s => s.Id, (v, s) => new { v, s.Code })
            .Where(x => x.Code == "Approved")
            .Select(x => x.v)
            .ToListAsync(ct);

        return candidates
            .OrderByDescending(v => v.IsStarVendor)
            .ThenByDescending(v => v.OverallScore ?? 0)
            .Select((v, i) => new VendorSuggestionDto(v.Id, v.LegalName, v.IsStarVendor, v.OverallScore, i + 1))
            .ToList();
    }

    public async Task<List<PendingVendorRegistrationDto>> Handle(ListPendingVendorRegistrationsQuery request, CancellationToken ct)
    {
        var statusId = await _db.ApprovalRequestStatuses.Where(s => s.Code == request.StatusCode).Select(s => s.Id).FirstAsync(ct);
        var rows = await _db.Set<Domain.Entities.VendorRegistrationRequests>().Where(r => r.StatusId == statusId)
            .OrderBy(r => r.CreatedAt).ToListAsync(ct);

        return rows.Select(r =>
        {
            var legalName = System.Text.Json.JsonSerializer.Deserialize<VendorRegistrationData>(r.ProposedData)?.LegalName ?? "(unreadable)";
            return new PendingVendorRegistrationDto(r.Id, r.RequestNo, legalName, request.StatusCode, r.CreatedAt, r.ProposedByUserId);
        }).ToList();
    }
}
