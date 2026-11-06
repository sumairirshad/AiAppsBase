using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Policy;

// BR-049: policy values are versioned, and a PR keeps the version in force when it was
// submitted - so changing a band/rule/setting never moves a running PR. A change always needs
// a reason and an effective date (DEC-017), which is why this clones forward into a brand new
// PolicyVersion rather than editing one in place.
public record CreatePolicyVersionCommand(long ActorUserId, string ChangeReason, DateOnly EffectiveFrom) : IRequest<long>;

public class CreatePolicyVersionValidator : AbstractValidator<CreatePolicyVersionCommand>
{
    public CreatePolicyVersionValidator()
    {
        RuleFor(x => x.ChangeReason).NotEmpty().WithMessage("A reason is mandatory for every policy change.");
    }
}

public class CreatePolicyVersionHandler : IRequestHandler<CreatePolicyVersionCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public CreatePolicyVersionHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task<long> Handle(CreatePolicyVersionCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.POLICY", ct);

        var current = await _db.PolicyVersions.OrderByDescending(p => p.VersionNo).FirstAsync(ct);
        current.EffectiveTo = request.EffectiveFrom.AddDays(-1);

        var approvedStatus = await _lookups.IdAsync<ApprovalRequestStatuses, short>("Approved", ct);
        var next = new PolicyVersions
        {
            VersionNo = current.VersionNo + 1,
            EffectiveFrom = request.EffectiveFrom,
            StatusId = approvedStatus,
            ApprovedBy = request.ActorUserId,
            ChangeReason = request.ChangeReason,
            CreatedBy = request.ActorUserId,
        };
        _db.PolicyVersions.Add(next);
        await _db.SaveChangesAsync(ct);

        foreach (var band in await _db.ApprovalBands.Where(b => b.PolicyVersionId == current.Id).ToListAsync(ct))
            _db.ApprovalBands.Add(new ApprovalBands { PolicyVersionId = next.Id, MinAmount = band.MinAmount, MaxAmount = band.MaxAmount, Sequence = band.Sequence, RoleId = band.RoleId, SpendSubHeadId = band.SpendSubHeadId, CreatedBy = request.ActorUserId });

        foreach (var rule in await _db.QuotationRules.Where(r => r.PolicyVersionId == current.Id).ToListAsync(ct))
            _db.QuotationRules.Add(new QuotationRules { PolicyVersionId = next.Id, SpendSubHeadId = rule.SpendSubHeadId, MinAmount = rule.MinAmount, MaxAmount = rule.MaxAmount, StarVendor = rule.StarVendor, Emergency = rule.Emergency, RequiredQuotes = rule.RequiredQuotes, Priority = rule.Priority, Description = rule.Description, CreatedBy = request.ActorUserId });

        foreach (var setting in await _db.PolicySettings.Where(s => s.PolicyVersionId == current.Id).ToListAsync(ct))
            _db.PolicySettings.Add(new PolicySettings { PolicyVersionId = next.Id, SettingKey = setting.SettingKey, ValueType = setting.ValueType, Value = setting.Value, Description = setting.Description, CreatedBy = request.ActorUserId });

        await _db.SaveChangesAsync(ct);
        return next.Id;
    }
}

public record UpdatePolicySettingCommand(long ActorUserId, string SettingKey, string Value) : IRequest;

public class UpdatePolicySettingHandler : IRequestHandler<UpdatePolicySettingCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public UpdatePolicySettingHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task Handle(UpdatePolicySettingCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.POLICY", ct);
        // Only the latest (not-yet-snapshotted-everywhere-else) version may be tuned directly;
        // anything more structural goes through CreatePolicyVersionCommand first.
        var latestVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var setting = await _db.PolicySettings.FirstOrDefaultAsync(s => s.PolicyVersionId == latestVersionId && s.SettingKey == request.SettingKey, ct)
            ?? throw new InvalidOperationException($"No policy setting '{request.SettingKey}' on the current version.");
        setting.Value = request.Value;
        setting.UpdatedBy = request.ActorUserId;
        setting.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public record UpsertApprovalBandCommand(long ActorUserId, decimal MinAmount, decimal? MaxAmount, int Sequence, string RoleCode, long? SpendSubHeadId) : IRequest<long>;

public class UpsertApprovalBandHandler : IRequestHandler<UpsertApprovalBandCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public UpsertApprovalBandHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task<long> Handle(UpsertApprovalBandCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.POLICY", ct);
        var latestVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);
        var roleId = await _lookups.IdAsync<Roles, long>(request.RoleCode, ct);

        var band = new ApprovalBands
        {
            PolicyVersionId = latestVersionId,
            MinAmount = request.MinAmount,
            MaxAmount = request.MaxAmount,
            Sequence = request.Sequence,
            RoleId = roleId,
            SpendSubHeadId = request.SpendSubHeadId,
            CreatedBy = request.ActorUserId,
        };
        _db.ApprovalBands.Add(band);
        await _db.SaveChangesAsync(ct);
        return band.Id;
    }
}

public record UpsertQuotationRuleCommand(long ActorUserId, long? SpendSubHeadId, decimal? MinAmount, decimal? MaxAmount, bool? StarVendor, bool? Emergency, byte RequiredQuotes, int Priority, string Description) : IRequest<long>;

public class UpsertQuotationRuleHandler : IRequestHandler<UpsertQuotationRuleCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public UpsertQuotationRuleHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(UpsertQuotationRuleCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "OPD.POLICY", ct);
        var latestVersionId = await _db.PolicyVersions.OrderByDescending(p => p.Id).Select(p => p.Id).FirstAsync(ct);

        var rule = new QuotationRules
        {
            PolicyVersionId = latestVersionId,
            SpendSubHeadId = request.SpendSubHeadId,
            MinAmount = request.MinAmount,
            MaxAmount = request.MaxAmount,
            StarVendor = request.StarVendor,
            Emergency = request.Emergency,
            RequiredQuotes = request.RequiredQuotes,
            Priority = request.Priority,
            Description = request.Description,
            CreatedBy = request.ActorUserId,
        };
        _db.QuotationRules.Add(rule);
        await _db.SaveChangesAsync(ct);
        return rule.Id;
    }
}
