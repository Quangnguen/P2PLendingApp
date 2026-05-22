import React from 'react';
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
import { Card, Button } from '@/components/common';
import { useTheme } from '@/providers';
import { useAuth, useOpenBanking } from '@/store';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

type LoanDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoanDetail'>;
  route: RouteProp<RootStackParamList, 'LoanDetail'>;
};

const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { connections } = useOpenBanking();
  const { loanId } = route.params;
  const [loan, setLoan] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Helper: Safely convert MongoDB Decimal128 to number
  const toNum = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
    return parseFloat(String(val)) || 0;
  };

  const fetchLoan = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const { loanApi } = await import('@/api/loan.api');
      // Try loan detail first, fallback to request detail
      let data: any;
      let dataType: 'loan' | 'request' = 'loan';
      try {
        data = await loanApi.getLoanDetail(loanId);
      } catch {
        data = await loanApi.getRequestDetail(loanId);
        dataType = 'request';
      }
      const d = data?.data || data;

      // Determine borrower ID (could be populated object or string)
      let borrowerId: string | null = null;
      if (d.borrowerId) {
        if (typeof d.borrowerId === 'object' && d.borrowerId !== null) {
          borrowerId = String(d.borrowerId._id || d.borrowerId.id || '');
        } else {
          borrowerId = String(d.borrowerId);
        }
      }

      // Determine lender ID
      let lenderId: string | null = null;
      if (d.lenderId) {
        if (typeof d.lenderId === 'object' && d.lenderId !== null) {
          lenderId = String(d.lenderId._id || d.lenderId.id || '');
        } else {
          lenderId = String(d.lenderId);
        }
      }

      // Tính tổng tiền phải trả
      const principal = toNum(d.loanAmount || d.principalAmount);
      const rate = toNum(d.interestRate);
      const days = toNum(d.durationDays);
      const interestAmount = Math.round((principal * rate * days) / (365 * 100) * 100) / 100;
      const totalRepayment = Math.round((principal + interestAmount) * 100) / 100;

      setLoan({
        id: loanId,
        title: d.purpose ? `Khoản vay ${d.purpose}` : 'Chi tiết khoản vay',
        borrowerName: typeof d.borrowerId === 'object' ? (d.borrowerId?.fullName || 'Ẩn danh') : 'Ẩn danh',
        borrowerAvatar: typeof d.borrowerId === 'object' ? (d.borrowerId?.fullName || 'A').charAt(0) : 'A',
        borrowerId: borrowerId,
        lenderId: lenderId,
        amount: principal,
        funded: toNum(d.amountPaid) || 0,
        interestRate: rate,
        term: days,
        interestAmount,
        totalRepayment: toNum(d.totalAmount) || totalRepayment,
        collateralAmount: toNum(d.collateralAmount),
        collateralType: d.collateralType || 'ETH',
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
        loanContractAddress: d.loanContractAddress || null,
        purpose: d.purpose || 'Cá nhân',
        description: d.purposeDescription || d.purpose || 'Không có mô tả',
        creditScore: typeof d.borrowerId === 'object' ? (toNum(d.borrowerId?.creditScore) || 0) : 0,
        status: d.status || 'pending',
        createdAt: new Date(d.createdAt),
        isRequest: dataType === 'request',
        dataType,
      });
    } catch (err) {
      console.error('Error fetching loan:', err);
      setLoan({
        id: loanId,
        title: 'Khoản vay',
        borrowerName: 'N/A',
        borrowerAvatar: '?',
        borrowerId: null,
        lenderId: null,
        amount: 0,
        funded: 0,
        interestRate: 0,
        term: 0,
        monthlyPayment: 0,
        purpose: 'N/A',
        description: 'Không thể tải dữ liệu',
        creditScore: 0,
        status: 'unknown',
        createdAt: new Date(),
        isRequest: false,
        dataType: 'loan',
      });
    } finally {
      setIsLoading(false);
    }
  }, [loanId]);

  useFocusEffect(
    React.useCallback(() => {
      fetchLoan();
    }, [fetchLoan])
  );

  if (isLoading || !loan) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textGray }}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fundingPercentage = loan.amount > 0 ? Math.min((loan.funded / loan.amount) * 100, 100) : 0;
  const remainingAmount = Math.max(loan.amount - loan.funded, 0);

  // Check if current user is the borrower (owner of this loan/request)
  const myUserId = user?._id ? String(user._id) : null;
  const loanBorrowerId = loan.borrowerId ? String(loan.borrowerId) : null;
  const loanLenderId = loan.lenderId ? String(loan.lenderId) : null;

  console.log('🔍 Ownership check:', {
    myUserId,
    loanBorrowerId,
    loanLenderId,
    match: myUserId === loanBorrowerId,
    status: loan.status,
    isRequest: loan.isRequest,
  });

  const isMyLoan = !!(myUserId && loanBorrowerId && myUserId === loanBorrowerId);
  // Check if current user is the lender
  const isMyInvestment = !!(myUserId && loanLenderId && myUserId === loanLenderId);
  // Check if the request has been funded (has a lender)
  const isFunded = !!loan.lenderId || loan.status === 'funded' || loan.status === 'active';
  // Check if this is a pending request (not yet funded)
  const isPending = loan.status === 'pending' || loan.status === 'approved' || loan.status === 'funding';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.yellowWarning;
      case 'approved': return colors.greenSuccess;
      case 'funding': return colors.yellowWarning;
      case 'active': return colors.greenSuccess;
      case 'funded': return colors.greenSuccess;
      case 'repaid': return colors.accentBlue;
      case 'completed': return colors.accentBlue;
      case 'cancelled': return colors.redError;
      default: return colors.textGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'approved': return 'Đã duyệt';
      case 'funding': return 'Đang gọi vốn';
      case 'active': return 'Đang hoạt động';
      case 'funded': return 'Đã cấp vốn';
      case 'repaid': return 'Đã trả nợ';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  // Handle delete/cancel loan request
  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa yêu cầu vay này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { loanApi } = await import('@/api/loan.api');
              await loanApi.deleteRequest(loanId);
              Alert.alert('Thành công', 'Đã xóa yêu cầu vay.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              const msg = error?.response?.data?.message || 'Không thể xóa yêu cầu vay';
              Alert.alert('Lỗi', msg);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  // Handle edit loan request - navigate to CreateLoan with edit params
  const handleEdit = () => {
    navigation.navigate('EditLoan', {
      requestId: loanId,
      currentData: {
        amount: loan.amount,
        interestRate: loan.interestRate,
        durationDays: loan.term,
        purpose: loan.purpose,
        description: loan.description,
      },
    });
  };

  // Handle fund/invest in loan
  const handleInvest = () => {
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
        'Bạn cần liên kết tài khoản ngân hàng để đảm bảo luồng nhận tiền lãi.',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Liên kết ngay', onPress: () => navigation.navigate('LinkBank' as any) }
        ]
      );
      return;
    }
    navigation.navigate('FundLoan', { requestId: loanId });
  };

  // Handle repay
  const handleRepay = () => {
    navigation.navigate('RepayLoan', { loanId: loanId });
  };

  // Determine which buttons to show
  const renderFooterButtons = () => {
    // Case 1: My loan request, pending, not funded → Show Edit + Delete
    if (isMyLoan && isPending && !isFunded) {
      return (
        <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
          <View style={styles.footerButtonRow}>
            <TouchableOpacity
              style={[styles.footerButton, styles.editButton, { borderColor: colors.accentBlue }]}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={20} color={colors.accentBlue} />
              <Text style={[styles.footerButtonText, { color: colors.accentBlue }]}>Sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.deleteButton, { borderColor: colors.redError }]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.redError} />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color={colors.redError} />
                  <Text style={[styles.footerButtonText, { color: colors.redError }]}>Xóa</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Case 2: My loan, funded/active → Show Repay button
    if (isMyLoan && (loan.status === 'active' || loan.status === 'funded')) {
      return (
        <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
          <Button
            title="Trả nợ"
            onPress={handleRepay}
            style={styles.investButton}
          />
        </View>
      );
    }

    // Case 3: Other's loan request, pending → Show Invest button (not my own request)
    if (!isMyLoan && isPending && loan.isRequest) {
      return (
        <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
          <Button
            title="Đầu tư ngay"
            onPress={handleInvest}
            style={styles.investButton}
          />
        </View>
      );
    }

    // Case 4: I'm the lender, loan is active → Show info (can view repayment progress)
    if (isMyInvestment && loan.status === 'active') {
      return (
        <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
          <View style={[styles.infoFooter, { backgroundColor: colors.accentBlue + '15' }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accentBlue} />
            <Text style={[styles.infoFooterText, { color: colors.accentBlue }]}>
              Đang chờ người vay trả nợ
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Chi tiết khoản vay</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ownership Badge */}
        {isMyLoan && (
          <View style={[styles.ownershipBadge, { backgroundColor: colors.accentBlue + '20' }]}>
            <Ionicons name="person-outline" size={16} color={colors.accentBlue} />
            <Text style={[styles.ownershipText, { color: colors.accentBlue }]}>Khoản vay của bạn</Text>
          </View>
        )}
        {isMyInvestment && (
          <View style={[styles.ownershipBadge, { backgroundColor: colors.greenSuccess + '20' }]}>
            <Ionicons name="wallet-outline" size={16} color={colors.greenSuccess} />
            <Text style={[styles.ownershipText, { color: colors.greenSuccess }]}>Bạn đã đầu tư</Text>
          </View>
        )}

        {/* Borrower Info */}
        <Card style={styles.borrowerCard}>
          <View style={styles.borrowerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.accentBlue + '30' }]}>
              <Text style={[styles.avatarText, { color: colors.accentBlue }]}>{loan.borrowerAvatar}</Text>
            </View>
            <View style={styles.borrowerInfo}>
              <Text style={[styles.borrowerName, { color: colors.textWhite }]}>{loan.borrowerName}</Text>
              {loan.creditScore > 0 && (
                <View style={styles.creditScoreRow}>
                  <Text style={[styles.creditScoreLabel, { color: colors.textGray }]}>Điểm tín dụng:</Text>
                  <Text style={[styles.creditScore, { color: colors.greenSuccess }]}>{loan.creditScore}</Text>
                </View>
              )}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(loan.status) + '20' },
              ]}
            >
              <Text
                style={[styles.statusText, { color: getStatusColor(loan.status) }]}
              >
                {getStatusText(loan.status)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Amount Card */}
        <LinearGradient
          colors={[colors.accentBlue, '#1a73e8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.amountCard}
        >
          <Text style={styles.amountLabel}>Số tiền vay</Text>
          <Text style={[styles.amountValue, { color: colors.textWhite }]}>{loan.amount} USDT</Text>

          {loan.funded > 0 && (
            <View style={styles.fundingProgress}>
              <View style={styles.fundingHeader}>
                <Text style={styles.fundingLabel}>
                  Đã trả: {loan.funded} USDT
                </Text>
                <Text style={[styles.fundingPercentage, { color: colors.textWhite }]}>
                  {fundingPercentage.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${fundingPercentage}%`, backgroundColor: colors.textWhite }]}
                />
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Loan Details */}
        <Card style={styles.detailsCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>Thông tin khoản vay</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Mục đích vay</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>{loan.purpose}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Lãi suất</Text>
            <Text style={[styles.detailValueGreen, { color: colors.greenSuccess }]}>{loan.interestRate}%/năm</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Kỳ hạn</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>{loan.term} ngày</Text>
          </View>

          {loan.interestAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textGray }]}>Tiền lãi</Text>
              <Text style={[styles.detailValue, { color: colors.textWhite }]}>{loan.interestAmount?.toFixed(2)} USDT</Text>
            </View>
          )}

          {loan.totalRepayment > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textGray }]}>Tổng phải trả</Text>
              <Text style={[styles.detailValue, { color: colors.yellowWarning, fontWeight: 'bold' }]}>{loan.totalRepayment?.toFixed(2)} USDT</Text>
            </View>
          )}

          {loan.collateralAmount > 0 && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textGray }]}>Tài sản thế chấp</Text>
              <Text style={[styles.detailValue, { color: colors.textWhite }]}>{loan.collateralAmount?.toFixed(4)} {loan.collateralType || 'ETH'}</Text>
            </View>
          )}

          {loan.dueDate && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textGray }]}>Hạn trả</Text>
              <Text style={[styles.detailValue, { color: colors.textWhite }]}>{new Date(loan.dueDate).toLocaleDateString('vi-VN')}</Text>
            </View>
          )}

          {loan.expiresAt && loan.isRequest && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textGray }]}>Hết hạn lúc</Text>
              <Text style={[styles.detailValue, { color: colors.yellowWarning }]}>{new Date(loan.expiresAt).toLocaleDateString('vi-VN')}</Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />

          <Text style={[styles.descriptionTitle, { color: colors.textWhite }]}>Mô tả</Text>
          <Text style={[styles.description, { color: colors.textGray }]}>{loan.description}</Text>
        </Card>
      </ScrollView>

      {/* Footer Actions - dynamic based on ownership and status */}
      {renderFooterButtons()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {},
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  ownershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 12,
  },
  ownershipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  borrowerCard: {
    marginBottom: 16,
  },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  creditScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditScoreLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  creditScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fundingProgress: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
  },
  fundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fundingLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  fundingPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  detailsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValueGreen: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  footerButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  editButton: {
    backgroundColor: 'transparent',
  },
  deleteButton: {
    backgroundColor: 'transparent',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  investButton: {},
  infoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  infoFooterText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoanDetailScreen;
