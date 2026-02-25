import apiClient from './client';
import {
  Bank,
  BankAccount,
  BankTransaction,
  LinkBankResponse
} from '../types/openbanking.types';

export const openBankingApi = {
  // 1. Lấy danh sách ngân hàng
  getBanks: async (): Promise<Bank[]> => {
    const response = await apiClient.get('/mock-banking/banks');
    return response.data;
  },

  // 2. Yêu cầu liên kết (Step 1)
  initiateLink: async (data: { bankId: string; username: string; password?: string }): Promise<LinkBankResponse> => {
    const response = await apiClient.post('/mock-banking/link', data);
    return response.data;
  },

  // 3. Xác thực OTP (Step 2)
  verifyOtp: async (data: { transactionId: string; otp: string }): Promise<LinkBankResponse> => {
    const response = await apiClient.post('/mock-banking/verify', data);
    return response.data;
  },

  // 4. Lấy danh sách tài khoản
  getAccounts: async (username: string): Promise<BankAccount[]> => {
    const response = await apiClient.get(`/mock-banking/accounts/${username}`);
    return response.data;
  },

  // 5. Lấy lịch sử giao dịch
  getTransactions: async (username: string): Promise<BankTransaction[]> => {
    const response = await apiClient.get(`/mock-banking/transactions/${username}`);
    return response.data;
  },

  // 6. Lấy điểm tín dụng
  getCreditScore: async (): Promise<{
    score: number;
    rating: string;
    loanLimit: number;
    breakdown: {
      incomeScore: number;
      spendingScore: number;
      balanceScore: number;
      consistencyScore: number;
      historyScore: number;
    }
  }> => {
    const response = await apiClient.get('/credit/score');
    return response.data;
  }
};

export default openBankingApi;