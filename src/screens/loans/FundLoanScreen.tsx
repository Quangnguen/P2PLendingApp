/**
 * =================================================================
 * FUND LOAN SCREEN - Màn hình cấp vốn cho khoản vay
 * =================================================================
 *
 * Màn hình cho Lender:
 * 1. Xem chi tiết yêu cầu vay từ marketplace
 * 2. Phân tích rủi ro (credit score, collateral ratio)
 * 3. Tính lợi nhuận dự kiến
 * 4. Xác nhận cấp vốn → gọi smart contract fundLoanRequest()
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
  formatCurrency,
} from '@/utils/loanCalculations';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth, useOpenBanking } from '@/store';

type FundLoanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FundLoan'>;
  route: RouteProp<RootStackParamList, 'FundLoan'>;
};

const FundLoanScreen: React.FC<FundLoanScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { balances, connection, sendUSDT, refreshBalances } = useWeb3();
  const { user } = useAuth();
  const { connections } = useOpenBanking();
  const { requestId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loanRequest, setLoanRequest] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [fundingStep, setFundingStep] = useState('');

  // Helper: Safely convert MongoDB Decimal128 to number
  const toNum = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
    return parseFloat(String(val)) || 0;
  };

  // Fetch loan request data từ API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const { loanApi } = await import('@/api/loan.api');
        const data = await loanApi.getRequestDetail(requestId);
        const reqData = data?.data || data;

        // Tính collateral ratio thực tế
        const loanAmount = toNum(reqData.loanAmount);
        const collateral = toNum(reqData.collateralAmount);
        // collateralRatio = (collateral * ethPrice / loanAmount) * 100
        // Tạm dùng giá ETH mặc định 2500 USDT
        const ethPrice = 2500;
        const collateralValueUSDT = collateral * ethPrice;
        const actualCollateralRatio = loanAmount > 0
          ? Math.round((collateralValueUSDT / loanAmount) * 100)
          : 0;

        setLoanRequest({
          id: requestId,
          borrowerAlias: reqData.borrowerId?.fullName || `Borrower #${requestId.slice(-4)}`,
          borrowerWallet: reqData.borrowerId?.walletAddress || null,
          amount: String(loanAmount),
          interestRate: toNum(reqData.interestRate),
          duration: toNum(reqData.durationDays),
          purpose: reqData.purpose || 'Cá nhân',
          purposeDescription: reqData.purposeDescription || '',
          creditScore: toNum(reqData.borrowerId?.creditScore),
          collateralAmount: String(collateral),
          collateralRatio: actualCollateralRatio,
          reputationScore: toNum(reqData.borrowerId?.reputationScore),
          createdAt: new Date(reqData.createdAt).getTime(),
          expiresAt: reqData.expiresAt ? new Date(reqData.expiresAt).getTime() : null,
        });
      } catch (err) {
        console.error('Error fetching request:', err);
        Alert.alert('❌ Lỗi', 'Không thể tải thông tin khoản vay.');
        navigation.goBack();
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [requestId]);

  if (loadingData || !loanRequest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={{ color: colors.textGray, marginTop: 12 }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Tính toán
  const expectedInterest = calculateInterest(
    loanRequest.amount,
    loanRequest.interestRate,
    loanRequest.duration
  );
  const totalReturn = calculateRepaymentAmount(
    loanRequest.amount,
    loanRequest.interestRate,
    loanRequest.duration
  );
  const profit = expectedInterest;

  // Đánh giá rủi ro
  const getRiskLevel = (creditScore: number, collateralRatio: number) => {
    if (creditScore >= 750 && collateralRatio >= 150) return { level: 'Thấp', color: '#10b981', icon: 'shield-checkmark' };
    if (creditScore >= 650 && collateralRatio >= 130) return { level: 'Trung bình', color: '#f59e0b', icon: 'shield-half' };
    return { level: 'Cao', color: '#ef4444', icon: 'warning' };
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return colors.greenSuccess;
    if (score >= 650) return colors.yellowWarning;
    return colors.redError;
  };

  const getCreditScoreLabel = (score: number) => {
    if (score >= 750) return 'Xuất sắc';
    if (score >= 700) return 'Tốt';
    if (score >= 650) return 'Khá';
    return 'Trung bình';
  };

  const risk = getRiskLevel(loanRequest.creditScore, loanRequest.collateralRatio);

  const handleFund = async () => {
    setIsLoading(true);
    try {
      // Bước 1: Chuyển USDT on-chain (thật)
      setFundingStep('Đang chuyển USDT trên blockchain...');
      
      // Địa chỉ nhận: P2P Lending contract hoặc borrower wallet
      const recipientAddress = CONTRACT_ADDRESSES.P2P_LENDING;
      const txHash = await sendUSDT(recipientAddress, loanRequest.amount);
      
      if (!txHash) {
        // sendUSDT đã hiện alert lỗi rồi
        setIsLoading(false);
        setFundingStep('');
        return;
      }

      // Bước 2: Gọi API backend để ghi nhận khoản đầu tư
      setFundingStep('Đang ghi nhận trên hệ thống...');
      const { loanApi } = await import('@/api/loan.api');
      await loanApi.fundLoan(requestId, { txHash });

      // Bước 3: Refresh balances
      await refreshBalances();

      Alert.alert(
        '✅ Cấp vốn thành công',
        `Bạn đã cấp vốn ${formatCurrency(loanRequest.amount)} USDT.\nLợi nhuận dự kiến: ${formatCurrency(profit)} USDT.\n\nTX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Không thể cấp vốn. Vui lòng thử lại.';
      Alert.alert('❌ Lỗi', msg);
    } finally {
      setIsLoading(false);
      setShowConfirm(false);
      setFundingStep('');
    }
  };

  const hasEnoughBalance = parseFloat(balances.usdt) >= parseFloat(loanRequest.amount);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Cấp vốn cho khoản vay</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loan Request Info Card */}
        <LinearGradient
          colors={[colors.accentBlue, '#1a73e8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.requestCard}
        >
          <View style={styles.requestHeader}>
            <View>
              <Text style={styles.requestLabel}>Số tiền cần vay</Text>
              <Text style={styles.requestAmount}>{formatCurrency(loanRequest.amount)} USDT</Text>
            </View>
            <View style={styles.requestPurposeBadge}>
              <Text style={styles.requestPurposeText}>{loanRequest.purpose}</Text>
            </View>
          </View>

          <View style={styles.requestDetails}>
            <View style={styles.requestDetailItem}>
              <Text style={styles.requestDetailLabel}>Lãi suất</Text>
              <Text style={styles.requestDetailValue}>{loanRequest.interestRate}%/năm</Text>
            </View>
            <View style={styles.requestDetailItem}>
              <Text style={styles.requestDetailLabel}>Thời hạn</Text>
              <Text style={styles.requestDetailValue}>{loanRequest.duration} ngày</Text>
            </View>
            <View style={styles.requestDetailItem}>
              <Text style={styles.requestDetailLabel}>Lợi nhuận</Text>
              <Text style={[styles.requestDetailValue, { color: '#a7f3d0' }]}>
                +{formatCurrency(profit)} USDT
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Borrower Info Card */}
        <Card style={styles.borrowerCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>
            👤 Thông tin người vay
          </Text>

          <View style={styles.borrowerRow}>
            <View style={[styles.borrowerAvatar, { backgroundColor: colors.accentBlue + '30' }]}>
              <Text style={[styles.borrowerAvatarText, { color: colors.accentBlue }]}>
                {loanRequest.borrowerAlias.charAt(0)}
              </Text>
            </View>
            <View style={styles.borrowerInfo}>
              <Text style={[styles.borrowerName, { color: colors.textWhite }]}>
                {loanRequest.borrowerAlias}
              </Text>
              <Text style={[styles.borrowerMeta, { color: colors.textGray }]}>
                Yêu cầu {(() => {
                  const diffMs = Date.now() - loanRequest.createdAt;
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  if (diffDays === 0) return 'hôm nay';
                  if (diffDays === 1) return '1 ngày trước';
                  return `${diffDays} ngày trước`;
                })()}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textGray }]}>Điểm tín dụng</Text>
              <Text style={[styles.statValue, { color: getCreditScoreColor(loanRequest.creditScore) }]}>
                {loanRequest.creditScore}
              </Text>
              <Text style={[styles.statBadge, { color: getCreditScoreColor(loanRequest.creditScore) }]}>
                {getCreditScoreLabel(loanRequest.creditScore)}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.darkBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textGray }]}>Uy tín</Text>
              <Text style={[styles.statValue, { color: loanRequest.reputationScore >= 70 ? colors.greenSuccess : colors.yellowWarning }]}>
                {loanRequest.reputationScore || 'N/A'}
              </Text>
              <Text style={[styles.statBadge, { color: loanRequest.reputationScore >= 70 ? colors.greenSuccess : colors.yellowWarning }]}>
                {loanRequest.reputationScore >= 80 ? 'Rất tốt' : loanRequest.reputationScore >= 60 ? 'Khá' : 'Mới'}
              </Text>
            </View>
          </View>

          {loanRequest.purposeDescription && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />
              <Text style={[styles.purposeTitle, { color: colors.textGray }]}>Mô tả mục đích</Text>
              <Text style={[styles.purposeText, { color: colors.textWhite }]}>
                {loanRequest.purposeDescription}
              </Text>
            </>
          )}
        </Card>

        {/* Risk Assessment Card */}
        <Card style={styles.riskCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>
            🛡️ Đánh giá rủi ro
          </Text>

          <View style={[styles.riskBadge, { backgroundColor: risk.color + '15' }]}>
            <Ionicons name={risk.icon as any} size={28} color={risk.color} />
            <View style={styles.riskBadgeText}>
              <Text style={[styles.riskLevel, { color: risk.color }]}>
                Mức rủi ro: {risk.level}
              </Text>
              <Text style={[styles.riskDesc, { color: colors.textGray }]}>
                {risk.level === 'Thấp'
                  ? 'Khoản vay có tài sản thế chấp đầy đủ và người vay có điểm tín dụng tốt.'
                  : risk.level === 'Trung bình'
                  ? 'Khoản vay có một số rủi ro. Cần cân nhắc kỹ trước khi đầu tư.'
                  : 'Khoản vay có rủi ro cao. Chỉ đầu tư nếu chấp nhận mất vốn.'}
              </Text>
            </View>
          </View>

          <View style={styles.riskDetails}>
            <View style={styles.riskRow}>
              <Text style={[styles.riskLabel, { color: colors.textGray }]}>Tỷ lệ tài sản thế chấp</Text>
              <Text
                style={[
                  styles.riskValue,
                  { color: loanRequest.collateralRatio >= 150 ? colors.greenSuccess : colors.redError },
                ]}
              >
                {loanRequest.collateralRatio}%
              </Text>
            </View>
            <View style={styles.riskRow}>
              <Text style={[styles.riskLabel, { color: colors.textGray }]}>ETH thế chấp</Text>
              <Text style={[styles.riskValue, { color: colors.textWhite }]}>
                {loanRequest.collateralAmount} ETH
              </Text>
            </View>
            <View style={styles.riskRow}>
              <Text style={[styles.riskLabel, { color: colors.textGray }]}>Ngưỡng thanh lý</Text>
              <Text style={[styles.riskValue, { color: colors.yellowWarning }]}>120%</Text>
            </View>
          </View>
        </Card>

        {/* Your Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>👛 Số dư của bạn</Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={[styles.balanceLabel, { color: colors.textGray }]}>USDT khả dụng</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: hasEnoughBalance ? colors.greenSuccess : colors.redError },
                ]}
              >
                {parseFloat(balances.usdt).toFixed(2)} USDT
              </Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={[styles.balanceLabel, { color: colors.textGray }]}>Cần cấp vốn</Text>
              <Text style={[styles.balanceValue, { color: colors.accentBlue }]}>
                {formatCurrency(loanRequest.amount)} USDT
              </Text>
            </View>
          </View>

          {!hasEnoughBalance && (
            <View style={[styles.insufficientWarning, { backgroundColor: colors.redError + '15' }]}>
              <Ionicons name="warning" size={16} color={colors.redError} />
              <Text style={[styles.insufficientText, { color: colors.redError }]}>
                Số dư USDT không đủ. Cần nạp thêm{' '}
                {(parseFloat(loanRequest.amount) - parseFloat(balances.usdt)).toFixed(2)} USDT.
              </Text>
            </View>
          )}
        </Card>

        {/* Expected Return Summary */}
        <Card style={styles.returnCard}>
          <View style={[styles.returnRow, { backgroundColor: colors.greenSuccess + '12' }]}>
            <View>
              <Text style={[styles.returnLabel, { color: colors.textGray }]}>Tổng nhận lại sau {loanRequest.duration} ngày</Text>
              <Text style={[styles.returnValue, { color: colors.greenSuccess }]}>
                {formatCurrency(totalReturn)} USDT
              </Text>
            </View>
            <View style={styles.returnProfit}>
              <Text style={[styles.returnProfitLabel, { color: colors.textGray }]}>Lợi nhuận</Text>
              <Text style={[styles.returnProfitValue, { color: colors.greenSuccess }]}>
                +{formatCurrency(profit)} USDT
              </Text>
            </View>
          </View>
        </Card>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Footer — Nút Cấp vốn */}
      <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
        <TouchableOpacity
          style={[
            styles.fundButton,
            { backgroundColor: hasEnoughBalance ? colors.greenSuccess : colors.textGray },
          ]}
          onPress={() => {
            if (user?.kycStatus !== 'verified') {
              Alert.alert(
                'Yêu cầu xác thực',
                'Bạn cần hoàn thành xác thực danh tính (KYC) trước khi cho vay.',
                [
                  { text: 'Để sau', style: 'cancel' },
                  { text: 'Xác thực ngay', onPress: () => navigation.navigate('KYCVerification' as any) }
                ]
              );
              return;
            }
            if (connections.length === 0) {
              Alert.alert(
                'Yêu cầu liên kết ngân hàng',
                'Bạn cần liên kết tài khoản ngân hàng để đảm bảo luồng nhận lãi.',
                [
                  { text: 'Để sau', style: 'cancel' },
                  { text: 'Liên kết ngay', onPress: () => navigation.navigate('LinkBank' as any) }
                ]
              );
              return;
            }
            setShowConfirm(true);
          }}
          disabled={!hasEnoughBalance}
          activeOpacity={0.8}
        >
          <Ionicons name="cash-outline" size={20} color="#fff" />
          <Text style={styles.fundButtonText}>
            Cấp vốn {formatCurrency(loanRequest.amount)} USDT
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      {showConfirm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.darkSurface }]}>
            <Text style={[styles.modalTitle, { color: colors.textWhite }]}>
              💰 Xác nhận cấp vốn
            </Text>

            <View style={styles.modalBody}>
              <ConfirmRow label="Số tiền cấp" value={`${formatCurrency(loanRequest.amount)} USDT`} />
              <ConfirmRow label="Lãi suất" value={`${loanRequest.interestRate}%/năm`} />
              <ConfirmRow label="Thời hạn" value={`${loanRequest.duration} ngày`} />
              <ConfirmRow label="Lợi nhuận dự kiến" value={`+${formatCurrency(profit)} USDT`} isSuccess />
              <View style={[styles.modalDivider, { backgroundColor: colors.darkBorder }]} />
              <ConfirmRow label="Tổng nhận lại" value={`${formatCurrency(totalReturn)} USDT`} isHighlight />
            </View>

            <View style={[styles.modalWarning, { backgroundColor: colors.yellowWarning + '15' }]}>
              <Text style={[styles.modalWarningText, { color: colors.yellowWarning }]}>
                ⚠️ Vốn sẽ bị khóa trong {loanRequest.duration} ngày. Giao dịch blockchain không thể hoàn tác.
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
                style={[styles.modalConfirmBtn, { backgroundColor: colors.greenSuccess }]}
                onPress={handleFund}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>Xác nhận cấp vốn</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// Helper component
