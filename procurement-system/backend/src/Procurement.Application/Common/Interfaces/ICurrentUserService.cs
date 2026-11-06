namespace Procurement.Application.Common.Interfaces;

// Populated by the API from the JWT (user id only, per the spec); the Worker sets this to
// the well-known SYSTEM user for background actions so every WorkflowAction/AuditEvent still
// has an actor.
public interface ICurrentUserService
{
    long UserId { get; }
    bool IsAuthenticated { get; }
}
