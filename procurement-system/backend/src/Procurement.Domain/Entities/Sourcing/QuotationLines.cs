namespace Procurement.Domain.Entities;

public class QuotationLines
{
    public long Id { get; set; }
    public long QuotationId { get; set; }
    public long PrLineId { get; set; }
    public decimal Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Tax { get; set; }
    public decimal Discount { get; set; }
    public int? DeliveryDays { get; set; }
}
