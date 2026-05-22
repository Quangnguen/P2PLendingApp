import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
//   Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type KYCSuccessScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCSuccess'>;
};

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

const KYCSuccessScreen: React.FC<KYCSuccessScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();

  const handleDone = () => {
    // Navigate back to profile or home
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Success Animation/Icon */}
        <View style={styles.successIconContainer}>
          <View style={[styles.successCircle, { backgroundColor: colors.greenSuccess + '20' }]}>
            <View style={[styles.successInnerCircle, { backgroundColor: colors.greenSuccess }]}>
              <Ionicons name="checkmark" size={48} color={colors.textWhite} />
            </View>
          </View>
        </View>

        {/* Success Message */}
        <Text style={[styles.successTitle, { color: colors.textWhite }]}>Xác thực thành công!</Text>
        <Text style={[styles.successSubtitle, { color: colors.textGray }]}>
          Tài khoản của bạn đã được xác thực danh tính thành công
        </Text>

        {/* KYC Level Info */}
        <View style={[styles.kycLevelCard, { backgroundColor: colors.darkSurface }]}>
          <View style={styles.kycLevelHeader}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.greenSuccess} style={{ marginRight: 12 }} />
            <Text style={[styles.kycLevelTitle, { color: colors.textWhite }]}>KYC Level 2</Text>
            <View style={[styles.kycBadge, { backgroundColor: colors.greenSuccess + '20' }]}>
              <Text style={[styles.kycBadgeText, { color: colors.greenSuccess }]}>Verified</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />
          
          <View style={styles.benefitsContainer}>
            <Text style={[styles.benefitsTitle, { color: colors.textGray }]}>Quyền lợi của bạn:</Text>
            
            <View style={styles.benefitItem}>
              <Ionicons name="cash-outline" size={18} color={colors.greenSuccess} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: colors.textWhite }]}>Vay tối đa 50.000.000 VNĐ</Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="bar-chart-outline" size={18} color={colors.accentBlue} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: colors.textWhite }]}>Đầu tư không giới hạn</Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="flash-outline" size={18} color={colors.yellowWarning} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: colors.textWhite }]}>Giải ngân trong 24h</Text>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textGray} style={styles.benefitIcon} />
              <Text style={[styles.benefitText, { color: colors.textWhite }]}>Bảo mật thông tin cá nhân</Text>
            </View>
          </View>
        </View>

        {/* Next Steps */}
        <View style={[styles.nextStepsCard, { backgroundColor: colors.accentBlue + '15' }]}>
          <Text style={[styles.nextStepsTitle, { color: colors.accentBlue }]}>Bước tiếp theo</Text>
          <Text style={[styles.nextStepsText, { color: colors.textGray }]}>
            Bạn có thể bắt đầu tạo khoản vay hoặc đầu tư ngay bây giờ!
          </Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        <Button title="Về trang chủ" onPress={handleDone} />
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [
                { name: 'Main' },
                { name: 'CreateLoan' },
              ],
            });
          }}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.accentBlue }]}>Tạo khoản vay ngay</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  successIconContainer: {
    marginBottom: 32,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
  },
  kycLevelCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  kycLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kycLevelIcon: {
    marginRight: 12,
  },
  kycLevelTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  kycBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kycBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  benefitsContainer: {},
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitIcon: {
    marginRight: 12,
    width: 24,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  nextStepsCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextStepsText: {
    fontSize: 13,
    textAlign: 'center',
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default KYCSuccessScreen;
