namespace Procurement.Application.Common;

public static class PermissionCheckerExtensions
{
    // A workflow-instance-aware permission check for a PR that might not have an instance
    // yet (e.g. a draft never submitted) - falls back to the plain role-permission check in
    // that case, since there is no task to be an escalation target of.
    public static Task RequireAsync(this IPermissionChecker permissions, long userId, string permissionCode, long? workflowInstanceId, CancellationToken ct = default) =>
        workflowInstanceId.HasValue
            ? permissions.RequireAsync(userId, permissionCode, workflowInstanceId.Value, ct)
            : permissions.RequireAsync(userId, permissionCode, ct);
}
