using Microsoft.EntityFrameworkCore;
using Procurement.Application.Vendoring;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Worker.Jobs;

// BR-024: scores are recalculated synchronously right after each GRN and acknowledgement
// (see Application/Receiving/ReceivingCommands.cs); this is just a nightly backstop sweep in
// case a recalc was ever missed (a failed request, manual data fix, etc.).
public class VendorScoreRecalcJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VendorScoreRecalcJob> _logger;

    public VendorScoreRecalcJob(IServiceScopeFactory scopeFactory, ILogger<VendorScoreRecalcJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(24));
        do
        {
            try { await RunAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "VendorScoreRecalcJob tick failed."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        var scores = scope.ServiceProvider.GetRequiredService<VendorScoreService>();

        var vendorIds = await db.Vendors.Select(v => v.Id).ToListAsync(ct);
        foreach (var vendorId in vendorIds)
            await scores.RecalculateAsync(vendorId, ct);

        _logger.LogInformation("Recalculated scores for {Count} vendor(s).", vendorIds.Count);
    }
}
