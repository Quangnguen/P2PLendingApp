import apiClient from './client';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId?: string;
  metadata?: {
    loanId?: string;
    transactionHash?: string;
    role?: 'borrower' | 'lender';
    screen?: string;
    [key: string]: any;
  };
  createdAt: string;
}

// Backend returns { notifications, unreadCount } directly (no ApiResponse wrapper)
export interface NotificationsPayload {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationApi = {
  getMyNotifications: async (limit = 20, skip = 0): Promise<NotificationsPayload> => {
    const res = await apiClient.get<NotificationsPayload>(`/notifications?limit=${limit}&skip=${skip}`);
    return res.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return res.data.count;
  },

  markAsRead: async (id: string) => {
    const res = await apiClient.put<{ success: boolean }>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async () => {
    const res = await apiClient.put<{ success: boolean }>('/notifications/read-all');
    return res.data;
  },

  deleteNotification: async (id: string) => {
    const res = await apiClient.delete<{ success: boolean }>(`/notifications/${id}`);
    return res.data;
  },

  // FCM device token
  registerDeviceToken: async (token: string, platform: 'ANDROID' | 'IOS' | 'WEB', deviceId?: string) => {
    const res = await apiClient.post<{ success: boolean }>('/notifications/device-token', {
      token, platform, deviceId,
    });
    return res.data;
  },

  removeDeviceToken: async (token: string) => {
    const res = await apiClient.delete<{ success: boolean }>(`/notifications/device-token/${encodeURIComponent(token)}`);
    return res.data;
  },
};

export default notificationApi;
