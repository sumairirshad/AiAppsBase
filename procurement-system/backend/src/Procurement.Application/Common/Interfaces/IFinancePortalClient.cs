namespace Procurement.Application.Common.Interfaces;

// The API never calls the Finance Portal directly (architecture spec) - only the Worker's
// OutboxDispatcher does, through this. The default implementation just logs when no real
// Finance Portal base URL is configured, so the outbox still drains in dev.
public interface IFinancePortalClient
{
    Task PushBillForwardedAsync(string payloadJson, CancellationToken ct = default);
}
