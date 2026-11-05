using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Notify;
using Procurement.Application.Common.Numbering;
using Procurement.Application.Common.Policy;
using Procurement.Application.Workflow;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.VendorManagement;

public record ProposedVendorData(
    string LegalName, string Ntn, string? Strn, string Address,
    string ContactName, string? ContactEmail, string? ContactPhone,
    string BankName, string AccountTitle, string AccountNo, List<long> CategoryIds);

public record VendorRegistrationRequestDto(
    long Id, string RequestNo, string LegalName, string Ntn, string Status,
    DateTime CreatedAt, long ProposedByUserId, string ProposedByUserName,
    List<long> CategoryIds, string? ProcurementReason, string? ProcurementHodReason, long? CreatedVendorId);

public record RegisterVendorCommand(
    string LegalName, string Ntn, string? Strn, string Address,
    string ContactName, string? ContactEmail, string? ContactPhone,
    string BankName, string AccountTitle, string AccountNo, List<long> CategoryIds) : IRequest<long>;

public class RegisterVendorCommandHandler : IRequestHandler<RegisterVendorCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public RegisterVendorCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task<long> Handle(RegisterVendorCommand request, CancellationToken ct)
    {
        if (request.CategoryIds.Count == 0)
        {
            throw new BusinessRuleException("At least one supplied category is required.");
        }
        if (await _db.Vendors.AnyAsync(v => v.Ntn == request.Ntn, ct))
        {
            throw new ConflictException($"A vendor with NTN '{request.Ntn}' already exists.");
        }

        var proposed = new ProposedVendorData(
            request.LegalName, request.Ntn, request.Strn, request.Address,
            request.ContactName, request.ContactEmail, request.ContactPhone,
            request.BankName, request.AccountTitle, request.AccountNo, request.CategoryIds);

        var assignments = await _currentUser.GetRoleAssignmentsAsync();
        var sourceRoleCode = assignments.FirstOrDefault()?.RoleCode ?? RoleCodes.Requestor;
        var sourceRole = await _db.Roles.FirstAsync(r => r.Code == sourceRoleCode, ct);
        var pendingProcurement = await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.PendingProcurement, ct);
        var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.VendorRegistrationRequest, ct);

        var requestNo = await DocumentNumberGenerator.NextAsync(_db, "seq_vr", "VR", 4, ct);
        var now = DateTime.UtcNow;

        var registrationRequest = new VendorRegistrationRequests
        {
            RequestNo = requestNo,
            ProposedData = JsonSerializer.Serialize(proposed),
            ProposedByUserId = _currentUser.UserId,
            SourceRoleId = sourceRole.Id,
            StatusId = pendingProcurement.Id,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.VendorRegistrationRequests.Add(registrationRequest);
        await _db.SaveChangesAsync(ct);

        var policyVersion = await PolicyVersionResolver.GetCurrentAsync(_db, ct);
        await _workflowEngine.StartAsync(
            WorkflowDefinitionCodes.VendorRegistration, entityType.Id, registrationRequest.Id, policyVersion.Id,
            new Dictionary<string, object>(), _currentUser.UserId, sourceRole.Id, ct);

        await NotificationWriter.AddAsync(
            _db, NotificationTypeCodes.ActionRequired, entityType.Id, registrationRequest.Id,
            $"Vendor registration {requestNo} is awaiting Procurement review.",
            $"vendorreg-submitted-{registrationRequest.Id}", ct, roleId: await RoleId(RoleCodes.Procurement, ct));

        return registrationRequest.Id;
    }

    private async Task<long> RoleId(string code, CancellationToken ct) => (await _db.Roles.FirstAsync(r => r.Code == code, ct)).Id;
}

public record ListVendorRegistrationRequestsQuery(string? StatusCode) : IRequest<List<VendorRegistrationRequestDto>>;

public class ListVendorRegistrationRequestsQueryHandler : IRequestHandler<ListVendorRegistrationRequestsQuery, List<VendorRegistrationRequestDto>>
{
    private readonly IProcurementDbContext _db;
    public ListVendorRegistrationRequestsQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<VendorRegistrationRequestDto>> Handle(ListVendorRegistrationRequestsQuery request, CancellationToken ct)
    {
        var statuses = await _db.ApprovalRequestStatuses.ToDictionaryAsync(s => s.Id, ct);
        var query = _db.VendorRegistrationRequests.AsQueryable();
        if (request.StatusCode != null)
        {
            var statusId = statuses.Values.First(s => s.Code == request.StatusCode).Id;
            query = query.Where(r => r.StatusId == statusId);
        }

        var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        var users = await _db.Users.ToDictionaryAsync(u => u.Id, ct);

        return requests.Select(r =>
        {
            var proposed = JsonSerializer.Deserialize<ProposedVendorData>(r.ProposedData)!;
            return new VendorRegistrationRequestDto(
                r.Id, r.RequestNo, proposed.LegalName, proposed.Ntn, statuses[r.StatusId].Code,
                r.CreatedAt, r.ProposedByUserId, users[r.ProposedByUserId].DisplayName,
                proposed.CategoryIds, r.ProcurementReason, r.ProcurementHodReason, r.CreatedVendorId);
        }).ToList();
    }
}

