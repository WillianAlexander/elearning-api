/**
 * Standard API response envelope.
 * All API responses follow this structure for consistency.
 */

export interface ApiError {
  code: string;
  message: string;
  field?: string;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
  errors: ApiError[];
}

export interface ApiListResponse<T> {
  data: T[];
  meta: ResponseMeta & PaginationMeta;
  errors: ApiError[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
