import apiClient from './client';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'LOAN' | 'SYSTEM' | 'TRANSACTION';
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}

// Backend returns { notifications: NotificationItem[], unreadCount: number } directly
// (no ApiResponse wrapper — controller does `return service.getMyNotifications(...)`)
export interface NotificationsPayload {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationApi = {
  getMyNotifications: async (limit = 20, skip = 0): Promise<NotificationsPayload> => {
    const response = await apiClient.get<NotificationsPayload>(
      `/notifications?limit=${limit}&skip=${skip}`
    );
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put<{ success: boolean }>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put<{ success: boolean }>('/notifications/read-all');
    return response.data;
  },
};

export default notificationApi;