interface ConfirmRowProps {
  label: string;
  value: string;
  isHighlight?: boolean;
  isSuccess?: boolean;
}
const ConfirmRow: React.FC<ConfirmRowProps> = ({ label, value, isHighlight, isSuccess }) => (
  <View style={styles.confirmRow}>
    <Text style={styles.confirmLabel}>{label}</Text>
    <Text
      style={[
        styles.confirmValue,
        isHighlight && styles.confirmValueHighlight,
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

  // Request Card (gradient)
  requestCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  requestLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  requestAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  requestPurposeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  requestPurposeText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  requestDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  requestDetailItem: { alignItems: 'center' },
  requestDetailLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  requestDetailValue: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Borrower Card
  borrowerCard: { marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  borrowerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  borrowerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  borrowerAvatarText: { fontSize: 20, fontWeight: 'bold' },
  borrowerInfo: { flex: 1 },
  borrowerName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  borrowerMeta: { fontSize: 13 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 40, marginHorizontal: 8 },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold' },
  statBadge: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },
  purposeTitle: { fontSize: 13, marginBottom: 6 },
  purposeText: { fontSize: 14, lineHeight: 22 },

  // Risk Card
  riskCard: { marginBottom: 16 },
  riskBadge: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 16, gap: 12, alignItems: 'center' },
  riskBadgeText: { flex: 1 },
  riskLevel: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  riskDesc: { fontSize: 13, lineHeight: 20 },
  riskDetails: {},
  riskRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  riskLabel: { fontSize: 14 },
  riskValue: { fontSize: 14, fontWeight: '600' },

  // Balance Card
  balanceCard: { marginBottom: 16 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceStat: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 12, marginBottom: 4 },
  balanceValue: { fontSize: 20, fontWeight: 'bold' },
  insufficientWarning: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 12, gap: 8 },
  insufficientText: { fontSize: 12, flex: 1 },

  // Return Card
  returnCard: { marginBottom: 16 },
  returnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 10 },
  returnLabel: { fontSize: 12, marginBottom: 2 },
  returnValue: { fontSize: 20, fontWeight: 'bold' },
  returnProfit: { alignItems: 'flex-end' },
  returnProfitLabel: { fontSize: 12, marginBottom: 2 },
  returnProfitValue: { fontSize: 18, fontWeight: 'bold' },

  // Footer
  footer: { padding: 20, borderTopWidth: 1 },
  fundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  fundButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

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
  modalContent: { borderRadius: 20, padding: 24, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  modalBody: { marginBottom: 16 },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  confirmLabel: { fontSize: 14, color: '#888' },
  confirmValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  confirmValueHighlight: { color: '#4a90d9', fontSize: 16 },
  modalDivider: { height: 1, marginVertical: 4 },
  modalWarning: { padding: 12, borderRadius: 8, marginBottom: 20 },
  modalWarningText: { fontSize: 13, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderRadius: 12 },
  modalCancelText: { fontSize: 15, fontWeight: '500' },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});

export default FundLoanScreen;
