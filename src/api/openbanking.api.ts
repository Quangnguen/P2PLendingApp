import apiClient from './client';
import {
  Bank,
  BankAccount,
  BankTransaction,
  LinkBankRequest,
  LinkBankResponse,
  VerifyOtpRequest,
  VietQRResponse,
  CreditScoreResponse,
} from '../types/openbanking.types';

export const openBankingApi = {
  // ===== VietQR Real APIs =====

  // 1. Lấy danh sách ngân hàng (từ VietQR API thật)
  getBanks: async (): Promise<Bank[]> => {
    const response = await apiClient.get('/openbanking/banks');
    return response.data;
  },

  // 2. Tạo QR thanh toán VietQR
  generateQR: async (data: {
    bankCode: string;
    accountNumber: string;
    accountName?: string;
    amount?: number;
    description?: string;
  }): Promise<VietQRResponse> => {
    const response = await apiClient.post('/openbanking/qr/generate', data);
    return response.data;
  },

  // 3. Tạo QR thanh toán khoản vay
  generateLoanPaymentQR: async (params: {
    loanId: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    amount: number;
  }): Promise<VietQRResponse> => {
    const response = await apiClient.get('/openbanking/qr/loan-payment', { params });
    return response.data;
  },

  // ===== Link Bank Flow =====

  // 4. Bước 1: Yêu cầu liên kết ngân hàng
  initiateLink: async (data: LinkBankRequest): Promise<LinkBankResponse> => {
    const response = await apiClient.post('/openbanking/link', data);
    return response.data;
  },

  // 5. Bước 2: Xác thực OTP
  verifyOtp: async (data: VerifyOtpRequest): Promise<LinkBankResponse> => {
    const response = await apiClient.post('/openbanking/verify', data);
    return response.data;
  },

  // ===== Mock Data APIs =====

  // 6. Lấy danh sách tài khoản đã liên kết
  getAccounts: async (username: string): Promise<BankAccount[]> => {
    const response = await apiClient.get(`/openbanking/accounts/${username}`);
    return response.data;
  },

  // 7. Lấy lịch sử giao dịch theo tài khoản
  getTransactions: async (accountId: string): Promise<BankTransaction[]> => {
    const response = await apiClient.get(`/openbanking/transactions/${accountId}`);
    return response.data;
  },

  // 8. Lấy điểm tín dụng
  getCreditScore: async (username: string = 'demo_user'): Promise<CreditScoreResponse> => {
    const response = await apiClient.get(`/openbanking/credit-score/${username}`);
    return response.data;
  },
};

export default openBankingApi;