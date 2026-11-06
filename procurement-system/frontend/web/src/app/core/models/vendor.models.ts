export interface VendorContactData {
  name: string;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
}

export interface VendorRegistrationData {
  legalName: string;
  ntn: string;
  strn?: string | null;
  categoryIds: number[];
  bankName: string;
  accountTitle: string;
  accountNo: string;
  contacts: VendorContactData[];
}

export interface VendorDto {
  id: number;
  vendorCode: string;
  legalName: string;
  statusCode: string;
  isStarVendor: boolean;
  overallScore: number | null;
  blacklistReason: string | null;
}

export interface VendorSuggestionDto {
  vendorId: number;
  legalName: string;
  isStarVendor: boolean;
  overallScore: number | null;
  rank: number;
}

export interface PendingVendorRegistrationDto {
  id: number;
  requestNo: string;
  legalName: string;
  statusCode: string;
  createdAt: string;
  proposedByUserId: number;
}
