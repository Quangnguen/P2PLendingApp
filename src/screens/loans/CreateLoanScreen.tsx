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
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth, useOpenBanking } from '../../store';

const MOCK_CREDIT_SCORE = 680;
const MOCK_ETH_PRICE = '2500';

const CreateLoanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { balances } = useWeb3();
  const { user } = useAuth();
  const { connections } = useOpenBanking();

  // =====================
  // STATE
  // =====================
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [interestRate, setInterestRate] = useState('');
  const [requiredCollateral, setRequiredCollateral] = useState('0');
  const [interestAmount, setInterestAmount] = useState('0');
  const [totalRepayment, setTotalRepayment] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // =====================
  // EFFECTS
  // =====================
  useEffect(() => {
    if (amount && interestRate) {
      const collateral = calculateRequiredCollateral(
        amount,
        MOCK_ETH_PRICE,
        LOAN_CONFIG.MIN_COLLATERAL_RATIO
      );
      setRequiredCollateral(collateral);
      const interest = calculateInterest(amount, parseFloat(interestRate), duration);
      setInterestAmount(interest);
      const total = calculateRepaymentAmount(amount, parseFloat(interestRate), duration);
      setTotalRepayment(total);
    } else {
      setRequiredCollateral('0');
      setInterestAmount('0');
      setTotalRepayment('0');
    }
  }, [amount, duration, interestRate]);

  useEffect(() => {
    const suggested = getSuggestedInterestRate(MOCK_CREDIT_SCORE);
    const defaultRate = Math.round((suggested.min + suggested.max) / 2);
    setInterestRate(defaultRate.toString());
  }, []);

  // Check prerequisites
  useEffect(() => {
    if (user && user.kycStatus !== 'verified') {
      Alert.alert(
        'Yêu cầu xác thực',
        'Bạn cần hoàn thành KYC trước khi tạo yêu cầu vay.',
        [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
      );
    } else if (connections && connections.length === 0) {
      Alert.alert(
        'Yêu cầu liên kết',
        'Bạn cần liên kết ngân hàng trước khi tạo yêu cầu vay.',
        [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
      );
    }
  }, [user, connections, navigation]);

  // =====================
  // HANDLERS
  // =====================
  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleInterestRateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setInterestRate(cleaned);
    if (errors.interestRate) {
      setErrors(prev => ({ ...prev, interestRate: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amountValidation = validateLoanAmount(amount);
    if (!amountValidation.isValid) {
      newErrors.amount = amountValidation.error || 'Số tiền không hợp lệ';
    }
    const rateValidation = validateInterestRate(parseFloat(interestRate));
    if (!rateValidation.isValid) {
      newErrors.interestRate = rateValidation.error || 'Lãi suất không hợp lệ';
    }
    const ethBalance = parseFloat(balances.eth);
    const required = parseFloat(requiredCollateral);
    if (ethBalance < required) {
      newErrors.collateral = `Không đủ ETH để thế chấp. Cần ${requiredCollateral} ETH, bạn có ${balances.eth} ETH`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const { loanApi } = await import('../../api/loan.api');
      await loanApi.createLoanRequest({
        loanAmount: parseFloat(amount),
        interestRate: parseFloat(interestRate),
        durationDays: duration,
        purpose: 'personal',
        collateralType: 'crypto',
        collateralAmount: parseFloat(requiredCollateral),
      });
      Alert.alert(
        '✅ Thành công',
        'Yêu cầu vay đã được tạo. Đang chờ người cho vay.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Không thể tạo yêu cầu vay';
      Alert.alert('❌ Lỗi', msg);
    } finally {
      setIsLoading(false);
      setShowPreview(false);
    }
  };

  // =====================
  // RENDER FUNCTIONS
  // =====================
  const renderDurationChip = (days: number, label: string) => {
    const isSelected = duration === days;
    return (
      <TouchableOpacity
        key={days}
        style={[styles.durationChip, isSelected && styles.durationChipSelected]}
        onPress={() => setDuration(days)}
        activeOpacity={0.7}>
        <Text style={[styles.durationChipText, isSelected && styles.durationChipTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

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
            <PreviewRow label="Tổng trả" value={`${formatCurrency(totalRepayment)} USDT`} highlight />
            <View style={styles.previewDivider} />
            <PreviewRow label="ETH thế chấp" value={`${requiredCollateral} ETH`} highlight />
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header với nút Back */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#1a1a2e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo yêu cầu vay</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
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
              {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
              <Text style={styles.inputHint}>
                Tối thiểu {LOAN_CONFIG.MIN_AMOUNT} - Tối đa {LOAN_CONFIG.MAX_AMOUNT} USDT
              </Text>
            </View>

            {/* Thời hạn vay */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>⏱️ Thời hạn vay</Text>
              <View style={styles.durationContainer}>
                {LOAN_CONFIG.DURATION_OPTIONS.map(opt => renderDurationChip(opt.value, opt.label))}
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
              {errors.interestRate && <Text style={styles.errorText}>{errors.interestRate}</Text>}
              <Text style={styles.inputHint}>Lãi suất cao hơn = cơ hội được vay nhanh hơn</Text>
            </View>
          </View>

          {/* Tính toán */}
          {amount && interestRate && (
            <View style={styles.calculationCard}>
              <Text style={styles.calculationTitle}>📊 Tính toán</Text>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Tiền lãi ({duration} ngày)</Text>
                <Text style={styles.calculationValue}>{formatCurrency(interestAmount)} USDT</Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Tổng phải trả</Text>
                <Text style={[styles.calculationValue, styles.highlightValue]}>
                  {formatCurrency(totalRepayment)} USDT
                </Text>
              </View>
              <View style={styles.calculationDivider} />
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>ETH cần thế chấp (150%)</Text>
                <Text style={[styles.calculationValue, styles.ethValue]}>{requiredCollateral} ETH</Text>
              </View>
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Số dư ETH của bạn</Text>
                <Text
                  style={[
                    styles.calculationValue,
                    parseFloat(balances.eth) < parseFloat(requiredCollateral) && styles.insufficientBalance,
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
            style={[styles.submitButton, (!amount || !interestRate) && styles.submitButtonDisabled]}
            onPress={handlePreview}
            disabled={!amount || !interestRate}
            activeOpacity={0.8}>
            <Text style={styles.submitButtonText}>Xem trước & Tạo yêu cầu</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {renderPreviewModal()}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    <Text style={[styles.previewValue, highlight && styles.previewValueHighlight]}>{value}</Text>
  </View>
);

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    fontSize: 24,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  headerRight: {
    width: 40, // Để cân bằng với nút back
  },

  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
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