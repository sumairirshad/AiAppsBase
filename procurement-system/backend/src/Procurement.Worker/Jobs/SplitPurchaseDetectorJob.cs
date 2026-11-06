using Microsoft.EntityFrameworkCore;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Worker.Jobs;

// BR-033: flags possible split purchases - the same requester, department, category and
// location raising more than one PR within the SPLIT_WINDOW_DAYS window (default 14 days).
// Advisory only (writes an AiChecks row Procurement/Audit can review); never blocks a PR.
public class SplitPurchaseDetectorJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SplitPurchaseDetectorJob> _logger;

    public SplitPurchaseDetectorJob(IServiceScopeFactory scopeFactory, ILogger<SplitPurchaseDetectorJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(6));
        do
        {
            try { await RunAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "SplitPurchaseDetectorJob tick failed."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();

        var policyVersionId = await db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var windowDaysSetting = await db.PolicySettings.FirstOrDefaultAsync(s => s.PolicyVersionId == policyVersionId && s.SettingKey == "SPLIT_WINDOW_DAYS", ct);
        var windowDays = windowDaysSetting is not null && int.TryParse(windowDaysSetting.Value, out var d) ? d : 14;
        var cutoff = DateTime.UtcNow.AddDays(-windowDays);

        var splitCheckTypeId = await db.AiCheckTypes.Where(t => t.Code == "SplitPurchase").Select(t => t.Id).FirstAsync(ct);
        var prEntityTypeId = await db.EntityTypes.Where(t => t.Code == "PurchaseRequisition").Select(t => t.Id).FirstAsync(ct);
        var alreadyFlagged = await db.AiChecks.Where(c => c.CheckTypeId == splitCheckTypeId).Select(c => c.EntityId).ToListAsync(ct);

        var recentLines = await db.PurchaseRequisitions
            .Where(p => p.CreatedAt >= cutoff)
            .Join(db.PrLines, p => p.Id, l => l.PrId, (p, l) => new { p, l })
            .Join(db.Items, x => x.l.ItemId, i => i.Id, (x, i) => new { x.p, x.l, i.CategoryId })
            .ToListAsync(ct);

        var groups = recentLines
            .GroupBy(x => (x.p.RequesterId, x.p.DepartmentId, x.CategoryId, x.l.LocationId))
            .Where(g => g.Select(x => x.p.Id).Distinct().Count() > 1);

        var flagged = 0;
        foreach (var group in groups)
        {
            var prIds = group.Select(x => x.p.Id).Distinct().ToList();
            foreach (var prId in prIds.Where(id => !alreadyFlagged.Contains(id)))
            {
                db.AiChecks.Add(new Domain.Entities.AiChecks
                {
                    CheckTypeId = splitCheckTypeId,
                    EntityTypeId = prEntityTypeId,
                    EntityId = prId,
                    Outcome = "Warn",
                    ResultJson = System.Text.Json.JsonSerializer.Serialize(new { relatedPrIds = prIds.Where(id => id != prId) }),
                    CheckedAt = DateTime.UtcNow,
                    Disposition = "Open",
                });
                flagged++;
            }
        }

        if (flagged > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Flagged {Count} PR(s) as possible split purchases.", flagged);
        }
    }
}
