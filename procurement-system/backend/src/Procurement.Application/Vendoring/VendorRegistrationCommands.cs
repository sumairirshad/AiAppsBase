using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Alerts;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Workflow;
using Procurement.Domain.Entities;

namespace Procurement.Application.Vendoring;

// BR-019/020/023: any department can register a vendor; Procurement decides first (reason
// mandatory on reject), then the HOD of the Procurement department decides (reason mandatory
// on reject); the requester is notified either way. No per-item vendor list - vendors are
// linked to categories only.
public record RegisterVendorCommand(long ActorUserId, VendorRegistrationData Data) : IRequest<long>;

public class RegisterVendorValidator : AbstractValidator<RegisterVendorCommand>
{
    public RegisterVendorValidator()
    {
        RuleFor(x => x.Data.LegalName).NotEmpty();
        RuleFor(x => x.Data.Ntn).NotEmpty();
        RuleFor(x => x.Data.CategoryIds).NotEmpty().WithMessage("At least one category is required.");
        RuleFor(x => x.Data.BankName).NotEmpty();
        RuleFor(x => x.Data.AccountTitle).NotEmpty();
        RuleFor(x => x.Data.AccountNo).NotEmpty();
    }
}

public class RegisterVendorHandler : IRequestHandler<RegisterVendorCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly UserAccessService _access;
    private readonly LookupCache _lookups;
    private readonly IDocumentNumberGenerator _numbers;

    public RegisterVendorHandler(IApplicationDbContext db, IWorkflowEngine workflow, UserAccessService access, LookupCache lookups, IDocumentNumberGenerator numbers)
    {
        _db = db;
        _workflow = workflow;
        _access = access;
        _lookups = lookups;
        _numbers = numbers;
    }

    public async Task<long> Handle(RegisterVendorCommand request, CancellationToken ct)
    {
        var pendingProcurement = await _lookups.IdAsync<ApprovalRequestStatuses, short>("PendingProcurement", ct);
        var requesterRoleId = await ResolveActorRoleAsync(request.ActorUserId, ct);
        var policyVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);

        var registration = new VendorRegistrationRequests
        {
            RequestNo = await _numbers.NextAsync(DocumentSequence.Vr, ct),
            ProposedData = JsonSerializer.Serialize(request.Data),
            ProposedByUserId = request.ActorUserId,
            SourceRoleId = requesterRoleId,
            StatusId = pendingProcurement,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<VendorRegistrationRequests>().Add(registration);
        await _db.SaveChangesAsync(ct);

        var procurementDept = await _access.GetProcurementDepartmentIdAsync(ct)
            ?? throw new InvalidOperationException("No Procurement department is configured.");

        await _workflow.StartAsync(new StartWorkflowRequest(
            "WF_VENDOR_REGISTRATION", registration.Id, request.ActorUserId, requesterRoleId,
            policyVersionId, Amount: 0, SpendSubHeadId: null, OwningDepartmentId: procurementDept, RequesterUserId: request.ActorUserId), ct);

        return registration.Id;
    }

    private async Task<long> ResolveActorRoleAsync(long userId, CancellationToken ct)
    {
        var assignments = await _access.GetAssignmentsAsync(userId, ct);
        return assignments.FirstOrDefault()?.RoleId ?? await _lookups.IdAsync<Roles, long>("REQUESTOR", ct);
    }
}

public record ProcurementVendorDecisionCommand(long ActorUserId, long RequestId, bool Approve, string? Reason) : IRequest;

