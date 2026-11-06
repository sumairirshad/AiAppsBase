using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Worker.Jobs;

// The only piece of the system that talks to anything outside it (architecture spec: "the API
// never calls outside systems directly, it writes to the outbox and the Worker delivers").
// Polls OutboxMessages, dispatches by MessageType, and retries with backoff on failure -
// never throws out of ExecuteAsync, so one bad message never stops the loop for every other one.
public class OutboxDispatcherJob : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OutboxDispatcherJob> _logger;

    public OutboxDispatcherJob(IServiceScopeFactory scopeFactory, ILogger<OutboxDispatcherJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(10));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try { await DispatchPendingAsync(stoppingToken); }
            catch (Exception ex) { _logger.LogError(ex, "OutboxDispatcherJob tick failed."); }
        }
    }

    private async Task DispatchPendingAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ProcurementDbContext>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        var whatsApp = scope.ServiceProvider.GetRequiredService<IWhatsAppSender>();
        var financePortal = scope.ServiceProvider.GetRequiredService<IFinancePortalClient>();

        var now = DateTime.UtcNow;
        var pending = await db.OutboxMessages
            .Where(m => m.ProcessedAt == null && (m.NextAttemptAt == null || m.NextAttemptAt <= now))
            .OrderBy(m => m.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        foreach (var message in pending)
        {
            try
            {
                switch (message.MessageType)
                {
                    case "Notification.Email":
                        await HandleEmailAsync(message.Payload, email, ct);
                        break;
                    case "Notification.WhatsApp":
                        await HandleWhatsAppAsync(message.Payload, whatsApp, ct);
                        break;
                    case "FinancePortal.BillForwarded":
                        await financePortal.PushBillForwardedAsync(message.Payload, ct);
                        break;
                    default:
                        _logger.LogWarning("Unknown outbox message type {Type}; marking processed without action.", message.MessageType);
                        break;
                }
                message.ProcessedAt = DateTime.UtcNow;
            }
            catch (Exception ex)
            {
                message.Attempts++;
                message.LastError = ex.Message;
                message.NextAttemptAt = DateTime.UtcNow.AddSeconds(Math.Pow(2, Math.Min(message.Attempts, 6)) * 5);
                _logger.LogWarning(ex, "Outbox message {Id} ({Type}) failed, attempt {Attempt}.", message.Id, message.MessageType, message.Attempts);
            }
        }
        await db.SaveChangesAsync(ct);
    }

    private static async Task HandleEmailAsync(string payload, IEmailSender email, CancellationToken ct)
    {
        var data = System.Text.Json.JsonDocument.Parse(payload).RootElement;
        var message = data.GetProperty("message").GetString() ?? "";
        // The target address is resolved from userId by Users.Email in a real deployment;
        // kept generic here since the payload only carries the internal user id.
        await email.SendAsync("notifications@procurement.local", "Procurement notification", message, ct);
    }

    private static async Task HandleWhatsAppAsync(string payload, IWhatsAppSender whatsApp, CancellationToken ct)
    {
        var data = System.Text.Json.JsonDocument.Parse(payload).RootElement;
        var message = data.GetProperty("message").GetString() ?? "";
        await whatsApp.SendAsync("+92-000-0000000", message, ct);
    }
}
