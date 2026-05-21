import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Input } from '../../components/common';
import { useAppDispatch, useAuth, login, register, clearAuthError, useToast } from '../../store';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import { isValidEmail, isValidPhoneNumber } from '../../utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AuthScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { isLoading, error } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const tabAnim = useRef(new Animated.Value(0)).current;

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
  }>({});

  const clearError = () => dispatch(clearAuthError());

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    Animated.spring(tabAnim, {
      toValue: tab === 'login' ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  };

  const validateLogin = (): boolean => {
    const errors: typeof loginErrors = {};
    if (!loginEmail) errors.email = 'Email không được để trống';
    else if (!isValidEmail(loginEmail)) errors.email = 'Email không hợp lệ';
    if (!loginPassword) errors.password = 'Mật khẩu không được để trống';
    else if (loginPassword.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = (): boolean => {
    const errors: typeof registerErrors = {};
    if (!fullName) errors.fullName = 'Họ tên không được để trống';
    else if (fullName.length > 50) errors.fullName = 'Họ tên không được quá 50 ký tự';
    if (!phoneNumber) errors.phoneNumber = 'Số điện thoại không được để trống';
    else if (!isValidPhoneNumber(phoneNumber)) errors.phoneNumber = 'Số điện thoại không hợp lệ';
    if (!registerEmail) errors.email = 'Email không được để trống';
    else if (!isValidEmail(registerEmail)) errors.email = 'Email không hợp lệ';
    if (!registerPassword) errors.password = 'Mật khẩu không được để trống';
    else if (registerPassword.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    if (!confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    else if (confirmPassword !== registerPassword) errors.confirmPassword = 'Mật khẩu không khớp';
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
        deviceId: 'device-id-placeholder',
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
          navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
        }
      } else {
        toast.error(resultAction.payload as string || 'Đăng nhập thất bại', 'Lỗi');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra', 'Lỗi');
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    clearError();
    try {
      const resultAction = await dispatch(register({
        fullname: fullName,
        email: registerEmail,
        phoneNumber,
        password: registerPassword,
      }));
      if (register.fulfilled.match(resultAction)) {
        toast.success('Đăng ký thành công! Vui lòng xác thực email.', 'Thành công');
        navigation.navigate('OtpVerification', { email: registerEmail, phoneNumber });
      } else {
        toast.error(resultAction.payload as string || 'Đăng ký thất bại', 'Lỗi');
      }
    } catch {
      toast.error('Đã có lỗi xảy ra', 'Lỗi');
    }
  };

  // Animated indicator width
  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '50%'],
  });

  return (
    <LinearGradient
      colors={isDark ? ['#0f172a', '#1e293b', '#0f172a'] : ['#eff6ff', '#dbeafe', '#eff6ff']}
      style={styles.container}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ─── Header ─── */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#1d4ed8', '#3b82f6']}
                style={styles.logoRing}
              >
                <Ionicons name="swap-horizontal-outline" size={36} color="#fff" />
              </LinearGradient>
              <Text style={[styles.appName, { color: colors.textWhite }]}>P2P Lending</Text>
              <Text style={[styles.tagline, { color: colors.textGray }]}>Vay & đầu tư trên Blockchain</Text>
            </View>

            {/* ─── Card ─── */}
            <View style={[styles.card, {
              backgroundColor: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.95)',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
            }]}>

              {/* Tab bar */}
              <View style={[styles.tabBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
                <TouchableOpacity
                  style={styles.tabBtn}
                  onPress={() => switchTab('login')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={activeTab === 'login' ? 'log-in' : 'log-in-outline'}
                    size={16}
                    color={activeTab === 'login' ? '#fff' : colors.textGray}
                  />
                  <Text style={[styles.tabText, { color: activeTab === 'login' ? '#fff' : colors.textGray }, activeTab === 'login' && styles.tabTextActive]}>
                    Đăng nhập
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.tabBtn}
                  onPress={() => switchTab('register')}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={activeTab === 'register' ? 'person-add' : 'person-add-outline'}
                    size={16}
                    color={activeTab === 'register' ? '#fff' : colors.textGray}
                  />
                  <Text style={[styles.tabText, { color: activeTab === 'register' ? '#fff' : colors.textGray }, activeTab === 'register' && styles.tabTextActive]}>
                    Đăng ký
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Error banner */}
              {error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}

              {/* ─── LOGIN FORM ─── */}
              {activeTab === 'login' && (
                <View style={styles.form}>
                  <Text style={[styles.formTitle, { color: colors.textWhite }]}>Chào mừng trở lại</Text>
                  <Text style={[styles.formSubtitle, { color: colors.textGray }]}>Đăng nhập để tiếp tục</Text>

                  <View style={styles.fieldGroup}>
                    <Input
                      label="Email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={loginErrors.email}
                      leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textGray} />}
                    />
                    <Input
                      label="Mật khẩu"
                      placeholder="Nhập mật khẩu"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secureTextEntry
                      error={loginErrors.password}
                      leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textGray} />}
                    />
                  </View>

                  <TouchableOpacity style={styles.forgotBtn}>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#1d4ed8', '#3b82f6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitBtnGradient}
                    >
                      {isLoading ? (
                        <Text style={styles.submitBtnText}>Đang xử lý...</Text>
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>Đăng nhập</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: colors.textGray }]}>Chưa có tài khoản? </Text>
                    <TouchableOpacity onPress={() => switchTab('register')}>
                      <Text style={styles.switchLink}>Đăng ký ngay</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ─── REGISTER FORM ─── */}
              {activeTab === 'register' && (
                <View style={styles.form}>
                  <Text style={[styles.formTitle, { color: colors.textWhite }]}>Tạo tài khoản</Text>
                  <Text style={[styles.formSubtitle, { color: colors.textGray }]}>Bắt đầu hành trình đầu tư</Text>

                  <View style={styles.fieldGroup}>
                    <Input
                      label="Họ và tên"
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChangeText={setFullName}
                      error={registerErrors.fullName}
                      leftIcon={<Ionicons name="person-outline" size={18} color={colors.textGray} />}
                    />
                    <Input
                      label="Số điện thoại"
                      placeholder="0901 234 567"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      keyboardType="phone-pad"
                      error={registerErrors.phoneNumber}
                      leftIcon={<Ionicons name="call-outline" size={18} color={colors.textGray} />}
                    />
                    <Input
                      label="Email"
                      placeholder="you@example.com"
                      value={registerEmail}
                      onChangeText={setRegisterEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={registerErrors.email}
                      leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textGray} />}
                    />
                    <Input
                      label="Mật khẩu"
                      placeholder="Tối thiểu 6 ký tự"
                      value={registerPassword}
                      onChangeText={setRegisterPassword}
                      secureTextEntry
                      error={registerErrors.password}
                      leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textGray} />}
                    />
                    <Input
                      label="Xác nhận mật khẩu"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      error={registerErrors.confirmPassword}
                      leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.textGray} />}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
                    onPress={handleRegister}
                    activeOpacity={0.85}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['#059669', '#10b981']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitBtnGradient}
                    >
                      {isLoading ? (
                        <Text style={styles.submitBtnText}>Đang xử lý...</Text>
                      ) : (
                        <>
                          <Text style={styles.submitBtnText}>Tạo tài khoản</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: colors.textGray }]}>Đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => switchTab('login')}>
                      <Text style={styles.switchLink}>Đăng nhập</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Terms */}
              <Text style={styles.terms}>
                Bằng cách tiếp tục, bạn đồng ý với{' '}
                <Text style={styles.termsLink}>Điều khoản dịch vụ</Text>
                {' '}và{' '}
                <Text style={styles.termsLink}>Chính sách bảo mật</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // ─── Header ───
  header: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 8,
  },
  logoRing: {
    width: 72,
    height: 72,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // ─── Card ───
  card: {
    borderRadius: 24,
    borderWidth: 1,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },

  // ─── Tab bar ───
  tabBar: {
    flexDirection: 'row',
    margin: 12,
    borderRadius: 14,
    position: 'relative',
    height: 48,
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },

  // ─── Error banner ───
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorBannerText: {
    color: '#f87171',
    fontSize: 13,
    flex: 1,
  },

  // ─── Form ───
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    marginBottom: 24,
  },
  fieldGroup: {
    gap: 4,
  },

  // ─── Forgot ───
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    marginBottom: 8,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: '#60a5fa',
    fontWeight: '500',
  },

  // ─── Submit ───
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // ─── Switch ───
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchLabel: {
    fontSize: 14,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── Terms ───
  terms: {
    textAlign: 'center',
    color: 'rgba(99,102,241,0.5)',
    fontSize: 11,
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 16,
  },
  termsLink: {
    color: 'rgba(99,102,241,0.8)',
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;
