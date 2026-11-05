export interface GrnLineInput {
  poLineId: number;
  deliveredQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectReason: string | null;
  evidenceDocumentId: number | null;
}

export interface GrnLine {
  poLineId: number;
  itemName: string;
  deliveredQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectReason: string | null;
}

export interface Grn {
  id: number;
  grnNumber: string;
  poId: number;
  poNumber: string;
  receivedOn: string;
  deliveryNoteNo: string;
  onTime: boolean | null;
  qualityRating: number | null;
  ackStatus: string | null;
  disputeReason: string | null;
  lines: GrnLine[];
}
