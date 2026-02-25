import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { Card, Button } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';

type LoanDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoanDetail'>;
  route: RouteProp<RootStackParamList, 'LoanDetail'>;
};

const LoanDetailScreen: React.FC<LoanDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { loanId } = route.params;

  // Mock data - in real app, fetch from API using loanId
  const loan = {
    id: loanId,
    title: 'Khoản vay kinh doanh',
    borrowerName: 'Nguyễn Văn A',
    borrowerAvatar: 'N',
    amount: 50000000,
    funded: 32500000,
    interestRate: 12,
    term: 12,
    monthlyPayment: 4440000,
    purpose: 'Kinh doanh',
    description:
      'Mở rộng cửa hàng kinh doanh thiết bị điện tử tại khu vực quận 7. Dự kiến sẽ tăng doanh thu 30% sau 6 tháng.',
    creditScore: 750,
    status: 'funding' as const,
    createdAt: new Date('2024-01-15'),
    investors: [
      { name: 'Trần Văn B', amount: 15000000 },
      { name: 'Lê Thị C', amount: 10000000 },
      { name: 'Phạm Văn D', amount: 7500000 },
    ],
  };

  const fundingPercentage = (loan.funded / loan.amount) * 100;
  const remainingAmount = loan.amount - loan.funded;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funding':
        return colors.yellowWarning;
      case 'active':
        return colors.greenSuccess;
      case 'completed':
        return colors.accentBlue;
      default:
        return colors.textGray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'funding':
        return 'Đang gọi vốn';
      case 'active':
        return 'Đang hoạt động';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Chi tiết khoản vay</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Borrower Info */}
        <Card style={styles.borrowerCard}>
          <View style={styles.borrowerRow}>
            <View style={[styles.avatar, { backgroundColor: colors.accentBlue + '30' }]}>
              <Text style={[styles.avatarText, { color: colors.accentBlue }]}>{loan.borrowerAvatar}</Text>
            </View>
            <View style={styles.borrowerInfo}>
              <Text style={[styles.borrowerName, { color: colors.textWhite }]}>{loan.borrowerName}</Text>
              <View style={styles.creditScoreRow}>
                <Text style={[styles.creditScoreLabel, { color: colors.textGray }]}>Điểm tín dụng:</Text>
                <Text style={[styles.creditScore, { color: colors.greenSuccess }]}>{loan.creditScore}</Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(loan.status) + '20' },
              ]}
            >
              <Text
                style={[styles.statusText, { color: getStatusColor(loan.status) }]}
              >
                {getStatusText(loan.status)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Amount Card */}
        <LinearGradient
          colors={[colors.accentBlue, '#1a73e8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.amountCard}
        >
          <Text style={styles.amountLabel}>Số tiền cần vay</Text>
          <Text style={[styles.amountValue, { color: colors.textWhite }]}>{formatCurrency(loan.amount)}</Text>

          <View style={styles.fundingProgress}>
            <View style={styles.fundingHeader}>
              <Text style={styles.fundingLabel}>
                Đã huy động: {formatCurrency(loan.funded)}
              </Text>
              <Text style={[styles.fundingPercentage, { color: colors.textWhite }]}>
                {fundingPercentage.toFixed(0)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${fundingPercentage}%`, backgroundColor: colors.textWhite }]}
              />
            </View>
            <Text style={styles.remainingText}>
              Còn thiếu: {formatCurrency(remainingAmount)}
            </Text>
          </View>
        </LinearGradient>

        {/* Loan Details */}
        <Card style={styles.detailsCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>Thông tin khoản vay</Text>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Mục đích vay</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>{loan.purpose}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Lãi suất</Text>
            <Text style={[styles.detailValueGreen, { color: colors.greenSuccess }]}>{loan.interestRate}%/năm</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Kỳ hạn</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>{loan.term} tháng</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Trả hàng tháng</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>
              {formatCurrency(loan.monthlyPayment)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />

          <Text style={[styles.descriptionTitle, { color: colors.textWhite }]}>Mô tả chi tiết</Text>
          <Text style={[styles.description, { color: colors.textGray }]}>{loan.description}</Text>
        </Card>

        {/* Investors */}
        <Card style={styles.investorsCard}>
          <Text style={[styles.cardTitle, { color: colors.textWhite }]}>
            Nhà đầu tư ({loan.investors.length})
          </Text>

          {loan.investors.map((investor, index) => (
            <View key={index} style={styles.investorRow}>
              <View style={[styles.investorAvatar, { backgroundColor: colors.darkBackground }]}>
                <Text style={[styles.investorAvatarText, { color: colors.textWhite }]}>
                  {investor.name.charAt(0)}
                </Text>
              </View>
              <Text style={[styles.investorName, { color: colors.textWhite }]}>{investor.name}</Text>
              <Text style={[styles.investorAmount, { color: colors.greenSuccess }]}>
                {formatCurrency(investor.amount)}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
        <Button
          title="Đầu tư ngay"
          onPress={() =>
            navigation.navigate('ConfirmTransaction', {
              loanId: loan.id,
              amount: remainingAmount,
              type: 'invest',
            })
          }
          style={styles.investButton}
        />
      </View>
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
  headerSpacer: {},
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  borrowerCard: {
    marginBottom: 16,
  },
  borrowerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  creditScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditScoreLabel: {
    fontSize: 13,
    marginRight: 4,
  },
  creditScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fundingProgress: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
  },
  fundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fundingLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  fundingPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  detailsCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValueGreen: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  investorsCard: {
    marginBottom: 16,
  },
  investorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  investorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  investorAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  investorName: {
    flex: 1,
    fontSize: 14,
  },
  investorAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  investButton: {},
});

export default LoanDetailScreen;
