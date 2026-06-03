// Types
export type {
  AssetType,
  AssetStatus,
  RequestStatus,
  AssetEmployee,
  AssetsSummary,
  AssignedTo,
  Asset,
  AssetsPage,
  AssetRequest,
  RequestsPage,
  AddAssetInput,
  AssignAssetInput,
  AssetsParams,
  RequestsParams,
} from './types/assets.types';

// Services
export { assetsApi } from './services/assets.api';

// Hooks
export {
  useAssetsSummary,
  useAssetEmployees,
  useAssets,
  useAssetRequests,
  useUpdateAssetStatus,
  useAssignAsset,
  useRecallAsset,
  useApproveRequest,
  useDeclineRequest,
  useAddAsset,
  ASSETS_KEYS,
} from './hooks/useAssets';

// Constants
export {
  ASSET_STATUS_CONFIG,
  REQUEST_STATUS_CONFIG,
  ASSET_TYPES,
  ASSET_STATUSES,
  REQUEST_STATUSES,
} from './constants';

// Validations
export { addAssetSchema } from './validations/add-asset.schema';
export type { AddAssetFormValues } from './validations/add-asset.schema';

// Components
export { AssetsScreen } from './components/AssetsScreen';
