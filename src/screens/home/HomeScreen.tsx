import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import notificationApi from '@/api/notification.api';
import LinearGradient from 'react-native-linear-gradient';
import { Card } from '@/components/common';
import { useAppDispatch, useAuth, useOpenBanking, loadConnections } from '@/store';
import { loadUser } from '@/store/slices/authSlice';
import { loadCreditScore } from '@/store/slices/openBankingSlice';
import { useTheme, useWeb3 } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { getRatingColor } from '@/utils';
import { loanApi } from '@/api/loan.api';
import { useFocusEffect } from '@react-navigation/native';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { connections, totalBalance, creditScore } = useOpenBanking();
  const { balances, connection, refreshBalances, formatBalance, formatAddress } = useWeb3();
  const [refreshing, setRefreshing] = React.useState(false);

  const [featuredLoans, setFeaturedLoans] = React.useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = React.useState<any[]>([]);
  const [myPendingLoansCount, setMyPendingLoansCount] = React.useState<number>(0);
  const [unreadNotifications, setUnreadNotifications] = React.useState<number>(0);

  // Helper: Safely convert numeric values from API
  const toNum = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
    return parseFloat(String(val)) || 0;
  };

  const fetchData = React.useCallback(async () => {
    try {
      // 1. Fetch my pending loan requests count
      try {
        const myReqRes = await loanApi.getMyRequests();
        const myReqData = myReqRes?.data || myReqRes || [];
        if (Array.isArray(myReqData)) {
          const pendingCount = myReqData.filter(
            (r: any) => r?.status === 'pending' || r?.status === 'PENDING'
          ).length;
          setMyPendingLoansCount(pendingCount);
        }
      } catch (reqErr) {
        console.log('Error fetching my requests:', reqErr);
      }

      // 2. Fetch Featured Loans (others' loans)
      const pendingRes = await loanApi.getPendingRequests();
      const pendingData = pendingRes?.data || pendingRes || [];
      if (Array.isArray(pendingData)) {
        const othersLoans = pendingData.filter((loan: any) => {
          if (!loan) return false;
          const borrowerId = loan.borrowerId?._id || loan.borrowerId;
          return borrowerId !== user?._id;
        });
        setFeaturedLoans(othersLoans.slice(0, 2));
      }

      // 3. Fetch Recent Transactions
      try {
        const txRes = await loanApi.getMyTransactions();
        const txData = txRes?.data || txRes || [];
        if (Array.isArray(txData)) {
          setRecentTransactions(txData.slice(0, 3));
        }
      } catch (txErr) {
        console.log('Error fetching transactions:', txErr);
      }

      // 4. Fetch Unread Notifications
      try {
        const notiRes = await notificationApi.getMyNotifications(1, 0);
        if (notiRes && notiRes.data) {
          setUnreadNotifications(notiRes.data.unreadCount || 0);
        }
      } catch (notiErr) {
        console.log('Error fetching notifications:', notiErr);
      }
    } catch (error) {
      console.log('Error fetching home data:', error);
    }
  }, [user?._id]);

  // Refresh user data (kycStatus, etc.) mỗi khi vào HomeScreen
  useFocusEffect(
    React.useCallback(() => {
      dispatch(loadUser());
      // Load credit score nếu chưa có
      if (!creditScore && user?._id) {
        dispatch(loadCreditScore(user._id));
      }
    }, [dispatch, creditScore, user?._id])
  );

  // Tự động load connections và dữ liệu khi vào HomeScreen
  useEffect(() => {
    dispatch(loadConnections());
    fetchData();
  }, [dispatch, fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(loadUser()),         // Sync kycStatus từ server
      dispatch(loadConnections()),  // Sync bank connections
      refreshBalances(),            // Sync crypto balances
      user?._id ? dispatch(loadCreditScore(user._id)) : Promise.resolve(),
      fetchData(),                  // Sync loan data
    ]);
    setRefreshing(false);
  };

  const quickActions = [
    {
      icon: '🏦',
      title: 'Liên kết ngân hàng',
      subtitle: 'Kết nối tài khoản',
      onPress: () => connections && connections.length > 0
        ? navigation.navigate('BankConnections')
        : navigation.navigate('LinkBank'),
    },
    {
      icon: '💸',
      title: 'Vay tiền',
      subtitle: 'Tạo yêu cầu vay',
      onPress: () => navigation.navigate('CreateLoan'),
    },
    {
      icon: '📊',
      title: 'Đầu tư',
      subtitle: 'Cho vay P2P',
      onPress: () => navigation.navigate('BrowseLoans'),
    },
    {
      icon: '📋',
      title: 'Lịch sử',
      subtitle: 'Giao dịch của bạn',
      onPress: () => navigation.navigate('TransactionHistory' as any),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textGray }]}>Xin chào 👋</Text>
            <Text style={[styles.userName, { color: colors.textWhite }]}>{user?.fullName || 'Người dùng'}</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.darkSurface, marginRight: 8 }]}
              onPress={() => navigation.navigate('Messages')}
            >
              <Text style={styles.notificationIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.darkSurface }]}
              onPress={() => navigation.navigate('Notifications' as any)}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={[colors.accentBlue, '#1a73e8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Tổng số dư</Text>
          <Text style={[styles.balanceAmount, { color: colors.textWhite }]}>
            {formatCurrency(toNum(totalBalance))}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Tài khoản liên kết</Text>
              <Text style={[styles.balanceItemValue, { color: colors.textWhite }]}>{connections?.length || 0}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Khoản vay đang xử lý</Text>
              <Text style={[styles.balanceItemValue, { color: colors.textWhite }]}>{myPendingLoansCount}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Crypto Wallet + Credit Score */}
        <View style={styles.statsRow}>
          {/* Crypto Wallet */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.darkSurface }]}
            onPress={() => navigation.navigate('WalletTab' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>ETH</Text>
            <Text style={[styles.statValue, { color: colors.textWhite }]} numberOfLines={1}>
              {formatBalance(balances.eth, 4)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textGray, marginTop: 6 }]}>USDT</Text>
            <Text style={[styles.statValue, { color: colors.textWhite }]} numberOfLines={1}>
              {formatBalance(balances.usdt, 2)}
            </Text>
            {connection.address && (
              <Text style={[styles.walletAddress, { color: colors.accentBlue }]}>
                {formatAddress(connection.address)}
              </Text>
            )}
          </TouchableOpacity>

          {/* Credit Score */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.darkSurface }]}
            onPress={() => navigation.navigate('BankConnections')}
            activeOpacity={0.8}
          >
            <Text style={styles.statEmoji}>📊</Text>
            <Text style={[styles.statLabel, { color: colors.textGray }]}>Điểm tín dụng</Text>
            {creditScore ? (
              <>
                <Text style={[styles.creditScoreValue, { color: getRatingColor(creditScore.rating) }]}>
                  {creditScore.score}
                </Text>
                <View style={[styles.ratingBadge, { backgroundColor: getRatingColor(creditScore.rating) + '20' }]}>
                  <Text style={[styles.ratingText, { color: getRatingColor(creditScore.rating) }]}>
                    {creditScore.rating}
                  </Text>
                </View>
                <Text style={[styles.statLabel, { color: colors.textGray, marginTop: 4 }]}>
                  Hạn mức: {creditScore.loanLimit?.toLocaleString()} USDT
                </Text>
              </>
            ) : (
              <Text style={[styles.statNoData, { color: colors.textGray }]}>Chưa có điểm</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Link Bank CTA */}
        {(!connections || connections.length === 0) && (
          <Card style={{ ...styles.linkBankCard, backgroundColor: colors.accentBlue + '15', borderColor: colors.accentBlue }}>
            <View style={styles.linkBankContent}>
              <View style={[styles.linkBankIcon, { backgroundColor: colors.accentBlue + '30' }]}>
                <Text style={styles.linkBankIconText}>🏦</Text>
              </View>
              <View style={styles.linkBankText}>
                <Text style={[styles.linkBankTitle, { color: colors.textWhite }]}>Liên kết ngân hàng</Text>
                <Text style={[styles.linkBankSubtitle, { color: colors.textGray }]}>
                  Kết nối tài khoản ngân hàng để bắt đầu vay hoặc cho vay
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.linkBankButton, { backgroundColor: colors.accentBlue }]}
              onPress={() => navigation.navigate('LinkBank')}
            >
              <Text style={[styles.linkBankButtonText, { color: colors.textWhite }]}>Kết nối ngay →</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Dịch vụ</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickActionItem}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.darkSurface }]}>
                  <Text style={styles.quickActionIconText}>{action.icon}</Text>
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.textWhite }]}>{action.title}</Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.textGray }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Loans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Khoản vay nổi bật</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BrowseLoans')}>
              <Text style={[styles.seeAllText, { color: colors.accentBlue }]}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          {!featuredLoans || featuredLoans.length === 0 ? (
            <Card style={styles.loanCard}>
              <View style={styles.emptyTransactions}>
                <Text style={[styles.emptyText, { color: colors.textGray }]}>Không có khoản vay nào mới</Text>
              </View>
            </Card>
          ) : (
            featuredLoans.map((loan) => {
              const borrowerName = typeof loan.borrowerId === 'object'
                ? (loan.borrowerId?.fullName || 'Ẩn danh')
                : 'Người vay';
              const borrowerInitial = borrowerName.charAt(0).toUpperCase();

              return (
                <Card
                  key={loan._id || loan.id}
                  style={styles.loanCard}
                  onPress={() => navigation.navigate('LoanDetail', { loanId: loan._id || loan.id })}
                >
                  <View style={styles.loanHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.accentBlue + '30', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: colors.accentBlue, fontWeight: 'bold', fontSize: 16 }}>{borrowerInitial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.loanTitle, { color: colors.textWhite }]} numberOfLines={1}>
                          {borrowerName}
                        </Text>
                        <Text style={{ color: colors.textGray, fontSize: 12 }} numberOfLines={1}>
                          {loan.purpose || 'Cá nhân'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.interestBadge, { backgroundColor: colors.greenSuccess + '20' }]}>
                      <Text style={[styles.interestText, { color: colors.greenSuccess }]}>{toNum(loan.interestRate)}%/năm</Text>
                    </View>
                  </View>
                  <View style={styles.loanDetails}>
                    <View style={styles.loanDetail}>
                      <Text style={[styles.loanDetailLabel, { color: colors.textGray }]}>Số tiền</Text>
                      <Text style={[styles.loanDetailValue, { color: colors.textWhite }]}>
                        {toNum(loan.loanAmount)} USDT
                      </Text>
                    </View>
                    <View style={styles.loanDetail}>
                      <Text style={[styles.loanDetailLabel, { color: colors.textGray }]}>Kỳ hạn</Text>
                      <Text style={[styles.loanDetailValue, { color: colors.textWhite }]}>{toNum(loan.durationDays)} ngày</Text>
                    </View>
                  </View>
                </Card>
              );
            })

          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('WalletTab' as any)}>
              <Text style={[styles.seeAllText, { color: colors.accentBlue }]}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          
          {!recentTransactions || recentTransactions.length === 0 ? (
            <Card style={styles.transactionCard}>
              <View style={styles.emptyTransactions}>
                <Text style={styles.emptyIcon}>📝</Text>
                <Text style={[styles.emptyText, { color: colors.textGray }]}>Chưa có giao dịch nào</Text>
              </View>
            </Card>
          ) : (
            recentTransactions.map((tx) => {
              const isPayment = tx.type === 'PAYMENT';
              return (
                <TouchableOpacity 
                  key={tx._id} 
                  onPress={() => tx.loanInfo?._id && navigation.navigate('LoanDetail', { loanId: tx.loanInfo._id })}
                >
                  <Card style={[styles.loanCard, { marginBottom: 8 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 20, 
                          backgroundColor: isPayment ? colors.redError + '20' : colors.greenSuccess + '20',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12
                        }}>
                          <Text style={{ fontSize: 18 }}>{isPayment ? '💸' : '💰'}</Text>
                        </View>
                        <View>
                          <Text style={{ color: colors.textWhite, fontWeight: '600', fontSize: 15 }}>
                            {isPayment ? 'Thanh toán trả nợ' : 'Nhận tiền thanh toán'}
                          </Text>
                          <Text style={{ color: colors.textGray, fontSize: 12 }}>
                            {formatDate(new Date(tx.date))}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ 
                          color: isPayment ? colors.redError : colors.greenSuccess, 
                          fontWeight: 'bold',
                          fontSize: 16
                        }}>
                          {isPayment ? '-' : '+'}{formatCurrency(toNum(tx.amount))}
                        </Text>
                        <Text style={{ color: colors.textGray, fontSize: 10 }}>
                          {tx.status === 'COMPLETED' ? 'Thành công' : 'Đang xử lý'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  balanceItemValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 20,
  },
  linkBankCard: {
    marginBottom: 20,
    borderWidth: 1,
  },
  linkBankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkBankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkBankIconText: {
    fontSize: 24,
  },
  linkBankText: {
    flex: 1,
  },
  linkBankTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  linkBankSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkBankButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkBankButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: -16,
  },
  quickActionItem: {
    width: '50%',
    padding: 6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionIconText: {
    fontSize: 24,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
  },
  loanCard: {
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loanTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  interestBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  interestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loanDetails: {
    flexDirection: 'row',
  },
  loanDetail: {
    flex: 1,
  },
  loanDetailLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  loanDetailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionCard: {},
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
  },

  // Stats Row (Crypto + Credit Score)
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  creditScoreValue: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 2,
  },
  ratingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statNoData: {
    fontSize: 14,
    marginTop: 12,
  },
  walletAddress: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500',
  },
});

export default HomeScreen;
