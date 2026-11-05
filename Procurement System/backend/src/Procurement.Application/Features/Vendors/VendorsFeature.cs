using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.VendorManagement;

public record VendorDto(
    long Id, string VendorCode, string LegalName, string Ntn, string? Strn, string VendorStatus,
    bool HasDeliveryHistory, bool IsStarVendor, decimal? OverallScore, bool IsBlacklisted, List<string> CategoryCodes);

public record ListVendorsQuery(long? CategoryId, bool ApprovedOnly) : IRequest<List<VendorDto>>;

public class ListVendorsQueryHandler : IRequestHandler<ListVendorsQuery, List<VendorDto>>
{
    private readonly IProcurementDbContext _db;
    public ListVendorsQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<VendorDto>> Handle(ListVendorsQuery request, CancellationToken ct)
    {
        var statuses = await _db.VendorStatuses.ToDictionaryAsync(s => s.Id, ct);
        var approvedStatusId = statuses.Values.First(s => s.Code == VendorStatusCodes.Approved).Id;
        var blacklistedStatusId = statuses.Values.First(s => s.Code == VendorStatusCodes.Blacklisted).Id;

        var query = _db.Vendors.AsQueryable();
        if (request.ApprovedOnly) query = query.Where(v => v.VendorStatusId == approvedStatusId);

        if (request.CategoryId != null)
        {
            var vendorIds = _db.VendorCategories.Where(vc => vc.CategoryId == request.CategoryId).Select(vc => vc.VendorId);
            query = query.Where(v => vendorIds.Contains(v.Id));
        }

        var vendors = await query.OrderBy(v => v.LegalName).ToListAsync(ct);
        var categoryLinks = await _db.VendorCategories
            .Where(vc => vendors.Select(v => v.Id).Contains(vc.VendorId))
            .Join(_db.Categories, vc => vc.CategoryId, c => c.Id, (vc, c) => new { vc.VendorId, c.Code })
            .ToListAsync(ct);

        return vendors.Select(v => new VendorDto(
            v.Id, v.VendorCode, v.LegalName, v.Ntn, v.Strn, statuses[v.VendorStatusId].Code,
            v.HasDeliveryHistory, v.IsStarVendor, v.OverallScore, v.VendorStatusId == blacklistedStatusId,
            categoryLinks.Where(c => c.VendorId == v.Id).Select(c => c.Code).ToList())).ToList();
    }
}

public record BlacklistVendorCommand(long VendorId, string Reason) : IRequest;

public class BlacklistVendorCommandHandler : IRequestHandler<BlacklistVendorCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    public BlacklistVendorCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(BlacklistVendorCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessRuleException("A reason is required to blacklist a vendor.");
        }

        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == request.VendorId, ct)
            ?? throw new NotFoundException("Vendor", request.VendorId);
        var blacklistedStatus = await _db.VendorStatuses.FirstAsync(s => s.Code == VendorStatusCodes.Blacklisted, ct);

        vendor.VendorStatusId = blacklistedStatus.Id;
        vendor.BlacklistReason = request.Reason;
        vendor.UpdatedByUserId = _currentUser.UserId;
        vendor.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}

public static class VendorScoring
{
    public static async Task RecalculateAsync(IProcurementDbContext db, long vendorId, CancellationToken ct)
    {
        var vendor = await db.Vendors.FirstAsync(v => v.Id == vendorId, ct);
        var policyVersion = await Common.Policy.PolicyVersionResolver.GetCurrentAsync(db, ct);
        var settings = await Common.Policy.PolicyVersionResolver.GetSettingsAsync(db, policyVersion.Id, ct);

        var grns = await db.GoodsReceipts
            .Where(g => g.AckStatus != null)
            .Join(db.PoLines, g => g.PoId, pl => pl.PoId, (g, pl) => g)
            .Join(db.PurchaseOrders, g => g.PoId, po => po.Id, (g, po) => new { g, po })
            .Where(x => x.po.VendorId == vendorId)
            .Select(x => x.g)
            .Distinct()
            .ToListAsync(ct);

        if (grns.Count == 0) return;

        var onTimePct = grns.Count(g => g.OnTime == true) * 100m / grns.Count;
        var qualityAvgPct = grns.Where(g => g.QualityRating != null).Select(g => (decimal)g.QualityRating!.Value * 20m).DefaultIfEmpty(0).Average();

        var weightOnTime = decimal.Parse(settings.GetValueOrDefault(PolicySettingKeys.VendorWeightOnTime, "40"));
        var weightPrice = decimal.Parse(settings.GetValueOrDefault(PolicySettingKeys.VendorWeightPrice, "30"));
        var weightQuality = decimal.Parse(settings.GetValueOrDefault(PolicySettingKeys.VendorWeightQuality, "30"));
        var priceScore = vendor.PriceScore ?? 70m;

        var overall = Math.Round((onTimePct * weightOnTime + priceScore * weightPrice + qualityAvgPct * weightQuality) / 100m, 2);
        var starMinScore = decimal.Parse(settings.GetValueOrDefault(PolicySettingKeys.StarVendorMinScore, "80"));

        vendor.OnTimeScore = Math.Round(onTimePct, 2);
        vendor.QualityScore = Math.Round(qualityAvgPct, 2);
        vendor.OverallScore = overall;
        vendor.HasDeliveryHistory = true;
        vendor.IsStarVendor = vendor.HasDeliveryHistory && overall >= starMinScore;
        vendor.ScoreUpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);
    }
}
