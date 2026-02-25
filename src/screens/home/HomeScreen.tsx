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
import LinearGradient from 'react-native-linear-gradient';
import { Card } from '@/components/common';
import { useAppDispatch, useAuth, useOpenBanking, loadConnections } from '@/store';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { connections, totalBalance } = useOpenBanking();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(loadConnections());
    setRefreshing(false);
  };

  const quickActions = [
    {
      icon: '🏦',
      title: 'Liên kết ngân hàng',
      subtitle: 'Kết nối tài khoản',
      onPress: () => navigation.navigate('LinkBank'),
    },
    {
      icon: '💸',
      title: 'Vay tiền',
      subtitle: 'Duyệt các khoản vay',
      onPress: () => navigation.navigate('BrowseLoans'),
    },
    {
      icon: '📊',
      title: 'Đầu tư',
      subtitle: 'Cho vay P2P',
      onPress: () => navigation.navigate('Loans'),
    },
    {
      icon: '📋',
      title: 'Lịch sử',
      subtitle: 'Giao dịch của bạn',
      onPress: () => navigation.navigate('Wallet'),
    },
  ];

  const featuredLoans = [
    {
      id: '1',
      title: 'Khoản vay kinh doanh',
      amount: 50000000,
      interestRate: 12,
      term: '12 tháng',
    },
    {
      id: '2',
      title: 'Khoản vay tiêu dùng',
      amount: 20000000,
      interestRate: 15,
      term: '6 tháng',
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
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: colors.darkSurface }]}
            onPress={() => navigation.navigate('Messages')}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
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
            {formatCurrency(totalBalance || 0)}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Tài khoản liên kết</Text>
              <Text style={[styles.balanceItemValue, { color: colors.textWhite }]}>{connections.length}</Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Khoản vay đang xử lý</Text>
              <Text style={[styles.balanceItemValue, { color: colors.textWhite }]}>2</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Link Bank CTA */}
        {connections.length === 0 && (
          <Card style={{...styles.linkBankCard, backgroundColor: colors.accentBlue + '15', borderColor: colors.accentBlue}}>
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
          {featuredLoans.map((loan) => (
            <Card
              key={loan.id}
              style={styles.loanCard}
              onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
            >
              <View style={styles.loanHeader}>
                <Text style={[styles.loanTitle, { color: colors.textWhite }]}>{loan.title}</Text>
                <View style={[styles.interestBadge, { backgroundColor: colors.greenSuccess + '20' }]}>
                  <Text style={[styles.interestText, { color: colors.greenSuccess }]}>{loan.interestRate}%/năm</Text>
                </View>
              </View>
              <View style={styles.loanDetails}>
                <View style={styles.loanDetail}>
                  <Text style={[styles.loanDetailLabel, { color: colors.textGray }]}>Số tiền</Text>
                  <Text style={[styles.loanDetailValue, { color: colors.textWhite }]}>
                    {formatCurrency(loan.amount)}
                  </Text>
                </View>
                <View style={styles.loanDetail}>
                  <Text style={[styles.loanDetailLabel, { color: colors.textGray }]}>Kỳ hạn</Text>
                  <Text style={[styles.loanDetailValue, { color: colors.textWhite }]}>{loan.term}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Wallet')}>
              <Text style={[styles.seeAllText, { color: colors.accentBlue }]}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.transactionCard}>
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={[styles.emptyText, { color: colors.textGray }]}>Chưa có giao dịch nào</Text>
            </View>
          </Card>
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
});

export default HomeScreen;
