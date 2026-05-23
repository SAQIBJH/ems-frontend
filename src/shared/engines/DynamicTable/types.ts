import type { ColumnDef } from '@tanstack/react-table';
import type React from 'react';

export interface DynamicTablePagination {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}

export interface DynamicTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  pagination?: DynamicTablePagination;
  onPageChange?: (page: number) => void;
  rowLabel?: string;
  loadingRows?: number;
  loadingCols?: number;
  className?: string;
}
