import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type KYCSuccessScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCSuccess'>;
};

const BENEFITS = [
  { icon: 'cash-outline',           color: '#34d399', label: 'Vay tối đa',   value: '50.000.000 VNĐ' },
  { icon: 'trending-up-outline',    color: '#60a5fa', label: 'Đầu tư',       value: 'Không giới hạn' },
  { icon: 'flash-outline',          color: '#fbbf24', label: 'Giải ngân',    value: 'Trong 24 giờ' },
  { icon: 'shield-checkmark-outline', color: '#a78bfa', label: 'Bảo mật',   value: 'Mã hoá 256-bit' },
];

const KYCSuccessScreen: React.FC<KYCSuccessScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulse1    = useRef(new Animated.Value(1)).current;
  const pulse2    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 55,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();

    const loopPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1.4, duration: 1400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1,   duration: 1400, useNativeDriver: true }),
        ])
      ).start();

    loopPulse(pulse1, 0);
    loopPulse(pulse2, 700);
  }, []);

  return (
    <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ─── Success Icon ─── */}
          <View style={styles.iconWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                { borderColor: '#8b5cf6', transform: [{ scale: pulse1 }], opacity: fadeAnim },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                styles.pulseRing2,
                { borderColor: '#6366f1', transform: [{ scale: pulse2 }], opacity: fadeAnim },
              ]}
            />
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <LinearGradient
                colors={['#4f46e5', '#7c3aed', '#9333ea']}
                style={styles.iconCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="shield-checkmark" size={52} color="#fff" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* ─── Title block ─── */}
          <Animated.View
            style={[
              styles.titleBlock,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.title}>Xác thực thành công!</Text>
            <View style={styles.badge}>
              <Ionicons name="ribbon-outline" size={13} color="#a78bfa" />
              <Text style={styles.badgeText}>KYC Level 2 · Verified</Text>
            </View>
            <Text style={styles.subtitle}>
              Danh tính của bạn đã được xác minh. Toàn bộ tính năng P2P Lending đã được mở khoá.
            </Text>
          </Animated.View>

          {/* ─── Benefits 2×2 grid ─── */}
          <Animated.View
            style={[
              styles.benefitsGrid,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {BENEFITS.map((item, i) => (
              <View
                key={i}
                style={[
                  styles.benefitCard,
                  { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: item.color + '30' },
                ]}
              >
                <View style={[styles.benefitIconBox, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={22} color={item.color} />
                </View>
                <Text style={styles.benefitLabel}>{item.label}</Text>
                <Text style={styles.benefitValue}>{item.value}</Text>
              </View>
            ))}
          </Animated.View>

          {/* ─── Info strip ─── */}
          <Animated.View
            style={[
              styles.infoStrip,
              { opacity: fadeAnim },
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color="#818cf8" />
            <Text style={styles.infoText}>
              Bạn có thể tạo khoản vay hoặc bắt đầu đầu tư ngay bây giờ
            </Text>
          </Animated.View>
        </ScrollView>

        {/* ─── Footer buttons ─── */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }, { name: 'CreateLoan' }],
              })
            }
            activeOpacity={0.85}
            style={styles.primaryBtnWrapper}
          >
            <LinearGradient
              colors={['#4f46e5', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.primaryBtnText}>Tạo khoản vay ngay</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
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
  safeArea:  { flex: 1 },

  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
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
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },

  // ─── Title ───
  titleBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  badgeText: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // ─── Benefits grid ───
  benefitsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  benefitCard: {
    width: '47.5%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitIconBox: {
    width: 42,
    height: 42,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '500',
  },
  benefitValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },

  // ─── Info strip ───
  infoStrip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 19,
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
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 7,
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
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default KYCSuccessScreen;
