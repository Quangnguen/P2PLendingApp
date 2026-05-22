import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '../../components/common';
import { useAppDispatch, useAuth, verifyLoginOtp, clearAuthError, useToast } from '../../store';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type LoginOtpVerificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LoginOtpVerification'>;
  route: RouteProp<RootStackParamList, 'LoginOtpVerification'>;
};

const LoginOtpVerificationScreen: React.FC<LoginOtpVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [trustDevice, setTrustDevice] = useState(true);
  const inputRefs = useRef<TextInput[]>([]);

  const dispatch = useAppDispatch();
  const toast = useToast();
  const { isLoading, error } = useAuth();
  
  const clearError = () => dispatch(clearAuthError());

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    clearError();
    const resultAction = await dispatch(verifyLoginOtp({ email, otp: otpCode, trustDevice }));
    
    if (verifyLoginOtp.fulfilled.match(resultAction)) {
      toast.success('Đăng nhập thành công!', 'Chào mừng bạn');
    } else {
      toast.error(resultAction.payload as string || 'Xác thực thất bại', 'Lỗi');
    }
  };

  const handleResend = () => {
    setCountdown(60);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]}>
      <View style={styles.content}>
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.accentBlue} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accentBlue + '33' }]}>
            <Ionicons name="shield-checkmark-outline" size={40} color={colors.accentBlue} />
          </View>
          <Text style={[styles.title, { color: colors.textWhite }]}>Xác thực đăng nhập</Text>
          <Text style={[styles.subtitle, { color: colors.textGray }]}>
            Chúng tôi đã gửi mã xác thực đến{'\n'}
            <Text style={[styles.email, { color: colors.accentBlue }]}>{email}</Text>
          </Text>
          <Text style={[styles.note, { color: colors.textGray }]}>
            Mã OTP được gửi do đây là thiết bị mới hoặc chưa được tin cậy.
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.redError + '20' }]}>
            <Text style={[styles.errorText, { color: colors.redError }]}>{error}</Text>
          </View>
        )}

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: digit ? colors.accentBlue : colors.darkBorder,
                  color: colors.textWhite,
                },
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Trust Device Switch */}
        <View style={[styles.trustDeviceContainer, { backgroundColor: colors.darkSurface }]}>
          <View style={styles.trustDeviceInfo}>
            <Ionicons name="shield-outline" size={24} color={colors.accentBlue} style={{ marginRight: 12 }} />
            <View style={styles.trustDeviceTextContainer}>
              <Text style={[styles.trustDeviceTitle, { color: colors.textWhite }]}>
                Tin cậy thiết bị này
              </Text>
              <Text style={[styles.trustDeviceSubtitle, { color: colors.textGray }]}>
                Không yêu cầu OTP cho các lần đăng nhập sau
              </Text>
            </View>
          </View>
          <Switch
            value={trustDevice}
            onValueChange={setTrustDevice}
            trackColor={{ false: colors.darkBorder, true: colors.accentBlue + '80' }}
            thumbColor={trustDevice ? colors.accentBlue : colors.textGray}
          />
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={[styles.countdownText, { color: colors.textGray }]}>
              Gửi lại mã sau {countdown}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={[styles.resendText, { color: colors.accentBlue }]}>Gửi lại mã</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <Button
          title="Xác nhận đăng nhập"
          onPress={handleVerify}
          loading={isLoading}
          disabled={otp.join('').length !== 6}
          style={styles.verifyButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  email: {
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  trustDeviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  trustDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trustDeviceTextContainer: {
    flex: 1,
  },
  trustDeviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trustDeviceSubtitle: {
    fontSize: 12,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  countdownText: {
    fontSize: 14,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifyButton: {
    marginBottom: 16,
  },
});

export default LoginOtpVerificationScreen;
