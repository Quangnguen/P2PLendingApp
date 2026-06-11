import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_BASE_URL } from '../utils/constants';

// Socket server URL: thay localhost bằng IP backend
const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');

export type SocketNotification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  referenceId?: string;
  createdAt: string;
};

type UseSocketOptions = {
  onNewNotification?: (notification: SocketNotification) => void;
  onUnreadCount?: (count: number) => void;
};

export function useSocket({ onNewNotification, onUnreadCount }: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(async () => {
    // Nếu đã kết nối thì thôi
    if (socketRef.current?.connected) return;

    const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) return;

    const socket = io(`${SOCKET_URL}/notifications`, {
      transports: ['websocket'],
      auth: { token: `Bearer ${token}` },
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socket.on('notification:new', (data: SocketNotification) => {
      console.log('[Socket] New notification:', data.title);
      onNewNotification?.(data);
    });

    socket.on('notification:unread_count', ({ count }: { count: number }) => {
      onUnreadCount?.(count);
    });

    socketRef.current = socket;
  }, [onNewNotification, onUnreadCount]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, []);

  return { connect, disconnect, socket: socketRef };
}
