import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/common';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.primaryBlue, colors.primaryBlue + 'CC', colors.primaryBlue + '99']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryBlue} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: colors.white + '20' }]}>
              <Text style={[styles.logoText, { color: colors.white }]}>P2P</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.welcomeText, { color: colors.white }]}>Chào mừng đến với</Text>
          <Text style={[styles.appName, { color: colors.white }]}>P2P Lending</Text>

          {/* Description */}
          <Text style={[styles.description, { color: colors.white + 'E6' }]}>
            Nền tảng cho vay ngang hàng{'\n'}an toàn và minh bạch
          </Text>

          {/* Features */}
          <View style={styles.features}>
            <FeatureItem icon="🔒" text="Bảo mật tuyệt đối" colors={colors} />
            <FeatureItem icon="⚡" text="Giao dịch nhanh chóng" colors={colors} />
            <FeatureItem icon="💰" text="Lãi suất hấp dẫn" colors={colors} />
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <Button
              title="Bắt đầu"
              onPress={() => navigation.navigate('Auth')}
              style={{ ...styles.button, backgroundColor: colors.white }}
              textStyle={{ color: colors.primaryBlue }}
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string; colors: any }> = ({ icon, text, colors }) => (
  <View style={[styles.featureItem, { backgroundColor: colors.white + '15' }]}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <Text style={[styles.featureText, { color: colors.white }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  features: {
    marginTop: 48,
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 48,
  },
  button: {
    width: '100%',
  },
});

export default OnboardingScreen;
