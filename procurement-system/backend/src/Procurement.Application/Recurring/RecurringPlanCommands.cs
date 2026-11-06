using MediatR;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Recurring;

public record RecurringPlanLineInput(long ItemId, decimal Qty, long UnitId, decimal? AgreedPrice);

// BR-046: OPD sets up (and approves) a recurring plan once; the system then creates one PR
// per plan per period. A later change creates a new plan version rather than editing history.
public record CreateRecurringPlanCommand(
    long ActorUserId, string PlanTypeCode, string SpendSubHeadCode, long DepartmentId, long LocationId,
    long OwnerUserId, string FrequencyCode, byte GenerationDay, DateOnly StartDate, DateOnly? EndDate,
    long? VendorId, decimal? FixedAmount, List<RecurringPlanLineInput> Lines) : IRequest<long>;

public class CreateRecurringPlanValidator : AbstractValidator<CreateRecurringPlanCommand>
{
    public CreateRecurringPlanValidator()
    {
        RuleFor(x => x.GenerationDay).InclusiveBetween((byte)1, (byte)28);
    }
}

public class CreateRecurringPlanHandler : IRequestHandler<CreateRecurringPlanCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IDocumentNumberGenerator _numbers;
    private readonly IWorkflowEngine _workflow;

    public CreateRecurringPlanHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IDocumentNumberGenerator numbers, IWorkflowEngine workflow)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _numbers = numbers;
        _workflow = workflow;
    }

    public async Task<long> Handle(CreateRecurringPlanCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.RECURRING", ct);
        var subHead = await _db.SpendSubHeads.FirstAsync(s => s.Code == request.SpendSubHeadCode, ct);
        var draftStatus = await _lookups.IdAsync<ApprovalRequestStatuses, short>("Draft", ct);

        var plan = new RecurringPlans
        {
            PlanNo = await _numbers.NextAsync(DocumentSequence.Rp, ct),
            RecurringPlanTypeId = await _lookups.IdAsync<RecurringPlanTypes, short>(request.PlanTypeCode, ct),
            SpendSubHeadId = subHead.Id,
            DepartmentId = request.DepartmentId,
            LocationId = request.LocationId,
            OwnerUserId = request.OwnerUserId,
            FrequencyId = await _lookups.IdAsync<RecurringFrequencies, short>(request.FrequencyCode, ct),
            GenerationDay = request.GenerationDay,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            StatusId = draftStatus,
            VendorId = request.VendorId,
            FixedAmount = request.FixedAmount,
            NextRunDate = request.StartDate,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<RecurringPlans>().Add(plan);
        await _db.SaveChangesAsync(ct);

        foreach (var line in request.Lines)
            _db.Set<RecurringPlanLines>().Add(new RecurringPlanLines { PlanId = plan.Id, ItemId = line.ItemId, Qty = line.Qty, UnitId = line.UnitId, AgreedPrice = line.AgreedPrice });
        await _db.SaveChangesAsync(ct);

        var policyVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var opdRoleId = await _lookups.IdAsync<Roles, long>("OPD", ct);
        await _workflow.StartAsync(new Workflow.StartWorkflowRequest(
            "WF_RECURRING_PLAN", plan.Id, request.ActorUserId, opdRoleId, policyVersionId,
            Amount: 0, SpendSubHeadId: subHead.Id, OwningDepartmentId: request.DepartmentId, RequesterUserId: request.ActorUserId), ct);

        return plan.Id;
    }
}

public record ApproveRecurringPlanCommand(long ActorUserId, long PlanId) : IRequest;

public class ApproveRecurringPlanHandler : IRequestHandler<ApproveRecurringPlanCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly IWorkflowEngine _workflow;

    public ApproveRecurringPlanHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups, IWorkflowEngine workflow)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
        _workflow = workflow;
    }

    public async Task Handle(ApproveRecurringPlanCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.RECURRING", ct);
        var plan = await _db.Set<RecurringPlans>().FirstOrDefaultAsync(p => p.Id == request.PlanId, ct)
            ?? throw new InvalidOperationException("Recurring plan not found.");

        var definitionId = await _db.WorkflowDefinitions.Where(d => d.Code == "WF_RECURRING_PLAN").Select(d => d.Id).FirstAsync(ct);
        var instance = await _db.WorkflowInstances.FirstOrDefaultAsync(i => i.EntityId == plan.Id && i.DefinitionId == definitionId, ct);
        if (instance is not null && instance.Status == "Running")
        {
            var opdRoleId = await _lookups.IdAsync<Roles, long>("OPD", ct);
            await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
                instance.Id, request.ActorUserId, opdRoleId, WorkflowActionCode.Approve,
                RequesterUserId: plan.OwnerUserId, OwningDepartmentId: plan.DepartmentId), ct);
        }

        plan.StatusId = await _lookups.IdAsync<ApprovalRequestStatuses, short>("Approved", ct);
        plan.ApprovedBy = request.ActorUserId;
        plan.UpdatedBy = request.ActorUserId;
        plan.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
