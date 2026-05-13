import apiClient from './client';
import { ApiResponse } from '../types/auth.types';

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'LOAN' | 'SYSTEM' | 'TRANSACTION';
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}

export const notificationApi = {
  getMyNotifications: async (limit = 20, skip = 0) => {
    const response = await apiClient.get<ApiResponse<{ notifications: NotificationItem[], unreadCount: number }>>(
      `/notifications?limit=${limit}&skip=${skip}`
    );
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await apiClient.put<ApiResponse<any>>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.put<ApiResponse<any>>('/notifications/read-all');
    return response.data;
  },
};

export default notificationApi;