public record ProcurementVendorDecisionCommand(long RequestId, bool Approve, string Reason) : IRequest;

public class ProcurementVendorDecisionCommandHandler : IRequestHandler<ProcurementVendorDecisionCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;

    public ProcurementVendorDecisionCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
    }

    public async Task Handle(ProcurementVendorDecisionCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessRuleException("A reason is required for this decision.");
        }
        if (!await _currentUser.HasRoleAsync(RoleCodes.Procurement))
        {
            throw new ForbiddenAccessException("Only Procurement may decide on vendor registrations.");
        }

        var registrationRequest = await _db.VendorRegistrationRequests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new NotFoundException("VendorRegistrationRequest", request.RequestId);
        var pendingProcurement = await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.PendingProcurement, ct);
        if (registrationRequest.StatusId != pendingProcurement.Id)
        {
            throw new BusinessRuleException("This vendor registration is not awaiting a Procurement decision.");
        }

        var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.VendorRegistrationRequest, ct);
        var instance = await _db.WorkflowInstances.FirstAsync(i => i.EntityTypeId == entityType.Id && i.EntityId == registrationRequest.Id && i.Status == "Running", ct);
        var procurementRoleId = await _db.Roles.Where(r => r.Code == RoleCodes.Procurement).Select(r => r.Id).FirstAsync(ct);

        registrationRequest.ProcurementDecisionBy = _currentUser.UserId;
        registrationRequest.ProcurementReason = request.Reason;
        registrationRequest.UpdatedByUserId = _currentUser.UserId;
        registrationRequest.UpdatedAt = DateTime.UtcNow;

        if (request.Approve)
        {
            registrationRequest.StatusId = (await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.PendingProcurementHod, ct)).Id;
            await _workflowEngine.AdvanceAsync(instance.Id, ActionTypeCodes.Approve, _currentUser.UserId, procurementRoleId, request.Reason, new Dictionary<string, object>(), ct);
        }
        else
        {
            registrationRequest.StatusId = (await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.Rejected, ct)).Id;
            await _workflowEngine.TerminateAsync(instance.Id, ActionTypeCodes.Reject, _currentUser.UserId, procurementRoleId, request.Reason, ct);
            await NotifyRequesterAsync(registrationRequest, entityType.Id, "rejected by Procurement", ct);
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task NotifyRequesterAsync(VendorRegistrationRequests registrationRequest, short entityTypeId, string outcome, CancellationToken ct)
    {
        await NotificationWriter.AddAsync(
            _db, NotificationTypeCodes.VendorDecision, entityTypeId, registrationRequest.Id,
            $"Vendor registration {registrationRequest.RequestNo} was {outcome}.",
            $"vendorreg-{outcome.Replace(' ', '-')}-{registrationRequest.Id}", ct, userId: registrationRequest.ProposedByUserId);
        registrationRequest.RequesterNotifiedAt = DateTime.UtcNow;
    }
}

public record ProcurementHodVendorDecisionCommand(long RequestId, bool Approve, string Reason) : IRequest;

