import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type LinkSuccessScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LinkSuccess'>;
  route: RouteProp<RootStackParamList, 'LinkSuccess'>;
};

const FEATURES = [
  {
    icon: 'wallet-outline',
    color: '#60a5fa',
    title: 'Xem số dư realtime',
    subtitle: 'Theo dõi số dư tài khoản ngân hàng trực tiếp trong app',
  },
  {
    icon: 'bar-chart-outline',
    color: '#34d399',
    title: 'Lịch sử giao dịch',
    subtitle: 'Xem toàn bộ giao dịch ngân hàng được đồng bộ tự động',
  },
  {
    icon: 'shield-checkmark-outline',
    color: '#a78bfa',
    title: 'Bảo mật end-to-end',
    subtitle: 'Dữ liệu được mã hóa 256-bit, không lưu mật khẩu',
  },
];

const LinkSuccessScreen: React.FC<LinkSuccessScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { bankName } = route.params;

  // Animations
  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;
  const pulse1      = useRef(new Animated.Value(1)).current;
  const pulse2      = useRef(new Animated.Value(1)).current;
  const cardAnims   = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // Stagger feature cards
      Animated.stagger(
        120,
        cardAnims.map(a => Animated.spring(a, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }))
      ),
    ]).start();

    const loopPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.35, duration: 1200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
        ])
      ).start();

    loopPulse(pulse1, 0);
    loopPulse(pulse2, 600);
  }, []);

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>

        {/* ─── Content ─── */}
        <View style={styles.content}>

          {/* Success Icon with pulse rings */}
          <View style={styles.iconWrapper}>
            {/* Pulse ring 1 */}
            <Animated.View
              style={[
                styles.pulseRing,
                { borderColor: '#10b981', transform: [{ scale: pulse1 }], opacity: fadeAnim },
              ]}
            />
            {/* Pulse ring 2 */}
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRing2,
                { borderColor: '#10b981', transform: [{ scale: pulse2 }], opacity: fadeAnim },
              ]}
            />

            {/* Main circle */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <LinearGradient
                colors={['#059669', '#10b981', '#34d399']}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={52} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Title block */}
          <Animated.View
            style={[
              styles.titleBlock,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.title}>Kết nối thành công!</Text>
            <View style={styles.bankBadge}>
              <Ionicons name="business-outline" size={14} color="#10b981" />
              <Text style={styles.bankBadgeText}>{bankName}</Text>
            </View>
            <Text style={styles.subtitle}>
              Tài khoản ngân hàng của bạn đã được liên kết an toàn. Bạn có thể sử dụng đầy đủ tính năng dưới đây.
            </Text>
          </Animated.View>

          {/* Feature cards — staggered */}
          <View style={styles.featuresContainer}>
            {FEATURES.map((item, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureCard,
                  { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: item.color + '25' },
                  { opacity: cardAnims[index], transform: [{ translateY: cardAnims[index].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
                ]}
              >
                <View style={[styles.featureIconBox, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <View style={styles.featureText}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={item.color} />
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ─── Footer buttons ─── */}
        <Animated.View
          style={[styles.footer, { opacity: fadeAnim }]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('BankConnections')}
            activeOpacity={0.85}
            style={styles.primaryBtnWrapper}
          >
            <LinearGradient
              colors={['#059669', '#10b981']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Ionicons name="wallet-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Xem tài khoản</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Main')}
            activeOpacity={0.8}
            style={styles.secondaryBtn}
          >
            <Ionicons name="home-outline" size={18} color="rgba(255,255,255,0.55)" />
            <Text style={styles.secondaryBtnText}>Về trang chủ</Text>
          </TouchableOpacity>
        </Animated.View>

      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
  },

  // ─── Icon ───
  iconWrapper: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  pulseRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  pulseRing2: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },

  // ─── Title ───
  titleBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  bankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  bankBadgeText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // ─── Features ───
  featuresContainer: {
    width: '100%',
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 17,
  },

  // ─── Footer ───
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 10,
  },
  primaryBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default LinkSuccessScreen;
