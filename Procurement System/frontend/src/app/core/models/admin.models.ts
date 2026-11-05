export interface Department {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
  parentName: string | null;
  hodUserId: number | null;
  hodUserName: string | null;
  isActive: boolean;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
  isActive: boolean;
}

export interface Item {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unitId: number;
  unitCode: string;
  isActive: boolean;
}

export interface Unit {
  id: number;
  code: string;
  name: string;
  precision: number;
}

export interface DepartmentCategory {
  departmentId: number;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
}

export interface UserSummary {
  id: number;
  employeeNo: string;
  displayName: string;
  email: string;
  departmentId: number;
  departmentName: string;
  isActive: boolean;
  roleCodes: string[];
}

export interface Role {
  id: number;
  code: string;
  name: string;
}

export interface SpendSubHead {
  id: number;
  code: string;
  name: string;
}
