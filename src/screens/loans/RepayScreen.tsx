/**
 * =================================================================
 * REPAY SCREEN - Màn hình trả nợ
 * =================================================================
 * 
 * Màn hình hiển thị chi tiết khoản vay đang active và cho phép
 * Borrower trả nợ thông qua smart contract.
 *
 * FLOW:
 * Xem chi tiết → Xem tổng tiền phải trả → Confirm → Gọi smart contract repay()
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Card } from '@/components/common';
import { useTheme, useWeb3 } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { CONTRACT_ADDRESSES } from '@/config/walletconnect';
import {
  calculateInterest,
  calculateRepaymentAmount,
  calculateDaysRemaining,
  calculatePenalty,
  formatDaysRemaining,
  isLoanOverdue,
  formatCurrency,
} from '@/utils/loanCalculations';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useToast } from '@/store';
import { ethers } from 'ethers';

type RepayScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'RepayLoan'>;
  route: RouteProp<RootStackParamList, 'RepayLoan'>;
};

const RepayScreen: React.FC<RepayScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { balances, connection, sendUSDT, sendTransaction, refreshBalances } = useWeb3();
  const { loanId } = route.params;
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);
  const [repayStep, setRepayStep] = useState('');

  const [loan, setLoan] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Helper: Safely convert numeric values from API
  const toNum = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
    return parseFloat(String(val)) || 0;
  };

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const { loanApi } = await import('@/api/loan.api');
        const res = await loanApi.getLoanDetail(loanId);
        const data = res?.data || res;
        
        setLoan({
          id: data._id || loanId,
          amount: toNum(data.principalAmount || data.loanAmount).toString(),
          interestRate: toNum(data.interestRate),
          duration: toNum(data.durationDays),
          startDate: new Date(data.startDate || Date.now()).getTime(),
          dueDate: new Date(data.dueDate || Date.now() + 30 * 24 * 3600000).getTime(),
          collateralAmount: toNum(data.collateralAmount).toString(),
          lender: data.lenderId?.fullName || 'Người cho vay',
          lenderWallet: data.lenderId?.walletAddress,
          status: data.status,
          loanContractAddress: data.loanContractAddress,
        });
      } catch (err) {
        console.log('Error fetching loan:', err);
        Alert.alert('Lỗi', 'Không thể tải chi tiết khoản vay');
        navigation.goBack();
      } finally {
        setLoadingData(false);
      }
    };
    fetchLoanData();
  }, [loanId]);

  // Fetch QR repayment data từ Open Banking
  useEffect(() => {
    const fetchQRData = async () => {
      try {
        const { loanApi } = await import('@/api/loan.api');
        const result = await loanApi.getRepaymentQR(loanId);
        if (result?.qrAvailable) {
          setQrData(result);
        }
      } catch (error) {
        console.log('QR repayment not available:', error);
      }
    };
    fetchQRData();
  }, [loanId]);

  if (loadingData || !loan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      </SafeAreaView>
    );
  }

  // Tính toán
  const daysRemaining = calculateDaysRemaining(loan.dueDate);
  const overdue = isLoanOverdue(loan.dueDate);
  const interest = calculateInterest(loan.amount, loan.interestRate, loan.duration);
  const penalty = calculatePenalty(loan.amount, loan.dueDate);
  const totalRepayment = (
    parseFloat(loan.amount) + parseFloat(interest) + parseFloat(penalty)
  ).toFixed(2);
  const progressPercent = Math.min(
    ((loan.duration - Math.max(daysRemaining, 0)) / loan.duration) * 100,
    100
  );

  const handleRepay = async () => {
    setIsLoading(true);
    try {
      let txHash = null;

      if (loan.loanContractAddress) {
        // LUỒNG CHUẨN BLOCKCHAIN
        setRepayStep('Đang ủy quyền chuyển USDT cho Smart Contract...');
        
        // 1. Approve USDT cho Loan contract
        const usdtInterface = new ethers.utils.Interface(['function approve(address spender, uint256 amount) returns (bool)']);
        const approveData = usdtInterface.encodeFunctionData('approve', [
          loan.loanContractAddress,
          ethers.utils.parseUnits(totalRepayment, 6)
        ]);
        
        const approveTx = await sendTransaction({
          to: CONTRACT_ADDRESSES.USDT,
          data: approveData
        });

        if (!approveTx) {
          setIsLoading(false);
          setRepayStep('');
          return;
        }

        // 2. Gọi hàm repay trên Loan contract
        setRepayStep('Đang xử lý trả nợ và hoàn trả ETH...');
        const loanInterface = new ethers.utils.Interface(['function repay()']);
        const repayData = loanInterface.encodeFunctionData('repay', []);
        
        txHash = await sendTransaction({
          to: loan.loanContractAddress,
          data: repayData,
          gasLimit: 500000 // Tăng gas limit vì thực hiện nhiều việc
        });
      } else {
        // LUỒNG CŨ
        setRepayStep('Đang chuyển USDT trên blockchain...');
        if (!loan.lenderWallet) {
          toast.error('Người cho vay chưa liên kết ví nhận thanh toán.', 'Lỗi');
          setIsLoading(false);
          return;
        }
        txHash = await sendUSDT(loan.lenderWallet, totalRepayment);
      }

      if (!txHash) {
        setIsLoading(false);
        setRepayStep('');
        return;
      }

      // Bước 2: Gọi API backend ghi nhận trả nợ
      setRepayStep('Đang ghi nhận trên hệ thống...');
      const { loanApi } = await import('@/api/loan.api');
      await loanApi.repayLoan(loanId, {
        txHash,
        amount: parseFloat(totalRepayment),
      });

      // Bước 3: Refresh balances
      await refreshBalances();

      toast.success(
        `Bạn đã trả ${formatCurrency(totalRepayment)} USDT.\nTài sản thế chấp ${loan.collateralAmount} ETH đã được hoàn trả.\n\nTX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        'Trả nợ thành công'
      );
      navigation.goBack();
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Không thể trả nợ. Vui lòng thử lại.';
      toast.error(msg, 'Lỗi');
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
      setRepayStep('');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Trả nợ</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loan Info Card */}
        <LinearGradient
          colors={overdue ? ['#ef4444', '#dc2626'] : [colors.accentBlue, '#1a73e8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loanInfoCard}
        >
          <Text style={styles.loanInfoLabel}>Số tiền đã vay</Text>
          <Text style={styles.loanInfoAmount}>{formatCurrency(loan.amount)} USDT</Text>
          <View style={styles.loanInfoRow}>
            <View style={styles.loanInfoItem}>
              <Text style={styles.loanInfoItemLabel}>Lãi suất</Text>
              <Text style={styles.loanInfoItemValue}>{loan.interestRate}%/năm</Text>
            </View>
            <View style={styles.loanInfoItem}>
              <Text style={styles.loanInfoItemLabel}>Thời hạn</Text>
              <Text style={styles.loanInfoItemValue}>{loan.duration} ngày</Text>
            </View>
            <View style={styles.loanInfoItem}>
              <Text style={styles.loanInfoItemLabel}>Người cho vay</Text>
              <Text style={styles.loanInfoItemValue}>{loan.lender}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Countdown Card */}
        <Card style={styles.countdownCard}>
          <View style={styles.countdownHeader}>
            <Ionicons
              name={overdue ? 'alert-circle' : 'time-outline'}
              size={24}
              color={overdue ? colors.redError : colors.yellowWarning}
            />
            <Text
              style={[
                styles.countdownTitle,
                { color: overdue ? colors.redError : colors.textWhite },
              ]}
            >
              {overdue ? '⚠️ Đã quá hạn!' : '⏰ Thời gian còn lại'}
            </Text>
          </View>
          <Text
            style={[
              styles.countdownValue,
              { color: overdue ? colors.redError : colors.yellowWarning },
            ]}
          >
            {formatDaysRemaining(daysRemaining)}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.darkBackground }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: overdue ? colors.redError : colors.accentBlue,
                  },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: colors.textGray }]}>Ngày bắt đầu</Text>
              <Text style={[styles.progressLabel, { color: colors.textGray }]}>Ngày đáo hạn</Text>
            </View>
          </View>
        </Card>

        {/* Repayment Breakdown Card */}
        <Card style={styles.breakdownCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>
            📊 Chi tiết thanh toán
          </Text>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textGray }]}>Tiền gốc</Text>
            <Text style={[styles.breakdownValue, { color: colors.textWhite }]}>
              {formatCurrency(loan.amount)} USDT
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textGray }]}>
              Tiền lãi ({loan.duration} ngày × {loan.interestRate}%/năm)
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.yellowWarning }]}>
              +{formatCurrency(interest)} USDT
            </Text>
          </View>

          {parseFloat(penalty) > 0 && (
            <View style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.redError }]}>
                Phí phạt quá hạn ({Math.abs(daysRemaining)} ngày)
              </Text>
              <Text style={[styles.breakdownValue, { color: colors.redError }]}>
                +{formatCurrency(penalty)} USDT
              </Text>
            </View>
          )}

          <View style={[styles.breakdownDivider, { backgroundColor: colors.darkBorder }]} />

          <View style={[styles.totalRow, { backgroundColor: colors.accentBlue + '15' }]}>
            <Text style={[styles.totalLabel, { color: colors.textWhite }]}>💰 Tổng cần trả</Text>
            <Text style={[styles.totalValue, { color: colors.accentBlue }]}>
              {formatCurrency(totalRepayment)} USDT
            </Text>
          </View>
        </Card>

        {/* Wallet Balance Card */}
        <Card style={styles.walletCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>👛 Số dư ví</Text>

          <View style={styles.walletRow}>
            <View style={styles.walletItem}>
              <Text style={[styles.walletLabel, { color: colors.textGray }]}>USDT</Text>
              <Text
                style={[
                  styles.walletValue,
                  {
                    color:
                      parseFloat(balances.usdt) >= parseFloat(totalRepayment)
                        ? colors.greenSuccess
                        : colors.redError,
                  },
                ]}
              >
                {parseFloat(balances.usdt).toFixed(2)} USDT
              </Text>
            </View>
            <View style={styles.walletItem}>
              <Text style={[styles.walletLabel, { color: colors.textGray }]}>Sẽ nhận lại</Text>
              <Text style={[styles.walletValue, { color: colors.greenSuccess }]}>
                {loan.collateralAmount} ETH
              </Text>
            </View>
          </View>

          {parseFloat(balances.usdt) < parseFloat(totalRepayment) && (
            <View style={[styles.insufficientWarning, { backgroundColor: colors.redError + '15' }]}>
              <Ionicons name="warning" size={16} color={colors.redError} />
              <Text style={[styles.insufficientText, { color: colors.redError }]}>
                Số dư USDT không đủ để trả nợ. Cần nạp thêm{' '}
                {(parseFloat(totalRepayment) - parseFloat(balances.usdt)).toFixed(2)} USDT.
              </Text>
            </View>
          )}
        </Card>

        {/* Open Banking QR Payment Card */}
        {qrData && qrData.qrAvailable && (
          <Card style={styles.breakdownCard}>
            <Text style={[styles.cardTitle, { color: colors.textWhite }]}>
              🏦 Trả nợ qua Ngân hàng (Open Banking)
            </Text>

            <View style={[styles.qrBankInfo, { backgroundColor: colors.accentBlue + '10' }]}>
              <View style={styles.qrBankRow}>
                <Ionicons name="business-outline" size={20} color={colors.accentBlue} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[{ color: colors.textGray, fontSize: 12 }]}>Chuyển khoản cho</Text>
                  <Text style={[{ color: colors.textWhite, fontSize: 15, fontWeight: '600' }]}>
                    {qrData.loanInfo?.lenderBank?.accountName || 'Người cho vay'}
                  </Text>
                  <Text style={[{ color: colors.textGray, fontSize: 13 }]}>
                    {qrData.loanInfo?.lenderBank?.bankName || ''}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.qrButton, { backgroundColor: colors.accentBlue + '15', borderColor: colors.accentBlue, borderWidth: 1 }]}
              onPress={() => setShowQR(!showQR)}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code-outline" size={20} color={colors.accentBlue} />
              <Text style={[{ color: colors.accentBlue, fontSize: 14, fontWeight: '600', marginLeft: 8 }]}>
                {showQR ? 'Ẩn mã QR' : 'Hiện mã QR thanh toán VietQR'}
              </Text>
            </TouchableOpacity>

            {showQR && qrData.qrData?.qrDataUrl && (
              <View style={styles.qrContainer}>
                <Image
                  source={{ uri: qrData.qrData.qrDataUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
                <Text style={[{ color: colors.textGray, fontSize: 12, textAlign: 'center', marginTop: 8 }]}>
                  Quét mã QR bằng ứng dụng ngân hàng để trả nợ
                </Text>
                <Text style={[{ color: colors.yellowWarning, fontSize: 11, textAlign: 'center', marginTop: 4 }]}>
                  Số tiền: {formatCurrency(String(qrData.loanInfo?.totalToRepay || totalRepayment))} VND
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: colors.accentBlue + '10' }]}>
          <Ionicons name="information-circle" size={20} color={colors.accentBlue} />
          <Text style={[styles.infoNoteText, { color: colors.textGray }]}>
            Sau khi trả nợ thành công, tài sản thế chấp ({loan.collateralAmount} ETH) sẽ được tự
            động hoàn trả về ví của bạn.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer — Nút Trả nợ */}
      <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
        <TouchableOpacity
          style={[
            styles.repayButton,
            {
              backgroundColor:
                parseFloat(balances.usdt) >= parseFloat(totalRepayment)
                  ? colors.accentBlue
                  : colors.textGray,
            },
          ]}
          onPress={() => setShowConfirm(true)}
          disabled={parseFloat(balances.usdt) < parseFloat(totalRepayment)}
          activeOpacity={0.8}
        >
          <Ionicons name="card-outline" size={20} color="#fff" />
          <Text style={styles.repayButtonText}>
            Trả {formatCurrency(totalRepayment)} USDT
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      {showConfirm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.darkSurface }]}>
            <Text style={[styles.modalTitle, { color: colors.textWhite }]}>
              📋 Xác nhận trả nợ
            </Text>

            <View style={styles.modalBody}>
              <ModalRow label="Số tiền gốc" value={`${formatCurrency(loan.amount)} USDT`} />
              <ModalRow label="Tiền lãi" value={`${formatCurrency(interest)} USDT`} />
              {parseFloat(penalty) > 0 && (
                <ModalRow label="Phí phạt" value={`${formatCurrency(penalty)} USDT`} isWarning />
              )}
              <View style={[styles.modalDivider, { backgroundColor: colors.darkBorder }]} />
              <ModalRow label="Tổng trả" value={`${formatCurrency(totalRepayment)} USDT`} isHighlight />
              <ModalRow label="ETH nhận lại" value={`${loan.collateralAmount} ETH`} isSuccess />
            </View>

            <View style={[styles.modalWarning, { backgroundColor: colors.yellowWarning + '15' }]}>
              <Text style={[styles.modalWarningText, { color: colors.yellowWarning }]}>
                ⚠️ Giao dịch blockchain không thể hoàn tác sau khi xác nhận.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.darkBorder }]}
                onPress={() => setShowConfirm(false)}
                disabled={isLoading}
              >
                <Text style={[styles.modalCancelText, { color: colors.textGray }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accentBlue }]}
                onPress={handleRepay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Xác nhận trả nợ</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// Helper component for modal rows
interface ModalRowProps {
  label: string;
  value: string;
  isHighlight?: boolean;
  isWarning?: boolean;
  isSuccess?: boolean;
}

const ModalRow: React.FC<ModalRowProps> = ({ label, value, isHighlight, isWarning, isSuccess }) => (
  <View style={styles.modalRow}>
    <Text style={[styles.modalLabel, isWarning && { color: '#ef4444' }]}>{label}</Text>
    <Text
      style={[
        styles.modalValue,
        isHighlight && styles.modalValueHighlight,
        isWarning && { color: '#ef4444' },
        isSuccess && { color: '#10b981' },
      ]}
    >
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 24 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  // Loan Info Card (gradient)
  loanInfoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  loanInfoLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  loanInfoAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  loanInfoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  loanInfoItem: { alignItems: 'center' },
  loanInfoItemLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  loanInfoItemValue: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Countdown Card
  countdownCard: { marginBottom: 16 },
  countdownHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  countdownTitle: { fontSize: 16, fontWeight: '600' },
  countdownValue: { fontSize: 28, fontWeight: 'bold', marginBottom: 16 },
  progressContainer: { marginTop: 4 },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabel: { fontSize: 11 },

  // Breakdown Card
  breakdownCard: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: { fontSize: 13, flex: 1 },
  breakdownValue: { fontSize: 14, fontWeight: '600' },
  breakdownDivider: { height: 1, marginVertical: 8 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },

  // Wallet Card
  walletCard: { marginBottom: 16 },
  walletRow: { flexDirection: 'row', gap: 16 },
  walletItem: { flex: 1 },
  walletLabel: { fontSize: 12, marginBottom: 4 },
  walletValue: { fontSize: 18, fontWeight: 'bold' },
  insufficientWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  insufficientText: { fontSize: 12, flex: 1 },

  // Info Note
  infoNote: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: 'flex-start',
  },
  infoNoteText: { fontSize: 13, lineHeight: 20, flex: 1 },

  // QR Payment
  qrBankInfo: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  qrBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 4,
  },
  qrImage: {
    width: 250,
    height: 250,
  },

  // Footer
  footer: { padding: 20, borderTopWidth: 1 },
  repayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  repayButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalBody: { marginBottom: 16 },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalLabel: { fontSize: 14, color: '#888' },
  modalValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  modalValueHighlight: { color: '#4a90d9', fontSize: 16 },
  modalDivider: { height: 1, marginVertical: 4 },
  modalWarning: { padding: 12, borderRadius: 8, marginBottom: 20 },
  modalWarningText: { fontSize: 13, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  modalCancelText: { fontSize: 15, fontWeight: '500' },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});

export default RepayScreen;
