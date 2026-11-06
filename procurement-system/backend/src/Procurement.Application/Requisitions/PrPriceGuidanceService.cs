using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Policy;

namespace Procurement.Application.Requisitions;

public record PriceGuidance(decimal? MarketPrice, decimal? LastPaidPrice, decimal? WarningPct);

// BR-051/FEAT-036: each PR line shows the unit, the market guidance price (latest non-stale
// MarketSurveys row, location-specific first), the last paid price (latest PoLines.UnitPrice
// for that item) and a warning when the estimate is more than OVER_MARKET_WARN_PCT above market
// guidance - advisory only, it never blocks submission, and the values are copied onto the
// line so Audit sees exactly what the requestor saw.
public class PrPriceGuidanceService
{
    private readonly IApplicationDbContext _db;
    private readonly IPolicySettingsReader _settings;

    public PrPriceGuidanceService(IApplicationDbContext db, IPolicySettingsReader settings)
    {
        _db = db;
        _settings = settings;
    }

    public async Task<PriceGuidance> GetAsync(long itemId, long? locationId, decimal estimatedUnitPrice, long policyVersionId, CancellationToken ct = default)
    {
        var staleDays = await _settings.GetIntAsync(policyVersionId, "SURVEY_STALE_DAYS", 90, ct);
        var warnPct = await _settings.GetDecimalAsync(policyVersionId, "OVER_MARKET_WARN_PCT", 0, ct);
        var cutoff = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-staleDays));

        var surveys = await _db.MarketSurveys
            .Where(s => s.ItemId == itemId && s.SurveyedOn >= cutoff)
            .OrderByDescending(s => s.LocationId == locationId) // location-specific first
            .ThenByDescending(s => s.SurveyedOn)
            .ToListAsync(ct);
        decimal? marketPrice = surveys.FirstOrDefault()?.SurveyedPrice;

        decimal? lastPaidPrice = await _db.Set<Domain.Entities.PoLines>()
            .Where(pl => _db.Set<Domain.Entities.PrLines>().Any(l => l.Id == pl.PrLineId && l.ItemId == itemId))
            .Join(_db.PurchaseOrders, pl => pl.PoId, po => po.Id, (pl, po) => new { pl.UnitPrice, po.IssuedAt })
            .Where(x => x.IssuedAt != null)
            .OrderByDescending(x => x.IssuedAt)
            .Select(x => (decimal?)x.UnitPrice)
            .FirstOrDefaultAsync(ct);

        decimal? warningPct = null;
        if (marketPrice is > 0 && estimatedUnitPrice > marketPrice.Value * (1 + warnPct / 100m))
            warningPct = (estimatedUnitPrice - marketPrice.Value) / marketPrice.Value * 100m;

        return new PriceGuidance(marketPrice, lastPaidPrice, warningPct);
    }
}
