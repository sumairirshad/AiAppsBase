export interface DepartmentDto {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
  isActive: boolean;
}

export interface LocationDto {
  id: number;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export interface CategoryDto {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
}

export interface ItemDto {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  unitId: number;
  unitCode: string;
}

export interface UnitDto {
  id: number;
  code: string;
  name: string;
}

export interface ProjectDto {
  id: number;
  projectCode: string;
  name: string;
  ownerDepartmentId: number;
  contractProvided: boolean;
}
