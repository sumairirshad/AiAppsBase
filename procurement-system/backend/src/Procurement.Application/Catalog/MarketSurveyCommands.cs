using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Catalog;

// BR-051 / PRC-15: Procurement keeps a surveyed market price per item; surveys older than
// SURVEY_STALE_DAYS are marked stale by the Worker (VendorScoreRecalc/EscalationWatch job),
// and a stale survey never feeds the PR-line price warning.
public record CreateMarketSurveyCommand(long ActorUserId, long ItemId, long? LocationId, decimal SurveyedPrice, string Source, DateOnly SurveyedOn) : IRequest<long>;

public class CreateMarketSurveyHandler : IRequestHandler<CreateMarketSurveyCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public CreateMarketSurveyHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(CreateMarketSurveyCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "MARKETSURVEY.MANAGE", ct);
        var survey = new MarketSurveys
        {
            ItemId = request.ItemId,
            LocationId = request.LocationId,
            SurveyedPrice = request.SurveyedPrice,
            Source = request.Source,
            SurveyedOn = request.SurveyedOn,
            SurveyedBy = request.ActorUserId,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<MarketSurveys>().Add(survey);
        await _db.SaveChangesAsync(ct);
        return survey.Id;
    }
}

public record CreateProjectCommand(long ActorUserId, string ProjectCode, string Name, long OwnerDepartmentId, long? ManagerUserId, bool ContractProvided) : IRequest<long>;

public class CreateProjectHandler : IRequestHandler<CreateProjectCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;

    public CreateProjectHandler(IApplicationDbContext db, IPermissionChecker permissions)
    {
        _db = db;
        _permissions = permissions;
    }

    public async Task<long> Handle(CreateProjectCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "CATALOG.MANAGE", ct);
        var project = new Projects
        {
            ProjectCode = request.ProjectCode,
            Name = request.Name,
            OwnerDepartmentId = request.OwnerDepartmentId,
            ManagerUserId = request.ManagerUserId,
            ContractProvided = request.ContractProvided,
            CreatedBy = request.ActorUserId,
        };
        _db.Set<Projects>().Add(project);
        await _db.SaveChangesAsync(ct);
        return project.Id;
    }
}
