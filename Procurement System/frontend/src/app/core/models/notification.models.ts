export interface AppNotification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  notificationTypeCode: string;
  entityTypeId: number;
  entityId: number;
}
