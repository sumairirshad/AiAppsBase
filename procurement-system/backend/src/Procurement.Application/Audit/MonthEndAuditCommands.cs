using MediatR;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common;
using Procurement.Application.Common.Interfaces;
using Procurement.Domain.Entities;

namespace Procurement.Application.Audit;

// BR-044: the month-end expense audit runs over PRs already pre-audited at the stamp step -
// it is a checklist, not a second approval.
public record StartMonthEndAuditCommand(long ActorUserId, string Period) : IRequest<long>;

public class StartMonthEndAuditHandler : IRequestHandler<StartMonthEndAuditCommand, long>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public StartMonthEndAuditHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task<long> Handle(StartMonthEndAuditCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "AUDIT.MONTHEND", ct);
        var existing = await _db.Set<MonthEndAudits>().FirstOrDefaultAsync(m => m.Period == request.Period, ct);
        if (existing is not null) return existing.Id;

        var openStatus = await _lookups.IdAsync<MonthEndAuditStatuses, short>("Open", ct);
        var audit = new MonthEndAudits { Period = request.Period, StatusId = openStatus, StartedBy = request.ActorUserId, CreatedBy = request.ActorUserId };
        _db.Set<MonthEndAudits>().Add(audit);
        await _db.SaveChangesAsync(ct);

        var (from, to) = ParsePeriod(request.Period);
        var stamps = await _db.Set<AuditStamps>().Where(s => s.StampedAt >= from && s.StampedAt < to).ToListAsync(ct);
        foreach (var stamp in stamps)
        {
            var bills = await _db.Set<SupplierInvoices>().Where(i => i.PrId == stamp.PrId).ToListAsync(ct);
            _db.Set<MonthEndAuditItems>().Add(new MonthEndAuditItems
            {
                MonthEndAuditId = audit.Id,
                PrId = stamp.PrId,
                BillId = bills.FirstOrDefault()?.Id,
                WasPreAudited = true,
            });
        }
        await _db.SaveChangesAsync(ct);
        return audit.Id;
    }

    private static (DateTime From, DateTime To) ParsePeriod(string period)
    {
        var parts = period.Split('-');
        var from = new DateTime(int.Parse(parts[0]), int.Parse(parts[1]), 1, 0, 0, 0, DateTimeKind.Utc);
        return (from, from.AddMonths(1));
    }
}

public record CompleteMonthEndAuditCommand(long ActorUserId, long MonthEndAuditId, string? Summary) : IRequest;

public class CompleteMonthEndAuditHandler : IRequestHandler<CompleteMonthEndAuditCommand>
{
    private readonly IApplicationDbContext _db;
    private readonly IPermissionChecker _permissions;
    private readonly LookupCache _lookups;

    public CompleteMonthEndAuditHandler(IApplicationDbContext db, IPermissionChecker permissions, LookupCache lookups)
    {
        _db = db;
        _permissions = permissions;
        _lookups = lookups;
    }

    public async Task Handle(CompleteMonthEndAuditCommand request, CancellationToken ct)
    {
        await _permissions.RequireAsync(request.ActorUserId, "AUDIT.MONTHEND", ct);
        var audit = await _db.Set<MonthEndAudits>().FirstOrDefaultAsync(m => m.Id == request.MonthEndAuditId, ct)
            ?? throw new InvalidOperationException("Month-end audit not found.");
        audit.StatusId = await _lookups.IdAsync<MonthEndAuditStatuses, short>("Completed", ct);
        audit.CompletedBy = request.ActorUserId;
        audit.CompletedAt = DateTime.UtcNow;
        audit.Summary = request.Summary;
        audit.UpdatedBy = request.ActorUserId;
        audit.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}
