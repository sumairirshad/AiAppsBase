namespace Procurement.Application.Common;

// The "Permission" layer of the four-layer authorization check: can this role ever perform
// this kind of action at all (regardless of which specific record or task). The "Task" and
// "Data scope" layers that follow it live in IWorkflowEngine and UserAccessService.
public interface IPermissionChecker
{
    Task<bool> HasPermissionAsync(long userId, string permissionCode, CancellationToken ct = default);

    Task RequireAsync(long userId, string permissionCode, CancellationToken ct = default);
}
