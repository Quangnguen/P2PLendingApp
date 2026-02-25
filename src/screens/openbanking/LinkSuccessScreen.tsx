import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Button } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type LinkSuccessScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LinkSuccess'>;
  route: RouteProp<RootStackParamList, 'LinkSuccess'>;
};

const LinkSuccessScreen: React.FC<LinkSuccessScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { bankName } = route.params;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconOuter, { backgroundColor: colors.greenSuccess + '20' }]}>
            <View style={[styles.iconInner, { backgroundColor: colors.greenSuccess }]}>
              <Ionicons name="checkmark" size={48} color={colors.textWhite} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textWhite }]}>Kết nối thành công!</Text>
        <Text style={[styles.subtitle, { color: colors.textGray }]}>
          Tài khoản {bankName} của bạn đã được liên kết thành công với ứng dụng.
        </Text>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <View style={[styles.featureItem, { backgroundColor: colors.darkSurface }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accentBlue + '20' }]}>
              <Text style={styles.featureIconText}>💰</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.textWhite }]}>Xem số dư</Text>
              <Text style={[styles.featureSubtitle, { color: colors.textGray }]}>
                Theo dõi số dư tài khoản realtime
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: colors.darkSurface }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accentBlue + '20' }]}>
              <Text style={styles.featureIconText}>📊</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.textWhite }]}>Lịch sử giao dịch</Text>
              <Text style={[styles.featureSubtitle, { color: colors.textGray }]}>
                Xem tất cả giao dịch ngân hàng
              </Text>
            </View>
          </View>

          <View style={[styles.featureItem, { backgroundColor: colors.darkSurface }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accentBlue + '20' }]}>
              <Text style={styles.featureIconText}>🔒</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={[styles.featureTitle, { color: colors.textWhite }]}>Bảo mật cao</Text>
              <Text style={[styles.featureSubtitle, { color: colors.textGray }]}>
                Dữ liệu được mã hóa end-to-end
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.footer}>
        <Button
          title="Xem tài khoản"
          onPress={() => navigation.navigate('BankConnections')}
          style={styles.primaryButton}
        />
        <Button
          title="Về trang chủ"
          onPress={() => navigation.navigate('Main')}
          variant="secondary"
          style={styles.secondaryButton}
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
  },
  footer: {
    padding: 24,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {},
});

export default LinkSuccessScreen;
