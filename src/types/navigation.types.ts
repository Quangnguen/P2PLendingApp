export interface ConfirmLoanRequestParams {
  amount: number;
  term: number;
  interestRate: number;
  purpose: string;
  description: string;
}

export interface ConfirmTransactionParams {
  loanId: string;
  amount: number;
  type: 'invest' | 'repay';
}
