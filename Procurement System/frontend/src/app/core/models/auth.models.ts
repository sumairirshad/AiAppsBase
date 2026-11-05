export interface RoleAssignment {
  roleId: number;
  roleCode: string;
  roleName: string;
  departmentId: number | null;
  departmentCode: string | null;
  departmentName: string | null;
}

export interface CurrentUser {
  id: number;
  employeeNo: string;
  displayName: string;
  email: string;
  departmentId: number;
  departmentCode: string;
  departmentName: string;
  roles: RoleAssignment[];
  permissions: string[];
}

export interface LoginResult {
  token: string;
  user: CurrentUser;
}
