namespace Procurement.Domain.Entities;

public class PoLines
{
    public long Id { get; set; }
    public long PoId { get; set; }
    public long PrLineId { get; set; }
    public long? QuotationLineId { get; set; }
    public decimal Qty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public decimal AcceptedQty { get; set; }
    public decimal OutstandingQty { get; set; }
}
