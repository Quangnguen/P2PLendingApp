import { LOAN_CONFIG } from './constants';

/**
 * Tính số tiền lãi
 * 
 * Công thức: Lãi = Gốc × Lãi suất × (Số ngày / 365)
 * 
 * @param principal - Số tiền gốc (USDT)
 * @param interestRate - Lãi suất năm (%)
 * @param durationDays - Số ngày vay
 * @returns Số tiền lãi (USDT)
 * 
 * @example
 * calculateInterest('1000', 12, 30)
 * // Lãi = 1000 × 0.12 × (30/365) = 9.86 USDT
 */
export function calculateInterest(
  principal: string,
  interestRate: number,
  durationDays: number
): string {
  // Chuyển principal sang số
  const principalNum = parseFloat(principal);
  
  // Kiểm tra input hợp lệ
  if (isNaN(principalNum) || principalNum <= 0) {
    return '0';
  }
  
  // Tính lãi
  // Lãi = Gốc × (Lãi suất / 100) × (Số ngày / 365)
  const interest = principalNum * (interestRate / 100) * (durationDays / 365);
  
  // Làm tròn 2 chữ số thập phân
  return interest.toFixed(2);
}

/**
 * Tính tổng số tiền phải trả (gốc + lãi)
 * 
 * @param principal - Số tiền gốc
 * @param interestRate - Lãi suất năm (%)
 * @param durationDays - Số ngày vay
 * @returns Tổng tiền phải trả
 * 
 * @example
 * calculateRepaymentAmount('1000', 12, 30)
 * // = 1000 + 9.86 = 1009.86 USDT
 */
export function calculateRepaymentAmount(
  principal: string,
  interestRate: number,
  durationDays: number
): string {
  const principalNum = parseFloat(principal);
  const interest = parseFloat(calculateInterest(principal, interestRate, durationDays));
  
  return (principalNum + interest).toFixed(2);
}

/**
 * Tính số ETH cần thế chấp
 * 
 * Công thức: ETH cần = (Số tiền vay × Tỷ lệ thế chấp) / Giá ETH
 * 
 * @param loanAmount - Số tiền vay (USDT)  
 * @param ethPrice - Giá ETH hiện tại (USDT)
 * @param collateralRatio - Tỷ lệ thế chấp (%, mặc định 150%)
 * @returns Số ETH cần thế chấp
 * 
 * @example
 * calculateRequiredCollateral('1000', '2000', 150)
 * // ETH cần = (1000 × 1.5) / 2000 = 0.75 ETH
 */
export function calculateRequiredCollateral(
  loanAmount: string,
  ethPrice: string,
  collateralRatio: number = LOAN_CONFIG.MIN_COLLATERAL_RATIO
): string {
  const amount = parseFloat(loanAmount);
  const price = parseFloat(ethPrice);
  
  if (isNaN(amount) || isNaN(price) || price <= 0) {
    return '0';
  }
  
  // Tính số ETH cần
  const ethRequired = (amount * (collateralRatio / 100)) / price;
  
  // Làm tròn 6 chữ số thập phân
  return ethRequired.toFixed(6);
}

/**
 * Tính tỷ lệ thế chấp hiện tại
 * 
 * Công thức: Tỷ lệ = (Giá trị ETH thế chấp / Số tiền vay) × 100
 * 
 * @param collateralEth - Số ETH đã thế chấp
 * @param ethPrice - Giá ETH hiện tại (USDT)
 * @param loanAmount - Số tiền vay (USDT)
 * @returns Tỷ lệ thế chấp (%)
 * 
 * @example
 * calculateCollateralRatio('0.75', '2000', '1000')
 * // Tỷ lệ = (0.75 × 2000 / 1000) × 100 = 150%
 */
export function calculateCollateralRatio(
  collateralEth: string,
  ethPrice: string,
  loanAmount: string
): number {
  const collateral = parseFloat(collateralEth);
  const price = parseFloat(ethPrice);
  const amount = parseFloat(loanAmount);
  
  if (isNaN(collateral) || isNaN(price) || isNaN(amount) || amount <= 0) {
    return 0;
  }
  
  // Giá trị ETH = Số ETH × Giá
  const collateralValue = collateral * price;
  
  // Tỷ lệ = (Giá trị / Số tiền vay) × 100
  const ratio = (collateralValue / amount) * 100;
  
  return Math.round(ratio * 100) / 100; // Làm tròn 2 chữ số
}

/**
 * Tính số ngày còn lại đến hạn
 * 
 * @param dueDate - Timestamp ngày đáo hạn (milliseconds)
 * @returns Số ngày còn lại (âm nếu quá hạn)
 * 
 * @example
 * // Nếu hôm nay là 20/02, đáo hạn 25/02
 * calculateDaysRemaining(dueDateTimestamp) // = 5
 */
