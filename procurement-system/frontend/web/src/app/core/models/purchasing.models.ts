export interface PoLineDto {
  id: number;
  prLineId: number;
  itemId: number;
  itemName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  acceptedQty: number;
  outstandingQty: number;
}

export interface ContractDto {
  id: number;
  contractTypeCode: string;
  startDate: string | null;
  endDate: string | null;
  generatedDocumentId: number | null;
  signedDocumentId: number | null;
  countryOfOrigin: string | null;
  incoterms: string | null;
  chequeNo: string | null;
  chequeAmount: number | null;
}

export interface PurchaseOrderDto {
  id: number;
  poNumber: string;
  vendorId: number;
  vendorName: string;
  poTypeCode: string;
  poStatusCode: string;
  total: number;
  deliveryDate: string;
  paymentTerms: string | null;
  issuedAt: string | null;
  lines: PoLineDto[];
  contract: ContractDto | null;
}
