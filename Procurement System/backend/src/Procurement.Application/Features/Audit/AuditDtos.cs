namespace Procurement.Application.Features.Audit;

public record AuditQueryDto(long Id, string EntityTypeCode, long EntityId, string QueryText, string? ResponseText, string QueryStatusCode, DateTime CreatedAt, DateTime? RespondedAt, string RaisedByName);

public record AuditStampDto(long Id, long PrId, bool PaymentVerified, bool DeliveryVerified, DateTime StampedAt, string StampedByName, string? Remarks);
