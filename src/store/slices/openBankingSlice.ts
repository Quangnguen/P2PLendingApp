import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { openBankingApi } from '../../api/openbanking.api';
import { Bank, BankAccount, BankConnection, BankTransaction, AccountBalance } from '../../types/openbanking.types';

interface OpenBankingState {
  isLoading: boolean;
  banks: Bank[]; // Danh sách ngân hàng hỗ trợ
  linkTransactionId: string | null; // ID giao dịch khi đang link
  connections: BankAccount[];
  transactions: BankTransaction[];
  balances: AccountBalance[];
  error: string | null;
}

const initialState: OpenBankingState = {
  isLoading: false,
  banks: [],
  linkTransactionId: null,
  connections: [],
  transactions: [],
  balances: [],
  error: null,
};

// 1. Load danh sách ngân hàng
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

// 2. Bắt đầu liên kết (Gửi user/pass)
export const initiateLinkBank = createAsyncThunk(
  'openBanking/initiateLink',
  async (data: { bankId: string; username: string; password?: string }, { rejectWithValue }) => {
    try {
      const response = await openBankingApi.initiateLink(data);
      return response.transactionId; // Trả về transactionId để dùng cho bước OTP
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Lỗi liên kết');
    }
  }
);

// 3. Xác thực OTP
export const verifyOtpLink = createAsyncThunk(
  'openBanking/verifyOtp',
  async (data: { transactionId: string; otp: string }, { rejectWithValue }) => {
    try {
      await openBankingApi.verifyOtp(data);
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'OTP không đúng');
    }
  }
);

// 4. Lấy danh sách tài khoản đã liên kết
export const loadConnections = createAsyncThunk(
  'openBanking/loadConnections',
  async (_, { rejectWithValue }) => {
    try {
      // Vì là Mock nên ta truyền cứng username là 'demo_user'
      const accounts = await openBankingApi.getAccounts('demo_user');

      // Map về format BankConnection để tương thích với UI cũ (nếu cần)
      // Nhưng ở đây ta sẽ dùng trực tiếp BankAccount
      // Cần sửa lại Interface State một chút nếu type không khớp
      // Tạm thời ta cứ trả về accounts
      return accounts;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi tải danh sách tài khoản');
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
    }
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

    // Verify OTP
    builder.addCase(verifyOtpLink.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(verifyOtpLink.fulfilled, (state) => {
      state.isLoading = false;
      state.linkTransactionId = null; // Reset sau khi thành công
    });
    builder.addCase(verifyOtpLink.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });

    // Load Connections
    builder.addCase(loadConnections.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(loadConnections.fulfilled, (state, action) => {
      state.isLoading = false;
      state.connections = action.payload;
    });
    builder.addCase(loadConnections.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearError, resetLinkState } = openBankingSlice.actions;
export default openBankingSlice.reducer;