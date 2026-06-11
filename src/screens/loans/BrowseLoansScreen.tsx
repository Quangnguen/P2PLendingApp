import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Card, Button } from '@/components/common';
import { useTheme } from '@/providers';
import { useAuth } from '@/store';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

type BrowseLoansScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BrowseLoans'>;
};

interface LoanRequest {
  id: string;
  borrowerName: string;
  borrowerWallet: string | null;
  amount: number;
  interestRate: number;
  term: number;
  purpose: string;
  creditScore: number;
  funded: number;
}

interface LoanCardProps {
  loan: LoanRequest;
  risk: { label: string; color: string; desc: string };
  colors: any;
  onPress: () => void;
  hasDebt?: boolean;
}

const LoanCard = memo<LoanCardProps>(({ loan, risk, colors, onPress, hasDebt }) => (
  <TouchableOpacity activeOpacity={0.95} onPress={onPress}>
    <Card style={[styles.loanCard, { backgroundColor: colors.darkSurface, borderColor: hasDebt ? '#dc2626' : colors.darkBorder }]}>
      <View style={styles.cardHeader}>
        <View style={styles.borrowerRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accentBlue + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.accentBlue }]}>
              {loan.borrowerName.charAt(0)}
            </Text>
          </View>
          <View style={styles.borrowerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.borrowerName, { color: colors.textWhite }]}>{loan.borrowerName}</Text>
              {hasDebt && (
                <View style={styles.debtBadge}>
                  <Ionicons name="warning" size={10} color="#fff" />
                  <Text style={styles.debtBadgeText}>Nợ xấu</Text>
                </View>
              )}
            </View>
            <View style={styles.purposeTag}>
              <Text style={[styles.purpose, { color: colors.textGray }]}>{loan.purpose}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.riskBadge, { backgroundColor: risk.color + '15', borderColor: risk.color }]}>
          <Text style={[styles.riskLabel, { color: risk.color }]}>Rủi ro: {risk.label}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textGray }]}>Số tiền</Text>
          <Text style={[styles.statValue, { color: colors.textWhite }]}>
            {formatCurrency(loan.amount).replace('.00', '')}
          </Text>
        </View>
        <View style={[styles.statItem, styles.statBorder]}>
          <Text style={[styles.statLabel, { color: colors.textGray }]}>Lợi nhuận</Text>
          <Text style={[styles.statValue, { color: colors.greenSuccess }]}>{loan.interestRate}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textGray }]}>Kỳ hạn</Text>
          <Text style={[styles.statValue, { color: colors.textWhite }]}>{loan.term} ngày</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={[styles.progressText, { color: colors.textGray }]}>Đã tài trợ: {loan.funded}%</Text>
          <Text style={[styles.remainingText, { color: colors.accentBlue }]}>
            Còn: {formatCurrency(loan.amount * (1 - loan.funded / 100)).replace('.00', '')}
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.darkBackground }]}>
          <LinearGradient
            colors={[colors.accentBlue, '#3b82f6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${loan.funded}%` }]}
          />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.creditInfo}>
          <Ionicons name="stats-chart" size={14} color={colors.textGray} />
          <Text style={[styles.creditText, { color: colors.textGray }]}>Điểm tín dụng: {loan.creditScore}</Text>
        </View>
        <TouchableOpacity
          style={[styles.investAction, { backgroundColor: colors.accentBlue }]}
          onPress={onPress}
        >
          <Text style={styles.investActionText}>Xem chi tiết</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </Card>
  </TouchableOpacity>
));

const toNum = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
  return parseFloat(String(val)) || 0;
};

const FILTERS = [
  { key: 'all', label: 'Tất cả', icon: 'list' },
  { key: 'low_risk', label: 'An toàn', icon: 'shield-checkmark' },
  { key: 'high_return', label: 'Lợi nhuận', icon: 'trending-up' },
] as const;

