import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';

type BrowseLoansScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BrowseLoans'>;
};

interface LoanRequest {
  id: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  term: number;
  purpose: string;
  creditScore: number;
  funded: number;
}

const BrowseLoansScreen: React.FC<BrowseLoansScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'low_risk' | 'high_return'>('all');
  const { colors } = useTheme();

  const loanRequests: LoanRequest[] = [
    {
      id: '1',
      borrowerName: 'Nguyễn Văn A',
      amount: 50000000,
      interestRate: 12,
      term: 12,
      purpose: 'Kinh doanh',
      creditScore: 750,
      funded: 65,
    },
    {
      id: '2',
      borrowerName: 'Trần Thị B',
      amount: 20000000,
      interestRate: 15,
      term: 6,
      purpose: 'Tiêu dùng',
      creditScore: 680,
      funded: 30,
    },
    {
      id: '3',
      borrowerName: 'Lê Văn C',
      amount: 100000000,
      interestRate: 10,
      term: 24,
      purpose: 'Đầu tư',
      creditScore: 800,
      funded: 80,
    },
    {
      id: '4',
      borrowerName: 'Phạm Thị D',
      amount: 30000000,
      interestRate: 14,
      term: 9,
      purpose: 'Giáo dục',
      creditScore: 720,
      funded: 45,
    },
  ];

  const filters = [
    { key: 'all', label: 'Tất cả' },
    { key: 'low_risk', label: 'Rủi ro thấp' },
    { key: 'high_return', label: 'Lợi nhuận cao' },
  ];

  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return colors.greenSuccess;
    if (score >= 650) return colors.yellowWarning;
    return colors.redError;
  };

  const getCreditScoreLabel = (score: number) => {
    if (score >= 750) return 'Xuất sắc';
    if (score >= 700) return 'Tốt';
    if (score >= 650) return 'Khá';
    return 'Trung bình';
  };

  const filteredLoans = loanRequests.filter((loan) => {
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Duyệt khoản vay</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.darkSurface }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.textWhite }]}
            placeholder="Tìm kiếm..."
            placeholderTextColor={colors.textGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              { backgroundColor: selectedFilter === filter.key ? colors.accentBlue : colors.darkSurface },
            ]}
            onPress={() => setSelectedFilter(filter.key as typeof selectedFilter)}
          >
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

      {/* Results count */}
      <Text style={[styles.resultsCount, { color: colors.textGray }]}>
        Tìm thấy {filteredLoans.length} khoản vay
      </Text>

      {/* Loan List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredLoans.map((loan) => (
          <Card
            key={loan.id}
            style={styles.loanCard}
            onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
          >
            {/* Borrower Info */}
            <View style={styles.borrowerRow}>
              <View style={[styles.avatar, { backgroundColor: colors.accentBlue + '30' }]}>
                <Text style={[styles.avatarText, { color: colors.accentBlue }]}>
                  {loan.borrowerName.charAt(0)}
                </Text>
              </View>
              <View style={styles.borrowerInfo}>
                <Text style={[styles.borrowerName, { color: colors.textWhite }]}>{loan.borrowerName}</Text>
                <Text style={[styles.purpose, { color: colors.textGray }]}>{loan.purpose}</Text>
              </View>
              <View style={styles.creditScoreContainer}>
                <Text
                  style={[
                    styles.creditScore,
                    { color: getCreditScoreColor(loan.creditScore) },
                  ]}
                >
                  {loan.creditScore}
                </Text>
                <Text
                  style={[
                    styles.creditLabel,
                    { color: getCreditScoreColor(loan.creditScore) },
                  ]}
                >
                  {getCreditScoreLabel(loan.creditScore)}
                </Text>
              </View>
            </View>

            {/* Loan Details */}
            <View style={[styles.detailsGrid, { backgroundColor: colors.darkBackground }]}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textGray }]}>Số tiền cần vay</Text>
                <Text style={[styles.detailValue, { color: colors.textWhite }]}>
                  {formatCurrency(loan.amount)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textGray }]}>Lãi suất</Text>
                <Text style={[styles.detailValueGreen, { color: colors.greenSuccess }]}>{loan.interestRate}%/năm</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.textGray }]}>Kỳ hạn</Text>
                <Text style={[styles.detailValue, { color: colors.textWhite }]}>{loan.term} tháng</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textGray }]}>Đã được tài trợ</Text>
                <Text style={[styles.progressValue, { color: colors.accentBlue }]}>{loan.funded}%</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.darkBackground }]}>
                <View style={[styles.progressFill, { width: `${loan.funded}%`, backgroundColor: colors.accentBlue }]} />
              </View>
            </View>

            {/* Invest Button */}
            <Button
              title="Đầu tư ngay"
              onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
              variant="primary"
              style={styles.investButton}
            />
          </Card>
        ))}
      </ScrollView>
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
  backButton: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsCount: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loanCard: {
    marginBottom: 16,
  },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  purpose: {
    fontSize: 13,
  },
  creditScoreContainer: {
    alignItems: 'center',
  },
  creditScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  creditLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValueGreen: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  investButton: {
    marginTop: 4,
  },
  headerSpacer: {
    width: 80,
  },
});

export default BrowseLoansScreen;
