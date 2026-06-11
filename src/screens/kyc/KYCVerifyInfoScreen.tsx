import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { RouteProp } from '@react-navigation/native';

type KYCVerifyInfoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCVerifyInfo'>;
  route: RouteProp<RootStackParamList, 'KYCVerifyInfo'>;
};

const KYCVerifyInfoScreen: React.FC<KYCVerifyInfoScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { idInfo, frontImageUri, backImageUri } = route.params;

  // Auto-clean số CCCD từ OCR: bỏ mọi ký tự không phải số
  const cleanId = (raw: string) => raw.replace(/\D/g, '');

  // State trích xuất từ OCR
  const [fullName, setFullName] = useState(idInfo.name || '');
  const [idNumber, setIdNumber] = useState(cleanId(idInfo.id || ''));
  const [idError, setIdError] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(idInfo.dob || '');
  const [gender, setGender] = useState(idInfo.sex || '');
  const [nationality, setNationality] = useState(idInfo.nationality || 'Việt Nam');
  const [placeOfOrigin, setPlaceOfOrigin] = useState(idInfo.home || '');
  const [placeOfResidence, setPlaceOfResidence] = useState(idInfo.address || '');
  const [expiryDate, setExpiryDate] = useState(idInfo.doe || '');
  const [issueDate, setIssueDate] = useState((idInfo as any).issue_date || '');
  const [issueLoc, setIssueLoc] = useState((idInfo as any).issue_loc || '');


  const handleConfirm = () => {
    // Strip non-digits trước khi validate (xử lý OCR có khoảng trắng, dấu gạch, etc.)
    const cleanedId = idNumber.replace(/\D/g, '');
    if (cleanedId !== idNumber) {
      setIdNumber(cleanedId); // Tự động làm sạch nếu chưa sạch
    }
    if (!/^\d{9}$|^\d{12}$/.test(cleanedId)) {
      setIdError('Phải gồm 12 chữ số (CCCD mới) hoặc 9 chữ số (CMND cũ)');
      return;
    }
    setIdError('');
    if (!fullName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên.');
      return;
    }
    navigation.navigate('KYCFaceScan', {
      frontImageUri: frontImageUri
    });
  };

  const renderTextField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    multiline: boolean = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={[styles.fieldLabel, { color: colors.textGray }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder, color: colors.textWhite }, multiline && styles.fieldInputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textGray}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.darkSurface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Kiểm tra thông tin</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Success Message */}
        <View style={[styles.successCard, { backgroundColor: colors.greenSuccess + '15' }]}>
          <Ionicons name="checkmark-circle" size={28} color={colors.greenSuccess} style={{ marginRight: 12 }} />
          <View style={styles.successContent}>
            <Text style={[styles.successTitle, { color: colors.greenSuccess }]}>Trích xuất thông tin thành công</Text>
            <Text style={[styles.successSubtitle, { color: colors.textGray }]}>
              Vui lòng kiểm tra và chỉnh sửa nếu cần
            </Text>
          </View>
        </View>

        {/* Form Section */}
        <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Thông tin cá nhân</Text>

        {renderTextField('Họ và tên', fullName, setFullName)}

        {/* CCCD field: chỉ nhận chữ số, hiện lỗi inline */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.fieldLabel, { color: colors.textGray }]}>Số CMND/CCCD</Text>
          <TextInput
            style={[
              styles.fieldInput,
              {
                backgroundColor: colors.darkSurface,
                borderColor: idError ? '#ef4444' : colors.darkBorder,
                color: colors.textWhite,
              },
            ]}
            value={idNumber}
            onChangeText={(text) => {
              // Auto-strip non-digits ngay khi gõ
              const digits = text.replace(/\D/g, '');
              setIdNumber(digits);
              if (idError && /^\d{9}$|^\d{12}$/.test(digits)) {
                setIdError('');
              }
            }}
            keyboardType="numeric"
            maxLength={12}
            placeholderTextColor={colors.textGray}
            placeholder="9 hoặc 12 chữ số"
          />
          {idError ? (
            <Text style={styles.fieldError}>{idError}</Text>
          ) : (
            <Text style={[styles.fieldHint, { color: colors.textGray }]}>
              {idNumber.length}/12 chữ số
            </Text>
          )}
        </View>

        <View style={styles.rowFields}>
          <View style={styles.halfField}>
            {renderTextField('Ngày sinh', dateOfBirth, setDateOfBirth)}
          </View>
          <View style={styles.halfField}>
            {renderTextField('Giới tính', gender, setGender)}
          </View>
        </View>

        {renderTextField('Quốc tịch', nationality, setNationality)}
        {renderTextField('Quê quán', placeOfOrigin, setPlaceOfOrigin)}
        {renderTextField('Nơi thường trú', placeOfResidence, setPlaceOfResidence, true)}

        <View style={styles.rowFields}>
          <View style={styles.halfField}>
            {renderTextField('Ngày hết hạn', expiryDate, setExpiryDate)}
          </View>
          <View style={styles.halfField}>
            {renderTextField('Ngày cấp', issueDate, setIssueDate)}
          </View>
        </View>

        {renderTextField('Nơi cấp', issueLoc, setIssueLoc)}

        {/* ID Images Preview */}
        <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Ảnh giấy tờ</Text>
        <View style={styles.imagesContainer}>
          <View style={[styles.imagePreview, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
            {frontImageUri ? (
              <Image source={{ uri: frontImageUri }} style={styles.previewImage} />
            ) : (
              <Ionicons name="id-card-outline" size={32} color={colors.textGray} />
            )}
            <Text style={[styles.imagePreviewLabel, { color: colors.textGray }]}>Mặt trước</Text>
          </View>
          <View style={[styles.imagePreview, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
            {backImageUri ? (
              <Image source={{ uri: backImageUri }} style={styles.previewImage} />
            ) : (
              <Ionicons name="phone-portrait-outline" size={32} color={colors.textGray} />
            )}
            <Text style={[styles.imagePreviewLabel, { color: colors.textGray }]}>Mặt sau</Text>
          </View>
        </View>

        {/* Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.accentBlue + '15' }]}>
          <Ionicons name="bulb-outline" size={18} color={colors.accentBlue} style={{ marginRight: 10 }} />
          <Text style={[styles.noteText, { color: colors.textGray }]}>
            Nếu thông tin không chính xác, vui lòng chỉnh sửa trước khi tiếp tục.
            Bạn có thể chụp lại ảnh nếu cần.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.darkBackground }]}>
        <Button
          title="Xác nhận & Tiếp tục"
          onPress={handleConfirm}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  successCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  successIcon: {
    marginRight: 12,
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  successSubtitle: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  fieldInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: '#ef4444',
  },
  fieldHint: {
    marginTop: 4,
    fontSize: 11,
  },
  rowFields: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  halfField: {
    flex: 1,
    paddingHorizontal: 6,
  },
  imagesContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  imagePreview: {
    flex: 1,
    borderRadius: 12,
    padding: 24,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 60,
    borderRadius: 4,
    marginBottom: 8,
  },
  imagePreviewIcon: {
    marginBottom: 8,
  },
  imagePreviewLabel: {
    fontSize: 12,
  },
  noteCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  noteIcon: {
    marginRight: 10,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: 24,
  },
});

export default KYCVerifyInfoScreen;
