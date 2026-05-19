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

const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [filter, setFilter] = useState('ALL'); // ALL, ETH, USDT
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to safely parse MongoDB Decimal128 values
  const toNum = (val: any): number => {
    if (val == null) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (val.$numberDecimal) return parseFloat(val.$numberDecimal) || 0;
    return parseFloat(String(val)) || 0;
  };

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { loanApi } = await import('@/api/loan.api');
        const res = await loanApi.getMyTransactions();
        const txData = res?.data || res || [];
        if (Array.isArray(txData)) {
          // Map backend transaction format to screen format
          const mappedTxs = txData.map(tx => {
            const isPayment = tx.type === 'PAYMENT';
            // Simple heuristic to detect if it's funding (USDT) or repayment (USDT/ETH depending on logic)
            // Currently all amounts are USDT since it's principal/repayment
            return {
              id: tx._id,
              type: isPayment ? 'PAYMENT' : 'RECEIPT',
              token: 'USDT', // Assuming USDT for funding and repayment
              amount: toNum(tx.amount).toString(),
              status: tx.status,
              date: new Date(tx.date).getTime(),
              title: isPayment ? 'Thanh toán khoản vay' : 'Nhận tiền giải ngân/trả nợ',
              hash: tx.txHash || '',
              loanId: tx.loanInfo?._id,
            };
          });
          setTransactions(mappedTxs);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(
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
      case 'PAYMENT': return '-';
      case 'RECEIPT': return '+';
      default: return '';
    }
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isNegative = item.type === 'PAYMENT';
    const amountColor = isNegative ? colors.redError : colors.greenSuccess;

    return (
      <TouchableOpacity 
        style={[styles.txCard, { backgroundColor: colors.darkSurface }]}
        onPress={() => item.loanId && navigation.navigate('LoanDetail', { loanId: item.loanId })}
      >
        <View style={styles.txLeft}>
          <Ionicons name={isNegative ? 'arrow-up-circle' : 'arrow-down-circle'} size={36} color={amountColor} />
          <View style={styles.txInfo}>
            <Text style={[styles.txTitle, { color: colors.textWhite }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.txDate, { color: colors.textGray }]} numberOfLines={1}>
              {new Date(item.date).toLocaleString('vi-VN')}
            </Text>
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {getAmountPrefix(item.type)}{Number(item.amount).toLocaleString('en-US')} {item.token}
          </Text>
          <Text style={[styles.txStatus, { color: item.status === 'COMPLETED' ? colors.greenSuccess : colors.yellowWarning }]}>
            {item.status === 'COMPLETED' ? 'Thành công' : 'Đang xử lý'}
          </Text>
        </View>
      </TouchableOpacity>
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
    flex: 1,
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
    marginLeft: 12,
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
