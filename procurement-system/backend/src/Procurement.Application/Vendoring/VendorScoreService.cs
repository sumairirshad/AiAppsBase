using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Policy;

namespace Procurement.Application.Vendoring;

// BR-024: on-time delivery, price and quality, weighted (40/30/30 by default, OPD-configurable
// via PolicySettings); star vendor = has delivery history AND overall score >= STAR_VENDOR_MIN_SCORE.
// Recalculated after every GRN and acknowledgement (called from the Receiving module).
public class VendorScoreService
{
    private readonly IApplicationDbContext _db;
    private readonly IPolicySettingsReader _settings;

    public VendorScoreService(IApplicationDbContext db, IPolicySettingsReader settings)
    {
        _db = db;
        _settings = settings;
    }

    public async Task RecalculateAsync(long vendorId, CancellationToken ct = default)
    {
        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == vendorId, ct);
        if (vendor is null) return;

        var policyVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var weightOnTime = await _settings.GetDecimalAsync(policyVersionId, "VENDOR_WEIGHT_ONTIME", 40, ct);
        var weightPrice = await _settings.GetDecimalAsync(policyVersionId, "VENDOR_WEIGHT_PRICE", 30, ct);
        var weightQuality = await _settings.GetDecimalAsync(policyVersionId, "VENDOR_WEIGHT_QUALITY", 30, ct);
        var starMinScore = await _settings.GetDecimalAsync(policyVersionId, "STAR_VENDOR_MIN_SCORE", 80, ct);

        var deliveries = await _db.GoodsReceipts
            .Where(g => _db.PurchaseOrders.Any(po => po.Id == g.PoId && po.VendorId == vendorId))
            .ToListAsync(ct);

        decimal? onTimeScore = deliveries.Count == 0 ? null : deliveries.Count(d => d.OnTime == true) * 100m / deliveries.Count;
        var ratings = deliveries.Where(d => d.QualityRating.HasValue).Select(d => (decimal)d.QualityRating!.Value).ToList();
        decimal? qualityScore = ratings.Count == 0 ? null : ratings.Average() / 5m * 100m;

        var quotes = await _db.Quotations.Where(q => q.VendorId == vendorId).ToListAsync(ct);
        decimal? priceScore = null;
        if (quotes.Count > 0)
        {
            var groupIds = quotes.Select(q => q.SourcingGroupId).Distinct().ToList();
            var selectedCount = await _db.SourcingGroups.CountAsync(
                g => groupIds.Contains(g.Id) && g.SelectedQuotationId != null && quotes.Select(q => q.Id).Contains(g.SelectedQuotationId.Value), ct);
            priceScore = selectedCount * 100m / quotes.Select(q => q.SourcingGroupId).Distinct().Count();
        }

        var components = new[] { (onTimeScore, weightOnTime), (priceScore, weightPrice), (qualityScore, weightQuality) }
            .Where(c => c.Item1.HasValue).ToList();
        decimal? overall = components.Count == 0 ? null : components.Sum(c => c.Item1!.Value * c.Item2) / components.Sum(c => c.Item2);

        vendor.OnTimeScore = onTimeScore;
        vendor.PriceScore = priceScore;
        vendor.QualityScore = qualityScore;
        vendor.OverallScore = overall;
        vendor.HasDeliveryHistory = deliveries.Count > 0;
        vendor.IsStarVendor = vendor.HasDeliveryHistory && overall.HasValue && overall.Value >= starMinScore;
        vendor.ScoreUpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
