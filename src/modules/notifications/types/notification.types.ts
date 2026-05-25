export type NotificationType =
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'LEAVE_REQUESTED'
  | 'ATTENDANCE_REGULARIZATION_REQUESTED'
  | 'ATTENDANCE_REGULARIZATION_APPROVED'
  | 'ATTENDANCE_REGULARIZATION_DENIED'
  | 'EMPLOYEE_CREATED'
  | 'DOCUMENT_UPLOADED'
  | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  actionUrl: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
