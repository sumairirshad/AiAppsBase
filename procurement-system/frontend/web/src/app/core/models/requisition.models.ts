export interface PrLineInput {
  itemId: number;
  qty: number;
  unitId: number;
  estUnitPrice: number;
  description?: string | null;
  suggestedVendorId?: number | null;
}

export interface PrBillInput {
  billingPeriod: string;
  billAmount: number;
  purpose: string;
  dueDate: string;
  billDocumentId: number;
  payeeVendorId: number;
}

export interface CreatePrRequest {
  departmentId: number;
  locationId: number;
  spendSubHeadCode: string;
  projectId?: number | null;
  costTypeCode: string;
  isEmergency: boolean;
  emergencyJustification?: string | null;
  title: string;
  lines: PrLineInput[];
  bill?: PrBillInput | null;
}

export interface SubmitPrResult {
  prStatus: string;
  nextRole: string | null;
}

export interface PrListItemDto {
  id: number;
  prNumber: string;
  title: string;
  estimatedAmount: number;
  statusCode: string;
  departmentCode: string;
  submittedAt: string | null;
  isEmergency: boolean;
}

export interface PrLineDto {
  id: number;
  itemId: number;
  itemName: string;
  qty: number;
  unitCode: string;
  estUnitPrice: number;
  lineTotal: number;
  marketPriceAtRequest: number | null;
  lastPaidPriceAtRequest: number | null;
  priceWarningPct: number | null;
  suggestedVendorId: number | null;
  awardedVendorId: number | null;
  overrideReason: string | null;
}

export interface PrDetailDto {
  id: number;
  prNumber: string;
  title: string;
  statusCode: string;
  estimatedAmount: number;
  departmentId: number;
  requesterId: number;
  isEmergency: boolean;
  lines: PrLineDto[];
  allowedActions: string[];
}

export const PR_ACTIONS = {
  Approve: 'Approve',
  Return: 'Return',
  Reject: 'Reject',
  Query: 'Query',
  Refer: 'Refer',
  Complete: 'Complete',
} as const;
