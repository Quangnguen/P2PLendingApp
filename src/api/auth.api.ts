import apiClient from './client';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  VerifyOtpRequest,
  VerifyLoginOtpRequest,
  User,
  ApiResponse,
  LoginOtpRequiredResponse,
} from '../types/auth.types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse | LoginOtpRequiredResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse | LoginOtpRequiredResponse>>('/auth/login', data);
    return response.data.data;
  },

  register: async (data: RegisterRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/register', data);
    return { message: response.data.message };
  },

  verifyOtp: async (data: VerifyOtpRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/verify-email', data);
    return { message: response.data.message };
  },

  verifyLoginOtp: async (data: VerifyLoginOtpRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-login-otp', data);
    return response.data.data;
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/resend-otp', { email });
    return { message: response.data.message };
  },

  logout: async (deviceId?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { deviceId });
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};

export default authApi;
