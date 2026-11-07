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

export interface QuotationLineDto {
  id: number;
  quotationId: number;
  prLineId: number;
  itemName: string;
  qty: number;
  unitPrice: number;
  tax: number;
  discount: number;
  deliveryDays: number | null;
}

export interface QuotationDto {
  id: number;
  vendorId: number;
  vendorName: string;
  isStarVendor: boolean;
  quotationNo: string;
  quotationDate: string;
  total: number;
  taxTotal: number;
  comparableTotal: number;
  documentId: number;
  lines: QuotationLineDto[];
}

export interface SourcingGroupLineDto {
  id: number;
  itemId: number;
  itemName: string;
  qty: number;
  unitCode: string;
  suggestedVendorId: number | null;
  awardedVendorId: number | null;
}

export interface SourcingGroupDto {
  id: number;
  prId: number;
  groupNo: number;
  groupAmount: number;
  requiredQuotes: number;
  recommendedQuotationId: number | null;
  selectedQuotationId: number | null;
  selectionJustification: string | null;
  lines: SourcingGroupLineDto[];
  quotations: QuotationDto[];
}
