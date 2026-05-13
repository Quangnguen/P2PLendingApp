import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers';
import Ionicons from 'react-native-vector-icons/Ionicons';
import authApi from '@/api/auth.api';

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    let valid = true;
    let newErrors: { [key: string]: string } = {};

    if (!oldPassword) {
      newErrors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại';
      valid = false;
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
      valid = false;
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
      valid = false;
    } else if (newPassword === oldPassword) {
      newErrors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
      valid = false;
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      setShowSuccessModal(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
      Alert.alert('Thất bại', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={isLoading}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Đổi mật khẩu</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        <View style={styles.infoContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentBlue + '20' }]}>
            <Ionicons name="lock-closed-outline" size={32} color={colors.accentBlue} />
          </View>
          <Text style={[styles.infoTitle, { color: colors.textWhite }]}>
            Tạo mật khẩu mới
          </Text>
          <Text style={[styles.infoSubtitle, { color: colors.textGray }]}>
            Mật khẩu mới của bạn phải khác với mật khẩu cũ và có độ dài tối thiểu 8 ký tự.
          </Text>
        </View>

        <View style={[styles.formContainer, { backgroundColor: colors.darkSurface }]}>
          {/* Old Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Mật khẩu hiện tại</Text>
            <View style={[styles.inputWrapper, { borderColor: errors.oldPassword ? colors.redError : colors.darkBorder }]}>
              <Ionicons name="key-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textWhite }]}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor={colors.textGray}
                secureTextEntry={!showOldPassword}
                value={oldPassword}
                onChangeText={(text) => {
                  setOldPassword(text);
                  if (errors.oldPassword) setErrors(prev => ({ ...prev, oldPassword: '' }));
                }}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)} style={styles.eyeIcon}>
                <Ionicons name={showOldPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            {errors.oldPassword && <Text style={[styles.errorText, { color: colors.redError }]}>{errors.oldPassword}</Text>}
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Mật khẩu mới</Text>
            <View style={[styles.inputWrapper, { borderColor: errors.newPassword ? colors.redError : colors.darkBorder }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textWhite }]}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor={colors.textGray}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
                }}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeIcon}>
                <Ionicons name={showNewPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            {errors.newPassword && <Text style={[styles.errorText, { color: colors.redError }]}>{errors.newPassword}</Text>}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textWhite }]}>Xác nhận mật khẩu mới</Text>
            <View style={[styles.inputWrapper, { borderColor: errors.confirmPassword ? colors.redError : colors.darkBorder }]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.textGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textWhite }]}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor={colors.textGray}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textGray} />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={[styles.errorText, { color: colors.redError }]}>{errors.confirmPassword}</Text>}
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { backgroundColor: colors.accentBlue },
            isLoading && { opacity: 0.7 }
          ]} 
          onPress={handleChangePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.textWhite} size="small" />
          ) : (
            <Text style={[styles.submitButtonText, { color: colors.textWhite }]}>Lưu mật khẩu mới</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.darkSurface }]}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color={colors.greenSuccess} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textWhite }]}>Thành công!</Text>
            <Text style={[styles.modalMessage, { color: colors.textGray }]}>
              Mật khẩu của bạn đã được thay đổi an toàn. Lần đăng nhập tiếp theo vui lòng sử dụng mật khẩu mới này.
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.accentBlue }]} 
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
            >
              <Text style={[styles.modalButtonText, { color: colors.textWhite }]}>Hoàn tất</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
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
    paddingBottom: 40,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  formContainer: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  modalButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;
