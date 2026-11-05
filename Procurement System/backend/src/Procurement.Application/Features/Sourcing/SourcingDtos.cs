namespace Procurement.Application.Features.Sourcing;

public record SourcingGroupDto(
    long Id, int GroupNo, long? CategoryId, string? CategoryName, decimal GroupAmount, byte RequiredQuotes,
    int DistinctVendorQuotes, long? RecommendedQuotationId, long? SelectedQuotationId, string? SelectionJustification,
    List<long> PrLineIds);

public record QuotationLineInput(long PrLineId, decimal Qty, decimal UnitPrice, decimal Tax, decimal Discount, int? DeliveryDays);

public record QuotationDto(
    long Id, long VendorId, string VendorName, string QuotationNo, DateOnly QuotationDate, decimal Total,
    decimal TaxTotal, decimal ComparableTotal, bool IsRecommended);
