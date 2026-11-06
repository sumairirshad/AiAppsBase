using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Procurement.Application.Sourcing;
using Procurement.Domain.Entities;
using Procurement.Infrastructure.Persistence;

namespace Procurement.Application.Tests.Sourcing;

// Exercises the exact rule set from Infrastructure/Persistence/Seed/PolicySeeder.cs against
// the boundary cases the business requirements test-case register calls out explicitly
// (TC-049..055): 250,000 is inclusive in the 3-quote band, not the 1-quote band; emergency
// always wins; star vs new/non-star vendors differ below the threshold.
public class QuotationRuleResolverTests
{
    private async Task<(ProcurementDbContext Db, QuotationRuleResolver Resolver, long PolicyVersionId)> BuildAsync()
    {
        var options = new DbContextOptionsBuilder<ProcurementDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var db = new ProcurementDbContext(options);
        db.Users.Add(new Users { Id = 1, EmployeeNo = "E1", DisplayName = "x", Email = "x@x", DepartmentId = 1, CreatedBy = 1 });
        db.PolicyVersions.Add(new PolicyVersions { VersionNo = 1, EffectiveFrom = DateOnly.FromDateTime(DateTime.UtcNow), StatusId = 1, ChangeReason = "t", CreatedBy = 1 });
        await db.SaveChangesAsync();
        var policyVersionId = db.PolicyVersions.Single().Id;

        db.QuotationRules.AddRange(
            new QuotationRules { PolicyVersionId = policyVersionId, Emergency = true, RequiredQuotes = 0, Priority = 10, Description = "emergency", CreatedBy = 1 },
            new QuotationRules { PolicyVersionId = policyVersionId, MinAmount = 250_000, RequiredQuotes = 3, Priority = 20, Description = "threshold", CreatedBy = 1 },
            new QuotationRules { PolicyVersionId = policyVersionId, MaxAmount = 250_000, StarVendor = true, RequiredQuotes = 1, Priority = 30, Description = "star", CreatedBy = 1 },
            new QuotationRules { PolicyVersionId = policyVersionId, MaxAmount = 250_000, StarVendor = false, RequiredQuotes = 3, Priority = 40, Description = "notstar", CreatedBy = 1 },
            new QuotationRules { PolicyVersionId = policyVersionId, RequiredQuotes = 1, Priority = 50, Description = "recurring items", CreatedBy = 1 },
            new QuotationRules { PolicyVersionId = policyVersionId, RequiredQuotes = 0, Priority = 60, Description = "bills", CreatedBy = 1 }
        );
        await db.SaveChangesAsync();

        return (db, new QuotationRuleResolver(db), policyVersionId);
    }

    [Fact]
    public async Task Emergency_always_needs_zero_quotes_regardless_of_amount_or_star()
    {
        var (db, resolver, policyVersionId) = await BuildAsync();
        var result = await resolver.ResolveAsync(policyVersionId, 10_000_000, isStarVendorKnown: true, isStarVendor: false, isEmergency: true, isRecurringItemsVerification: false);
        result.RequiredQuotes.Should().Be(0);
    }

    [Theory]
    [InlineData(249_999, 3)] // just below the threshold with a non-star vendor still needs 3
    [InlineData(250_000, 3)] // inclusive: exactly 250,000 is already in the 3-quote band
    [InlineData(250_001, 3)]
    public async Task At_or_above_threshold_needs_three_quotes(decimal amount, byte expected)
    {
        var (db, resolver, policyVersionId) = await BuildAsync();
        var result = await resolver.ResolveAsync(policyVersionId, amount, isStarVendorKnown: false, isStarVendor: null, isEmergency: false, isRecurringItemsVerification: false);
        result.RequiredQuotes.Should().Be(expected);
    }

    [Fact]
    public async Task Below_threshold_star_vendor_needs_one_quote()
    {
        var (db, resolver, policyVersionId) = await BuildAsync();
        var result = await resolver.ResolveAsync(policyVersionId, 100_000, isStarVendorKnown: true, isStarVendor: true, isEmergency: false, isRecurringItemsVerification: false);
        result.RequiredQuotes.Should().Be(1);
    }

    [Fact]
    public async Task Below_threshold_non_star_or_new_vendor_needs_three_quotes()
    {
        var (db, resolver, policyVersionId) = await BuildAsync();
        var result = await resolver.ResolveAsync(policyVersionId, 100_000, isStarVendorKnown: true, isStarVendor: false, isEmergency: false, isRecurringItemsVerification: false);
        result.RequiredQuotes.Should().Be(3);
    }

    [Fact]
    public async Task Recurring_items_verification_needs_exactly_one_quote_regardless_of_amount()
    {
        var (db, resolver, policyVersionId) = await BuildAsync();
        var result = await resolver.ResolveAsync(policyVersionId, 5_000_000, isStarVendorKnown: false, isStarVendor: null, isEmergency: false, isRecurringItemsVerification: true);
        result.RequiredQuotes.Should().Be(1);
    }
}
