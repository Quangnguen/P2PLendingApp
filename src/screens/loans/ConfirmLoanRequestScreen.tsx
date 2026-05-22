import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Card, Button, Loading } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';

type ConfirmLoanRequestScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ConfirmLoanRequest'>;
  route: RouteProp<RootStackParamList, 'ConfirmLoanRequest'>;
};

const purposeLabels: Record<string, string> = {
  business: 'Kinh doanh',
  education: 'Giáo dục',
  medical: 'Y tế',
  personal: 'Cá nhân',
  home: 'Nhà ở',
  other: 'Khác',
};

const purposeIonicons: Record<string, string> = {
  business: 'briefcase-outline',
  education: 'school-outline',
  medical: 'medkit-outline',
  personal: 'person-outline',
  home: 'home-outline',
  other: 'cube-outline',
};

const ConfirmLoanRequestScreen: React.FC<ConfirmLoanRequestScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { amount, term, interestRate, purpose, description } = route.params;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const calculateMonthlyPayment = () => {
    const rate = interestRate / 100 / 12;
    const months = term;
    if (amount === 0 || rate === 0 || months === 0) return 0;
    const payment = (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    return payment;
  };

  const calculateTotalInterest = () => {
    return calculateMonthlyPayment() * term - amount;
  };

  const calculateTotalPayment = () => {
    return calculateMonthlyPayment() * term;
  };

  const handleSubmit = async () => {
    if (!agreed) {
      Alert.alert('Thông báo', 'Vui lòng đồng ý với điều khoản và điều kiện');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call API to create loan request
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo yêu cầu vay. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <Loading text="Đang xử lý yêu cầu..." />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Xác nhận khoản vay</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Loan Summary Card */}
        <Card style={{ ...styles.summaryCard, backgroundColor: colors.darkSurface }}>
          <View style={styles.amountHeader}>
            <Text style={[styles.amountLabel, { color: colors.textGray }]}>Số tiền vay</Text>
            <Text style={[styles.amountValue, { color: colors.accentBlue }]}>{formatCurrency(amount)}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Kỳ hạn</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>{term} tháng</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Lãi suất</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>{interestRate}%/năm</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Mục đích</Text>
            <View style={styles.purposeContainer}>
              <Ionicons name={(purposeIonicons[purpose] || 'cube-outline') as any} size={16} color={colors.accentBlue} style={styles.purposeIcon} />
              <Text style={[styles.detailValue, { color: colors.textWhite }]}>{purposeLabels[purpose]}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Trả hàng tháng</Text>
            <Text style={[styles.detailValue, { color: colors.textWhite }]}>{formatCurrency(calculateMonthlyPayment())}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textGray }]}>Tổng lãi phải trả</Text>
            <Text style={[styles.detailValue, { color: colors.yellowWarning }]}>{formatCurrency(calculateTotalInterest())}</Text>
          </View>

          <View style={[styles.totalRow, { backgroundColor: colors.accentBlue + '20' }]}>
            <Text style={[styles.totalLabel, { color: colors.textWhite }]}>Tổng phải trả</Text>
            <Text style={[styles.totalValue, { color: colors.accentBlue }]}>{formatCurrency(calculateTotalPayment())}</Text>
          </View>
        </Card>

        {/* Description Card */}
        <Card style={{ ...styles.descriptionCard, backgroundColor: colors.darkSurface }}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Mô tả mục đích vay</Text>
          <Text style={[styles.descriptionText, { color: colors.textGray }]}>{description}</Text>
        </Card>

        {/* Terms and Conditions */}
        <TouchableOpacity style={styles.termsContainer} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
          <View style={[styles.checkbox, { borderColor: colors.darkBorder }, agreed && { backgroundColor: colors.accentBlue, borderColor: colors.accentBlue }]}>
            {agreed && <Ionicons name="checkmark" size={16} color={colors.textWhite} />}
          </View>
          <Text style={[styles.termsText, { color: colors.textGray }]}>
            Tôi đã đọc và đồng ý với <Text style={{ color: colors.accentBlue }}>Điều khoản và Điều kiện</Text> của dịch vụ vay P2P
          </Text>
        </TouchableOpacity>

        {/* Warning Notice */}
        <View style={[styles.warningContainer, { backgroundColor: colors.yellowWarning + '15' }]}>
          <Ionicons name="warning-outline" size={24} color={colors.yellowWarning} />
          <Text style={[styles.warningText, { color: colors.yellowWarning }]}>
            Lưu ý: Yêu cầu vay sẽ được đăng công khai để các nhà đầu tư xem xét. Lãi suất cuối cùng có thể thay đổi dựa trên đánh giá tín dụng.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
        <Button 
          title="Xác nhận yêu cầu" 
          onPress={handleSubmit} 
          disabled={!agreed} 
          style={!agreed ? styles.submitButtonDisabled : undefined} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 24 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  summaryCard: { marginBottom: 16 },
  amountHeader: { alignItems: 'center', marginBottom: 16 },
  amountLabel: { fontSize: 14, marginBottom: 8 },
  amountValue: { fontSize: 32, fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  purposeContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  purposeIcon: { marginRight: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  descriptionCard: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  descriptionText: { fontSize: 14, lineHeight: 22 },
  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 },
  termsText: { flex: 1, fontSize: 14, lineHeight: 22 },
  warningContainer: { flexDirection: 'row', padding: 16, borderRadius: 12, marginBottom: 16, gap: 12 },
  warningText: { flex: 1, fontSize: 13, lineHeight: 20 },
  footer: { padding: 20, borderTopWidth: 1 },
  submitButton: {},
  submitButtonDisabled: { opacity: 0.5 },
});

export default ConfirmLoanRequestScreen;