const BrowseLoansScreen: React.FC<BrowseLoansScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low_risk' | 'high_return'>('all');
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debtTokenMap, setDebtTokenMap] = useState<Record<string, boolean>>({});

  // Fetch pending loan requests from API - refresh on focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchLoans = async () => {
        setIsLoading(true);
        try {
          const { loanApi } = await import('@/api/loan.api');
          const response = await loanApi.getPendingRequests();
          if (!isActive) return;
          const data = response?.data || response || [];
          
          const requests = (Array.isArray(data) ? data : [])
            // Tạm thời comment filter này để bạn có thể xem thiết kế UI bằng chính khoản vay của mình
            // .filter((req: any) => {
            //   const borrowerId = req.borrowerId?._id || req.borrowerId;
            //   return borrowerId !== user?._id;
            // })
            .map((req: any) => ({
              id: req._id || req.id,
              borrowerName: req.borrowerId?.fullName || 'Ẩn danh',
              borrowerWallet: req.borrowerId?.walletAddress || null,
              amount: toNum(req.loanAmount),
              interestRate: toNum(req.interestRate),
              term: toNum(req.durationDays) || 30,
              purpose: req.purpose || 'Không rõ',
              creditScore: toNum(req.borrowerId?.creditScore) || 0,
              funded: 0,
            }));
          setLoanRequests(requests);

          // Kiểm tra nợ xấu cho từng người vay (song song)
          const wallets = [...new Set(requests.map((r: LoanRequest) => r.borrowerWallet).filter(Boolean))] as string[];
          if (wallets.length > 0) {
            const { loanApi } = await import('@/api/loan.api');
            const results = await Promise.allSettled(wallets.map(w => loanApi.checkDebtTokens(w)));
            const map: Record<string, boolean> = {};
            results.forEach((res, i) => {
              if (res.status === 'fulfilled') {
                const data = res.value?.data || res.value;
                map[wallets[i]] = data?.hasDebt ?? false;
              }
            });
            if (isActive) setDebtTokenMap(map);
          }
        } catch (err) {
          console.error('Error fetching pending requests:', err);
          if (isActive) setLoanRequests([]);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      fetchLoans();

      return () => {
        isActive = false;
      };
    }, [user?._id])
  );

  const getRiskLevel = useCallback((score: number) => {
    if (score >= 750) return { label: 'A', color: colors.greenSuccess, desc: 'Rất thấp' };
    if (score >= 680) return { label: 'B', color: colors.yellowWarning, desc: 'Trung bình' };
    return { label: 'C', color: colors.redError, desc: 'Cao' };
  }, [colors]);

  const renderLoanItem = useCallback(({ item: loan }: { item: LoanRequest }) => {
    const risk = getRiskLevel(loan.creditScore);
    return (
      <LoanCard
        loan={loan}
        risk={risk}
        colors={colors}
        onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
        hasDebt={loan.borrowerWallet ? (debtTokenMap[loan.borrowerWallet] ?? false) : false}
      />
    );
  }, [getRiskLevel, colors, navigation, debtTokenMap]);

  const filteredLoans = useMemo(() => {
    return loanRequests.filter((loan) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          loan.borrowerName.toLowerCase().includes(query) ||
          loan.purpose.toLowerCase().includes(query)
        );
      }
      if (selectedFilter === 'low_risk') return loan.creditScore >= 750;
      if (selectedFilter === 'high_return') return loan.interestRate >= 14;
      return true;
    });
  }, [loanRequests, searchQuery, selectedFilter]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header with Background Accent */}
      <View style={styles.headerWrapper}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={[styles.iconButton, { backgroundColor: colors.darkSurface }]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textWhite} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Thị trường</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textGray }]}>Duyệt các khoản vay tiềm năng</Text>
          </View>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.darkSurface }]}>
            <Ionicons name="notifications-outline" size={22} color={colors.textWhite} />
          </TouchableOpacity>
        </View>

        {/* Modern Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
            <Ionicons name="search" size={20} color={colors.textGray} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textWhite }]}
              placeholder="Tìm theo tên hoặc mục đích..."
              placeholderTextColor={colors.textGray + '80'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textGray} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Filters */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: selectedFilter === filter.key ? colors.accentBlue : colors.darkSurface,
                  borderColor: selectedFilter === filter.key ? colors.accentBlue : colors.darkBorder,
                },
              ]}
              onPress={() => setSelectedFilter(filter.key as typeof selectedFilter)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={filter.icon as any} 
                size={16} 
                color={selectedFilter === filter.key ? colors.textWhite : colors.textGray} 
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedFilter === filter.key ? colors.textWhite : colors.textGray },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loan List */}
      <FlatList
        data={filteredLoans}
        keyExtractor={item => item.id}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={[styles.resultsCount, { color: colors.textWhite }]}>
              Khoản vay sẵn có ({filteredLoans.length})
            </Text>
            <TouchableOpacity>
              <Text style={{ color: colors.accentBlue, fontSize: 13 }}>Sắp xếp</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={colors.darkBorder} />
            <Text style={[styles.emptyText, { color: colors.textGray }]}>
              Không tìm thấy khoản vay nào phù hợp
            </Text>
          </View>
        }
        renderItem={renderLoanItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerWrapper: {
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 10,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loanCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  debtBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#dc2626',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 2,
  },
  debtBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  purposeTag: {
    alignSelf: 'flex-start',
  },
  purpose: {
    fontSize: 13,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  creditInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditText: {
    fontSize: 12,
    marginLeft: 6,
  },
  investAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  investActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
  },
});

export default BrowseLoansScreen;

