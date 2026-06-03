import type { AssetStatus, AssetType, RequestStatus } from '../types/assets.types';

export const ASSET_STATUS_CONFIG: Record<
  AssetStatus,
  { variant: 'info' | 'success' | 'warning' | 'secondary' }
> = {
  Assigned: { variant: 'info' },
  Available: { variant: 'success' },
  Repair: { variant: 'warning' },
  Retired: { variant: 'secondary' },
};

export const REQUEST_STATUS_CONFIG: Record<
  RequestStatus,
  { variant: 'warning' | 'info' | 'success' | 'danger' | 'secondary' }
> = {
  Pending: { variant: 'warning' },
  Approved: { variant: 'info' },
  Fulfilled: { variant: 'success' },
  Declined: { variant: 'danger' },
};

export const ASSET_TYPES: Array<'All types' | AssetType> = [
  'All types',
  'Laptop',
  'Monitor',
  'Phone',
  'Other',
];

export const ASSET_STATUSES: Array<'All statuses' | AssetStatus> = [
  'All statuses',
  'Assigned',
  'Available',
  'Repair',
  'Retired',
];

export const REQUEST_STATUSES: Array<'All statuses' | RequestStatus> = [
  'All statuses',
  'Pending',
  'Approved',
  'Fulfilled',
  'Declined',
];

export const ASSET_TYPE_ICON: Record<AssetType, string> = {
  Laptop: 'LaptopIcon',
  Monitor: 'MonitorIcon',
  Phone: 'SmartphoneIcon',
  Other: 'BoxIcon',
};
