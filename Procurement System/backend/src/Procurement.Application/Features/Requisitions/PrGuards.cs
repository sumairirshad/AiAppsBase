using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Requisitions;

internal static class PrGuards
{
    public static async Task EnsureDepartmentAccessAsync(IProcurementDbContext db, ICurrentUserContext currentUser, long departmentId, CancellationToken ct)
    {
        if (await currentUser.HasRoleAsync(RoleCodes.Opd)) return;

        var accessible = await currentUser.GetAccessibleDepartmentIdsAsync();
        if (!accessible.Contains(departmentId))
        {
            throw new ForbiddenAccessException("You may not raise a purchase requisition for this department.");
        }
    }

    public static async Task EnsureCategoryAllowedAsync(IProcurementDbContext db, ICurrentUserContext currentUser, long departmentId, long categoryId, CancellationToken ct)
    {
        if (await currentUser.HasRoleAsync(RoleCodes.Opd)) return;

        var allowed = await db.DepartmentCategories.AnyAsync(dc => dc.DepartmentId == departmentId && dc.CategoryId == categoryId, ct);
        if (!allowed)
        {
            throw new BusinessRuleException("This item's category is not available to the selected department.");
        }
    }

    /// <summary>Only one open PR line (PR not Closed/Rejected/Cancelled) may exist for the same item at the same location.</summary>
    public static async Task EnsureNoDuplicateOpenLineAsync(IProcurementDbContext db, long itemId, long locationId, CancellationToken ct)
    {
        var terminalCodes = new[] { PrStatusCodes.Closed, PrStatusCodes.Rejected, PrStatusCodes.Cancelled };
        var terminalIds = await db.PrStatuses.Where(s => terminalCodes.Contains(s.Code)).Select(s => s.Id).ToListAsync(ct);

        var existing = await (
            from line in db.PrLines
            join pr in db.PurchaseRequisitions on line.PrId equals pr.Id
            where line.ItemId == itemId && line.LocationId == locationId && !terminalIds.Contains(pr.PrStatusId)
            select pr.PrNumber
        ).FirstOrDefaultAsync(ct);

        if (existing != null)
        {
            throw new ConflictException($"An open purchase requisition ({existing}) already exists for this item at this location.");
        }
    }

    public static async Task<long> ResolveActorRoleIdAsync(IProcurementDbContext db, ICurrentUserContext currentUser, CancellationToken ct)
    {
        var assignments = await currentUser.GetRoleAssignmentsAsync();
        var preferredOrder = new[] { RoleCodes.Opd, RoleCodes.Procurement, RoleCodes.Requestor, RoleCodes.Hod, RoleCodes.Finance, RoleCodes.Audit };
        var roleCode = preferredOrder.FirstOrDefault(code => assignments.Any(a => a.RoleCode == code)) ?? RoleCodes.Requestor;
        return (await db.Roles.FirstAsync(r => r.Code == roleCode, ct)).Id;
    }

    /// <summary>Verifies the caller currently holds the open task for this PR's workflow instance under the given
    /// role, respecting department/requester scope, and that they are not the PR's own requester (self-approval
    /// is always blocked). Returns the open task and the caller's effective role id for recording the action.</summary>
    public static async Task<(WorkflowTasks Task, long ActorRoleId)> EnsureCanActOnTaskAsync(
        IProcurementDbContext db, ICurrentUserContext currentUser, Workflow.IWorkflowEngine engine,
        PurchaseRequisitions pr, string requiredRoleCode, CancellationToken ct)
    {
        if (pr.RequesterId == currentUser.UserId)
        {
            throw new ForbiddenAccessException("The requester may not act on an approval stage of their own purchase requisition.");
        }
        if (pr.WorkflowInstanceId == null)
        {
            throw new BusinessRuleException("This purchase requisition has not been submitted.");
        }

        var task = await engine.GetOpenTaskAsync(pr.WorkflowInstanceId.Value, ct)
            ?? throw new BusinessRuleException("There is no open task to act on for this purchase requisition.");

        var role = await db.Roles.FirstAsync(r => r.Id == task.AssignedRoleId, ct);
        if (role.Code != requiredRoleCode)
        {
            throw new ForbiddenAccessException($"This stage is awaiting {role.Name}, not {requiredRoleCode}.");
        }
        if (task.ScopeDepartmentId != null && !await currentUser.HasRoleForDepartmentAsync(requiredRoleCode, task.ScopeDepartmentId.Value))
        {
            throw new ForbiddenAccessException("You are not the HOD of the department this purchase requisition belongs to.");
        }
        if (task.ScopeDepartmentId == null && !await currentUser.HasRoleAsync(requiredRoleCode))
        {
            throw new ForbiddenAccessException($"You do not hold the {requiredRoleCode} role.");
        }
        if (task.AssignedUserId != null && task.AssignedUserId != currentUser.UserId)
        {
            throw new ForbiddenAccessException("This task is assigned to a specific user, not you.");
        }

        return (task, task.AssignedRoleId);
    }
}
