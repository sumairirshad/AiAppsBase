namespace Procurement.Application.Features.Purchasing;

public record PoLineInput(long PrLineId, decimal Qty, decimal UnitPrice);

public record CreatePoInput(
    long VendorId, List<PoLineInput> Lines, DateOnly DeliveryDate, string? PaymentTerms,
    string AdvanceTypeCode, decimal? AdvancePct, decimal? AdvanceAmount, decimal? RetentionPct);

public record PoLineDto(long Id, long PrLineId, string ItemName, decimal Qty, decimal UnitPrice, decimal LineTotal, decimal AcceptedQty, decimal OutstandingQty);

public record PurchaseOrderDto(
    long Id, string PoNumber, long VendorId, string VendorName, string PoTypeCode, string PoStatusCode,
    decimal Total, DateOnly DeliveryDate, decimal AdvanceAmount, decimal AdvancePaid,
    bool HasSignedContract, bool HasCheque, List<PoLineDto> Lines);
