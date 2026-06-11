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
import { Card, KYCRequiredModal } from '@/components/common';
import { useTheme, useWeb3 } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { CONTRACT_ADDRESSES } from '@/config/walletconnect';
import {
  calculateInterest,
  calculateRepaymentAmount,
  formatCurrency,
} from '@/utils/loanCalculations';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth, useOpenBanking, useToast } from '@/store';

import { ethers } from 'ethers';

type FundLoanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'FundLoan'>;
  route: RouteProp<RootStackParamList, 'FundLoan'>;
};

const FundLoanScreen: React.FC<FundLoanScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { balances, connection, sendUSDT, sendTransaction, refreshBalances, getProvider } = useWeb3();
  const { user } = useAuth();
  const { connections } = useOpenBanking();
  const toast = useToast();
  const { requestId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loanRequest, setLoanRequest] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [fundingStep, setFundingStep] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [debtInfo, setDebtInfo] = useState<{ hasDebt: boolean; count: number; totalAmount: number } | null>(null);
  const [successData, setSuccessData] = useState<{txHash: string} | null>(null);

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
        // Lấy giá ETH từ backend (CoinGecko), fallback 2000
        const { getRates } = await import('@/api/loan.api');
        const rates = await getRates().catch(() => ({ ethUsd: 2000, usdtVnd: 25000 }));
        const ethPrice = rates.ethUsd;
        const collateralValueUSDT = collateral * ethPrice;
        const actualCollateralRatio = loanAmount > 0
          ? Math.round((collateralValueUSDT / loanAmount) * 100)
          : 0;

        setLoanRequest({
          id: requestId,
          onChainRequestId: reqData.onChainRequestId,
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
        toast.error('Không thể tải thông tin khoản vay.');
        navigation.goBack();
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [requestId]);

  React.useEffect(() => {
    if (!loanRequest?.borrowerWallet) return;
    const fetch = async () => {
      try {
        const { loanApi } = await import('@/api/loan.api');
        const result = await loanApi.checkDebtTokens(loanRequest.borrowerWallet);
        const data = result?.data || result;
        setDebtInfo({
          hasDebt: data?.hasDebt ?? false,
          count: data?.debtTokenCount ?? 0,
          totalAmount: parseFloat(data?.totalDebtAmount ?? '0') || 0,
        });
      } catch {
        // non-critical
      }
    };
    fetch();
  }, [loanRequest?.borrowerWallet]);

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
    if (score >= 500) return 'Trung bình';
    if (score >= 400) return 'Yếu';
    if (score >= 200) return 'Kém';
    return 'Rất xấu';
  };

  const risk = getRiskLevel(loanRequest.creditScore, loanRequest.collateralRatio);

  const handleFund = async () => {
    setIsLoading(true);
    try {
      if (!loanRequest.borrowerWallet) {
        toast.warning('Người vay chưa liên kết ví Ganache.', 'Không thể cấp vốn');
        setIsLoading(false);
        return;
      }

      // Kiểm tra tự cấp vốn (chỉ chặn khi cùng ví blockchain)
      // Tắm bỏ check này để hỗ trợ demo single-user dùng nhiều ví Ganache khác nhau
      // if (connection.address?.toLowerCase() === loanRequest.borrowerWallet?.toLowerCase()) {
      //   toast.error('Bạn không thể cấp vốn cho chính mình.', 'Không hợp lệ');
      //   setIsLoading(false);
      //   return;
      // }

      let txHash = null;

      if (loanRequest.onChainRequestId !== undefined && loanRequest.onChainRequestId !== null) {
        // 1. PRE-FLIGHT: Verify request on-chain
        const provider = new ethers.providers.StaticJsonRpcProvider(
          'http://localhost:7545', { chainId: 1337, name: 'ganache' }
        );
        const p2pReadInterface = new ethers.utils.Interface([
          'function requestActive(uint256) view returns (bool)',
          'function requestBorrower(uint256) view returns (address)',
        ]);
        const p2pContract = new ethers.Contract(CONTRACT_ADDRESSES.P2P_LENDING, p2pReadInterface, provider);

        const [isActive, borrowerOnChain] = await Promise.all([
          p2pContract.requestActive(loanRequest.onChainRequestId),
          p2pContract.requestBorrower(loanRequest.onChainRequestId),
        ]);

        if (!isActive) {
          toast.error(
            `Request #${loanRequest.onChainRequestId} không tồn tại hoặc đã bị hủy trên hợp đồng hiện tại.\n\nVui lòng tạo yêu cầu vay mới sau khi deploy lại hệ thống.`,
            'Lỗi On-Chain'
          );
          setIsLoading(false);
          setFundingStep('');
          return;
        }

        // Kiểm tra tự cấp vốn (smart contract sẽ revert nếu bỏ qua check này)
        if (borrowerOnChain.toLowerCase() === connection.address?.toLowerCase()) {
          toast.error(
            'Bạn không thể cấp vốn cho khoản vay của chính mình.\n\nHãy chuyển sang ví khác (VD: Account #2 Bob) để đóng vai Lender.',
            'Không hợp lệ'
          );
          setIsLoading(false);
          setFundingStep('');
          return;
        }

        // Kiểm tra request hết hạn
        if (loanRequest.expiresAt && Date.now() > loanRequest.expiresAt) {
          toast.error(
            'Yêu cầu vay này đã hết hạn. Người vay cần tạo yêu cầu mới.',
            'Hết hạn'
          );
          setIsLoading(false);
          setFundingStep('');
          return;
        }

        // 2. Approve USDT cho P2PLending contract
        setFundingStep('Đang ủy quyền chuyển USDT cho Smart Contract...');
        const usdtInterface = new ethers.utils.Interface(['function approve(address spender, uint256 amount) returns (bool)']);
        const approveData = usdtInterface.encodeFunctionData('approve', [
          CONTRACT_ADDRESSES.P2P_LENDING,
          ethers.utils.parseUnits(loanRequest.amount, 6)
        ]);
        
        const approveTx = await sendTransaction({
          to: CONTRACT_ADDRESSES.USDT,
          data: approveData
        });

        if (!approveTx) {
          setIsLoading(false);
          setFundingStep('');
          return;
        }

        // 3. Gọi fundLoanRequest trên P2PLending contract
        setFundingStep('Đang tạo hợp đồng vay trên blockchain...');
        const p2pInterface = new ethers.utils.Interface(['function fundLoanRequest(uint256 requestId) returns (address)']);
        const fundData = p2pInterface.encodeFunctionData('fundLoanRequest', [loanRequest.onChainRequestId]);
        
        txHash = await sendTransaction({
          to: CONTRACT_ADDRESSES.P2P_LENDING,
          data: fundData,
          gasLimit: 2000000 // cần ~1.2M gas để deploy Loan contract + authorize CollateralManager
        });
      } else {
        // LUỒNG CŨ (Chỉ chuyển USDT ngang hàng)
        setFundingStep('Đang chuyển USDT đến người vay...');
        txHash = await sendUSDT(loanRequest.borrowerWallet, loanRequest.amount);
      }

      if (!txHash) {
        setIsLoading(false);
        setFundingStep('');
        return;
      }

      // Bước 3: Lấy địa chỉ Loan contract từ event LoanMatched trong receipt
      setFundingStep('Đang xác nhận hợp đồng vay...');
      let loanContractAddress: string | null = null;
      const provider = getProvider();
      if (provider && txHash) {
        const receipt = await provider.getTransactionReceipt(txHash);
        const iface = new ethers.utils.Interface([
          'event LoanMatched(uint256 indexed requestId, address indexed lender, address indexed loanContract, uint256 platformFee, uint256 borrowerReceived, uint256 lenderAPY, uint256 expectedReturn)'
        ]);
        for (const log of receipt?.logs || []) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed.name === 'LoanMatched') {
              loanContractAddress = parsed.args.loanContract;
              break;
            }
          } catch (_) {}
        }
      }

      // Bước 4: Thông báo backend ghi nhận
      setFundingStep('Đang ghi nhận trên hệ thống...');
      const { loanApi } = await import('@/api/loan.api');
      await loanApi.fundLoan(requestId, { txHash, loanContractAddress: loanContractAddress ?? undefined });

      await refreshBalances();

      setSuccessData({ txHash });
      setShowSuccess(true);
    } catch (error: any) {
      const raw = error?.response?.data?.message || error.message || '';
      let msg = raw || 'Không thể cấp vốn. Vui lòng thử lại.';
      // Giải thích các lỗi on-chain phổ biến (Ganache không trả về reason)
      if (raw.includes('revert') || raw.includes('VM Exception')) {
        if (raw.includes('CannotFundOwnLoan') || raw.includes('own')) {
          msg = 'Bạn không thể cấp vốn cho khoản vay của chính mình.';
        } else if (raw.includes('RequestExpired') || raw.includes('expired')) {
          msg = 'Yêu cầu vay đã hết hạn.';
        } else if (raw.includes('InsufficientAllowance') || raw.includes('allowance')) {
          msg = 'Số USDT được ủy quyền không đủ. Hãy thử lại.';
        } else if (raw.includes('Insufficient') || raw.includes('balance')) {
          msg = `Số dư USDT không đủ. Cần ít nhất ${loanRequest?.amount} USDT trong ví của bạn.`;
        } else {
          msg = 'Giao dịch bị từ chối bởi smart contract. Kiểm tra số dư USDT và thử lại.';
        }
      }
      toast.error(msg, 'Cấp vốn thất bại');
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="person-outline" size={18} color={colors.accentBlue} />
            <Text style={[styles.cardTitle, { color: colors.textWhite }]}>Thông tin người vay</Text>
          </View>

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

          {debtInfo?.hasDebt && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />
              <View style={[styles.debtWarning, { backgroundColor: '#7f1d1d20', borderColor: '#dc2626' }]}>
                <Ionicons name="warning-outline" size={20} color="#dc2626" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[styles.debtWarningTitle, { color: '#dc2626' }]}>
                    Cảnh báo: Người vay có nợ xấu!
                  </Text>
                  <Text style={[styles.debtWarningText, { color: '#fca5a5' }]}>
                    Người vay này có {debtInfo.count} NFT nợ xấu (DebtToken) trên blockchain.
                    Tổng nợ: {debtInfo.totalAmount.toFixed(2)} USDT. Hãy cân nhắc kỹ trước khi đầu tư.
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Risk Assessment Card */}
        <Card style={styles.riskCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.accentBlue} />
            <Text style={[styles.cardTitle, { color: colors.textWhite }]}>Đánh giá rủi ro</Text>
          </View>

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
              <Text style={[styles.riskValue, { color: colors.yellowWarning }]}>110%</Text>
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
              setShowKYCModal(true);
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Ionicons name="cash-outline" size={20} color={colors.accentBlue} />
              <Text style={[styles.modalTitle, { color: colors.textWhite }]}>Xác nhận cấp vốn</Text>
            </View>

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
                Vốn sẽ bị khóa trong {loanRequest.duration} ngày. Giao dịch blockchain không thể hoàn tác.
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

      {/* Success Modal */}
      {showSuccess && successData && (
        <View style={styles.modalOverlay}>
          <View style={[styles.successModalContent, { backgroundColor: colors.darkSurface }]}>
            <View style={styles.successIconWrapper}>
              <View style={[styles.successIconBg, { backgroundColor: colors.greenSuccess + '20' }]}>
                <Ionicons name="checkmark-circle" size={80} color={colors.greenSuccess} />
              </View>
            </View>
            
            <Text style={[styles.successTitle, { color: colors.textWhite }]}>
              Cấp Vốn Thành Công!
            </Text>
            
            <Text style={[styles.successSubtitle, { color: colors.textGray }]}>
              Bạn đã chuyển thành công <Text style={{color: colors.textWhite, fontWeight: 'bold'}}>{formatCurrency(loanRequest.amount)} USDT</Text> đến ví của người vay.
            </Text>

            <View style={[styles.successInfoBox, { backgroundColor: colors.darkBackground }]}>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Lợi nhuận dự kiến:</Text>
                <Text style={[styles.successInfoValue, { color: colors.greenSuccess }]}>+{formatCurrency(profit)} USDT</Text>
              </View>
              <View style={[styles.modalDivider, { backgroundColor: colors.darkBorder, marginVertical: 8 }]} />
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Mã giao dịch:</Text>
                <Text style={[styles.successInfoValue, { color: colors.accentBlue, fontSize: 12 }]} numberOfLines={1} ellipsizeMode="middle">
                  {successData.txHash}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: colors.greenSuccess }]}
              onPress={() => {
                setShowSuccess(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.successButtonText}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KYCRequiredModal
        visible={showKYCModal}
        reason="invest"
        onVerify={() => {
          setShowKYCModal(false);
          navigation.navigate('KYCVerification' as any);
        }}
        onDismiss={() => setShowKYCModal(false)}
      />
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
  debtWarning: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 4 },
  debtWarningTitle: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  debtWarningText: { fontSize: 12, lineHeight: 17 },

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

  // Success Modal
  successModalContent: { borderRadius: 24, padding: 24, width: '90%', maxWidth: 400, alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  successIconWrapper: { marginBottom: 20 },
  successIconBg: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  successSubtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  successInfoBox: { width: '100%', padding: 16, borderRadius: 16, marginBottom: 24 },
  successInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  successInfoLabel: { fontSize: 14, color: '#888' },
  successInfoValue: { fontSize: 15, fontWeight: 'bold', flexShrink: 1, textAlign: 'right', marginLeft: 10 },
  successButton: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 2 },
  successButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});

export default FundLoanScreen;
