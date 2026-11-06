using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Common.Interfaces;

namespace Procurement.Application.Common;

// Lookup tables (statuses, types) are near-static reference data maintained by OPD/SysAdmin,
// not hot application state, so caching Code -> Id for the life of this scope is safe and
// saves repeated round trips within a single request/handler chain. The cache is scoped to
// this instance (registered AddScoped, same lifetime as IApplicationDbContext) rather than
// static: a static cache would leak Ids across independently-seeded databases (e.g. every
// InMemory provider instance used by tests assigns its own Ids starting from 1), and would
// never see an OPD admin edit to a lookup table without an explicit invalidation call. Scoping
// it per-request means a fresh cache every time and both problems disappear for free.
public class LookupCache
{
    private readonly IApplicationDbContext _db;
    private readonly ConcurrentDictionary<(Type, string), object> Cache = new();

    public LookupCache(IApplicationDbContext db) => _db = db;

    public async Task<TId> IdAsync<T, TId>(string code, CancellationToken ct = default) where T : class where TId : struct
    {
        if (Cache.TryGetValue((typeof(T), code), out var cached)) return (TId)cached;

        var all = await _db.Set<T>().ToListAsync(ct);
        var codeProp = typeof(T).GetProperty("Code") ?? throw new InvalidOperationException($"{typeof(T).Name} has no Code property.");
        var idProp = typeof(T).GetProperty("Id") ?? throw new InvalidOperationException($"{typeof(T).Name} has no Id property.");

        foreach (var row in all)
        {
            var rowCode = (string?)codeProp.GetValue(row);
            if (rowCode is null) continue;
            var id = (TId)Convert.ChangeType(idProp.GetValue(row), typeof(TId))!;
            Cache[(typeof(T), rowCode)] = id;
        }

        if (Cache.TryGetValue((typeof(T), code), out var found)) return (TId)found;
        throw new InvalidOperationException($"Lookup {typeof(T).Name} has no row with Code '{code}'.");
    }
}
