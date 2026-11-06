namespace Procurement.Application.Requisitions;

public record PrLineInput(long ItemId, decimal Qty, long UnitId, decimal EstUnitPrice, string? Description, long? SuggestedVendorId);
