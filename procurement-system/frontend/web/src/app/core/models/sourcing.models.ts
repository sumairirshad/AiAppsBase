export interface QuotationLineInput {
  prLineId: number;
  qty: number;
  unitPrice: number;
  tax: number;
  discount: number;
}

export interface AddQuotationRequest {
  vendorId: number;
  quotationNo: string;
  quotationDate: string;
  taxTotal: number;
  documentId: number;
  lines: QuotationLineInput[];
}

export interface SelectQuoteRequest {
  quotationId: number;
  justification?: string | null;
}
