/**
 * =================================================================
 * EDIT LOAN SCREEN - Màn hình sửa yêu cầu vay
 * =================================================================
 * 
 * Cho phép Borrower sửa yêu cầu vay đang ở trạng thái pending.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { LOAN_CONFIG } from '@/utils/constants';
import Ionicons from 'react-native-vector-icons/Ionicons';

type EditLoanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditLoan'>;
  route: RouteProp<RootStackParamList, 'EditLoan'>;
};

const EditLoanScreen: React.FC<EditLoanScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { requestId, currentData } = route.params;

  const [amount, setAmount] = useState(currentData.amount.toString());
  const [interestRate, setInterestRate] = useState(currentData.interestRate.toString());
  const [duration, setDuration] = useState(currentData.durationDays);
  const [purpose, setPurpose] = useState(currentData.purpose);
  const [description, setDescription] = useState(currentData.description);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ';
    }
    const rateNum = parseFloat(interestRate);
    if (!interestRate || isNaN(rateNum) || rateNum <= 0 || rateNum > 100) {
      newErrors.interestRate = 'Lãi suất phải từ 0 đến 100%';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    Alert.alert(
      'Xác nhận cập nhật',
      'Bạn có chắc muốn cập nhật yêu cầu vay này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Cập nhật',
          onPress: async () => {
            setIsLoading(true);
            try {
              const { loanApi } = await import('@/api/loan.api');
              await loanApi.updateRequest(requestId, {
                loanAmount: parseFloat(amount),
                interestRate: parseFloat(interestRate),
                durationDays: duration,
                purpose,
                purposeDescription: description,
              });
              Alert.alert('Thành công', 'Đã cập nhật yêu cầu vay.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              const msg = error?.response?.data?.message || 'Không thể cập nhật yêu cầu vay';
              Alert.alert('Lỗi', msg);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderDurationChip = (days: number, label: string) => {
    const isSelected = duration === days;
    return (
      <TouchableOpacity
        key={days}
        style={[
          styles.durationChip,
          { backgroundColor: isSelected ? colors.accentBlue : colors.darkSurface },
        ]}
        onPress={() => setDuration(days)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.durationChipText,
          { color: isSelected ? colors.textWhite : colors.textGray },
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const durationOptions = [
    { value: 7, label: '7 ngày' },
    { value: 14, label: '14 ngày' },
    { value: 30, label: '30 ngày' },
    { value: 60, label: '60 ngày' },
    { value: 90, label: '90 ngày' },
    { value: 180, label: '180 ngày' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Sửa yêu cầu vay</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Amount */}
          <View style={[styles.inputCard, { backgroundColor: colors.darkSurface }]}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="cash-outline" size={16} color={colors.accentBlue} />
              <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Số tiền vay (USDT)</Text>
            </View>
            <View style={[styles.inputWrapper, { borderColor: errors.amount ? colors.redError : colors.darkBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.textWhite }]}
                placeholder="Nhập số tiền"
                placeholderTextColor={colors.textGray}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={(text) => {
                  setAmount(text.replace(/[^0-9.]/g, ''));
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                }}
              />
              <Text style={[styles.inputSuffix, { color: colors.textGray }]}>USDT</Text>
            </View>
            {errors.amount ? <Text style={[styles.errorText, { color: colors.redError }]}>{errors.amount}</Text> : null}
          </View>

          {/* Interest Rate */}
          <View style={[styles.inputCard, { backgroundColor: colors.darkSurface }]}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="trending-up-outline" size={16} color={colors.accentBlue} />
              <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Lãi suất (%/năm)</Text>
            </View>
            <View style={[styles.inputWrapper, { borderColor: errors.interestRate ? colors.redError : colors.darkBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.textWhite }]}
                placeholder="Nhập lãi suất"
                placeholderTextColor={colors.textGray}
                keyboardType="decimal-pad"
                value={interestRate}
                onChangeText={(text) => {
                  setInterestRate(text.replace(/[^0-9.]/g, ''));
                  if (errors.interestRate) setErrors(prev => ({ ...prev, interestRate: '' }));
                }}
              />
              <Text style={[styles.inputSuffix, { color: colors.textGray }]}>%/năm</Text>
            </View>
            {errors.interestRate ? <Text style={[styles.errorText, { color: colors.redError }]}>{errors.interestRate}</Text> : null}
          </View>

          {/* Duration */}
          <View style={[styles.inputCard, { backgroundColor: colors.darkSurface }]}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="time-outline" size={16} color={colors.accentBlue} />
              <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Thời hạn vay</Text>
            </View>
            <View style={styles.durationContainer}>
              {durationOptions.map(opt => renderDurationChip(opt.value, opt.label))}
            </View>
          </View>

          {/* Purpose */}
          <View style={[styles.inputCard, { backgroundColor: colors.darkSurface }]}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="flag-outline" size={16} color={colors.accentBlue} />
              <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Mục đích vay</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.textWhite, borderColor: colors.darkBorder }]}
              placeholder="Nhập mục đích vay"
              placeholderTextColor={colors.textGray}
              value={purpose}
              onChangeText={setPurpose}
            />
          </View>

          {/* Description */}
          <View style={[styles.inputCard, { backgroundColor: colors.darkSurface }]}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="document-text-outline" size={16} color={colors.accentBlue} />
              <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Mô tả chi tiết</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, styles.descriptionInput, { color: colors.textWhite, borderColor: colors.darkBorder }]}
              placeholder="Mô tả chi tiết về yêu cầu vay..."
              placeholderTextColor={colors.textGray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.darkBackground, borderTopColor: colors.darkBorder }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accentBlue }]}
          onPress={handleSave}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            </>
          )}
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  inputCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  inputSuffix: {
    paddingRight: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  descriptionInput: {
    minHeight: 100,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  durationChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EditLoanScreen;
