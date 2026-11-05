using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Exceptions;
using Procurement.Application.Common.Interfaces;
using Procurement.Application.Common.Notify;
using Procurement.Domain.Constants;
using Procurement.Domain.Entities;

namespace Procurement.Application.Features.Audit;

public record RaiseAuditQueryCommand(string EntityTypeCode, long EntityId, string RoleCode, long? AssignedUserId, string QueryText) : IRequest<long>;

public class RaiseAuditQueryCommandHandler : IRequestHandler<RaiseAuditQueryCommand, long>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public RaiseAuditQueryCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<long> Handle(RaiseAuditQueryCommand request, CancellationToken ct)
    {
        if (!await _currentUser.HasRoleAsync(RoleCodes.Audit))
        {
            throw new ForbiddenAccessException("Only Audit may raise a query.");
        }
        if (string.IsNullOrWhiteSpace(request.QueryText))
        {
            throw new BusinessRuleException("The query text is mandatory.");
        }

        var entityType = await _db.EntityTypes.FirstOrDefaultAsync(e => e.Code == request.EntityTypeCode, ct)
            ?? throw new NotFoundException("EntityType", request.EntityTypeCode);
        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Code == request.RoleCode, ct)
            ?? throw new NotFoundException("Role", request.RoleCode);
        var openStatus = await _db.QueryStatuses.FirstAsync(s => s.Code == QueryStatusCodes.Open, ct);

        var now = DateTime.UtcNow;
        var query = new AuditQueries
        {
            EntityTypeId = entityType.Id,
            EntityId = request.EntityId,
            RaisedBy = _currentUser.UserId,
            AssignedRoleId = role.Id,
            AssignedUserId = request.AssignedUserId,
            QueryText = request.QueryText,
            QueryStatusId = openStatus.Id,
            CreatedByUserId = _currentUser.UserId,
            CreatedAt = now,
        };
        _db.AuditQueries.Add(query);

        if (entityType.Code == EntityTypeCodes.PurchaseRequisition)
        {
            var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == request.EntityId, ct);
            if (pr != null)
            {
                pr.PrStatusId = (await _db.PrStatuses.FirstAsync(s => s.Code == PrStatusCodes.Queried, ct)).Id;
                pr.UpdatedByUserId = _currentUser.UserId;
                pr.UpdatedAt = now;
            }
        }

        await _db.SaveChangesAsync(ct);

        await NotificationWriter.AddAsync(
            _db, NotificationTypeCodes.AuditQuery, entityType.Id, request.EntityId,
            $"Audit raised a query: {request.QueryText}", $"auditquery-{query.Id}", ct, userId: request.AssignedUserId, roleId: request.AssignedUserId == null ? role.Id : null);

        return query.Id;
    }
}

public record RespondAuditQueryCommand(long QueryId, string ResponseText, string ReturnToPrStatusCode) : IRequest;

public class RespondAuditQueryCommandHandler : IRequestHandler<RespondAuditQueryCommand>
{
    private readonly IProcurementDbContext _db;
    private readonly ICurrentUserContext _currentUser;

    public RespondAuditQueryCommandHandler(IProcurementDbContext db, ICurrentUserContext currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task Handle(RespondAuditQueryCommand request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ResponseText))
        {
            throw new BusinessRuleException("A response is required.");
        }

        var query = await _db.AuditQueries.FirstOrDefaultAsync(q => q.Id == request.QueryId, ct)
            ?? throw new NotFoundException("AuditQuery", request.QueryId);
        var now = DateTime.UtcNow;

        query.ResponseText = request.ResponseText;
        query.QueryStatusId = (await _db.QueryStatuses.FirstAsync(s => s.Code == QueryStatusCodes.Responded, ct)).Id;
        query.RespondedAt = now;
        query.UpdatedByUserId = _currentUser.UserId;
        query.UpdatedAt = now;

        var entityType = await _db.EntityTypes.FirstAsync(e => e.Id == query.EntityTypeId, ct);
        if (entityType.Code == EntityTypeCodes.PurchaseRequisition)
        {
            var pr = await _db.PurchaseRequisitions.FirstOrDefaultAsync(p => p.Id == query.EntityId, ct);
            if (pr != null)
            {
                pr.PrStatusId = (await _db.PrStatuses.FirstAsync(s => s.Code == request.ReturnToPrStatusCode, ct)).Id;
                pr.UpdatedByUserId = _currentUser.UserId;
                pr.UpdatedAt = now;
            }
        }

        await _db.SaveChangesAsync(ct);
    }
}

public record ListAuditQueriesQuery(string EntityTypeCode, long EntityId) : IRequest<List<AuditQueryDto>>;

public class ListAuditQueriesQueryHandler : IRequestHandler<ListAuditQueriesQuery, List<AuditQueryDto>>
{
    private readonly IProcurementDbContext _db;
    public ListAuditQueriesQueryHandler(IProcurementDbContext db) => _db = db;

    public async Task<List<AuditQueryDto>> Handle(ListAuditQueriesQuery request, CancellationToken ct)
    {
        var entityType = await _db.EntityTypes.FirstOrDefaultAsync(e => e.Code == request.EntityTypeCode, ct)
            ?? throw new NotFoundException("EntityType", request.EntityTypeCode);
        var queries = await _db.AuditQueries.Where(q => q.EntityTypeId == entityType.Id && q.EntityId == request.EntityId).OrderByDescending(q => q.CreatedAt).ToListAsync(ct);
        var statuses = await _db.QueryStatuses.ToDictionaryAsync(s => s.Id, ct);
        var users = await _db.Users.ToDictionaryAsync(u => u.Id, ct);

        return queries.Select(q => new AuditQueryDto(
            q.Id, entityType.Code, q.EntityId, q.QueryText, q.ResponseText, statuses[q.QueryStatusId].Code,
            q.CreatedAt, q.RespondedAt, users[q.RaisedBy].DisplayName)).ToList();
    }
}
