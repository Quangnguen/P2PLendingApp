import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Card } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth, useOpenBanking } from '@/store';
import { Alert } from 'react-native';

type LoansScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Loans'>;
};

type TabType = 'borrowing' | 'lending';

interface LoanItem {
  id: string;
  title: string;
  amount: number;
  interestRate: number;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  dueDate: Date;
  borrower?: string;
  lender?: string;
}

const LoansScreen: React.FC<LoansScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('borrowing');
  const { colors } = useTheme();
  const { user } = useAuth();
  const { connections } = useOpenBanking();
  const [borrowingLoans, setBorrowingLoans] = useState<LoanItem[]>([]);
  const [lendingLoans, setLendingLoans] = useState<LoanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper: Safely convert MongoDB Decimal128 to number
  const toNum = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
    return parseFloat(String(val)) || 0;
  };

  // Fetch data from API - refresh mỗi khi screen được focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchLoans = async () => {
        setIsLoading(true);
        try {
          const { loanApi } = await import('@/api/loan.api');

          // Fetch: my requests + my loans
          const [requestsRes, loansRes] = await Promise.all([
            loanApi.getMyRequests().catch(() => []),
            loanApi.getMyLoans().catch(() => []),
          ]);

          if (!isActive) return;

          const requests = Array.isArray(requestsRes?.data || requestsRes) 
            ? (requestsRes?.data || requestsRes) 
            : [];
          const loans = Array.isArray(loansRes?.data || loansRes) 
            ? (loansRes?.data || loansRes) 
            : [];

          // === BORROWING TAB ===
          // 1. Pending/Cancelled requests (chưa thành khoản vay thực tế)
          const pendingRequests = requests.filter((r: any) => r.status !== 'funded').map((req: any) => ({
            id: req._id || req.id,
            title: `Vay ${req.purpose || 'cá nhân'} - ${toNum(req.loanAmount)} USDT`,
            amount: toNum(req.loanAmount),
            interestRate: toNum(req.interestRate),
            status: req.status === 'pending' ? 'pending' : req.status === 'approved' ? 'pending' : req.status === 'cancelled' ? 'rejected' : 'pending',
            dueDate: new Date(req.expiresAt || Date.now()),
            lender: 'Đang chờ',
          }));
          
          // 2. Active/Repaid loans (đã giải ngân)
          const myBorrowingLoans = loans.filter((l: any) => {
            const bId = l.borrowerId?._id || l.borrowerId;
            return bId === user?._id;
          }).map((loan: any) => ({
            id: loan._id || loan.id,
            title: `Khoản vay - ${toNum(loan.principalAmount)} USDT`,
            amount: toNum(loan.principalAmount),
            interestRate: toNum(loan.interestRate),
            status: loan.status === 'repaid' ? 'completed' : loan.status === 'active' ? 'active' : loan.status === 'overdue' ? 'rejected' : 'active',
            dueDate: new Date(loan.dueDate || Date.now()),
            lender: loan.lenderId?.fullName || 'N/A',
          }));

          setBorrowingLoans([...pendingRequests, ...myBorrowingLoans].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime()));

          // === LENDING TAB: My investments ===
          const lending: LoanItem[] = loans.filter((l: any) => {
            const lId = l.lenderId?._id || l.lenderId;
            return lId === user?._id;
          }).map((loan: any) => ({
            id: loan._id || loan.id,
            title: `Đầu tư - ${toNum(loan.principalAmount)} USDT`,
            amount: toNum(loan.principalAmount),
            interestRate: toNum(loan.interestRate),
            status: loan.status === 'repaid' ? 'completed' : loan.status === 'active' ? 'active' : loan.status === 'overdue' ? 'rejected' : 'active',
            dueDate: new Date(loan.dueDate || Date.now()),
            borrower: loan.borrowerId?.fullName || 'N/A',
            lender: 'Tôi',
          }));
          setLendingLoans(lending);
        } catch (err) {
          console.error('Error fetching loans:', err);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      fetchLoans();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const getStatusColor = (status: LoanItem['status']) => {
    switch (status) {
      case 'pending':
        return colors.yellowWarning;
      case 'active':
        return colors.greenSuccess;
      case 'completed':
        return colors.accentBlue;
      case 'rejected':
        return colors.redError;
      default:
        return colors.textGray;
    }
  };

  const getStatusText = (status: LoanItem['status']) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'active':
        return 'Đang hoạt động';
      case 'completed':
        return 'Hoàn thành';
      case 'rejected':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const renderLoanItem = ({ item }: { item: LoanItem }) => (
    <Card
      style={styles.loanCard}
      onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}
    >
      <View style={styles.loanHeader}>
        <Text style={[styles.loanTitle, { color: colors.textWhite }]} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.loanAmount}>
        <Text style={[styles.amountLabel, { color: colors.textGray }]}>Số tiền</Text>
        <Text style={[styles.amountValue, { color: colors.accentBlue }]}>{item.amount} USDT</Text>
      </View>

      <View style={[styles.loanDetails, { borderTopColor: colors.darkBorder }]}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textGray }]}>Lãi suất</Text>
          <Text style={[styles.detailValue, { color: colors.textWhite }]}>{item.interestRate}%/năm</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textGray }]}>Ngày đáo hạn</Text>
          <Text style={[styles.detailValue, { color: colors.textWhite }]}>{formatDate(item.dueDate)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textGray }]}>
            {activeTab === 'borrowing' ? 'Người cho vay' : 'Người vay'}
          </Text>
          <Text style={[styles.detailValue, { color: colors.textWhite }]}>
            {activeTab === 'borrowing' ? item.lender : item.borrower}
          </Text>
        </View>
      </View>
    </Card>
  );

  const loans = activeTab === 'borrowing' ? borrowingLoans : lendingLoans;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Khoản vay của tôi</Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.accentBlue }]}
          onPress={() => {
            if (user?.kycStatus !== 'verified') {
              Alert.alert(
                'Yêu cầu xác thực',
                'Bạn cần hoàn thành xác thực danh tính (KYC) trước khi tạo yêu cầu vay.',
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
                'Bạn cần liên kết tài khoản ngân hàng để đảm bảo luồng trả nợ tự động.',
                [
                  { text: 'Để sau', style: 'cancel' },
                  { text: 'Liên kết ngay', onPress: () => navigation.navigate('LinkBank' as any) }
                ]
              );
              return;
            }
            navigation.navigate('CreateLoan');
          }}
        >
          <View style={styles.createButtonContent}>
            <Ionicons name="add" size={18} color={colors.textWhite} />
            <Text style={[styles.createButtonText, { color: colors.textWhite }]}>Tạo mới</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.darkSurface }]}>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'borrowing' && { backgroundColor: colors.accentBlue }
          ]}
          onPress={() => setActiveTab('borrowing')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'borrowing' ? colors.textWhite : colors.textGray }
          ]}>
            Đang vay ({borrowingLoans.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'lending' && { backgroundColor: colors.accentBlue }
          ]}
          onPress={() => setActiveTab('lending')}
        >
          <Text style={[
            styles.tabText, 
            { color: activeTab === 'lending' ? colors.textWhite : colors.textGray }
          ]}>
            Đang cho vay ({lendingLoans.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.darkSurface }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textGray }]}>Tổng số tiền</Text>
          <Text style={[styles.summaryValue, { color: colors.textWhite }]}>
            {formatCurrency(loans.reduce((sum, loan) => sum + loan.amount, 0))}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.darkBorder }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textGray }]}>Số khoản vay</Text>
          <Text style={[styles.summaryValue, { color: colors.textWhite }]}>{loans.length}</Text>
        </View>
      </View>

      {/* Loan List */}
      {loans.length > 0 ? (
        <FlatList
          data={loans}
          renderItem={renderLoanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={colors.textGray} />
          <Text style={[styles.emptyTitle, { color: colors.textWhite }]}>Chưa có khoản vay nào</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
            {activeTab === 'borrowing'
              ? 'Bạn chưa có khoản vay nào. Tạo yêu cầu vay ngay!'
              : 'Bạn chưa cho ai vay. Khám phá các yêu cầu vay!'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.accentBlue }]}
            onPress={() => navigation.navigate('BrowseLoans')}
          >
            <Text style={[styles.emptyButtonText, { color: colors.textWhite }]}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loanCard: {
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loanAmount: {
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  loanDetails: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LoansScreen;
