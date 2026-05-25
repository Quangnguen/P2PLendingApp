import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  FlatList,
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
import Ionicons from 'react-native-vector-icons/Ionicons';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const toNum = (val: any): number => {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val) || 0;
  if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
  return parseFloat(String(val)) || 0;
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
      // Backend returns { notifications: [...], unreadCount: n } directly (no .data wrapper)
      try {
        const notiRes = await notificationApi.getMyNotifications(1, 0);
        setUnreadNotifications(notiRes?.unreadCount || 0);
      } catch (notiErr) {
        console.log('Error fetching notifications:', notiErr);
      }
    } catch (error) {
      console.log('Error fetching home data:', error);
    }
  }, [user?._id]);

  // Refresh tất cả dữ liệu mỗi khi vào HomeScreen (bao gồm lần đầu mount)
  useFocusEffect(
    React.useCallback(() => {
      dispatch(loadUser());
      dispatch(loadConnections());
      if (!creditScore && user?._id) {
        dispatch(loadCreditScore(user._id));
      }
      fetchData();
    }, [dispatch, creditScore, user?._id, fetchData])
  );

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
      icon: 'business-outline',
      color: '#4ade80',
      title: 'Liên kết NH',
      subtitle: 'Kết nối tài khoản',
      onPress: () => connections && connections.length > 0
        ? navigation.navigate('BankConnections')
        : navigation.navigate('LinkBank'),
    },
    {
      icon: 'cash-outline',
      color: '#3b82f6',
      title: 'Vay tiền',
      subtitle: 'Tạo yêu cầu vay',
      onPress: () => navigation.navigate('CreateLoan'),
    },
    {
      icon: 'bar-chart-outline',
      color: '#f59e0b',
      title: 'Đầu tư',
      subtitle: 'Cho vay P2P',
      onPress: () => navigation.navigate('BrowseLoans'),
    },
    {
      icon: 'receipt-outline',
      color: '#a855f7',
      title: 'Lịch sử',
      subtitle: 'Giao dịch của bạn',
      onPress: () => navigation.navigate('TransactionHistory' as any),
    },
  ];

  const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
          <View style={styles.userInfo}>
            <View style={[styles.avatar, { backgroundColor: colors.accentBlue + '20' }]}>
              <Text style={{ fontSize: 24 }}>{user?.fullName?.charAt(0)?.toUpperCase() || 'U'}</Text>
            </View>
            <View>
              <View style={styles.greetingRow}>
                <Text style={[styles.greeting, { color: colors.textGray }]}>Chào buổi sáng </Text>
                <Ionicons name="hand-left-outline" size={14} color={colors.textGray} />
              </View>
              <Text style={[styles.userName, { color: colors.textWhite }]}>{user?.fullName || 'Người dùng'}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.darkSurface, marginRight: 10 }]}
              onPress={() => navigation.navigate('Messages')}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={colors.textWhite} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: colors.darkSurface }]}
              onPress={() => navigation.navigate('Notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textWhite} />
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={['#1a73e8', '#4b6cb7', '#182848']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          {/* Decorative shapes */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          <Text style={styles.balanceLabel}>Tổng tài sản (VND)</Text>
          <Text style={[styles.balanceAmount, { color: colors.textWhite }]}>
            {formatCurrency(toNum(totalBalance))}
          </Text>

          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconWrapper}>
                <Ionicons name="card-outline" size={16} color={colors.textWhite} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Ngân hàng</Text>
                <Text style={[styles.balanceItemValue, { color: colors.textWhite }]}>{connections?.length || 0} liên kết</Text>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={styles.balanceIconWrapper}>
                <Ionicons name="time-outline" size={16} color={colors.textWhite} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Khoản vay</Text>
                <Text style={[styles.balanceItemValue, { color: colors.textWhite }]}>{myPendingLoansCount}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Crypto Wallet + Credit Score */}
        <View style={styles.statsRow}>
          {/* Crypto Wallet */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder, borderWidth: 1 }]}
            onPress={() => navigation.navigate('WalletTab' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="wallet-outline" size={24} color="#a855f7" />
            </View>
            <View style={styles.statContent}>
              <View style={styles.cryptoRow}>
                <Text style={[styles.statLabel, { color: colors.textGray }]}>ETH</Text>
                <Text style={[styles.statValue, { color: colors.textWhite }]} numberOfLines={1}>
                  {formatBalance(balances.eth, 4)}
                </Text>
              </View>
              <View style={styles.cryptoRow}>
                <Text style={[styles.statLabel, { color: colors.textGray }]}>USDT</Text>
                <Text style={[styles.statValue, { color: colors.textWhite }]} numberOfLines={1}>
                  {formatBalance(balances.usdt, 2)}
                </Text>
              </View>
              {connection.address && (
                <Text style={[styles.walletAddress, { color: colors.accentBlue }]} numberOfLines={1}>
                  {formatAddress(connection.address)}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          {/* Credit Score */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder, borderWidth: 1 }]}
            onPress={() => navigation.navigate('BankConnections')}
            activeOpacity={0.8}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="speedometer-outline" size={24} color="#3b82f6" />
            </View>
            <View style={[styles.statContent, { alignItems: 'center' }]}>
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
                </>
              ) : (
                <Text style={[styles.statNoData, { color: colors.textGray }]}>Chưa có điểm</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Link Bank CTA */}
        {(!connections || connections.length === 0) && (
          <Card style={{ ...styles.linkBankCard, backgroundColor: colors.accentBlue + '12', borderColor: colors.accentBlue + '60' }}>
            <View style={styles.linkBankContent}>
              <LinearGradient
                colors={['#1d4ed8', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linkBankIcon}
              >
                <Ionicons name="business" size={22} color="#fff" />
              </LinearGradient>
              <View style={styles.linkBankText}>
                <Text style={[styles.linkBankTitle, { color: colors.textWhite }]}>Liên kết ngân hàng</Text>
                <Text style={[styles.linkBankSubtitle, { color: colors.textGray }]}>
                  Kết nối tài khoản ngân hàng để bắt đầu vay hoặc cho vay
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('LinkBank')}
              activeOpacity={0.85}
              style={styles.linkBankBtnWrapper}
            >
              <LinearGradient
                colors={['#1d4ed8', '#2563eb', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linkBankButton}
              >
                <Text style={styles.linkBankButtonText}>Kết nối ngay</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Khám phá</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionItem, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={[styles.quickActionTitle, { color: colors.textWhite }]}>{action.title}</Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.textGray }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Loans (Horizontal Scroll) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Cơ hội đầu tư</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BrowseLoans')}>
              <Text style={[styles.seeAllText, { color: colors.accentBlue }]}>Xem thêm</Text>
            </TouchableOpacity>
          </View>

          {!featuredLoans || featuredLoans.length === 0 ? (
            <Card style={[styles.loanCard, { backgroundColor: colors.darkSurface }]}>
              <View style={styles.emptyTransactions}>
                <Ionicons name="file-tray-outline" size={48} color={colors.textGray} />
                <Text style={[styles.emptyText, { color: colors.textGray, marginTop: 10 }]}>Không có khoản vay nào mới</Text>
              </View>
            </Card>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featuredLoans}
              keyExtractor={(item) => item._id || item.id}
              contentContainerStyle={{ paddingRight: 20 }}
              renderItem={({ item: loan }) => {
                const borrowerName = typeof loan.borrowerId === 'object'
                  ? (loan.borrowerId?.fullName || 'Ẩn danh')
                  : 'Người vay';
                const borrowerInitial = borrowerName.charAt(0).toUpperCase();

                return (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('LoanDetail', { loanId: loan._id || loan.id })}
                    style={[styles.featuredLoanCard, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}
                  >
                    <View style={styles.featuredLoanHeader}>
                      <View style={[styles.featuredAvatar, { backgroundColor: colors.accentBlue + '20' }]}>
                        <Text style={{ color: colors.accentBlue, fontWeight: 'bold', fontSize: 18 }}>{borrowerInitial}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.featuredBorrower, { color: colors.textWhite }]} numberOfLines={1}>{borrowerName}</Text>
                        <Text style={{ color: colors.textGray, fontSize: 12 }} numberOfLines={1}>{loan.purpose || 'Mục đích cá nhân'}</Text>
                      </View>
                      <View style={[styles.interestBadge, { backgroundColor: colors.greenSuccess + '15' }]}>
                        <Text style={[styles.interestText, { color: colors.greenSuccess }]}>{toNum(loan.interestRate)}%</Text>
                      </View>
                    </View>

                    <View style={styles.featuredLoanBody}>
                      <View style={styles.featuredDetail}>
                        <Text style={{ color: colors.textGray, fontSize: 12, marginBottom: 4 }}>Cần vay</Text>
                        <Text style={{ color: colors.textWhite, fontSize: 18, fontWeight: 'bold' }}>
                          {formatCurrency(toNum(loan.loanAmount))} <Text style={{ fontSize: 14, fontWeight: 'normal' }}>USDT</Text>
                        </Text>
                      </View>
                      <View style={[styles.featuredDetail, { alignItems: 'flex-end' }]}>
                        <Text style={{ color: colors.textGray, fontSize: 12, marginBottom: 4 }}>Thời hạn</Text>
                        <Text style={{ color: colors.textWhite, fontSize: 16, fontWeight: '600' }}>
                          {toNum(loan.durationDays)} ngày
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
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
                <Ionicons name="document-text-outline" size={48} color={colors.textGray} />
                <Text style={[styles.emptyText, { color: colors.textGray, marginTop: 10 }]}>Chưa có giao dịch nào</Text>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: isPayment ? colors.redError + '15' : colors.greenSuccess + '15',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 14
                        }}>
                          <Ionicons
                            name={isPayment ? "arrow-up" : "arrow-down"}
                            size={20}
                            color={isPayment ? colors.redError : colors.greenSuccess}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textWhite, fontWeight: '600', fontSize: 15 }} numberOfLines={1}>
                            {isPayment ? 'Thanh toán trả nợ' : 'Nhận tiền thanh toán'}
                          </Text>
                          <Text style={{ color: colors.textGray, fontSize: 12 }} numberOfLines={1}>
                            {formatDate(new Date(tx.date))}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
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
    paddingHorizontal: 20,
    paddingTop: 8,
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
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#121212',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
    shadowColor: '#1a73e8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  circle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -40,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -20,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    padding: 12,
    borderRadius: 16,
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
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
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  linkBankBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  linkBankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  linkBankButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
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
    marginTop: 0,
  },
  seeAllText: {
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: '47.5%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
  },
  quickActionSubtitle: {
    fontSize: 12,
  },
  featuredLoanCard: {
    width: 280,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 16,
  },
  featuredLoanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featuredBorrower: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  featuredLoanBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  featuredDetail: {
    justifyContent: 'center',
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
  emptyText: {
    fontSize: 14,
  },

  // Stats Row (Crypto + Credit Score)
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  cryptoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  walletAddress: {
    fontSize: 10,
    marginTop: 8,
    fontWeight: '500',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  creditScoreValue: {
    fontSize: 36,
    fontWeight: '900',
    marginVertical: 4,
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
});

export default HomeScreen;
