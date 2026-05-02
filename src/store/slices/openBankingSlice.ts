import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openBankingApi } from '../../api/openbanking.api';
import {
  Bank,
  BankAccount,
  BankTransaction,
  AccountBalance,
  VietQRResponse,
  CreditScoreResponse,
} from '../../types/openbanking.types';

const CONNECTIONS_STORAGE_KEY = '@openbanking_connections';

interface OpenBankingState {
  isLoading: boolean;
  banks: Bank[]; // Danh sách ngân hàng từ VietQR
  linkTransactionId: string | null; // ID giao dịch khi đang link
  connections: BankAccount[];
  transactions: BankTransaction[];
  balances: AccountBalance[];
  qrData: VietQRResponse | null; // QR code data
  creditScore: CreditScoreResponse | null;
  totalBalance: number;
  error: string | null;
}

const initialState: OpenBankingState = {
  isLoading: false,
  banks: [],
  linkTransactionId: null,
  connections: [],
  transactions: [],
  balances: [],
  qrData: null,
  creditScore: null,
  totalBalance: 0,
  error: null,
};

// 1. Load danh sách ngân hàng (từ VietQR API thật)
export const loadBanks = createAsyncThunk(
  'openBanking/loadBanks',
  async (_, { rejectWithValue }) => {
    try {
      const banks = await openBankingApi.getBanks();
      return banks;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi tải danh sách ngân hàng');
    }
  }
);

// 2. Bắt đầu liên kết ngân hàng
export const initiateLinkBank = createAsyncThunk(
  'openBanking/initiateLink',
  async (data: { bankCode: string; accountNumber: string; accountName: string }, { rejectWithValue }) => {
    try {
      const response = await openBankingApi.initiateLink(data);
      return response.transactionId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi liên kết');
    }
  }
);

// 3. Xác thực OTP
export const verifyOtpLink = createAsyncThunk(
  'openBanking/verifyOtp',
  async (data: { transactionId: string; otp: string }, { rejectWithValue, getState }) => {
    try {
      const response = await openBankingApi.verifyOtp(data);

      // Lưu account mới vào AsyncStorage
      if (response?.data?.linkedAccount) {
        try {
          const state = getState() as { openBanking: OpenBankingState };
          const currentConnections = [...state.openBanking.connections];
          const newAccount = response.data.linkedAccount;

          // Tránh trùng lặp
          const existingIndex = currentConnections.findIndex(
            (acc) => acc.bankId === newAccount.bankId && acc.accountNumber === newAccount.accountNumber,
          );
          if (existingIndex >= 0) {
            currentConnections[existingIndex] = newAccount;
          } else {
            currentConnections.push(newAccount);
          }

          await AsyncStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(currentConnections));
        } catch (storageErr) {
          console.warn('Error saving connection to AsyncStorage:', storageErr);
        }
      }

      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'OTP không đúng');
    }
  }
);

// 4a. Khôi phục connections từ AsyncStorage khi app khởi động (không gọi API)
export const hydrateConnectionsFromCache = createAsyncThunk(
  'openBanking/hydrateConnectionsFromCache',
  async (_, { rejectWithValue }) => {
    try {
      const cachedData = await AsyncStorage.getItem(CONNECTIONS_STORAGE_KEY);
      if (cachedData) {
        console.log('📦 Hydrating connections from cache');
        return JSON.parse(cachedData) as BankAccount[];
      }
      return [] as BankAccount[];
    } catch (error: any) {
      console.warn('Error hydrating connections from cache:', error);
      return rejectWithValue('Lỗi đọc dữ liệu cache');
    }
  }
);

// 4b. Lấy danh sách tài khoản đã liên kết
// Load từ cache trước để hiển thị ngay, sau đó merge với API
export const loadConnections = createAsyncThunk(
  'openBanking/loadConnections',
  async (_, { rejectWithValue }) => {
    // Bước 1: Đọc cache trước
    let cachedAccounts: BankAccount[] = [];
    try {
      const cachedData = await AsyncStorage.getItem(CONNECTIONS_STORAGE_KEY);
      if (cachedData) {
        cachedAccounts = JSON.parse(cachedData);
      }
    } catch (cacheErr) {
      console.warn('Error reading cached connections:', cacheErr);
    }

    // Bước 2: Gọi API để đồng bộ
    try {
      const apiAccounts = await openBankingApi.getAccounts('demo_user');

      // Merge: API accounts + cached accounts chưa có trong API
      let mergedAccounts = [...apiAccounts];
      for (const cached of cachedAccounts) {
        const existsInApi = mergedAccounts.some(
          (acc) => acc.bankId === cached.bankId && acc.accountNumber === cached.accountNumber,
        );
        if (!existsInApi) {
          mergedAccounts.push(cached);
        }
      }

      // Lưu merged result vào cache
      await AsyncStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(mergedAccounts));

      return mergedAccounts;
    } catch (error: any) {
      // API fail → trả về cache data nếu có
      if (cachedAccounts.length > 0) {
        console.log('📦 Using cached connections (API failed)');
        return cachedAccounts;
      }
      return rejectWithValue(error.message || 'Lỗi tải danh sách tài khoản');
    }
  }
);

