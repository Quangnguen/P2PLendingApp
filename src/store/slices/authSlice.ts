import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/auth.api';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';
import { User, LoginRequest, RegisterRequest, AuthResponse, LoginOtpRequiredResponse } from '../../types/auth.types';

// Type guard để kiểm tra response có phải OTP required không
const isOtpRequired = (response: AuthResponse | LoginOtpRequiredResponse): response is LoginOtpRequiredResponse => {
  return 'requireOtp' in response && response.requireOtp === true;
};

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  pendingLoginEmail: string | null;
  pendingDeviceInfo: {
    deviceId?: string;
    deviceName?: string;
    deviceType?: string;
  } | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  pendingLoginEmail: null,
  pendingDeviceInfo: null,
};

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(data);
      
      // Check nếu backend yêu cầu OTP
      if (isOtpRequired(response)) {
        return { 
          requireOtp: true as const,
          email: data.email,
          deviceInfo: {
            deviceId: data.deviceId,
            deviceName: data.deviceName,
            deviceType: data.deviceType,
          }
        };
      }
      
      // Login thành công với trusted device
      await storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      await storage.set(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      
      return { 
        requireOtp: false as const, 
        user: response.user 
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      await authApi.register(data);
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Đăng ký thất bại';
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      await authApi.verifyOtp({ email, otp });
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Xác thực OTP thất bại';
      return rejectWithValue(errorMessage);
    }
  }
);

export const verifyLoginOtp = createAsyncThunk(
  'auth/verifyLoginOtp',
  async (
    { email, otp, trustDevice }: { email: string; otp: string; trustDevice?: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const { pendingDeviceInfo } = state.auth;
      
      const response = await authApi.verifyLoginOtp({
        email,
        otp,
        ...pendingDeviceInfo,
        trustDevice,
      });
      
      await storage.set(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
      await storage.set(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      
      return response.user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Xác thực OTP thất bại';
      return rejectWithValue(errorMessage);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (deviceId: string | undefined) => {
    try {
      if (deviceId) {
        await authApi.logout(deviceId);
      }
    } catch (error: any) {
      console.warn('Logout API error:', error?.message || 'Unknown error');
    } finally {
      await storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      await storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    }
    return true;
  }
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const token = await storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
      if (!token) {
        return null;
      }

      const user = await authApi.getMe();
      return user;
    } catch (error: any) {
      console.warn('Load user error:', error || 'Unknown error');
      await storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
      return rejectWithValue('Failed to load user');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async () => {
    const token = await storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      try {
        const user = await authApi.getMe();
        return user;
      } catch (error) {
        console.warn('Check auth error:', error || 'Unknown error');
        await storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        return null;
      }
    }
    return null;
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: () => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.requireOtp) {
          state.pendingLoginEmail = action.payload.email;
          state.pendingDeviceInfo = action.payload.deviceInfo;
        } else {
          state.user = action.payload.user;
          state.isAuthenticated = true;
          state.pendingLoginEmail = null;
          state.pendingDeviceInfo = null;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Verify Login OTP
      .addCase(verifyLoginOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.pendingLoginEmail = null;
        state.pendingDeviceInfo = null;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
    
    // Load User
      .addCase(loadUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(loadUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })
    
    // Check Auth
      .addCase(checkAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
