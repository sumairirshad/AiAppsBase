using Microsoft.EntityFrameworkCore;
using Procurement.Application.Alerts;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Worker.Jobs;

// BR-028: an emergency Fault PR not handled (not yet at PO Issued) within
// EMERGENCY_WATCH_HOURS (default 24h) of submission escalates to OPD.
public class EmergencyWatchJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmergencyWatchJob> _logger;

    public EmergencyWatchJob(IServiceScopeFactory scopeFactory, ILogger<EmergencyWatchJob> logger)
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
            catch (Exception ex) { _logger.LogError(ex, "EmergencyWatchJob tick failed."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        var notifications = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var policyVersionId = await db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var hoursSetting = await db.PolicySettings.FirstOrDefaultAsync(s => s.PolicyVersionId == policyVersionId && s.SettingKey == "EMERGENCY_WATCH_HOURS", ct);
        var hours = hoursSetting is not null && int.TryParse(hoursSetting.Value, out var h) ? h : 24;
        var cutoff = DateTime.UtcNow.AddHours(-hours);

        var poIssuedStatusId = await db.PrStatuses.Where(s => s.Code == "PoIssued").Select(s => s.Id).FirstAsync(ct);
        var closedCodes = new[] { "Closed", "Rejected", "Cancelled" };
        var closedIds = await db.PrStatuses.Where(s => closedCodes.Contains(s.Code)).Select(s => s.Id).ToListAsync(ct);

        var stuckEmergencies = await db.PurchaseRequisitions
            .Where(p => p.IsEmergency && p.SubmittedAt != null && p.SubmittedAt < cutoff && p.PrStatusId != poIssuedStatusId && !closedIds.Contains(p.PrStatusId))
            .ToListAsync(ct);

        foreach (var pr in stuckEmergencies)
        {
            await notifications.NotifyRoleAsync("OPD", null, "PurchaseRequisition", pr.Id,
                $"Emergency PR {pr.PrNumber} has not reached PO issue within {hours}h of submission.",
                "Escalation", $"EmergencyWatch:{pr.Id}", ct);
        }

        if (stuckEmergencies.Count > 0)
            _logger.LogInformation("Escalated {Count} overdue emergency PR(s) to OPD.", stuckEmergencies.Count);
    }
}