public class ProcurementVendorDecisionHandler : IRequestHandler<ProcurementVendorDecisionCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly UserAccessService _access;
    private readonly NotificationService _notifications;

    public ProcurementVendorDecisionHandler(IApplicationDbContext db, IWorkflowEngine workflow, IPermissionChecker permissions, LookupCache lookups, UserAccessService access, NotificationService notifications)
    {
        _db = db;
        _workflow = workflow;
        _permissions = permissions;
        _lookups = lookups;
        _access = access;
        _notifications = notifications;
    }

    public async Task Handle(ProcurementVendorDecisionCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "VENDOR.VET", ct);
        if (!request.Approve && string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("A reason is required to reject a vendor registration.");

        var registration = await _db.Set<VendorRegistrationRequests>().FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException("Vendor registration not found.");
        var instance = await _db.WorkflowInstances.FirstAsync(i => i.EntityId == registration.Id && i.DefinitionId ==
            _db.WorkflowDefinitions.Where(d => d.Code == "WF_VENDOR_REGISTRATION").Select(d => d.Id).First(), ct);

        var procurementRoleId = await _lookups.IdAsync<Roles, long>("PROCUREMENT", ct);
        var procurementDept = await _access.GetProcurementDepartmentIdAsync(ct) ?? 0;

        registration.ProcurementDecisionBy = request.ActorUserId;
        registration.ProcurementReason = request.Reason;
        registration.StatusId = await _lookups.IdAsync<ApprovalRequestStatuses, short>(
            request.Approve ? "PendingProcurementHod" : "Rejected", ct);
        registration.UpdatedBy = request.ActorUserId;
        registration.UpdatedAt = DateTime.UtcNow;

        await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instance.Id, request.ActorUserId, procurementRoleId,
            request.Approve ? WorkflowActionCode.Approve : WorkflowActionCode.Reject,
            registration.ProposedByUserId, procurementDept, request.Reason), ct);

        if (!request.Approve)
        {
            await _notifications.NotifyUserAsync(registration.ProposedByUserId, "VendorRegistrationRequest", registration.Id,
                $"Your vendor registration {registration.RequestNo} was rejected by Procurement: {request.Reason}",
                "VendorDecision", $"VendorDecision:{registration.Id}:procurement", ct);
        }
    }
}

public record ProcurementHodVendorDecisionCommand(long ActorUserId, long RequestId, bool Approve, string? Reason) : IRequest<long?>;

public class ProcurementHodVendorDecisionHandler : IRequestHandler<ProcurementHodVendorDecisionCommand, long?>
{
    private readonly IApplicationDbContext _db;
    private readonly IWorkflowEngine _workflow;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;
    private readonly UserAccessService _access;
    private readonly NotificationService _notifications;

    public ProcurementHodVendorDecisionHandler(IApplicationDbContext db, IWorkflowEngine workflow, IPermissionChecker permissions, LookupCache lookups, UserAccessService access, NotificationService notifications)
    {
        _db = db;
        _workflow = workflow;
        _permissions = permissions;
        _lookups = lookups;
        _access = access;
        _notifications = notifications;
    }

