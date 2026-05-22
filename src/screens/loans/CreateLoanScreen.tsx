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
import { CONTRACT_ADDRESSES } from '../../config/walletconnect';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store';
import { useAppDispatch } from '../../store/hooks';
import { useOpenBanking, useToast } from '../../store';
import { loadCreditScore } from '../../store/slices/openBankingSlice';
import { ethers } from 'ethers';


// Price cache — sẽ được update từ oracle khi app load
// Fallback $2000 nếu không lấy được
const MOCK_ETH_PRICE = '2000';

// Buffer 1% để đảm bảo collateral không bị reject do precision loss
const COLLATERAL_BUFFER_PCT = 1.01;

const CreateLoanScreen: React.FC = () => {
  const navigation = useNavigation();
  const { connection, balances, sendTransaction, getProvider, refreshBalances } = useWeb3();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { connections, creditScore } = useOpenBanking();
  const toast = useToast();

  // Lấy điểm tín dụng thực từ store, fallback 0 nếu chưa có
  const realCreditScore = creditScore?.score ?? 0;

  // Hạn mức vay động: lấy từ credit score (backend tính), fallback MAX_AMOUNT nếu chưa có
  const dynamicMaxAmount = creditScore?.loanLimit && creditScore.loanLimit > 0
    ? creditScore.loanLimit
    : parseFloat(LOAN_CONFIG.MAX_AMOUNT);
  const dynamicMinAmount = parseFloat(LOAN_CONFIG.MIN_AMOUNT);

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
  const [creatingStep, setCreatingStep] = useState('');
  const [dynamicRatio, setDynamicRatio] = useState(150);
  const [onChainRatioForDisplay, setOnChainRatioForDisplay] = useState<number | null>(null);

  // =====================
  // ON-CHAIN QUERY HELPERS
  // =====================
  /**
   * Lấy collateral ratio thực tế từ smart contract (dùng chính xác hơn offline calc)
   * Contract dùng CreditScoreOracle on-chain, frontend dùng OpenBanking score → không khớp
   */
  const getOnChainCollateralRatio = async (borrowerAddress: string): Promise<number> => {
    try {
      const provider = getProvider();
      if (!provider) return dynamicRatio;
      const p2pIface = new ethers.utils.Interface([
        'function getCollateralRatioForBorrower(address) view returns (uint256 ratio, uint256 creditScore, bool hasScore)'
      ]);
      const p2pContract = new ethers.Contract(
        CONTRACT_ADDRESSES.P2P_LENDING, p2pIface, provider
      );
      const [ratio] = await p2pContract.getCollateralRatioForBorrower(borrowerAddress);
      // ratio là basis points (15000 = 150%), convert về % (150)
      return Number(ratio) / 100;
    } catch (e) {
      console.warn('Cannot fetch on-chain ratio, using frontend estimate:', e);
      return dynamicRatio;
    }
  };

  // =====================
  // EFFECTS
  // =====================
  // Load điểm tín dụng khi vào màn hình
  useEffect(() => {
    if (!creditScore && user?._id) {
      dispatch(loadCreditScore(user._id));
    }
  }, [creditScore, user?._id, dispatch]);

  // Fetch on-chain collateral ratio khi có địa chỉ ví để preview khớp với giao dịch thực tế
  useEffect(() => {
    if (connection.address) {
      getOnChainCollateralRatio(connection.address).then(r => setOnChainRatioForDisplay(r));
    }
  }, [connection.address]);

  useEffect(() => {
    if (amount && interestRate) {
      // Logic tỉ lệ thế chấp động theo điểm tín dụng đồng bộ với Backend
      let offlineRatio = 190; // Default (POOR)
      if (realCreditScore >= 800) offlineRatio = 135;
      else if (realCreditScore >= 700) offlineRatio = 145;
      else if (realCreditScore >= 600) offlineRatio = 155;
      else if (realCreditScore >= 500) offlineRatio = 165;
      else if (realCreditScore >= 400) offlineRatio = 175;

      setDynamicRatio(offlineRatio);

      // Ưu tiên on-chain ratio (chính xác hơn) nếu đã fetch được
      const ratio = onChainRatioForDisplay ?? offlineRatio;

      const collateralRaw = calculateRequiredCollateral(
        amount,
        MOCK_ETH_PRICE,
        ratio
      );
      // Hiển thị số đã cộng buffer 1% để preview = số thực tế giao dịch
      const collateralWithBuffer = (parseFloat(collateralRaw) * COLLATERAL_BUFFER_PCT).toFixed(6);
      setRequiredCollateral(collateralWithBuffer);
      const interest = calculateInterest(amount, parseFloat(interestRate), duration);
      setInterestAmount(interest);
      const total = calculateRepaymentAmount(amount, parseFloat(interestRate), duration);
      setTotalRepayment(total);
    } else {
      setRequiredCollateral('0');
      setInterestAmount('0');
      setTotalRepayment('0');
    }
  }, [amount, duration, interestRate, realCreditScore, onChainRatioForDisplay]);

  useEffect(() => {
    const score = realCreditScore > 0 ? realCreditScore : 650; // fallback 650 nếu chưa có điểm
    const suggested = getSuggestedInterestRate(score);
    const defaultRate = Math.round((suggested.min + suggested.max) / 2);
    setInterestRate(defaultRate.toString());
  }, [realCreditScore]);

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

    // Validate số tiền vay theo hạn mức động
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Số tiền không hợp lệ';
    } else if (amountNum < dynamicMinAmount) {
      newErrors.amount = `Số tiền tối thiểu là ${dynamicMinAmount} USDT`;
    } else if (amountNum > dynamicMaxAmount) {
      newErrors.amount = creditScore?.loanLimit
        ? `Vượt hạn mức tín dụng (${formatCurrency(dynamicMaxAmount.toString())} USDT). Nâng điểm tín dụng để tăng hạn mức.`
        : `Số tiền tối đa là ${formatCurrency(dynamicMaxAmount.toString())} USDT`;
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
      // Bước 1: Gửi yêu cầu vay và khóa ETH trên smart contract
      setCreatingStep('Đang khởi tạo yêu cầu vay trên blockchain...');

      // FIX: Dùng connection.address (ví đang kết nối thực tế) thay vì getSigner() lấy account #0
      const borrowerAddress = connection.address;
      const onChainRatio = borrowerAddress
        ? await getOnChainCollateralRatio(borrowerAddress)
        : dynamicRatio;

      // Tính collateral theo on-chain ratio + 1% buffer (để tránh cạn do precision)
      const requiredCollateralExact = calculateRequiredCollateral(
        amount, MOCK_ETH_PRICE, onChainRatio
      );
      // Tăng 1% buffer để đảm bảo luôn pass collateral check
      const collateralWithBuffer = (parseFloat(requiredCollateralExact) * COLLATERAL_BUFFER_PCT).toFixed(6);

      const collateralInWei = ethers.utils.parseEther(collateralWithBuffer);
      const principalInWei = ethers.utils.parseUnits(amount, 6); // USDT 6 decimals

      const p2pInterface = new ethers.utils.Interface([
        // Struct field order (phải khớp chính xác với IP2PLending.sol):
        // loanToken, collateralToken, principal, interestRate, collateralAmount, duration,
        // loanTokenDecimals (field 7), collateralDecimals (field 8)
        'function createLoanRequest((address loanToken, address collateralToken, uint256 principal, uint256 interestRate, uint256 collateralAmount, uint256 duration, uint8 loanTokenDecimals, uint8 collateralDecimals)) returns (uint256)',
        // Event signature phải khớp với IP2PLending.sol để parse log
        'event LoanRequestCreated(uint256 indexed requestId, address indexed borrower, address loanToken, address collateralToken, uint256 principal, uint256 interestRate, uint256 collateralAmount, uint256 duration, uint256 collateralRatio)'
      ]);

      const interestRateBP = Math.round(parseFloat(interestRate) * 100);
      const durationSeconds = duration * 86400;

      const data = p2pInterface.encodeFunctionData('createLoanRequest', [[
        CONTRACT_ADDRESSES.USDT,          // loanToken
        ethers.constants.AddressZero,     // collateralToken (ETH = address(0))
        principalInWei,                   // principal
        interestRateBP,                   // interestRate (basis points)
        collateralInWei,                  // collateralAmount (ETH in wei)
        durationSeconds,                  // duration (seconds)
        6,                                // FIX: loanTokenDecimals (USDT = 6) — field 7
        18,                               // FIX: collateralDecimals (ETH = 18) — field 8
      ]]);


      const txHash = await sendTransaction({
        to: CONTRACT_ADDRESSES.P2P_LENDING,
        value: collateralInWei,
        data: data,
        gasLimit: 5000000, // Tăng gas limit để tránh lỗi out of gas
      });

      if (!txHash) {
        setIsLoading(false);
        setCreatingStep('');
        return;
      }

      // Lấy onChainRequestId từ event
      setCreatingStep('Đang xác nhận giao dịch...');
      let onChainRequestId = undefined;
      const provider = getProvider();
      if (provider) {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);
          for (const log of receipt.logs) {
            try {
              const parsedLog = p2pInterface.parseLog(log);
              if (parsedLog.name === 'LoanRequestCreated') {
                onChainRequestId = parsedLog.args.requestId.toNumber();
                break;
              }
            } catch (e) {
              // ignore logs from other contracts
            }
          }
        } catch (e) {
          console.log('Error parsing receipt:', e);
        }
      }

      // Bước 2: Gọi API backend để tạo loan request (gửi kèm txHash và onChainRequestId)
      setCreatingStep('Đang ghi nhận yêu cầu vay...');
      const { loanApi } = await import('../../api/loan.api');
      await loanApi.createLoanRequest({
        loanAmount: parseFloat(amount),
        interestRate: parseFloat(interestRate),
        durationDays: duration,
        purpose: 'personal',
        collateralType: 'crypto',
        collateralAmount: parseFloat(requiredCollateral),
        collateralTxHash: txHash,
        onChainRequestId: onChainRequestId,
      } as any);

      // Bước 3: Refresh balances
      await refreshBalances();

      toast.success(
        `Yêu cầu vay đã được tạo.\n${requiredCollateral} ETH đã được khóa thế chấp.\n\nTX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        'Thành công'
      );
      setShowPreview(false);
      navigation.goBack();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Không thể tạo yêu cầu vay';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsLoading(false);
      setShowPreview(false);
      setCreatingStep('');
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
          <Text style={styles.previewTitle}>Xác nhận yêu cầu vay</Text>
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
              ETH sẽ bị khóa làm tài sản thế chấp cho đến khi bạn trả nợ
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
            <Text style={styles.creditScoreValue}>
              {realCreditScore > 0 ? realCreditScore : 'Chưa có'}
            </Text>
            <Text style={styles.creditScoreHint}>
              {realCreditScore > 0
                ? `Lãi suất gợi ý: ${getSuggestedInterestRate(realCreditScore).min}% - ${getSuggestedInterestRate(realCreditScore).max}%`
                : 'Liên kết ngân hàng để tính điểm tín dụng'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            {/* Số tiền vay */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số tiền muốn vay (USDT)</Text>
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
                Tối thiểu {dynamicMinAmount} - Tối đa {formatCurrency(dynamicMaxAmount.toString())} USDT
                {creditScore?.loanLimit ? ` (Hạn mức tín dụng)` : ''}
              </Text>
            </View>

            {/* Thời hạn vay */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Thời hạn vay</Text>
              <View style={styles.durationContainer}>
                {LOAN_CONFIG.DURATION_OPTIONS.map(opt => renderDurationChip(opt.value, opt.label))}
              </View>
            </View>

            {/* Lãi suất */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lãi suất đề xuất (%/năm)</Text>
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
              <Text style={styles.calculationTitle}>Tính toán</Text>
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
                <Text style={styles.calculationLabel}>ETH cần thế chấp ({dynamicRatio}%)</Text>
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