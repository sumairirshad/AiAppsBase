export interface Vendor {
  id: number;
  vendorCode: string;
  legalName: string;
  ntn: string;
  strn: string | null;
  vendorStatus: string;
  hasDeliveryHistory: boolean;
  isStarVendor: boolean;
  overallScore: number | null;
  isBlacklisted: boolean;
  categoryCodes: string[];
}

export interface VendorRegistrationRequest {
  id: number;
  requestNo: string;
  legalName: string;
  ntn: string;
  status: string;
  createdAt: string;
  proposedByUserId: number;
  proposedByUserName: string;
  categoryIds: number[];
  procurementReason: string | null;
  procurementHodReason: string | null;
  createdVendorId: number | null;
}

export interface RegisterVendorRequest {
  legalName: string;
  ntn: string;
  strn: string | null;
  address: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  bankName: string;
  accountTitle: string;
  accountNo: string;
  categoryIds: number[];
}
