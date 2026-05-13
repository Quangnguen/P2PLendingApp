export { default as authReducer } from './authSlice';
export { default as openBankingReducer } from './openBankingSlice';
export { default as toastReducer } from './toastSlice';
export { default as loanReducer } from './loanSlice';

// Auth exports
export {
  login,
  register,
  verifyOtp,
  verifyLoginOtp,
  logout,
  loadUser,
  checkAuth,
  clearError as clearAuthError,
  resetAuth,
} from './authSlice';

// OpenBanking exports
export {
  loadBanks,
  initiateLinkBank,
  verifyOtpLink,
  loadConnections,
  hydrateConnectionsFromCache,
  generateQRCode,
  loadCreditScore,
  recalculateCreditScore,
  unlinkConnection,
  clearError as clearOpenBankingError,
  clearQRData,
  resetOpenBanking,
  resetLinkState,
} from './openBankingSlice';

// Toast exports
export {
  showToast,
  hideToast,
  clearToasts,
  selectToasts,
} from './toastSlice';

export {
  fetchMyLoans,
  fetchPendingRequests,
  fetchMyInvestments,
  clearError as clearLoanError,
  resetLoan,
} from './loanSlice'; 
