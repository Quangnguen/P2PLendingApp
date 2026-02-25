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



export interface BankConnection {
  id: string;
  connectionId: string;
  institutionName: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: 'connected' | 'pending' | 'error';
  accounts: string[];
  lastSyncedAt: string | null;
  linkedAt: string | null;
  createdAt: string;
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

export interface AccountBalance {
  accountId: string;
  name: string;
  type: string;
  currentBalance: number;
  availableBalance: number;
  currency: string;
}

export interface GetTransactionsRequest {
  connectionId: string;
  startDate: string;
  endDate: string;
}

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  logo: string;
}

export interface BankAccount {
  id: string;
  bankId: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  currency: string;
  type: 'SAVINGS' | 'CURRENT';
}

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  type: 'IN' | 'OUT';
  description: string;
  date: string; // JSON trả về string
  beneficiary?: string;
}

export interface LinkBankResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  data?: {
    linkedAccounts: BankAccount[];
  };
}