export interface SourcingGroup {
  id: number;
  groupNo: number;
  categoryId: number | null;
  categoryName: string | null;
  groupAmount: number;
  requiredQuotes: number;
  distinctVendorQuotes: number;
  recommendedQuotationId: number | null;
  selectedQuotationId: number | null;
  selectionJustification: string | null;
  prLineIds: number[];
}

export interface QuotationLineInput {
  prLineId: number;
  qty: number;
  unitPrice: number;
  tax: number;
  discount: number;
  deliveryDays: number | null;
}

export interface Quotation {
  id: number;
  vendorId: number;
  vendorName: string;
  quotationNo: string;
  quotationDate: string;
  total: number;
  taxTotal: number;
  comparableTotal: number;
  isRecommended: boolean;
}