export function calculateDaysRemaining(dueDate: number): number {
  const now = Date.now();
  const diff = dueDate - now;
  
  // Chuyển từ milliseconds sang ngày
  // 1 ngày = 24 × 60 × 60 × 1000 = 86,400,000 ms
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  
  return days;
}

/**
 * Kiểm tra khoản vay có quá hạn không
 * 
 * @param dueDate - Timestamp ngày đáo hạn
 * @returns true nếu đã quá hạn
 */
export function isLoanOverdue(dueDate: number): boolean {
  return Date.now() > dueDate;
}

/**
 * Tính tiền phạt quá hạn
 * 
 * Công thức: Phạt = Số tiền × Số ngày quá hạn × Tỷ lệ phạt/ngày
 * 
 * @param amount - Số tiền gốc
 * @param dueDate - Ngày đáo hạn
 * @param penaltyRatePerDay - Tỷ lệ phạt mỗi ngày (%, mặc định 0.1%)
 * @returns Số tiền phạt
 */
export function calculatePenalty(
  amount: string,
  dueDate: number,
  penaltyRatePerDay: number = 0.1
): string {
  const daysOverdue = -calculateDaysRemaining(dueDate);
  
  // Nếu chưa quá hạn, không có phạt
  if (daysOverdue <= 0) {
    return '0';
  }
  
  const amountNum = parseFloat(amount);
  const penalty = amountNum * (penaltyRatePerDay / 100) * daysOverdue;
  
  return penalty.toFixed(2);
}

/**
 * Lấy lãi suất gợi ý dựa trên điểm tín dụng
 * 
 * @param creditScore - Điểm tín dụng (0-850)
 * @returns Object { min, max } lãi suất gợi ý
 * 
 * @example
 * getSuggestedInterestRate(720) // { min: 5, max: 10 }
 */
export function getSuggestedInterestRate(creditScore: number): { min: number; max: number } {
  const { SUGGESTED_RATES } = LOAN_CONFIG;
  
  if (creditScore >= 700) {
    return { min: SUGGESTED_RATES.EXCELLENT.min, max: SUGGESTED_RATES.EXCELLENT.max };
  } else if (creditScore >= 650) {
    return { min: SUGGESTED_RATES.GOOD.min, max: SUGGESTED_RATES.GOOD.max };
  } else if (creditScore >= 600) {
    return { min: SUGGESTED_RATES.FAIR.min, max: SUGGESTED_RATES.FAIR.max };
  } else {
    return { min: SUGGESTED_RATES.POOR.min, max: SUGGESTED_RATES.POOR.max };
  }
}

/**
 * Format số tiền hiển thị
 * 
 * @param amount - Số tiền
 * @param decimals - Số chữ số thập phân
 * @returns String đã format
 * 
 * @example
 * formatCurrency('1234.5678', 2) // "1,234.57"
 */
export function formatCurrency(amount: string, decimals: number = 2): string {
  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format số ngày còn lại thành text
 * 
 * @param days - Số ngày
 * @returns Text hiển thị
 * 
 * @example
 * formatDaysRemaining(5)  // "Còn 5 ngày"
 * formatDaysRemaining(-2) // "Quá hạn 2 ngày"
 * formatDaysRemaining(0)  // "Đến hạn hôm nay"
 */
export function formatDaysRemaining(days: number): string {
  if (days > 0) {
    return `Còn ${days} ngày`;
  } else if (days < 0) {
    return `Quá hạn ${Math.abs(days)} ngày`;
  } else {
    return 'Đến hạn hôm nay';
  }
}

/**
 * Validate số tiền vay
 * 
 * @param amount - Số tiền cần validate
 * @returns Object { isValid, error }
 */
export function validateLoanAmount(amount: string): { isValid: boolean; error?: string } {
  const num = parseFloat(amount);
  
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Số tiền không hợp lệ' };
  }
  
  const min = parseFloat(LOAN_CONFIG.MIN_AMOUNT);
  const max = parseFloat(LOAN_CONFIG.MAX_AMOUNT);
  
  if (num < min) {
    return { isValid: false, error: `Số tiền tối thiểu là ${min} USDT` };
  }
  
  if (num > max) {
    return { isValid: false, error: `Số tiền tối đa là ${max} USDT` };
  }
  
  return { isValid: true };
}

/**
 * Validate lãi suất
 * 
 * @param rate - Lãi suất cần validate
 * @returns Object { isValid, error }
 */
export function validateInterestRate(rate: number): { isValid: boolean; error?: string } {
  if (rate < LOAN_CONFIG.MIN_INTEREST_RATE) {
    return { isValid: false, error: `Lãi suất tối thiểu là ${LOAN_CONFIG.MIN_INTEREST_RATE}%` };
  }
  
  if (rate > LOAN_CONFIG.MAX_INTEREST_RATE) {
    return { isValid: false, error: `Lãi suất tối đa là ${LOAN_CONFIG.MAX_INTEREST_RATE}%` };
  }
  
  return { isValid: true };
}