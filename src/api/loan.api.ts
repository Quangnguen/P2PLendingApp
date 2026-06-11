import apiClient from './client';
import { Loan, LoanSummary, CreateLoanRequest, RepaymentInfo } from '../types/loan.types';

export const loanApi = {
    // === LoanRequest APIs ===

    createLoanRequest: async (data: CreateLoanRequest) => {
        const response = await apiClient.post('/loans/requests', data);
        return response.data;
    },

    getMyRequests: async () => {
        const response = await apiClient.get('/loans/requests');
        return response.data;
    },

    getPendingRequests: async (filters?: any) => {
        const response = await apiClient.get('/loans/requests/pending', { params: filters });
        return response.data;
    },

    getRequestDetail: async (id: string) => {
        const response = await apiClient.get(`/loans/requests/${id}`);
        return response.data;
    },

    cancelRequest: async (id: string) => {
        const response = await apiClient.post(`/loans/requests/${id}/cancel`);
        return response.data;
    },

    deleteRequest: async (id: string) => {
        const response = await apiClient.delete(`/loans/requests/${id}`);
        return response.data;
    },

    updateRequest: async (id: string, data: Partial<CreateLoanRequest>) => {
        const response = await apiClient.put(`/loans/requests/${id}`, data);
        return response.data;
    },

    // === Loan APIs ===

    getMyLoans: async () => {
        const response = await apiClient.get('/loans');
        return response.data;
    },

    getLoanDetail: async (id: string) => {
        const response = await apiClient.get(`/loans/${id}`);
        return response.data;
    },

    fundLoan: async (requestId: string, data: { txHash: string }) => {
        const response = await apiClient.post(`/loans/requests/${requestId}/fund`, data);
        return response.data;
    },

    repayLoan: async (loanId: string, data: { txHash: string; amount: number }) => {
        const response = await apiClient.post(`/loans/${loanId}/repay`, data);
        return response.data;
    },

    getMyInvestments: async () => {
        const response = await apiClient.get('/loans/investments/my');
        return response.data;
    },

    getMyTransactions: async () => {
        const response = await apiClient.get('/loans/transactions/my');
        return response.data;
    },

    // === Open Banking Integration ===

    /** Tạo QR Code trả nợ qua VietQR (Open Banking) */
    getRepaymentQR: async (loanId: string) => {
        const response = await apiClient.get(`/loans/${loanId}/repay-qr`);
        return response.data;
    },

    /** Lấy thông tin ngân hàng liên kết của borrower/lender */
    getLoanBankInfo: async (loanId: string) => {
        const response = await apiClient.get(`/loans/${loanId}/bank-info`);
        return response.data;
    },

    /** Kiểm tra NFT nợ xấu (DebtToken) của một địa chỉ ví */
    checkDebtTokens: async (walletAddress: string) => {
        const response = await apiClient.get(`/loans/debt/check/${walletAddress}`);
        return response.data;
    },
};

// Tỷ giá thị trường — cache trong memory, tránh gọi liên tục
let _ratesCache: { ethUsd: number; usdtVnd: number; fetchedAt: number } | null = null;

export const getRates = async (): Promise<{ ethUsd: number; usdtVnd: number }> => {
    const TTL = 5 * 60 * 1000;
    if (_ratesCache && Date.now() - _ratesCache.fetchedAt < TTL) {
        return _ratesCache;
    }
    try {
        const response = await apiClient.get('/credit/rates');
        const data = response.data;
        _ratesCache = { ethUsd: data.ethUsd, usdtVnd: data.usdtVnd, fetchedAt: Date.now() };
        return _ratesCache;
    } catch {
        return { ethUsd: 2000, usdtVnd: 25000 };
    }
};
