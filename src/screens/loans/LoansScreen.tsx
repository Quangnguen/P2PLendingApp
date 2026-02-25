import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';

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

  const borrowingLoans: LoanItem[] = [
    {
      id: '1',
      title: 'Khoản vay tiêu dùng',
      amount: 50000000,
      interestRate: 12,
      status: 'active',
      dueDate: new Date('2024-12-31'),
      lender: 'Nguyễn Văn A',
    },
    {
      id: '2',
      title: 'Khoản vay kinh doanh',
      amount: 100000000,
      interestRate: 10,
      status: 'pending',
      dueDate: new Date('2025-06-30'),
      lender: 'Đang chờ',
    },
  ];

  const lendingLoans: LoanItem[] = [
    {
      id: '3',
      title: 'Cho vay cá nhân',
      amount: 20000000,
      interestRate: 15,
      status: 'active',
      dueDate: new Date('2024-09-15'),
      borrower: 'Trần Văn B',
    },
  ];

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
        return 'Bị từ chối';
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
        <Text style={[styles.loanTitle, { color: colors.textWhite }]}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.loanAmount}>
        <Text style={[styles.amountLabel, { color: colors.textGray }]}>Số tiền</Text>
        <Text style={[styles.amountValue, { color: colors.accentBlue }]}>{formatCurrency(item.amount)}</Text>
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
          onPress={() => navigation.navigate('CreateLoan')}
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
          <Text style={styles.emptyIcon}>📋</Text>
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
