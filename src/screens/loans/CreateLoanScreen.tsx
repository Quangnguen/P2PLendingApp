/**
 * =================================================================
 * CREATE LOAN SCREEN - Màn hình tạo yêu cầu vay
 * =================================================================
 * 
 * Màn hình này cho phép Borrower:
 * 1. Nhập số tiền muốn vay
 * 2. Chọn thời hạn vay
 * 3. Đề xuất lãi suất
 * 4. Xem số ETH cần thế chấp
 * 5. Xác nhận và ký giao dịch
 * 
 * FLOW:
 * User nhập form → Validate → Hiện preview → Confirm → Gọi Smart Contract
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useWeb3 } from '../../providers';
import {
  calculateInterest,
  calculateRepaymentAmount,
  calculateRequiredCollateral,
  getSuggestedInterestRate,
  validateLoanAmount,
  validateInterestRate,
  formatCurrency,
} from '../../utils/loanCalculations';
import { LOAN_CONFIG } from '../../utils/constants';
// import { LoanDuration, CreateLoanRequest } from '../../types/loan.types';


const MOCK_CREDIT_SCORE = 680; // Điểm tín dụng giả
const MOCK_ETH_PRICE = '2500'; // Giá ETH giả (USDT)

// =====================
// COMPONENT
// =====================

const CreateLoanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { balances } = useWeb3();

  // =====================
  // STATE
  // =====================
  
  /**
   * Form data
   */
  const [amount, setAmount] = useState(''); // Số tiền vay
  const [duration, setDuration] = useState<number>(30); // Thời hạn (ngày)
  const [interestRate, setInterestRate] = useState(''); // Lãi suất
  
  /**
   * Calculated values (tính toán từ form)
   */
  const [requiredCollateral, setRequiredCollateral] = useState('0');
  const [interestAmount, setInterestAmount] = useState('0');
  const [totalRepayment, setTotalRepayment] = useState('0');
  
  /**
   * UI state
   */
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // =====================
  // EFFECTS
  // =====================
  
  /**
   * Tự động tính toán khi user thay đổi input
   * 
   * useEffect sẽ chạy mỗi khi amount, duration, hoặc interestRate thay đổi
   */
  useEffect(() => {
    if (amount && interestRate) {
      // Tính số ETH cần thế chấp
      const collateral = calculateRequiredCollateral(
        amount,
        MOCK_ETH_PRICE,
        LOAN_CONFIG.MIN_COLLATERAL_RATIO
      );
      setRequiredCollateral(collateral);
      
      // Tính tiền lãi
      const interest = calculateInterest(amount, parseFloat(interestRate), duration);
      setInterestAmount(interest);
      
      // Tính tổng tiền phải trả
      const total = calculateRepaymentAmount(amount, parseFloat(interestRate), duration);
      setTotalRepayment(total);
    } else {
      // Reset nếu input trống
      setRequiredCollateral('0');
      setInterestAmount('0');
      setTotalRepayment('0');
    }
  }, [amount, duration, interestRate]);

  /**
   * Gợi ý lãi suất dựa trên điểm tín dụng
   */
  useEffect(() => {
    const suggested = getSuggestedInterestRate(MOCK_CREDIT_SCORE);
    // Đặt lãi suất mặc định là trung bình của khoảng gợi ý
    const defaultRate = Math.round((suggested.min + suggested.max) / 2);
    setInterestRate(defaultRate.toString());
  }, []);

  // =====================
  // HANDLERS
  // =====================
  
  /**
   * Xử lý khi user thay đổi số tiền
   */
  const handleAmountChange = (text: string) => {
    // Chỉ cho phép nhập số và dấu chấm
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    
    // Xóa lỗi cũ
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  /**
   * Xử lý khi user thay đổi lãi suất
   */
  const handleInterestRateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setInterestRate(cleaned);
    
    if (errors.interestRate) {
      setErrors(prev => ({ ...prev, interestRate: '' }));
    }
  };

  /**
   * Validate toàn bộ form
   * 
   * @returns true nếu form hợp lệ
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate số tiền
    const amountValidation = validateLoanAmount(amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error || 'Số tiền không hợp lệ';
    }
    
    // Validate lãi suất
    const rateValidation = validateInterestRate(parseFloat(interestRate));
    if (!rateValidation.isValid) {
      newErrors.interestRate = rateValidation.error || 'Lãi suất không hợp lệ';
    }
    
    // Validate ETH balance (đủ thế chấp không)
    const ethBalance = parseFloat(balances.eth);
    const required = parseFloat(requiredCollateral);
    if (ethBalance < required) {
      newErrors.collateral = `Không đủ ETH để thế chấp. Cần ${requiredCollateral} ETH, bạn có ${balances.eth} ETH`;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Hiện preview trước khi xác nhận
   */
  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  /**
   * Xác nhận tạo khoản vay
   */
  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      // TODO: Gọi smart contract để tạo loan
      // Sẽ implement ở phần sau
      
      // Giả lập delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        '✅ Thành công',
        'Yêu cầu vay đã được tạo. Đang chờ người cho vay.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('❌ Lỗi', error.message || 'Không thể tạo yêu cầu vay');
    } finally {
      setIsLoading(false);
      setShowPreview(false);
    }
  };

  // =====================
  // RENDER FUNCTIONS
  // =====================
  
  /**
   * Render chip chọn thời hạn
   */
  const renderDurationChip = (days: number, label: string) => {
    const isSelected = duration === days;
    
    return (
      <TouchableOpacity
        key={days}
        style={[
          styles.durationChip,
          isSelected && styles.durationChipSelected,
        ]}
        onPress={() => setDuration(days)}
        activeOpacity={0.7}>
        <Text
          style={[
            styles.durationChipText,
            isSelected && styles.durationChipTextSelected,
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render preview modal
   */
  const renderPreviewModal = () => {
    if (!showPreview) return null;

    return (
      <View style={styles.previewOverlay}>
        <View style={styles.previewModal}>
          <Text style={styles.previewTitle}>📋 Xác nhận yêu cầu vay</Text>
          
          <View style={styles.previewContent}>
            <PreviewRow label="Số tiền vay" value={`${formatCurrency(amount)} USDT`} />
            <PreviewRow label="Thời hạn" value={`${duration} ngày`} />
            <PreviewRow label="Lãi suất" value={`${interestRate}%/năm`} />
            <PreviewRow label="Tiền lãi" value={`${formatCurrency(interestAmount)} USDT`} />
            <PreviewRow 
              label="Tổng trả" 
              value={`${formatCurrency(totalRepayment)} USDT`} 
              highlight 
            />
            <View style={styles.previewDivider} />
            <PreviewRow 
              label="ETH thế chấp" 
              value={`${requiredCollateral} ETH`}
              highlight
            />
          </View>
          
          <View style={styles.previewWarning}>
            <Text style={styles.previewWarningText}>
              ⚠️ ETH sẽ bị khóa làm tài sản thế chấp cho đến khi bạn trả nợ
            </Text>
          </View>
          
          <View style={styles.previewButtons}>
            <TouchableOpacity
              style={styles.previewCancelButton}
              onPress={() => setShowPreview(false)}
              disabled={isLoading}>
              <Text style={styles.previewCancelText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.previewConfirmButton}
              onPress={handleConfirm}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.previewConfirmText}>Xác nhận</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // =====================
  // MAIN RENDER
  // =====================
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        
        {/* Header - Điểm tín dụng */}
        <View style={styles.creditScoreCard}>
          <Text style={styles.creditScoreLabel}>Điểm tín dụng của bạn</Text>
          <Text style={styles.creditScoreValue}>{MOCK_CREDIT_SCORE}</Text>
          <Text style={styles.creditScoreHint}>
            Lãi suất gợi ý: {getSuggestedInterestRate(MOCK_CREDIT_SCORE).min}% - {getSuggestedInterestRate(MOCK_CREDIT_SCORE).max}%
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          {/* Số tiền vay */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>💰 Số tiền muốn vay (USDT)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Nhập số tiền"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={handleAmountChange}
              />
              <Text style={styles.inputSuffix}>USDT</Text>
            </View>
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
            <Text style={styles.inputHint}>
              Tối thiểu {LOAN_CONFIG.MIN_AMOUNT} - Tối đa {LOAN_CONFIG.MAX_AMOUNT} USDT
            </Text>
          </View>

          {/* Thời hạn vay */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>⏱️ Thời hạn vay</Text>
            <View style={styles.durationContainer}>
              {LOAN_CONFIG.DURATION_OPTIONS.map(opt =>
                renderDurationChip(opt.value, opt.label)
              )}
            </View>
          </View>

          {/* Lãi suất */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📊 Lãi suất đề xuất (%/năm)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Nhập lãi suất"
                placeholderTextColor="#999"
                keyboardType="decimal-pad"
                value={interestRate}
                onChangeText={handleInterestRateChange}
              />
              <Text style={styles.inputSuffix}>%/năm</Text>
            </View>
            {errors.interestRate && (
              <Text style={styles.errorText}>{errors.interestRate}</Text>
            )}
            <Text style={styles.inputHint}>
              Lãi suất cao hơn = cơ hội được vay nhanh hơn
            </Text>
          </View>
        </View>

        {/* Tính toán */}
        {amount && interestRate && (
          <View style={styles.calculationCard}>
            <Text style={styles.calculationTitle}>📊 Tính toán</Text>
            
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Tiền lãi ({duration} ngày)</Text>
              <Text style={styles.calculationValue}>
                {formatCurrency(interestAmount)} USDT
              </Text>
            </View>
            
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Tổng phải trả</Text>
              <Text style={[styles.calculationValue, styles.highlightValue]}>
                {formatCurrency(totalRepayment)} USDT
              </Text>
            </View>
            
            <View style={styles.calculationDivider} />
            
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>
                ETH cần thế chấp (150%)
              </Text>
              <Text style={[styles.calculationValue, styles.ethValue]}>
                {requiredCollateral} ETH
              </Text>
            </View>
            
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Số dư ETH của bạn</Text>
              <Text style={[
                styles.calculationValue,
                parseFloat(balances.eth) < parseFloat(requiredCollateral) && styles.insufficientBalance
              ]}>
                {parseFloat(balances.eth).toFixed(6)} ETH
              </Text>
            </View>
            
            {errors.collateral && (
              <View style={styles.collateralError}>
                <Text style={styles.collateralErrorText}>{errors.collateral}</Text>
              </View>
            )}
          </View>
        )}

        {/* Nút tạo yêu cầu */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!amount || !interestRate) && styles.submitButtonDisabled,
          ]}
          onPress={handlePreview}
          disabled={!amount || !interestRate}
          activeOpacity={0.8}>
          <Text style={styles.submitButtonText}>Xem trước & Tạo yêu cầu</Text>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </KeyboardAvoidingView>
  );
};

// =====================
// HELPER COMPONENT
// =====================

interface PreviewRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const PreviewRow: React.FC<PreviewRowProps> = ({ label, value, highlight }) => (
  <View style={styles.previewRow}>
    <Text style={styles.previewLabel}>{label}</Text>
    <Text style={[styles.previewValue, highlight && styles.previewValueHighlight]}>
      {value}
    </Text>
  </View>
);

// =====================
// STYLES
// =====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Credit Score Card
  creditScoreCard: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  creditScoreLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  creditScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  creditScoreHint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },

  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a2e',
  },
  inputSuffix: {
    paddingRight: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 6,
  },

  // Duration Chips
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  durationChipSelected: {
    backgroundColor: '#667eea',
  },
  durationChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  durationChipTextSelected: {
    color: '#fff',
  },

  // Calculation Card
  calculationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#666',
  },
  calculationValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  highlightValue: {
    color: '#667eea',
    fontSize: 16,
  },
  ethValue: {
    color: '#f59e0b',
  },
  insufficientBalance: {
    color: '#ef4444',
  },
  calculationDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  collateralError: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  collateralErrorText: {
    fontSize: 13,
    color: '#dc2626',
  },

  // Submit Button
  submitButton: {
    backgroundColor: '#667eea',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  bottomPadding: {
    height: 30,
  },

  // Preview Modal
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1a1a2e',
  },
  previewContent: {
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewLabel: {
    fontSize: 14,
    color: '#666',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  previewValueHighlight: {
    color: '#667eea',
    fontSize: 15,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  previewWarning: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  previewWarningText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
  },
  previewButtons: {
    flexDirection: 'row',
  },
  previewCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginRight: 8,
  },
  previewCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  previewConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#667eea',
    borderRadius: 12,
    marginLeft: 8,
  },
  previewConfirmText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
});

export default CreateLoanScreen;