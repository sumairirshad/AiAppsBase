using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Policy;

public record ApprovalBandDto(long Id, decimal MinAmount, decimal? MaxAmount, int Sequence, string RoleCode, long? SpendSubHeadId);
public record QuotationRuleDto(long Id, long? SpendSubHeadId, decimal? MinAmount, decimal? MaxAmount, bool? StarVendor, bool? Emergency, byte RequiredQuotes, int Priority, string Description);
public record PolicySettingDto(string Key, string ValueType, string Value, string Description);
public record CurrentPolicyDto(long PolicyVersionId, int VersionNo, DateOnly EffectiveFrom, List<ApprovalBandDto> Bands, List<QuotationRuleDto> QuotationRules, List<PolicySettingDto> Settings);

public record GetCurrentPolicyQuery : IRequest<CurrentPolicyDto>;

public class GetCurrentPolicyHandler : IRequestHandler<GetCurrentPolicyQuery, CurrentPolicyDto>
{
    private readonly IApplicationDbContext _db;

    public GetCurrentPolicyHandler(IApplicationDbContext db) => _db = db;

    public async Task<CurrentPolicyDto> Handle(GetCurrentPolicyQuery request, CancellationToken ct)
    {
        var version = await _db.PolicyVersions.OrderByDescending(p => p.VersionNo).FirstAsync(ct);

        var bands = await _db.ApprovalBands.Where(b => b.PolicyVersionId == version.Id)
            .Join(_db.Roles, b => b.RoleId, r => r.Id, (b, r) => new ApprovalBandDto(b.Id, b.MinAmount, b.MaxAmount, b.Sequence, r.Code, b.SpendSubHeadId))
            .OrderBy(b => b.MinAmount).ThenBy(b => b.Sequence).ToListAsync(ct);

        var rules = await _db.QuotationRules.Where(r => r.PolicyVersionId == version.Id)
            .Select(r => new QuotationRuleDto(r.Id, r.SpendSubHeadId, r.MinAmount, r.MaxAmount, r.StarVendor, r.Emergency, r.RequiredQuotes, r.Priority, r.Description))
            .OrderBy(r => r.Priority).ToListAsync(ct);

        var settings = await _db.PolicySettings.Where(s => s.PolicyVersionId == version.Id)
            .Select(s => new PolicySettingDto(s.SettingKey, s.ValueType, s.Value, s.Description))
            .OrderBy(s => s.Key).ToListAsync(ct);

        return new CurrentPolicyDto(version.Id, version.VersionNo, version.EffectiveFrom, bands, rules, settings);
    }
}
