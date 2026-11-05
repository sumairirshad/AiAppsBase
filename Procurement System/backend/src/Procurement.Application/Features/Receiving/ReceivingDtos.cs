namespace Procurement.Application.Features.Receiving;

public record GrnLineInput(long PoLineId, decimal DeliveredQty, decimal AcceptedQty, decimal RejectedQty, string? RejectReason, long? EvidenceDocumentId);

public record GrnLineDto(long PoLineId, string ItemName, decimal DeliveredQty, decimal AcceptedQty, decimal RejectedQty, string? RejectReason);

public record GrnDto(
    long Id, string GrnNumber, long PoId, string PoNumber, DateOnly ReceivedOn, string DeliveryNoteNo,
    bool? OnTime, byte? QualityRating, string? AckStatus, string? DisputeReason, List<GrnLineDto> Lines);
