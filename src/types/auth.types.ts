// Auth Types
export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  avatar?: string;
  role: string;
  isVerified: boolean;
  kycStatus?: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
}

export interface RegisterRequest {
  fullname: string; // Backend dùng fullname (lowercase n)
  email: string;
  phoneNumber: string;
  password: string;
}

// Backend response wrapper format
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isTrustedDevice?: boolean;
}

// Response khi cần OTP
export interface LoginOtpRequiredResponse {
  requireOtp: boolean;
  email: string;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

// Request verify login OTP với thông tin thiết bị
export interface VerifyLoginOtpRequest {
  email: string;
  otp: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  trustDevice?: boolean;
}
