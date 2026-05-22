import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
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
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected';
  dueDate: Date;
  borrower?: string;
  lender?: string;
}

type StatusFilter = LoanItem['status'] | 'all';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Đang chờ' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'active', label: 'Hoạt động' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'rejected', label: 'Đã hủy' },
];

const toNum = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
  return parseFloat(String(val)) || 0;
};

const LoansScreen: React.FC<LoansScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('borrowing');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { colors } = useTheme();
  const { user } = useAuth();
  const { connections } = useOpenBanking();
  const [borrowingLoans, setBorrowingLoans] = useState<LoanItem[]>([]);
  const [lendingLoans, setLendingLoans] = useState<LoanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

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
            status: req.status === 'approved' ? 'approved' : req.status === 'cancelled' ? 'rejected' : 'pending',
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

  const getFilterColor = (key: StatusFilter): string => {
    switch (key) {
      case 'pending':   return colors.yellowWarning;
      case 'approved':  return '#60a5fa';
      case 'active':    return colors.greenSuccess;
      case 'completed': return colors.accentBlue;
      case 'rejected':  return colors.redError;
      default:          return colors.accentBlue;
    }
  };

  const getStatusColor = (status: LoanItem['status']) => {
    switch (status) {
      case 'pending':
        return colors.yellowWarning;
      case 'approved':
        return '#60a5fa';
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
        return 'Đang chờ duyệt';
      case 'approved':
        return 'Chờ giải ngân';
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

  const renderLoanItem = ({ item }: { item: LoanItem }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity
        style={[styles.loanCard, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder, borderLeftColor: statusColor }]}
        onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.loanTop}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[styles.loanTitle, { color: colors.textGray }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.loanAmount, { color: colors.textWhite }]}>
              {item.amount.toLocaleString()} <Text style={[styles.loanAmountUnit, { color: colors.textGray }]}>USDT</Text>
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <View style={[styles.loanBottom, { borderTopColor: colors.darkBorder }]}>
          <View style={styles.loanMeta}>
            <Text style={[styles.metaLabel, { color: colors.textGray }]}>Lãi suất</Text>
            <Text style={[styles.metaValue, { color: colors.textWhite }]}>{item.interestRate}%/năm</Text>
          </View>
          <View style={styles.loanMeta}>
            <Text style={[styles.metaLabel, { color: colors.textGray }]}>Đáo hạn</Text>
            <Text style={[styles.metaValue, { color: colors.textWhite }]}>{formatDate(item.dueDate)}</Text>
          </View>
          <View style={[styles.loanMeta, { flex: 1.2 }]}>
            <Text style={[styles.metaLabel, { color: colors.textGray }]}>{activeTab === 'borrowing' ? 'Người cho vay' : 'Người vay'}</Text>
            <Text style={[styles.metaValue, { color: colors.textWhite }]} numberOfLines={1}>{activeTab === 'borrowing' ? item.lender : item.borrower}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textGray} />
        </View>
      </TouchableOpacity>
    );
  };

  const loans = activeTab === 'borrowing' ? borrowingLoans : lendingLoans;

  const filteredLoans = useMemo(
    () => statusFilter === 'all' ? loans : loans.filter(l => l.status === statusFilter),
    [loans, statusFilter]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Khoản vay của tôi</Text>
          <Text style={[styles.headerSub, { color: colors.textGray }]}>{loans.length} khoản vay</Text>
        </View>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.accentBlue }]}
          onPress={() => {
            if (user?.kycStatus !== 'verified') {
              Alert.alert('Yêu cầu xác thực', 'Bạn cần hoàn thành xác thực danh tính (KYC) trước khi tạo yêu cầu vay.', [
                { text: 'Để sau', style: 'cancel' },
                { text: 'Xác thực ngay', onPress: () => navigation.navigate('KYCVerification' as any) },
              ]);
              return;
            }
            if (connections.length === 0) {
              Alert.alert('Yêu cầu liên kết ngân hàng', 'Bạn cần liên kết tài khoản ngân hàng để đảm bảo luồng trả nợ tự động.', [
                { text: 'Để sau', style: 'cancel' },
                { text: 'Liên kết ngay', onPress: () => navigation.navigate('LinkBank' as any) },
              ]);
              return;
            }
            navigation.navigate('CreateLoan');
          }}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={[styles.createButtonText, { color: '#fff' }]}>Tạo mới</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.darkSurface }]}>
        {(['borrowing', 'lending'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { backgroundColor: colors.accentBlue }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#fff' : colors.textGray }]}>
              {tab === 'borrowing' ? `Đang vay (${borrowingLoans.length})` : `Đang cho vay (${lendingLoans.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filter chips */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {STATUS_FILTERS.map(f => {
            const isActive = statusFilter === f.key;
            const chipColor = getFilterColor(f.key);
            const count = f.key === 'all' ? loans.length : loans.filter(l => l.status === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setStatusFilter(f.key)}
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  isActive
                    ? { backgroundColor: chipColor + '22', borderColor: chipColor }
                    : { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder },
                ]}
              >
                <Text style={[styles.filterChipLabel, { color: isActive ? chipColor : colors.textGray, fontWeight: isActive ? '600' : '400' }]}>
                  {f.label}
                </Text>
                <View style={[styles.filterChipCount, { backgroundColor: isActive ? chipColor : colors.darkBackground }]}>
                  <Text style={[styles.filterChipCountText, { color: isActive ? '#fff' : colors.textGray }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.darkSurface }]}>
          <Ionicons name="cash-outline" size={22} color={colors.accentBlue} style={{ marginBottom: 6 }} />
          <Text style={[styles.summaryValue, { color: colors.textWhite }]} numberOfLines={1}>
            {filteredLoans.reduce((s, l) => s + l.amount, 0).toLocaleString()}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.textGray }]}>USDT · Tổng tiền</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.darkSurface }]}>
          <Ionicons name="document-text-outline" size={22} color={colors.greenSuccess} style={{ marginBottom: 6 }} />
          <Text style={[styles.summaryValue, { color: colors.textWhite }]}>{filteredLoans.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textGray }]}>Khoản vay</Text>
        </View>
      </View>

      {/* Loan List */}
      {filteredLoans.length > 0 ? (
        <FlatList
          data={filteredLoans}
          renderItem={renderLoanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name={statusFilter !== 'all' ? 'filter-outline' : 'document-outline'} size={56} color={colors.textGray} />
          <Text style={[styles.emptyTitle, { color: colors.textWhite }]}>
            {statusFilter !== 'all' ? 'Không có khoản vay phù hợp' : 'Chưa có khoản vay nào'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
            {statusFilter !== 'all' ? 'Thử chọn bộ lọc khác' : activeTab === 'borrowing' ? 'Tạo yêu cầu vay ngay!' : 'Khám phá các yêu cầu vay!'}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: statusFilter !== 'all' ? colors.darkSurface : colors.accentBlue }]}
            onPress={() => statusFilter !== 'all' ? setStatusFilter('all') : navigation.navigate('BrowseLoans')}
          >
            <Text style={[styles.emptyButtonText, { color: '#fff' }]}>{statusFilter !== 'all' ? 'Xem tất cả' : 'Khám phá ngay'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSub: { fontSize: 13, marginTop: 2 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  createButtonText: { fontSize: 14, fontWeight: '600' },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '600' },
  filterWrapper: { height: 52, marginBottom: 14 },
  filterScroll: { flex: 1 },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    marginRight: 8,
    gap: 6,
  },
  filterChipLabel: { fontSize: 13 },
  filterChipCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  filterChipCountText: { fontSize: 11, fontWeight: '600' },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  loanCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  loanTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  loanTitle: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  loanAmount: { fontSize: 22, fontWeight: 'bold' },
  loanAmountUnit: { fontSize: 14, fontWeight: '400' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  loanBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  loanMeta: { flex: 1 },
  metaLabel: { fontSize: 11, marginBottom: 3 },
  metaValue: { fontSize: 13, fontWeight: '500' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyButton: { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { fontSize: 15, fontWeight: '600' },
});

export default LoansScreen;
