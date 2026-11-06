using Microsoft.EntityFrameworkCore;
using Procurement.Application.Alerts;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Worker.Jobs;

// BR-008: every stage carries EscalationDays; an overdue open task escalates to its stage's
// EscalateToRoleId (OPD by default) and both parties are notified. Runs every 15 minutes -
// escalation is a courtesy nudge, not a real-time requirement.
public class EscalationWatchJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EscalationWatchJob> _logger;

    public EscalationWatchJob(IServiceScopeFactory scopeFactory, ILogger<EscalationWatchJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(15));
        do
        {
            try { await RunAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "EscalationWatchJob tick failed."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        var notifications = scope.ServiceProvider.GetRequiredService<NotificationService>();

        var openStatusId = await db.TaskStatuses.Where(s => s.Code == "Open").Select(s => s.Id).FirstAsync(ct);
        var now = DateTime.UtcNow;

        var overdue = await db.WorkflowTasks
            .Where(t => t.TaskStatusId == openStatusId && t.DueAt != null && t.DueAt < now && t.EscalatedAt == null)
            .ToListAsync(ct);

        foreach (var task in overdue)
        {
            // The task stays Open (and stays with its original assignee) - escalation only
            // adds a second person who can also act on it; see WorkflowEngine.AuthorizeAsync,
            // which checks EscalatedAt/EscalatedToRoleId as an alternate path to the same task.
            task.EscalatedAt = now;

            var instance = await db.WorkflowInstances.FirstAsync(i => i.Id == task.InstanceId, ct);
            var prId = instance.EntityId;
            var message = $"A task on record {prId} is overdue and has escalated.";

            if (task.EscalatedToRoleId.HasValue)
            {
                var escalateRole = await db.Roles.FirstAsync(r => r.Id == task.EscalatedToRoleId.Value, ct);
                await notifications.NotifyRoleAsync(escalateRole.Code, task.ScopeDepartmentId, "WorkflowTask", task.Id, message, "Escalation", $"Escalation:{task.Id}:to", ct);
            }
            var originalRole = await db.Roles.FirstAsync(r => r.Id == task.AssignedRoleId, ct);
            await notifications.NotifyRoleAsync(originalRole.Code, task.ScopeDepartmentId, "WorkflowTask", task.Id, message, "Escalation", $"Escalation:{task.Id}:original", ct);
        }

        if (overdue.Count > 0)
        {
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("Escalated {Count} overdue task(s).", overdue.Count);
        }
    }
}
