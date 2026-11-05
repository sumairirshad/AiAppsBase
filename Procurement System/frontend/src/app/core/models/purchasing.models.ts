export interface PoLineInput {
  prLineId: number;
  qty: number;
  unitPrice: number;
}

export interface CreatePoInput {
  vendorId: number;
  lines: PoLineInput[];
  deliveryDate: string;
  paymentTerms: string | null;
  advanceTypeCode: 'None' | 'Percent' | 'Amount';
  advancePct: number | null;
  advanceAmount: number | null;
  retentionPct: number | null;
}

export interface PoLine {
  id: number;
  prLineId: number;
  itemName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  acceptedQty: number;
  outstandingQty: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  vendorId: number;
  vendorName: string;
  poTypeCode: string;
  poStatusCode: string;
  total: number;
  deliveryDate: string;
  advanceAmount: number;
  advancePaid: number;
  hasSignedContract: boolean;
  hasCheque: boolean;
  lines: PoLine[];
}
