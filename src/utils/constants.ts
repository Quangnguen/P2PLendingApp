export const API_BASE_URL = 'http://10.0.2.2:9000/api/v1'; // Android Emulator
// export const API_BASE_URL = 'http://localhost:9000/api/v1'; // iOS Simulator

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
};

export const APP_NAME = 'P2P Lending';

/**
 * Cấu hình cho các khoản vay
 */
export const LOAN_CONFIG = {
  /** Số tiền vay tối thiểu (USDT) */
  MIN_AMOUNT: '100',
  
  /** Số tiền vay tối đa (USDT) */
  MAX_AMOUNT: '10000',
  
  /** Lãi suất tối thiểu (% năm) */
  MIN_INTEREST_RATE: 5,
  
  /** Lãi suất tối đa (% năm) */
  MAX_INTEREST_RATE: 50,
  
  /** Tỷ lệ thế chấp tối thiểu (%) */
  MIN_COLLATERAL_RATIO: 150,
  
  /** Tỷ lệ thanh lý tài sản thế chấp (%) */
  LIQUIDATION_THRESHOLD: 120,
  
  /** Các tùy chọn thời hạn vay */
  DURATION_OPTIONS: [
    { label: '7 ngày', value: 7 },
    { label: '14 ngày', value: 14 },
    { label: '30 ngày', value: 30 },
    { label: '60 ngày', value: 60 },
    { label: '90 ngày', value: 90 },
  ],
  
  /** Lãi suất gợi ý theo điểm tín dụng */
  SUGGESTED_RATES: {
    EXCELLENT: { min: 5, max: 10, label: 'Xuất sắc (700+)' },
    GOOD: { min: 10, max: 15, label: 'Tốt (650-699)' },
    FAIR: { min: 15, max: 25, label: 'Trung bình (600-649)' },
    POOR: { min: 25, max: 40, label: 'Kém (<600)' },
  },
};

/**
 * Màu sắc theo trạng thái khoản vay
 */
export const LOAN_STATUS_COLORS = {
  PENDING: '#f59e0b',    // Vàng cam
  FUNDED: '#3b82f6',     // Xanh dương
  ACTIVE: '#10b981',     // Xanh lá
  REPAID: '#6b7280',     // Xám
  DEFAULTED: '#ef4444',  // Đỏ
  CANCELLED: '#9ca3af',  // Xám nhạt
};

/**
 * Text hiển thị theo trạng thái
 */
export const LOAN_STATUS_TEXT = {
  PENDING: 'Đang chờ',
  FUNDED: 'Đã cấp vốn',
  ACTIVE: 'Đang hoạt động',
  REPAID: 'Đã trả',
  DEFAULTED: 'Quá hạn',
  CANCELLED: 'Đã hủy',
};