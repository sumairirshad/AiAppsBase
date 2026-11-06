using FluentAssertions;
using Procurement.Application.Requisitions;

namespace Procurement.Application.Tests.Requisitions;

public class CreatePrValidatorTests
{
    private static CreatePrCommand BaseCommand(List<PrLineInput>? lines = null, PrBillInput? bill = null, bool emergency = false, string? justification = null) =>
        new(1, 1, 1, "APR-FAULT", null, "Final", emergency, justification, "Test PR", lines ?? new List<PrLineInput>(), bill);

    [Fact]
    public void Requires_either_a_bill_or_at_least_one_line()
    {
        var validator = new CreatePrValidator();
        var result = validator.Validate(BaseCommand());
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Passes_with_at_least_one_line()
    {
        var validator = new CreatePrValidator();
        var command = BaseCommand(new List<PrLineInput> { new(1, 1, 1, 100, null, null) });
        validator.Validate(command).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Passes_with_a_bill_and_no_lines()
    {
        var validator = new CreatePrValidator();
        var command = BaseCommand(bill: new PrBillInput("2026-01", 1000, "Electricity", DateOnly.FromDateTime(DateTime.UtcNow), 1, 1));
        validator.Validate(command).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Emergency_flag_requires_a_justification()
    {
        var validator = new CreatePrValidator();
        var command = BaseCommand(new List<PrLineInput> { new(1, 1, 1, 100, null, null) }, emergency: true, justification: null);
        validator.Validate(command).IsValid.Should().BeFalse();
    }

    [Fact]
    public void Emergency_flag_with_justification_passes()
    {
        var validator = new CreatePrValidator();
        var command = BaseCommand(new List<PrLineInput> { new(1, 1, 1, 100, null, null) }, emergency: true, justification: "AC down in server room.");
        validator.Validate(command).IsValid.Should().BeTrue();
    }

    [Fact]
    public void Negative_quantity_is_rejected()
    {
        var validator = new CreatePrValidator();
        var command = BaseCommand(new List<PrLineInput> { new(1, -1, 1, 100, null, null) });
        validator.Validate(command).IsValid.Should().BeFalse();
    }
}
