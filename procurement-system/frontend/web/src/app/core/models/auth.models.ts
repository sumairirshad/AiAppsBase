export interface RoleAssignmentDto {
  roleCode: string;
  departmentId: number | null;
  departmentCode: string | null;
}

export interface LoginResult {
  token: string;
  expiresAtUtc: string;
  userId: number;
  displayName: string;
  roles: RoleAssignmentDto[];
}

export interface MeResult {
  id: number;
  displayName: string;
  email: string;
  departmentId: number;
  roles: RoleAssignmentDto[];
}

export const ROLE_CODES = ['REQUESTOR', 'HOD', 'PROCUREMENT', 'FINANCE', 'AUDIT', 'OPD', 'SYSADMIN'] as const;
export type RoleCode = (typeof ROLE_CODES)[number];
