using Microsoft.EntityFrameworkCore;
using Procurement.Application.Recurring;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Worker.Jobs;

// BR-046: creates each approved recurring plan's PR once per period, on its GenerationDay.
// RecurringOccurrenceGenerator.GenerateForPeriodAsync is idempotent (UNIQUE(PlanId,
// OccurrenceKey)), so running this more than once a day, or re-running after a restart, never
// creates a duplicate PR for the same plan/period.
public class RecurringGenerationJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RecurringGenerationJob> _logger;

    public RecurringGenerationJob(IServiceScopeFactory scopeFactory, ILogger<RecurringGenerationJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        do
        {
            try { await RunAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "RecurringGenerationJob tick failed."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        var generator = scope.ServiceProvider.GetRequiredService<RecurringOccurrenceGenerator>();

        var approvedStatusId = await db.ApprovalRequestStatuses.Where(s => s.Code == "Approved").Select(s => s.Id).FirstAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var duePlans = await db.RecurringPlans
            .Where(p => p.StatusId == approvedStatusId && p.NextRunDate != null && p.NextRunDate <= today
                && (p.EndDate == null || p.EndDate >= today))
            .ToListAsync(ct);

        foreach (var plan in duePlans)
        {
            try
            {
                var prId = await generator.GenerateForPeriodAsync(plan.Id, plan.NextRunDate!.Value, ct);
                if (prId.HasValue) _logger.LogInformation("Generated PR {PrId} for recurring plan {PlanId}.", prId, plan.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to generate occurrence for recurring plan {PlanId}.", plan.Id);
            }
        }
    }
}
