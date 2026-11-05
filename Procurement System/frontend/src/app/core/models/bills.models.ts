export interface SupplierInvoice {
  id: number;
  invoiceNo: string;
  vendorId: number;
  vendorName: string;
  vendorInvoiceRef: string;
  prId: number;
  poId: number | null;
  invoiceDate: string;
  total: number;
  billStatus: string;
  paidAmount: number;
  isFullyPaid: boolean;
  paidAt: string | null;
  financePortalRef: string | null;
}
