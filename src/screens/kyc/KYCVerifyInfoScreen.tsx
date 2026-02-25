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
import { Button } from '../../components/common';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type KYCVerifyInfoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCVerifyInfo'>;
};

const KYCVerifyInfoScreen: React.FC<KYCVerifyInfoScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  // Sample extracted data - trong thực tế sẽ lấy từ OCR/QR scan
  const [fullName, setFullName] = useState('NGUYỄN VĂN A');
  const [idNumber, setIdNumber] = useState('001234567890');
  const [dateOfBirth, setDateOfBirth] = useState('01/01/1990');
  const [gender, setGender] = useState('Nam');
  const [nationality, setNationality] = useState('Việt Nam');
  const [placeOfOrigin, setPlaceOfOrigin] = useState('Hà Nội');
  const [placeOfResidence, setPlaceOfResidence] = useState('123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh');
  const [expiryDate, setExpiryDate] = useState('01/01/2030');

  const handleConfirm = () => {
    navigation.navigate('KYCFaceScan');
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
          <Text style={styles.successIcon}>✅</Text>
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
        {renderTextField('Số CMND/CCCD', idNumber, setIdNumber)}

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
        {renderTextField('Ngày hết hạn', expiryDate, setExpiryDate)}

        {/* ID Images Preview */}
        <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Ảnh giấy tờ</Text>
        <View style={styles.imagesContainer}>
          <View style={[styles.imagePreview, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
            <Text style={styles.imagePreviewIcon}>🪪</Text>
            <Text style={[styles.imagePreviewLabel, { color: colors.textGray }]}>Mặt trước</Text>
          </View>
          <View style={[styles.imagePreview, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
            <Text style={styles.imagePreviewIcon}>📱</Text>
            <Text style={[styles.imagePreviewLabel, { color: colors.textGray }]}>Mặt sau</Text>
          </View>
        </View>

        {/* Note */}
        <View style={[styles.noteCard, { backgroundColor: colors.accentBlue + '15' }]}>
          <Text style={styles.noteIcon}>💡</Text>
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
    fontSize: 24,
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
  },
  imagePreviewIcon: {
    fontSize: 32,
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
    fontSize: 16,
    marginRight: 12,
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
