// import { ConfirmLoanRequestParams } from '../types';

import { Bank } from "@/types";

export type RootStackParamList = {
  // Onboarding
  Onboarding: undefined;

  // Auth
  Auth: undefined;
  OtpVerification: {
    email: string;
    phoneNumber: string;
  };
  LoginOtpVerification: {
    email: string;
  };

  // Main Tabs
  Main: undefined;
  Home: undefined;
  Loans: undefined;
  Wallet: undefined;
  Profile: undefined;

  // Loans
  BrowseLoans: undefined;
  CreateLoan: undefined;
  LoanDetail: {
    loanId: string;
  };
  RepayLoan: { loanId: string };
  FundLoan: { requestId: string };
  EditLoan: {
    requestId: string;
    currentData: {
      amount: number;
      interestRate: number;
      durationDays: number;
      purpose: string;
      description: string;
    };
  };
  MyInvestments: undefined;
  ConfirmLoanRequest: {
    amount: number;
    term: number;
    interestRate: number;
    purpose: string;
    description: string;
  };
  ConfirmTransaction: {
    loanId: string;
    amount: number;
    type: 'invest' | 'repay';
  };
  LoanRequestSuccess: {
    loanId: string;
  };

  // Open Banking
  LinkBank: undefined;
  BankConnections: undefined;
  VNLinkBank: {
    bank: Bank;
  };
  BankDetail: {
    connectionId: string;
  };
  LinkSuccess: {
    bankName: string;
    bankId: string;
  };

  // KYC
  KYCVerification: undefined;
  KYCCaptureID: {
    side: 'front' | 'back';
    frontImageUri?: string;
    frontIdInfo?: any;
  };
  KYCVerifyInfo: {
    idInfo: any; // IDRecognitionResult
    frontImageUri: string;
    backImageUri: string;
  };
  KYCFaceScan: {
    frontImageUri: string;
  };
  KYCSuccess: undefined;

  // Messages
  Messages: undefined;
  ChatDetail: {
    conversationId: string;
    name: string;
  };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  LoansTab: undefined;
  WalletTab: undefined;
  ProfileTab: undefined;
};


export type WalletStackParamList = {
  Wallet: undefined;
  SendToken: { tokenType: 'ETH' | 'USDT' };
  ReceiveToken: undefined;
  TransactionHistory: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}
