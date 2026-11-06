using Microsoft.EntityFrameworkCore;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Worker.Jobs;

// BR-032: after a vendor is selected, an AI lookup shows what the same item costs elsewhere
// online - advisory only, never auto-awards. No live web-search provider is wired up in this
// build, so this writes a clearly-marked mock result through the same AiChecks contract a
// real provider would use; swap the body of LookupMockPriceAsync for a real search/LLM call
// behind the same interface shape to go live.
public class MarketPriceLookupJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MarketPriceLookupJob> _logger;

    public MarketPriceLookupJob(IServiceScopeFactory scopeFactory, ILogger<MarketPriceLookupJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(30));
        do
        {
            try { await RunAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "MarketPriceLookupJob tick failed."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();

        var marketPriceCheckType = await db.AiCheckTypes.Where(t => t.Code == "MarketPrice").Select(t => t.Id).FirstAsync(ct);
        var prEntityTypeId = await db.EntityTypes.Where(t => t.Code == "PurchaseRequisition").Select(t => t.Id).FirstAsync(ct);
        var alreadyChecked = await db.AiChecks.Where(c => c.CheckTypeId == marketPriceCheckType).Select(c => c.EntityId).ToListAsync(ct);

        var withAwardedVendor = await db.PrLines
            .Where(l => l.AwardedVendorId != null)
            .Select(l => new { l.PrId, l.ItemId })
            .Distinct()
            .Where(x => !alreadyChecked.Contains(x.PrId))
            .Take(50)
            .ToListAsync(ct);

        foreach (var pr in withAwardedVendor.GroupBy(x => x.PrId))
        {
            var results = pr.Select(x => LookupMockPrice(x.ItemId)).ToList();
            db.AiChecks.Add(new Domain.Entities.AiChecks
            {
                CheckTypeId = marketPriceCheckType,
                EntityTypeId = prEntityTypeId,
                EntityId = pr.Key,
                Outcome = "Pass",
                ResultJson = System.Text.Json.JsonSerializer.Serialize(results),
                CheckedAt = DateTime.UtcNow,
                Confidence = 50,
                Disposition = "Open",
            });
        }

        if (withAwardedVendor.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Ran market price lookup for {Count} PR(s).", withAwardedVendor.Select(x => x.PrId).Distinct().Count());
        }
    }

    private static object LookupMockPrice(long itemId) => new
    {
        itemId,
        source = "mock-provider (no live web-search configured)",
        price = (decimal?)null,
        link = (string?)null,
        checkedAt = DateTime.UtcNow,
    };
}
