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
    const response = await apiClient.post<ApiResponse<any>>('/auth/login', data);
    const result = response.data.data;
    // Map user.id → user._id nếu có user object
    if (result?.user) {
      result.user = { ...result.user, _id: result.user._id || result.user.id };
    }
    return result;
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
    const response = await apiClient.post<ApiResponse<any>>('/auth/verify-login-otp', data);
    const result = response.data.data;
    // Map user.id → user._id
    if (result?.user) {
      result.user = { ...result.user, _id: result.user._id || result.user.id };
    }
    return result;
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<null>>('/auth/resend-otp', { email });
    return { message: response.data.message };
  },

  logout: async (deviceId?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { deviceId });
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<any>>('/auth/me');
    const data = response.data.data;
    // Backend trả 'id' (từ BaseResponseDto), frontend cần '_id'
    return {
      ...data,
      _id: data._id || data.id,
    };
  },

  changePassword: async (data: any): Promise<{ message: string }> => {
    const response = await apiClient.put<ApiResponse<null>>('/auth/change-password', data);
    return { message: response.data.message };
  },

  /**
   * Cập nhật địa chỉ ví Ganache cho user hiện tại
   * Gọi PUT /auth/me/wallet (endpoint riêng, không cần fullName/avatarUrl)
   */
  updateWallet: async (walletAddress: string): Promise<{ walletAddress: string }> => {
    const response = await apiClient.put<ApiResponse<any>>('/auth/me/wallet', {
      walletAddress,
    });
    return response.data.data;
  },
};

export default authApi;
