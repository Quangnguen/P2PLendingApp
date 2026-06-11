import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storage } from '../utils/storage';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

// Callback được set từ AppNavigator để tránh circular dependency
// store → authSlice → authApi → client → store
let _onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  _onUnauthorized = handler;
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
});

// Request interceptor - đính kèm access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xử lý 401: xóa token và về màn login
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
      _onUnauthorized?.(); // dispatch(resetAuth()) → AppNavigator tự chuyển về Auth stack
    }
    return Promise.reject(error);
  }
);

export default apiClient;
