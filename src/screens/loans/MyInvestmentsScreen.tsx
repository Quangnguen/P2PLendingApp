/**
 * =================================================================
 * MY INVESTMENTS SCREEN - Danh sách đầu tư của tôi
 * =================================================================
 *
 * Màn hình cho Lender xem danh sách các khoản đã cho vay:
 * - Tab: Active | Completed | Defaulted
 * - Summary card (tổng đã đầu tư, lợi nhuận)
 * - Danh sách khoản đầu tư với progress bar
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency as formatCurrencyNum, formatDate } from '@/utils/formatters';
import { formatCurrency, calculateDaysRemaining, formatDaysRemaining } from '@/utils/loanCalculations';
import Ionicons from 'react-native-vector-icons/Ionicons';

type MyInvestmentsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MyInvestments'>;
};

type TabType = 'active' | 'completed' | 'defaulted';

interface InvestmentItem {
  id: string;
  borrowerAlias: string;
  amount: number;
  interestRate: number;
  duration: number;
  status: 'active' | 'completed' | 'defaulted';
  fundedDate: Date;
  dueDate: Date;
  expectedReturn: number;
  actualReturn?: number;
  progress: number; // 0-100 completion %
}

const getStatusText = (status: InvestmentItem['status']): string => {
  switch (status) {
    case 'active': return 'Đang hoạt động';
    case 'completed': return 'Hoàn thành';
    case 'defaulted': return 'Vỡ nợ';
    default: return status;
  }
};

const toNum = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
  return parseFloat(String(val)) || 0;
};

const MyInvestmentsScreen: React.FC<MyInvestmentsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvestments = useCallback(async () => {
    try {
      const { loanApi } = await import('@/api/loan.api');
      const response = await loanApi.getMyInvestments();
      const data = Array.isArray(response?.data || response) ? (response?.data || response) : [];

      const items: InvestmentItem[] = data.map((loan: any) => {
        const startDate = new Date(loan.startDate || loan.createdAt);
        const dueDate = new Date(loan.dueDate || Date.now());
        const now = Date.now();
        const totalDuration = dueDate.getTime() - startDate.getTime();
        const elapsed = now - startDate.getTime();
        const progress = Math.min(Math.max(Math.round((elapsed / totalDuration) * 100), 0), 100);

        let status: 'active' | 'completed' | 'defaulted' = 'active';
        if (loan.status === 'repaid') status = 'completed';
        else if (loan.status === 'defaulted') status = 'defaulted';

        const principalAmt = toNum(loan.principalAmount);
        const totalInterest = toNum(loan.totalInterest);

        return {
          id: loan._id || loan.id,
          borrowerAlias: loan.borrowerId?.fullName || `Borrower #${(loan._id || '').slice(-4)}`,
          amount: principalAmt,
          interestRate: toNum(loan.interestRate),
          duration: toNum(loan.durationDays) || 30,
          status,
          fundedDate: startDate,
          dueDate,
          expectedReturn: principalAmt + totalInterest,
          actualReturn: status === 'completed' ? (toNum(loan.amountPaid) || principalAmt + totalInterest) : undefined,
          progress,
        };
      });

      setInvestments(items);
    } catch (err) {
      console.error('Error fetching investments:', err);
      setInvestments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Single-pass derivation: filter + summary + tab counts in one useMemo
  const { filteredInvestments, totalInvested, totalEarned, activePending, tabCounts } = useMemo(() => {
    let invested = 0;
    let earned = 0;
    let pending = 0;
    const counts = { active: 0, completed: 0, defaulted: 0 };
    const filtered: InvestmentItem[] = [];

    for (const inv of investments) {
      invested += inv.amount;
      counts[inv.status] = (counts[inv.status] ?? 0) + 1;
      if (inv.status === activeTab) filtered.push(inv);
      if (inv.status === 'completed') earned += (inv.actualReturn || 0) - inv.amount;
      if (inv.status === 'active') pending += inv.expectedReturn - inv.amount;
    }

    return {
      filteredInvestments: filtered,
      totalInvested: invested,
      totalEarned: earned,
      activePending: pending,
      tabCounts: counts,
    };
  }, [investments, activeTab]);

  const getStatusColor = useCallback((status: InvestmentItem['status']): string => {
    switch (status) {
      case 'active': return colors.accentBlue;
      case 'completed': return colors.greenSuccess;
      case 'defaulted': return colors.redError;
      default: return colors.textGray;
    }
  }, [colors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInvestments();
    setRefreshing(false);
  }, [fetchInvestments]);

  const renderInvestmentItem = useCallback(({ item }: { item: InvestmentItem }) => {
    const daysLeft = calculateDaysRemaining(item.dueDate.getTime());
    const profit = item.status === 'completed'
      ? (item.actualReturn || 0) - item.amount
      : item.expectedReturn - item.amount;

    return (
      <Card
        style={styles.investmentCard}
        onPress={() => navigation.navigate('LoanDetail', { loanId: item.id })}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.borrowerRow}>
            <View style={[styles.avatar, { backgroundColor: getStatusColor(item.status) + '20' }]}>
              <Text style={[styles.avatarText, { color: getStatusColor(item.status) }]}>
                {item.borrowerAlias.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={[styles.borrowerName, { color: colors.textWhite }]}>
                {item.borrowerAlias}
              </Text>
              <Text style={[styles.fundedDate, { color: colors.textGray }]}>
                Cấp vốn: {formatDate(item.fundedDate)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        {/* Details Grid */}
        <View style={[styles.detailsGrid, { backgroundColor: colors.darkBackground }]}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Đã đầu tư</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>
              {formatCurrency(item.amount.toString())} USDT
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Lãi suất</Text>
            <Text style={[styles.detailValue, { color: colors.greenSuccess }]}>
              {item.interestRate}%/năm
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Lợi nhuận</Text>
            <Text style={[styles.detailValue, { color: colors.greenSuccess }]}>
              +{formatCurrency(profit.toFixed(2))} USDT
            </Text>
          </View>
        </View>

        {/* Progress Bar (active only) */}
        {item.status === 'active' && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textGray }]}>
                {formatDaysRemaining(daysLeft)}
              </Text>
              <Text style={[styles.progressValue, { color: colors.accentBlue }]}>
                {item.progress}%
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.darkBackground }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${item.progress}%`, backgroundColor: colors.accentBlue },
                ]}
              />
            </View>
          </View>
        )}

        {/* Completed info */}
        {item.status === 'completed' && (
          <View style={[styles.completedRow, { backgroundColor: colors.greenSuccess + '10' }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.greenSuccess} />
            <Text style={[styles.completedText, { color: colors.greenSuccess }]}>
              Đã nhận {formatCurrency((item.actualReturn || 0).toFixed(2))} USDT
            </Text>
          </View>
        )}

        {/* Defaulted info */}
        {item.status === 'defaulted' && (
          <View style={[styles.defaultedRow, { backgroundColor: colors.redError + '10' }]}>
            <Ionicons name="alert-circle" size={18} color={colors.redError} />
            <Text style={[styles.defaultedText, { color: colors.redError }]}>
              Tài sản thế chấp đang được thanh lý
            </Text>
          </View>
        )}
      </Card>
    );
  }, [colors, navigation, getStatusColor, getStatusText]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Đầu tư của tôi</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Summary Card */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.darkSurface }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textGray }]}>Tổng đã đầu tư</Text>
          <Text style={[styles.summaryValue, { color: colors.textWhite }]}>
            {formatCurrency(totalInvested.toString())}
          </Text>
          <Text style={[styles.summaryUnit, { color: colors.textGray }]}>USDT</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.darkBorder }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textGray }]}>Lợi nhuận đã nhận</Text>
          <Text style={[styles.summaryValue, { color: colors.greenSuccess }]}>
            +{formatCurrency(totalEarned.toFixed(2))}
          </Text>
          <Text style={[styles.summaryUnit, { color: colors.textGray }]}>USDT</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.darkBorder }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textGray }]}>Đang chờ</Text>
          <Text style={[styles.summaryValue, { color: colors.yellowWarning }]}>
            +{formatCurrency(activePending.toFixed(2))}
          </Text>
          <Text style={[styles.summaryUnit, { color: colors.textGray }]}>USDT</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={[styles.tabContainer, { backgroundColor: colors.darkSurface }]}>
        {(['active', 'completed', 'defaulted'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { backgroundColor: getStatusColor(tab) },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? colors.textWhite : colors.textGray },
              ]}
            >
              {tab === 'active' ? 'Đang đầu tư' : tab === 'completed' ? 'Hoàn thành' : 'Vỡ nợ'} (
              {tabCounts[tab]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Investment List */}
      {filteredInvestments.length > 0 ? (
        <FlatList
          data={filteredInvestments}
          renderItem={renderInvestmentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={activeTab === 'active' ? 'bar-chart-outline' : activeTab === 'completed' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={64}
            color={activeTab === 'active' ? colors.accentBlue : activeTab === 'completed' ? colors.greenSuccess : colors.redError}
          />
          <Text style={[styles.emptyTitle, { color: colors.textWhite }]}>
            {activeTab === 'active'
              ? 'Chưa có khoản đầu tư nào'
              : activeTab === 'completed'
              ? 'Chưa có khoản hoàn thành'
              : 'Chưa có khoản vỡ nợ'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textGray }]}>
            {activeTab === 'active'
              ? 'Khám phá marketplace để tìm cơ hội đầu tư phù hợp!'
              : activeTab === 'completed'
              ? 'Các khoản đầu tư hoàn thành sẽ hiển thị ở đây.'
              : 'Thật tuyệt! Bạn chưa gặp trường hợp vỡ nợ nào.'}
          </Text>
          {activeTab === 'active' && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.accentBlue }]}
              onPress={() => navigation.navigate('BrowseLoans')}
            >
              <Text style={[styles.emptyButtonText, { color: colors.textWhite }]}>
                Khám phá ngay
              </Text>
            </TouchableOpacity>
          )}
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
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerSpacer: { width: 24 },

  // Summary
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 10, marginBottom: 4, textAlign: 'center' },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
  summaryUnit: { fontSize: 10, marginTop: 2 },
  summaryDivider: { width: 1, marginHorizontal: 8 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: { fontSize: 12, fontWeight: '600' },

  // List
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Card
  investmentCard: { marginBottom: 12 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  borrowerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  borrowerName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  fundedDate: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: { flex: 1, alignItems: 'center' },
  detailLabel: { fontSize: 10, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '600' },

  // Progress
  progressSection: { marginBottom: 4 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12 },
  progressValue: { fontSize: 12, fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  // Completed Row
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  completedText: { fontSize: 13, fontWeight: '500' },

  // Defaulted Row
  defaultedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  defaultedText: { fontSize: 13, fontWeight: '500' },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  emptyButton: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  emptyButtonText: { fontSize: 16, fontWeight: '600' },
});

export default MyInvestmentsScreen;
