export type AssetType = 'Laptop' | 'Monitor' | 'Phone' | 'Other';

export type AssetStatus = 'Assigned' | 'Available' | 'Repair' | 'Retired';

export type RequestStatus = 'Pending' | 'Approved' | 'Fulfilled' | 'Declined';

export interface AssetEmployee {
  employeeId: string;
  name: string;
}

export interface AssetsSummary {
  totalAssets: number;
  assigned: number;
  available: number;
  inRepair: number;
  utilizationPct: number;
  avgRepairDays: number;
}

export interface AssignedTo {
  employeeId: string;
  name: string;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  assignedTo: AssignedTo | null;
  assignedSince: string | null;
  createdAt: string;
}

export interface AssetsPage {
  assets: Asset[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AssetRequest {
  id: string;
  requestedBy: { employeeId: string; name: string };
  item: string;
  reason: string;
  requestedAt: string;
  status: RequestStatus;
}

export interface RequestsPage {
  requests: AssetRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AddAssetInput {
  tag: string;
  name: string;
  type: AssetType;
  assignedTo?: { employeeId: string; name: string };
  assignedSince?: string;
}

export interface AssignAssetInput {
  employeeId: string;
  name: string;
  since: string;
}

export interface AssetsParams {
  type?: AssetType;
  status?: AssetStatus;
  page?: number;
  limit?: number;
}

export interface RequestsParams {
  status?: RequestStatus;
  page?: number;
  limit?: number;
}
