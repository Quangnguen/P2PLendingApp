import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Input } from '../../components/common';
import { useAppDispatch, useAuth, login, register, clearAuthError, useToast } from '../../store';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import { isValidEmail, isValidPhoneNumber } from '../../utils/formatters';

type AuthScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { isLoading, error } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Register state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerErrors, setRegisterErrors] = useState<{
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({}); const clearError = () => dispatch(clearAuthError());

  const validateLogin = (): boolean => {
    const errors: typeof loginErrors = {};

    if (!loginEmail) {
      errors.email = 'Email không được để trống';
    } else if (!isValidEmail(loginEmail)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!loginPassword) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (loginPassword.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = (): boolean => {
    const errors: typeof registerErrors = {};

    if (!fullName) {
      errors.fullName = 'Họ tên không được để trống';
    } else if (fullName.length > 50) {
      errors.fullName = 'Họ tên không được quá 50 ký tự';
    }

    if (!phoneNumber) {
      errors.phoneNumber = 'Số điện thoại không được để trống';
    } else if (!isValidPhoneNumber(phoneNumber)) {
      errors.phoneNumber = 'Số điện thoại không hợp lệ';
    }

    if (!registerEmail) {
      errors.email = 'Email không được để trống';
    } else if (!isValidEmail(registerEmail)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!registerPassword) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (registerPassword.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (confirmPassword !== registerPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    clearError();
    try {
      const resultAction = await dispatch(login({
        email: loginEmail,
        password: loginPassword,
        deviceId: 'device-id-placeholder', // TODO: Get real device ID
        deviceName: 'React Native App',
        deviceType: Platform.OS,
      }));

      if (login.fulfilled.match(resultAction)) {
        const payload = resultAction.payload;
        if (payload.requireOtp) {
          toast.info('Vui lòng xác thực OTP', 'Xác thực 2 bước');
          navigation.navigate('LoginOtpVerification', { email: loginEmail });
        } else {
          toast.success('Đăng nhập thành công!', 'Chào mừng bạn');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      } else {
        toast.error(resultAction.payload as string || 'Đăng nhập thất bại', 'Lỗi');
      }
    } catch (err) {
      toast.error('Đã có lỗi xảy ra', 'Lỗi');
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;

    clearError();
    try {
      const resultAction = await dispatch(register({
        fullname: fullName, // Backend dùng fullname (lowercase n)
        email: registerEmail,
        phoneNumber,
        password: registerPassword,
      }));

      if (register.fulfilled.match(resultAction)) {
        toast.success('Đăng ký thành công! Vui lòng xác thực email.', 'Thành công');
        navigation.navigate('OtpVerification', {
          email: registerEmail,
          phoneNumber,
        });
      } else {
        toast.error(resultAction.payload as string || 'Đăng ký thất bại', 'Lỗi');
      }
    } catch (err) {
      toast.error('Đã có lỗi xảy ra', 'Lỗi');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accentBlue + '33' }]}>
              <Text style={styles.icon}>🔐</Text>
            </View>
            <Text style={[styles.welcomeText, { color: colors.textWhite }]}>
              {activeTab === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </Text>
            <Text style={[styles.subtitleText, { color: colors.textGray }]}>
              {activeTab === 'login'
                ? 'Đăng nhập để tiếp tục sử dụng'
                : 'Tạo tài khoản mới'}
            </Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: colors.darkSurface }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'login' && [styles.tabActive, { backgroundColor: colors.accentBlue }]]}
              onPress={() => setActiveTab('login')}
            >
              <Text style={[styles.tabText, { color: colors.textGray }, activeTab === 'login' && { color: colors.textWhite }]}>
                Đăng nhập
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'register' && [styles.tabActive, { backgroundColor: colors.accentBlue }]]}
              onPress={() => setActiveTab('register')}
            >
              <Text style={[styles.tabText, { color: colors.textGray }, activeTab === 'register' && { color: colors.textWhite }]}>
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.redError + '20' }]}>
              <Text style={[styles.errorText, { color: colors.redError }]}>{error}</Text>
            </View>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <View style={styles.form}>
              <Input
                label="Email"
                placeholder="Nhập email của bạn"
                value={loginEmail}
                onChangeText={setLoginEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={loginErrors.email}
                leftIcon={<Text>📧</Text>}
              />

              <Input
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={loginPassword}
                onChangeText={setLoginPassword}
                secureTextEntry
                error={loginErrors.password}
                leftIcon={<Text>🔒</Text>}
              />

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: colors.accentBlue }]}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <Button
                title="Đăng nhập"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <View style={styles.form}>
              <Input
                label="Họ và tên"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChangeText={setFullName}
                error={registerErrors.fullName}
                leftIcon={<Text>👤</Text>}
              />

              <Input
                label="Số điện thoại"
                placeholder="Nhập số điện thoại"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                error={registerErrors.phoneNumber}
                leftIcon={<Text>📱</Text>}
              />

              <Input
                label="Email"
                placeholder="Nhập email của bạn"
                value={registerEmail}
                onChangeText={setRegisterEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={registerErrors.email}
                leftIcon={<Text>📧</Text>}
              />

              <Input
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                value={registerPassword}
                onChangeText={setRegisterPassword}
                secureTextEntry
                error={registerErrors.password}
                leftIcon={<Text>🔒</Text>}
              />

              <Input
                label="Xác nhận mật khẩu"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={registerErrors.confirmPassword}
                leftIcon={<Text>🔒</Text>}
              />

              <Button
                title="Đăng ký"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.submitButton}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {},

  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginTop: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AuthScreen;
