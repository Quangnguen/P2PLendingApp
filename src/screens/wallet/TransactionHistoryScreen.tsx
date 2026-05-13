import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/types';
import { useTheme } from '@/providers';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatCurrency } from '@/utils/formatters';

type TransactionHistoryScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TransactionHistory'>;
};

// Mock data for transactions
const MOCK_TRANSACTIONS = [
  {
    id: 'tx1',
    type: 'FUND_LOAN',
    token: 'USDT',
    amount: '1000',
    status: 'COMPLETED',
    date: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    title: 'Cấp vốn khoản vay',
    hash: '0x123...abc',
  },
  {
    id: 'tx2',
    type: 'CREATE_LOAN',
    token: 'ETH',
    amount: '1.2',
    status: 'COMPLETED',
    date: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    title: 'Khóa ETH thế chấp',
    hash: '0x456...def',
  },
  {
    id: 'tx3',
    type: 'REPAY_LOAN',
    token: 'USDT',
    amount: '550',
    status: 'COMPLETED',
    date: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    title: 'Trả nợ khoản vay',
    hash: '0x789...ghi',
  },
  {
    id: 'tx4',
    type: 'RECEIVE_USDT',
    token: 'USDT',
    amount: '2000',
    status: 'COMPLETED',
    date: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
    title: 'Nhận USDT từ ví khác',
    hash: '0xabc...123',
  },
];

const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('ALL'); // ALL, ETH, USDT

  const filteredTransactions = MOCK_TRANSACTIONS.filter(
    tx => filter === 'ALL' || tx.token === filter
  );

  const getIconName = (type: string) => {
    switch (type) {
      case 'FUND_LOAN': return 'arrow-up-circle';
      case 'CREATE_LOAN': return 'lock-closed';
      case 'REPAY_LOAN': return 'arrow-up-circle';
      case 'RECEIVE_USDT': return 'arrow-down-circle';
      default: return 'swap-horizontal';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'FUND_LOAN': return colors.redError;
      case 'CREATE_LOAN': return colors.yellowWarning;
      case 'REPAY_LOAN': return colors.redError;
      case 'RECEIVE_USDT': return colors.greenSuccess;
      default: return colors.textGray;
    }
  };

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'FUND_LOAN': return '-';
      case 'CREATE_LOAN': return '-';
      case 'REPAY_LOAN': return '-';
      case 'RECEIVE_USDT': return '+';
      default: return '';
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isNegative = ['FUND_LOAN', 'CREATE_LOAN', 'REPAY_LOAN'].includes(item.type);
    const amountColor = isNegative ? colors.redError : colors.greenSuccess;

    return (
      <View style={[styles.txCard, { backgroundColor: colors.darkSurface }]}>
        <View style={styles.txLeft}>
          <Ionicons name={getIconName(item.type)} size={36} color={getIconColor(item.type)} />
          <View style={styles.txInfo}>
            <Text style={[styles.txTitle, { color: colors.textWhite }]}>{item.title}</Text>
            <Text style={[styles.txDate, { color: colors.textGray }]}>
              {new Date(item.date).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {getAmountPrefix(item.type)}{Number(item.amount).toLocaleString('en-US')} {item.token}
          </Text>
          <Text style={[styles.txStatus, { color: colors.greenSuccess }]}>
            Thành công
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Lịch sử giao dịch</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {['ALL', 'USDT', 'ETH'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterChip,
              filter === f ? { backgroundColor: colors.accentBlue } : { backgroundColor: colors.darkSurface },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f ? { color: colors.textWhite } : { color: colors.textGray },
              ]}
            >
              {f === 'ALL' ? 'Tất cả' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={colors.textGray} />
            <Text style={[styles.emptyText, { color: colors.textGray }]}>Không có giao dịch nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  txCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txInfo: {
    marginLeft: 12,
  },
  txTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  txDate: {
    fontSize: 12,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  txStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default TransactionHistoryScreen;
