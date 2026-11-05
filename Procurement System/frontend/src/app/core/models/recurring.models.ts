export interface RecurringPlanLineInput {
  itemId: number;
  qty: number;
  unitId: number;
  agreedPrice: number | null;
}

export interface CreateRecurringPlanRequest {
  recurringPlanTypeCode: 'Bill' | 'Items';
  spendSubHeadId: number;
  departmentId: number;
  locationId: number;
  ownerUserId: number;
  frequencyCode: string;
  generationDay: number;
  dueOffsetDays: number;
  startDate: string;
  endDate: string | null;
  vendorId: number | null;
  fixedAmount: number | null;
  lines: RecurringPlanLineInput[] | null;
}

export interface RecurringPlan {
  id: number;
  planNo: string;
  recurringPlanTypeCode: string;
  spendSubHeadName: string;
  departmentName: string;
  ownerName: string;
  frequencyCode: string;
  startDate: string;
  endDate: string | null;
  statusCode: string;
  fixedAmount: number | null;
}
