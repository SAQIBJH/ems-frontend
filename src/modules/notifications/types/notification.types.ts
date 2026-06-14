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
  // Timesheet reminders (lowercase) — created by the backend scheduled job.
  | 'timesheet_submit_reminder'
  | 'timesheet_approval_reminder'
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
  /**
   * Some notification sources (e.g. timesheet reminders) send `message` instead of
   * `body` and carry structured `metadata` (e.g. `weekStart` for deep-linking).
   * Optional + defensive: the live shape is unverified for cron-gated reminders.
   */
  message?: string;
  metadata?: Record<string, unknown> | null;
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
