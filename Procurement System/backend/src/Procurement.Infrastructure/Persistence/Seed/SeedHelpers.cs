using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Procurement.Domain.Entities;

namespace Procurement.Infrastructure.Persistence.Seed;

internal static class SeedHelpers
{
    public static string Humanize(string code)
    {
        var withSpaces = Regex.Replace(code, "(?<=[a-z0-9])(?=[A-Z])", " ");
        withSpaces = Regex.Replace(withSpaces, "(?<=[A-Z])(?=[A-Z][a-z])", " ");
        return withSpaces.Replace("-", " ").Replace("_", " ");
    }

    public static async Task SeedLookupAsync<T>(ProcurementDbContext db, DbSet<T> set, IReadOnlyList<string> codes)
        where T : LookupEntity, new()
    {
        if (await set.AnyAsync()) return;
        short sort = 1;
        foreach (var code in codes)
        {
            set.Add(new T { Id = sort, Code = code, Name = Humanize(code), SortOrder = sort, IsActive = true });
            sort++;
        }
        await db.SaveChangesAsync();
    }

    public static async Task SeedTerminalLookupAsync<T>(ProcurementDbContext db, DbSet<T> set, IReadOnlyList<(string Code, bool Terminal)> rows)
        where T : TerminalLookupEntity, new()
    {
        if (await set.AnyAsync()) return;
        short sort = 1;
        foreach (var (code, terminal) in rows)
        {
            set.Add(new T { Id = sort, Code = code, Name = Humanize(code), SortOrder = sort, IsActive = true, IsTerminal = terminal });
            sort++;
        }
        await db.SaveChangesAsync();
    }
}
