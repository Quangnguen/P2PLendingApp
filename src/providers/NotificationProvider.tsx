import React, {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import notificationApi from '../api/notification.api';
import { usePushNotification } from '../hooks/usePushNotification';
import { useAuth } from '../store';

const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  setUnreadCount: () => {},
  refreshUnreadCount: async () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuth();

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {}
  }, []);

  // FCM: chỉ setup khi đã đăng nhập — tránh gọi API trước khi có token
  usePushNotification({
    enabled: isAuthenticated,
    onNotification: () => { refreshUnreadCount(); },
  });

  const connectSocket = useCallback(async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token || socketRef.current?.connected) return;

    const socket = io(`${SOCKET_URL}/notifications`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      refreshUnreadCount();
    });

    socket.on('notification:new', () => {
      setUnreadCount(prev => prev + 1);
    });

    socket.on('notification:unread_count', ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketRef.current = socket;
  }, [refreshUnreadCount]);

  const disconnectSocket = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setUnreadCount(0);
  }, []);

  // Kết nối socket khi đăng nhập, ngắt khi đăng xuất
  useEffect(() => {
    if (isAuthenticated) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => { disconnectSocket(); };
  }, [isAuthenticated]); // connectSocket/disconnectSocket stable — không cần trong deps

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};
