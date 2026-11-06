export interface ApprovalBandDto {
  id: number;
  minAmount: number;
  maxAmount: number | null;
  sequence: number;
  roleCode: string;
  spendSubHeadId: number | null;
}

export interface QuotationRuleDto {
  id: number;
  spendSubHeadId: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  starVendor: boolean | null;
  emergency: boolean | null;
  requiredQuotes: number;
  priority: number;
  description: string;
}

export interface PolicySettingDto {
  key: string;
  valueType: string;
  value: string;
  description: string;
}

export interface CurrentPolicyDto {
  policyVersionId: number;
  versionNo: number;
  effectiveFrom: string;
  bands: ApprovalBandDto[];
  quotationRules: QuotationRuleDto[];
  settings: PolicySettingDto[];
}
