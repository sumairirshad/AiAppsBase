namespace Procurement.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    // The JWT carries only the user id (per the architecture spec's Identity layer) - every
    // later authorization check re-reads roles/permissions/department access from the
    // database on each request, it never trusts a claim for that.
    (string Token, DateTime ExpiresAtUtc) Generate(long userId);
}
