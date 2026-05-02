/**
 * Thông tin cơ bản của một khoản vay
 */
export interface Loan {
  /** ID duy nhất của khoản vay (từ smart contract) */
  id: string;
  
  /** Địa chỉ ví người vay */
  borrower: string;
  
  /** Địa chỉ ví người cho vay (null nếu chưa có) */
  lender: string | null;
  
  /** Số tiền vay (đơn vị: USDT) */
  amount: string;
  
  /** Lãi suất (% năm) - Ví dụ: 12 = 12%/năm */
  interestRate: number;
  
  /** Thời hạn vay (số ngày) */
  duration: number;
  
  /** Tài sản thế chấp (ETH) */
  collateralAmount: string;

  /** Trạng thái hiện tại */
  status: LoanStatus;
  
  /** Thời điểm tạo (timestamp) */
  createdAt: number;
  
  /** Thời điểm được cấp vốn (timestamp, null nếu chưa) */
  fundedAt: number | null;
  
  /** Thời điểm đáo hạn (timestamp, null nếu chưa active) */
  dueDate: number | null;
  
  /** Thời điểm trả nợ (timestamp, null nếu chưa trả) */
  repaidAt: number | null;
  
  /** Số tiền phải trả (gốc + lãi) */
  repaymentAmount: string;
  
  /** Điểm tín dụng của borrower tại thời điểm tạo */
  creditScore: number;
  
  /** Hash giao dịch tạo loan */
  txHash: string;
}

export enum LoanStatus {
  /** Đang chờ người cho vay */
  PENDING = 'PENDING',
  
  /** Đã được cấp vốn, chờ borrower nhận */
  FUNDED = 'FUNDED',
  
  /** Đang hoạt động (borrower đã nhận tiền) */
  ACTIVE = 'ACTIVE',
  
  /** Đã trả nợ hoàn tất */
  REPAID = 'REPAID',
  
  /** Quá hạn không trả */
  DEFAULTED = 'DEFAULTED',
  
  /** Đã hủy */
  CANCELLED = 'CANCELLED',
}

export interface CreateLoanRequest {
  loanAmount: number;
  interestRate: number;
  durationDays: number;
  purpose?: string;
  purposeDescription?: string;
  collateralType?: string;
  collateralAmount?: number;
}

export interface LoanPayment {
  _id: string;
  loanId: string;
  amount: number;
  principal: number;
  interest: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
}

export interface Investment {
  _id: string;
  loanId: string;
  investorId: string;
  amount: number;
  expectedReturn: number;
  status: 'active' | 'completed' | 'defaulted';
  createdAt: string;
}


/**
 * Thời hạn vay (tính bằng ngày)
 */
export enum LoanDuration {
  SEVEN_DAYS = 7,
  FOURTEEN_DAYS = 14,
  THIRTY_DAYS = 30,
  SIXTY_DAYS = 60,
  NINETY_DAYS = 90,
}

export interface LoanSummary {
  id: string;
  amount: string;
  interestRate: number;
  duration: number;
  status: LoanStatus;
  createdAt: number;
  dueDate: number | null;
  creditScore: number;
}

/**
 * Thông tin thống kê cho Borrower Dashboard
 */
export interface BorrowerStats {
  /** Tổng số khoản vay đã tạo */
  totalLoans: number;
  
  /** Số khoản đang hoạt động */
  activeLoans: number;
  
  /** Tổng tiền đã vay */
  totalBorrowed: string;
  
  /** Tổng tiền đã trả */
  totalRepaid: string;
  
  /** Điểm tín dụng hiện tại */
  creditScore: number;
  
  /** Số khoản trả đúng hạn */
  onTimePayments: number;
  
  /** Số khoản trễ hạn */
  latePayments: number;
}

/**
 * Thông tin thống kê cho Lender Dashboard
 */
export interface LenderStats {
  /** Tổng số khoản đã đầu tư */
  totalInvestments: number;
  
  /** Số khoản đang hoạt động */
  activeInvestments: number;
  
  /** Tổng vốn đã cho vay */
  totalLent: string;
  
  /** Tổng lợi nhuận đã nhận */
  totalEarned: string;
  
  /** Lợi nhuận đang chờ */
  pendingEarnings: string;
  
  /** ROI trung bình (%) */
  averageROI: number;
}

/**
 * Thông tin thanh toán
 */
export interface RepaymentInfo {
  /** ID khoản vay */
  loanId: string;
  
  /** Số tiền gốc */
  principal: string;
  
  /** Số tiền lãi */
  interest: string;
  
  /** Tổng cần trả */
  totalAmount: string;
  
  /** Ngày đáo hạn */
  dueDate: number;
  
  /** Số ngày còn lại */
  daysRemaining: number;
  
  /** Đã quá hạn chưa */
  isOverdue: boolean;
  
  /** Tiền phạt (nếu quá hạn) */
  penalty: string;
}

export interface LoanFilter {
  /** Lọc theo trạng thái */
  status?: LoanStatus[];
  
  /** Số tiền tối thiểu */
  minAmount?: string;
  
  /** Số tiền tối đa */
  maxAmount?: string;
  
  /** Lãi suất tối thiểu */
  minInterestRate?: number;
  
  /** Lãi suất tối đa */
  maxInterestRate?: number;
  
  /** Thời hạn vay */
  duration?: LoanDuration[];
  
  /** Điểm tín dụng tối thiểu */
  minCreditScore?: number;
  
  /** Sắp xếp theo */
  sortBy?: 'amount' | 'interestRate' | 'duration' | 'creditScore' | 'createdAt';
  
  /** Thứ tự sắp xếp */
  sortOrder?: 'asc' | 'desc';
}

