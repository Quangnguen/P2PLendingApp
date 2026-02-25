import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '../../components/common';
import { useAppDispatch, useAuth, verifyOtp, clearAuthError, useToast } from '../../store';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';

type OtpVerificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OtpVerification'>;
  route: RouteProp<RootStackParamList, 'OtpVerification'>;
};

const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<TextInput[]>([]);

  const dispatch = useAppDispatch();
  const toast = useToast();
  const { isLoading, error } = useAuth();
  const { colors } = useTheme();
  
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
    const resultAction = await dispatch(verifyOtp({ email, otp: otpCode }));
    
    if (verifyOtp.fulfilled.match(resultAction)) {
      toast.success('Xác thực thành công!', 'Thành công');
      navigation.navigate('Auth');
    } else {
      toast.error(resultAction.payload as string || 'Xác thực thất bại', 'Lỗi');
    }
  };

  const handleResend = () => {
    // TODO: Implement resend OTP
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
          <Text style={[styles.backButtonText, { color: colors.accentBlue }]}>← Quay lại</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: colors.accentBlue + '33' }]}>
            <Text style={styles.icon}>📧</Text>
          </View>
          <Text style={[styles.title, { color: colors.textWhite }]}>Xác thực OTP</Text>
          <Text style={[styles.subtitle, { color: colors.textGray }]}>
            Chúng tôi đã gửi mã xác thực đến{'\n'}
            <Text style={[styles.email, { color: colors.accentBlue }]}>{email}</Text>
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
                  backgroundColor: colors.darkSurface,
                  borderColor: digit ? colors.accentBlue : colors.darkBorder,
                  color: colors.textWhite,
                }
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
          title="Xác nhận"
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
  icon: {
    fontSize: 36,
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
  errorContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
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
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
    marginTop: 'auto',
  },
});

export default OtpVerificationScreen;