// 5. Tạo QR thanh toán
export const generateQRCode = createAsyncThunk(
  'openBanking/generateQR',
  async (data: {
    bankCode: string;
    accountNumber: string;
    accountName?: string;
    amount?: number;
    description?: string;
  }, { rejectWithValue }) => {
    try {
      const qr = await openBankingApi.generateQR(data);
      return qr;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi tạo mã QR');
    }
  }
);

// 6. Lấy điểm tín dụng
export const loadCreditScore = createAsyncThunk(
  'openBanking/loadCreditScore',
  async (username: string = 'demo_user', { rejectWithValue }) => {
    try {
      const score = await openBankingApi.getCreditScore(username);
      return score;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi tải điểm tín dụng');
    }
  }
);

// Slice
const openBankingSlice = createSlice({
  name: 'openBanking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetLinkState: (state) => {
      state.linkTransactionId = null;
      state.error = null;
    },
    clearQRData: (state) => {
      state.qrData = null;
    },
    resetOpenBanking: () => initialState,
  },
  extraReducers: (builder) => {
    // Load Banks
    builder.addCase(loadBanks.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadBanks.fulfilled, (state, action) => {
      state.isLoading = false;
      state.banks = action.payload;
    });
    builder.addCase(loadBanks.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Initiate Link
    builder.addCase(initiateLinkBank.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(initiateLinkBank.fulfilled, (state, action) => {
      state.isLoading = false;
      state.linkTransactionId = action.payload || null;
    });
    builder.addCase(initiateLinkBank.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Verify OTP — cập nhật connections ngay khi verify thành công
    builder.addCase(verifyOtpLink.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyOtpLink.fulfilled, (state, action) => {
      state.isLoading = false;
      state.linkTransactionId = null;

      // Thêm account mới vào connections ngay lập tức
      const newAccount = action.payload?.data?.linkedAccount;
      if (newAccount) {
        const existingIndex = state.connections.findIndex(
          (acc) => acc.bankId === newAccount.bankId && acc.accountNumber === newAccount.accountNumber,
        );
        if (existingIndex >= 0) {
          state.connections[existingIndex] = newAccount;
        } else {
          state.connections.push(newAccount);
        }
        state.totalBalance = state.connections.reduce((sum, acc) => sum + acc.balance, 0);
      }
    });
    builder.addCase(verifyOtpLink.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Hydrate from Cache (startup - không loading spinner)
    builder.addCase(hydrateConnectionsFromCache.fulfilled, (state, action) => {
      // Chỉ hydrate nếu chưa có connections (tránh ghi đè data mới hơn)
      if (state.connections.length === 0 && action.payload.length > 0) {
        state.connections = action.payload;
        state.totalBalance = action.payload.reduce((sum, acc) => sum + acc.balance, 0);
      }
    });

    // Load Connections (API sync)
    builder.addCase(loadConnections.pending, (state) => {
      // Chỉ hiện loading nếu chưa có data từ cache
      if (state.connections.length === 0) {
        state.isLoading = true;
      }
      state.error = null;
    });
    builder.addCase(loadConnections.fulfilled, (state, action) => {
      state.isLoading = false;
      state.connections = action.payload;
      // Calculate total balance
      state.totalBalance = action.payload.reduce((sum, acc) => sum + acc.balance, 0);
    });
    builder.addCase(loadConnections.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Generate QR
    builder.addCase(generateQRCode.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(generateQRCode.fulfilled, (state, action) => {
      state.isLoading = false;
      state.qrData = action.payload;
    });
    builder.addCase(generateQRCode.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Load Credit Score
    builder.addCase(loadCreditScore.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadCreditScore.fulfilled, (state, action) => {
      state.isLoading = false;
      state.creditScore = action.payload;
    });
    builder.addCase(loadCreditScore.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, resetLinkState, clearQRData, resetOpenBanking } = openBankingSlice.actions;
export default openBankingSlice.reducer;