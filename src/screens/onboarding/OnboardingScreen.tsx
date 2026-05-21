import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SlideItem {
  id: string;
  icon: string;
  iconColor: string;
  gradientColors: string[];
  title: string;
  subtitle: string;
  description: string;
}

const SLIDES: SlideItem[] = [
  {
    id: '1',
    icon: 'people-outline',
    iconColor: '#60a5fa',
    gradientColors: ['#0f172a', '#1e3a5f', '#0f172a'],
    title: 'Vay tiền',
    subtitle: 'Nhanh — Đơn giản — Minh bạch',
    description:
      'Tạo yêu cầu vay trong vài phút. Nhận tiền từ cộng đồng nhà đầu tư với lãi suất cạnh tranh và điều khoản linh hoạt.',
  },
  {
    id: '2',
    icon: 'trending-up-outline',
    iconColor: '#34d399',
    gradientColors: ['#0f172a', '#064e3b', '#0f172a'],
    title: 'Đầu tư sinh lời',
    subtitle: 'Lãi suất hấp dẫn — Rủi ro kiểm soát',
    description:
      'Cho vay ngang hàng với lãi suất cao hơn ngân hàng. Hệ thống đánh giá tín dụng AI giúp bạn đưa ra quyết định thông minh.',
  },
  {
    id: '3',
    icon: 'shield-checkmark-outline',
    iconColor: '#a78bfa',
    gradientColors: ['#0f172a', '#2e1065', '#0f172a'],
    title: 'Bảo mật Blockchain',
    subtitle: 'Smart Contract — Không trung gian',
    description:
      'Mọi giao dịch được ghi nhận trên blockchain. Tài sản thế chấp ETH được khóa tự động bởi smart contract, đảm bảo an toàn tuyệt đối.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      navigation.navigate('Auth');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Auth');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderSlide = ({ item }: { item: SlideItem }) => (
    <View style={styles.slide}>
      {/* Central Icon */}
      <View style={styles.iconWrapper}>
        <LinearGradient
          colors={[item.iconColor + '30', item.iconColor + '10']}
          style={styles.iconOuterRing}
        >
          <LinearGradient
            colors={[item.iconColor + '50', item.iconColor + '20']}
            style={styles.iconInnerRing}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.iconColor + '25', borderColor: item.iconColor + '60', borderWidth: 1 }]}>
              <Ionicons name={item.icon as any} size={64} color={item.iconColor} />
            </View>
          </LinearGradient>
        </LinearGradient>
      </View>

      {/* Text */}
      <View style={styles.textBlock}>
        <Text style={[styles.slideTitle, { color: '#fff' }]}>{item.title}</Text>
        <Text style={[styles.slideSubtitle, { color: item.iconColor }]}>{item.subtitle}</Text>
        <Text style={[styles.slideDescription, { color: 'rgba(255,255,255,0.65)' }]}>
          {item.description}
        </Text>
      </View>
    </View>
  );

  const isLast = currentIndex === SLIDES.length - 1;
  const activeSlide = SLIDES[currentIndex];

  return (
    <LinearGradient colors={['#0f172a', '#1e293b', '#0f172a']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>

        {/* Top bar: Logo + Skip */}
        <View style={styles.topBar}>
          <View style={styles.logoMini}>
            <Ionicons name="swap-horizontal-outline" size={20} color="#60a5fa" />
            <Text style={styles.logoLabel}>P2P Lending</Text>
          </View>
          {!isLast && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Bỏ qua</Text>
              <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
          style={styles.flatList}
        />

        {/* Bottom: Dots + Button */}
        <View style={styles.bottom}>
          {/* Dots */}
          <View style={styles.dotsRow}>
            {SLIDES.map((slide, index) => {
              const inputRange = [
                (index - 1) * SCREEN_WIDTH,
                index * SCREEN_WIDTH,
                (index + 1) * SCREEN_WIDTH,
              ];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.35, 1, 0.35],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={slide.id}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: activeSlide.iconColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={[activeSlide.iconColor, activeSlide.iconColor + 'AA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaText}>
                {isLast ? 'Bắt đầu ngay' : 'Tiếp theo'}
              </Text>
              <Ionicons
                name={isLast ? 'rocket-outline' : 'arrow-forward-outline'}
                size={20}
                color="#fff"
              />
            </LinearGradient>
          </TouchableOpacity>

          {/* Already have account */}
          {isLast && (
            <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Đã có tài khoản?{' '}
                <Text style={[styles.loginLinkBold, { color: activeSlide.iconColor }]}>Đăng nhập</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  // Top
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  logoMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },

  // Slides
  flatList: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // Icon
  iconWrapper: {
    marginBottom: 48,
  },
  iconOuterRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInnerRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Text
  textBlock: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  slideDescription: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Bottom
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  // CTA
  ctaWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ctaButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Login link
  loginLink: {
    marginTop: 20,
    paddingVertical: 4,
  },
  loginLinkText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  loginLinkBold: {
    fontWeight: '700',
  },
});

export default OnboardingScreen;