public class ProcurementHodVendorDecisionCommandHandler : IRequestHandler<ProcurementHodVendorDecisionCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;
    private readonly IWorkflowEngine _workflowEngine;
    private readonly IEncryptionService _encryption;

    public ProcurementHodVendorDecisionCommandHandler(
        IProcurementDbContext db, ICurrentUserContext currentUser, IWorkflowEngine workflowEngine, IEncryptionService encryption)
    {
        _db = db;
        _currentUser = currentUser;
        _workflowEngine = workflowEngine;
        _encryption = encryption;
    }

    public async Task Handle(ProcurementHodVendorDecisionCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessRuleException("A reason is required for this decision.");
        }

        var procurementDept = await _db.Departments.FirstAsync(d => d.Code == "PROC", ct);
        if (!await _currentUser.HasRoleForDepartmentAsync(RoleCodes.Hod, procurementDept.Id))
        {
            throw new ForbiddenAccessException("Only the HOD of Procurement may give final approval of a vendor registration.");
        }

        var registrationRequest = await _db.VendorRegistrationRequests.FirstOrDefaultAsync(r => r.Id == request.RequestId, ct)
            ?? throw new NotFoundException("VendorRegistrationRequest", request.RequestId);
        var pendingHod = await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.PendingProcurementHod, ct);
        if (registrationRequest.StatusId != pendingHod.Id)
        {
            throw new BusinessRuleException("This vendor registration is not awaiting a Procurement-HOD decision.");
        }

        var entityType = await _db.EntityTypes.FirstAsync(e => e.Code == EntityTypeCodes.VendorRegistrationRequest, ct);
        var instance = await _db.WorkflowInstances.FirstAsync(i => i.EntityTypeId == entityType.Id && i.EntityId == registrationRequest.Id && i.Status == "Running", ct);
        var hodRoleId = await _db.Roles.Where(r => r.Code == RoleCodes.Hod).Select(r => r.Id).FirstAsync(ct);

        registrationRequest.ProcurementHodDecisionBy = _currentUser.UserId;
        registrationRequest.ProcurementHodReason = request.Reason;
        registrationRequest.UpdatedByUserId = _currentUser.UserId;
        registrationRequest.UpdatedAt = DateTime.UtcNow;

        if (request.Approve)
        {
            var vendor = await CreateVendorFromProposalAsync(registrationRequest, ct);
            registrationRequest.CreatedVendorId = vendor.Id;
            registrationRequest.StatusId = (await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.Approved, ct)).Id;
            await _workflowEngine.AdvanceAsync(instance.Id, ActionTypeCodes.Approve, _currentUser.UserId, hodRoleId, request.Reason, new Dictionary<string, object>(), ct);
            await NotifyRequesterAsync(registrationRequest, entityType.Id, "approved", ct);
        }
        else
        {
            registrationRequest.StatusId = (await _db.ApprovalRequestStatuses.FirstAsync(s => s.Code == ApprovalRequestStatusCodes.Rejected, ct)).Id;
            await _workflowEngine.TerminateAsync(instance.Id, ActionTypeCodes.Reject, _currentUser.UserId, hodRoleId, request.Reason, ct);
            await NotifyRequesterAsync(registrationRequest, entityType.Id, "rejected by the Procurement HOD", ct);
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task<Vendors> CreateVendorFromProposalAsync(VendorRegistrationRequests registrationRequest, CancellationToken ct)
    {
        var proposed = JsonSerializer.Deserialize<ProposedVendorData>(registrationRequest.ProposedData)!;
        var approvedStatus = await _db.VendorStatuses.FirstAsync(s => s.Code == VendorStatusCodes.Approved, ct);
        var now = DateTime.UtcNow;

        var vendor = new Vendors
        {
            VendorCode = "PENDING",
            LegalName = proposed.LegalName,
            Ntn = proposed.Ntn,
            Strn = proposed.Strn,
            VendorStatusId = approvedStatus.Id,
            HasDeliveryHistory = false,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.Vendors.Add(vendor);
        await _db.SaveChangesAsync(ct);
        vendor.VendorCode = $"VEN-{vendor.Id:D5}";

        foreach (var categoryId in proposed.CategoryIds)
        {
            _db.VendorCategories.Add(new VendorCategories { VendorId = vendor.Id, CategoryId = categoryId });
        }

        _db.VendorContacts.Add(new VendorContacts
        {
            VendorId = vendor.Id, Name = proposed.ContactName, Email = proposed.ContactEmail, Phone = proposed.ContactPhone,
            IsPrimary = true, CreatedByUserId = _currentUser.UserId, CreatedAt = now,
        });

        var titleMatches = string.Equals(proposed.AccountTitle.Trim(), proposed.LegalName.Trim(), StringComparison.OrdinalIgnoreCase);
        var encrypted = _encryption.Encrypt(proposed.AccountNo);
        var masked = proposed.AccountNo.Length > 4 ? new string('*', proposed.AccountNo.Length - 4) + proposed.AccountNo[^4..] : proposed.AccountNo;

        _db.VendorBankAccounts.Add(new VendorBankAccounts
        {
            VendorId = vendor.Id, BankName = proposed.BankName, AccountTitle = proposed.AccountTitle,
            AccountNoEncrypted = encrypted, AccountNoMasked = masked, TitleMatchesLegalName = titleMatches,
            ExceptionApprovedBy = titleMatches ? null : _currentUser.UserId, IsActive = true,
            CreatedByUserId = _currentUser.UserId, CreatedAt = now,
        });

        await _db.SaveChangesAsync(ct);
        return vendor;
    }

    private async Task NotifyRequesterAsync(VendorRegistrationRequests registrationRequest, short entityTypeId, string outcome, CancellationToken ct)
    {
        await NotificationWriter.AddAsync(
            _db, NotificationTypeCodes.VendorDecision, entityTypeId, registrationRequest.Id,
            $"Vendor registration {registrationRequest.RequestNo} was {outcome}.",
            $"vendorreg-{outcome.Replace(' ', '-')}-{registrationRequest.Id}", ct, userId: registrationRequest.ProposedByUserId);
        registrationRequest.RequesterNotifiedAt = DateTime.UtcNow;
    }
}
