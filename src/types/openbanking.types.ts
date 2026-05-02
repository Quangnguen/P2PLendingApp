// ===== VietQR Bank (from real API) =====
export interface Bank {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  code?: string;
  bin?: string;
  transferSupported?: boolean;
  lookupSupported?: boolean;
  swiftCode?: string | null;
}

// ===== Bank Account =====
export interface BankAccount {
  id: string;
  bankId: string; // VietQR bank code
  bankName?: string;
  bankLogo?: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  type: 'SAVINGS' | 'CURRENT';
}

// ===== Bank Transaction =====
export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'IN' | 'OUT';
  description: string;
  date: string; // JSON trả về string
  beneficiary?: string;
}

// ===== Bank Connection (stored in DB) =====
export interface BankConnection {
  connectionId: string;
  bankCode: string;
  bankName: string;
  bankLogo: string;
  accountName: string;
  accountNumberMask: string;
  linkedAt: string | null;
  lastSyncedAt: string | null;
}

// ===== VietQR Response =====
export interface VietQRResponse {
  qrDataUrl: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName?: string;
  amount?: number;
  description?: string;
}

// ===== Link Bank Flow =====
export interface LinkBankRequest {
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface LinkBankResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  data?: {
    linkedAccount?: BankAccount;
    linkedAccounts?: BankAccount[];
  };
}

export interface VerifyOtpRequest {
  transactionId: string;
  otp: string;
}

// ===== Credit Score =====
export interface CreditScoreResponse {
  score: number;
  rating: string;
  loanLimit: number;
  breakdown: {
    balanceScore: number;
    accountsScore: number;
    transactionScore: number;
  };
}

// ===== Legacy types (backward compatibility) =====
export interface AccountBalance {
  accountId: string;
  name: string;
  type: string;
  currentBalance: number;
  availableBalance: number;
  currency: string;
}

export interface LinkTokenResponse {
  linkToken: string;
  expiration: string;
}

export interface ExchangeTokenRequest {
  publicToken: string;
}

export interface ExchangeTokenResponse {
  connectionId: string;
  institutionName: string;
  accounts: BankAccount[];
}

export interface Transaction {
  transactionId: string;
  accountId: string;
  amount: number;
  currency: string;
  date: string;
  name: string;
  merchantName: string | null;
  category: string[];
  pending: boolean;
}

export interface GetTransactionsRequest {
  connectionId: string;
  startDate: string;
  endDate: string;
}