    public async Task<long?> Handle(ProcurementHodVendorDecisionCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "VENDOR.APPROVE", ct);
        if (!request.Approve && string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("A reason is required to reject a vendor registration.");

        var procurementDept = await _access.GetProcurementDepartmentIdAsync(ct)
            ?? throw new InvalidOperationException("No Procurement department is configured.");
        var isProcurementHod = await _access.HasRoleAsync(request.ActorUserId, "HOD", procurementDept, ct);
        if (!isProcurementHod)
            throw new UnauthorizedAccessException("Only the HOD of the Procurement department can decide vendor registrations.");

        var registration = await _db.Set<VendorRegistrationRequests>().FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new InvalidOperationException("Vendor registration not found.");
        var instance = await _db.WorkflowInstances.FirstAsync(i => i.EntityId == registration.Id && i.DefinitionId ==
            _db.WorkflowDefinitions.Where(d => d.Code == "WF_VENDOR_REGISTRATION").Select(d => d.Id).First(), ct);

        long? createdVendorId = null;
        if (request.Approve)
        {
            var data = JsonSerializer.Deserialize<VendorRegistrationData>(registration.ProposedData)
                ?? throw new InvalidOperationException("Corrupt vendor registration data.");

            var titleMatches = string.Equals(data.AccountTitle.Trim(), data.LegalName.Trim(), StringComparison.OrdinalIgnoreCase);
            if (!titleMatches)
                throw new InvalidOperationException("The bank account title does not match the vendor's legal name (BR-023). Reject, or correct the registration, instead of approving.");

            var approvedStatus = await _lookups.IdAsync<VendorStatuses, short>("Approved", ct);
            var vendor = new Domain.Entities.Vendors
            {
                VendorCode = $"VEN-{registration.Id:D5}",
                LegalName = data.LegalName,
                Ntn = data.Ntn,
                Strn = data.Strn,
                VendorStatusId = approvedStatus,
                HasDeliveryHistory = false,
                CreatedBy = request.ActorUserId,
            };
            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync(ct);

            foreach (var categoryId in data.CategoryIds)
                _db.Set<VendorCategories>().Add(new VendorCategories { VendorId = vendor.Id, CategoryId = categoryId });

            foreach (var contact in data.Contacts)
                _db.Set<VendorContacts>().Add(new VendorContacts { VendorId = vendor.Id, Name = contact.Name, Email = contact.Email, Phone = contact.Phone, IsPrimary = contact.IsPrimary, CreatedBy = request.ActorUserId });

            _db.Set<VendorBankAccounts>().Add(new VendorBankAccounts
            {
                VendorId = vendor.Id,
                BankName = data.BankName,
                AccountTitle = data.AccountTitle,
                AccountNoEncrypted = System.Text.Encoding.UTF8.GetBytes(data.AccountNo), // dev-only placeholder; swap for real field-level encryption (e.g. Always Encrypted) in production
                AccountNoMasked = MaskAccountNo(data.AccountNo),
                TitleMatchesLegalName = true,
                IsActive = true,
                CreatedBy = request.ActorUserId,
            });

            registration.CreatedVendorId = vendor.Id;
            createdVendorId = vendor.Id;
        }

        registration.ProcurementHodDecisionBy = request.ActorUserId;
        registration.ProcurementHodReason = request.Reason;
        registration.StatusId = await _lookups.IdAsync<ApprovalRequestStatuses, short>(request.Approve ? "Approved" : "Rejected", ct);
        registration.RequesterNotifiedAt = DateTime.UtcNow;
        registration.UpdatedBy = request.ActorUserId;
        registration.UpdatedAt = DateTime.UtcNow;

        var hodRoleId = await _lookups.IdAsync<Roles, long>("HOD", ct);
        await _workflow.ExecuteAsync(new ExecuteWorkflowActionRequest(
            instance.Id, request.ActorUserId, hodRoleId,
            request.Approve ? WorkflowActionCode.Approve : WorkflowActionCode.Reject,
            registration.ProposedByUserId, procurementDept, request.Reason), ct);

        // BR-020: the requester is notified of the final outcome either way.
        var outcomeMessage = request.Approve
            ? $"Your vendor registration {registration.RequestNo} was approved."
            : $"Your vendor registration {registration.RequestNo} was rejected by the Procurement HOD: {request.Reason}";
        await _notifications.NotifyUserAsync(registration.ProposedByUserId, "VendorRegistrationRequest", registration.Id,
            outcomeMessage, "VendorDecision", $"VendorDecision:{registration.Id}:procurement-hod", ct);

        return createdVendorId;
    }

    private static string MaskAccountNo(string accountNo) =>
        accountNo.Length <= 4 ? accountNo : new string('*', accountNo.Length - 4) + accountNo[^4..];
}

public record BlacklistVendorCommand(long ActorUserId, long VendorId, string Reason) : IRequest;

public class BlacklistVendorHandler : IRequestHandler<BlacklistVendorCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public BlacklistVendorHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task Handle(BlacklistVendorCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "VENDOR.BLACKLIST", ct);
        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new InvalidOperationException("A reason is required to blacklist a vendor.");

        var vendor = await _db.Vendors.FirstOrDefaultAsync(v => v.Id == request.VendorId, ct)
            ?? throw new InvalidOperationException("Vendor not found.");
        vendor.VendorStatusId = await _lookups.IdAsync<VendorStatuses, short>("Blacklisted", ct);
        vendor.BlacklistReason = request.Reason;
        vendor.UpdatedBy = request.ActorUserId;
        vendor.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
