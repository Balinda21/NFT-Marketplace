// User role enum
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}

// Base entity interface
export interface BaseEntity {
  id: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
