export interface PrLineInput {
  itemId: number;
  description: string | null;
  qty: number;
  unitId: number;
  estUnitPrice: number;
  locationId: number;
}

export interface PrLine {
  id: number;
  lineNo: number;
  itemId: number;
  itemName: string;
  description: string | null;
  qty: number;
  unitCode: string;
  estUnitPrice: number;
  lineTotal: number;
  locationId: number;
  locationName: string;
  suggestedVendorId: number | null;
  awardedVendorId: number | null;
  acceptedQty: number;
}

export interface PrTimelineEntry {
  actedAt: string;
  actorName: string;
  roleName: string;
  action: string;
  fromStage: string | null;
  toStage: string | null;
  remarks: string | null;
}

export interface Pr {
  id: number;
  prNumber: string;
  requesterId: number;
  requesterName: string;
  departmentId: number;
  departmentName: string;
  locationId: number;
  locationName: string;
  spendSubHeadCode: string;
  spendSubHeadName: string;
  costTypeCode: string;
  isEmergency: boolean;
  emergencyJustification: string | null;
  title: string;
  estimatedAmount: number;
  approvedAmount: number | null;
  finalAmount: number | null;
  prStatusCode: string;
  prStatusName: string;
  createdAt: string;
  submittedAt: string | null;
  closedAt: string | null;
  raisedOnBehalf: boolean;
  lines: PrLine[];
  billingPeriod: string | null;
  billAmount: number | null;
  purpose: string | null;
  dueDate: string | null;
  currentStageCode: string | null;
  currentStageRoleCode: string | null;
  workflowInstanceId: number | null;
}

export interface PrListItem {
  id: number;
  prNumber: string;
  requesterName: string;
  departmentName: string;
  spendSubHeadName: string;
  title: string;
  estimatedAmount: number;
  prStatusCode: string;
  prStatusName: string;
  createdAt: string;
  currentStageCode: string | null;
}

export interface CreatePrRequest {
  departmentId: number;
  locationId: number;
  spendSubHeadId: number;
  projectId: number | null;
  isTentative: boolean;
  isEmergency: boolean;
  emergencyJustification: string | null;
  title: string;
  lines: PrLineInput[] | null;
  billingPeriod: string | null;
  billAmount: number | null;
  purpose: string | null;
  dueDate: string | null;
  billDocumentId: number | null;
}
