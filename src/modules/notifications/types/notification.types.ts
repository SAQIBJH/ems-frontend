// Live notification types from API_MAPPING.md (2026-05-25 shape — uppercase)
export type NotificationType =
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_WITHDRAWN'
  | 'ATTENDANCE_CHECK_IN'
  | 'ATTENDANCE_CHECK_OUT'
  | 'REGULARIZATION_REQUESTED'
  | 'REGULARIZATION_APPROVED'
  | 'REGULARIZATION_DENIED'
  | 'EMPLOYEE_CREATED'
  | 'DOCUMENT_UPLOADED'
  | 'SYSTEM'
  // fallback for any future types
  | string;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  /** Body text of the notification */
  body: string;
  entityType: string;
  entityId: string;
  actionUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  /** Total unread count for the current user — comes directly in the list response */
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
