import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { useAppDispatch, useAppSelector, useAuth, logout } from '@/store';
import { loadConnections, resetOpenBanking } from '@/store/slices/openBankingSlice';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { connections } = useAppSelector(state => state.openBanking);

  useEffect(() => {
    dispatch(loadConnections());
  }, [dispatch]);

  const isBankLinked = connections.length > 0;

  const menuItems = [
    {
      icon: 'person-outline' as const,
      iconColor: '#60a5fa',
      title: 'Thông tin cá nhân',
      subtitle: 'Xem và chỉnh sửa thông tin',
      onPress: () => navigation.navigate('PersonalInfo'),
    },
    {
      icon: 'shield-checkmark-outline' as const,
      iconColor: '#a78bfa',
      title: 'Bảo mật',
      subtitle: 'Mật khẩu, xác thực 2 bước',
      onPress: () => navigation.navigate('Security'),
    },
    {
      icon: 'business-outline' as const,
      iconColor: '#34d399',
      title: 'Tài khoản ngân hàng',
      subtitle: isBankLinked ? 'Đã liên kết tài khoản' : 'Quản lý tài khoản liên kết',
      onPress: () => navigation.navigate('BankConnections'),
      badge: isBankLinked ? 'Đã liên kết' : 'Chưa liên kết',
      badgeColor: isBankLinked ? colors.greenSuccess : colors.yellowWarning,
    },
    {
      icon: 'card-outline' as const,
      iconColor: '#f59e0b',
      title: 'Xác minh danh tính (KYC)',
      subtitle: 'Hoàn tất xác minh để vay',
      onPress: () => navigation.navigate('KYCVerification'),
      badge: user?.kycStatus === 'verified'
        ? 'Đã xác minh'
        : user?.kycStatus === 'pending'
          ? 'Đang xử lý'
          : 'Chưa xác minh',
      badgeColor: user?.kycStatus === 'verified'
        ? colors.greenSuccess
        : user?.kycStatus === 'pending'
          ? colors.accentBlue
          : colors.yellowWarning,
    },
    {
      icon: 'receipt-outline' as const,
      iconColor: '#fb923c',
      title: 'Lịch sử giao dịch',
      subtitle: 'Xem tất cả giao dịch',
      onPress: () => navigation.navigate('TransactionHistory'),
    },
    {
      icon: 'notifications-outline' as const,
      iconColor: '#e879f9',
      title: 'Thông báo',
      subtitle: 'Cài đặt thông báo',
      onPress: () => { },
    },
    {
      icon: 'help-circle-outline' as const,
      iconColor: '#38bdf8',
      title: 'Trợ giúp & Hỗ trợ',
      subtitle: 'FAQ, liên hệ hỗ trợ',
      onPress: () => { },
    },
    {
      icon: 'document-text-outline' as const,
      iconColor: '#94a3b8',
      title: 'Điều khoản & Chính sách',
      subtitle: 'Điều khoản sử dụng',
      onPress: () => { },
    },
  ];

  const handleLogout = async () => {
    dispatch(resetOpenBanking()); // Xóa bank connections cache
    await dispatch(logout(undefined));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <LinearGradient
          colors={[colors.accentBlue, '#1a73e8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.fullName?.charAt(0) || 'U'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={colors.accentBlue} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {connections.length > 0 ? `${connections.length}` : '0'}
              </Text>
              <Text style={styles.statLabel}>Tài khoản NH</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name={user?.kycStatus === 'verified' ? 'checkmark-circle' : user?.kycStatus === 'pending' ? 'time-outline' : 'ellipse-outline'}
                size={22}
                color={user?.kycStatus === 'verified' ? '#34d399' : user?.kycStatus === 'pending' ? '#fbbf24' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={styles.statLabel}>KYC</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons
                name={user?.isVerified ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={user?.isVerified ? '#34d399' : 'rgba(255,255,255,0.5)'}
              />
              <Text style={styles.statLabel}>Email</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Theme Switch Section */}
        <View style={[styles.themeSection, { backgroundColor: colors.darkSurface }]}>
          <View style={styles.themeSwitchRow}>
            <View style={[styles.themeIconContainer, { backgroundColor: isDark ? 'rgba(167,139,250,0.15)' : 'rgba(251,191,36,0.15)' }]}>
              <Ionicons name={isDark ? 'moon-outline' : 'sunny-outline'} size={22} color={isDark ? '#a78bfa' : '#fbbf24'} />
            </View>
            <View style={styles.themeContent}>
              <Text style={[styles.themeTitle, { color: colors.textWhite }]}>
                Giao diện {isDark ? 'Tối' : 'Sáng'}
              </Text>
              <Text style={[styles.themeSubtitle, { color: colors.textGray }]}>
                {isDark ? 'Bật chế độ sáng' : 'Bật chế độ tối'}
              </Text>
            </View>
            <Switch
              value={!isDark}
              onValueChange={toggleTheme}
              trackColor={{
                false: colors.darkBorder,
                true: colors.accentBlue + '60'
              }}
              thumbColor={!isDark ? colors.accentBlue : colors.textGray}
              ios_backgroundColor={colors.darkBorder}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.darkSurface }]}
              onPress={item.onPress}
            >
              <View style={[styles.menuIcon, { backgroundColor: (item as any).iconColor + '18' }]}>
                <Ionicons name={(item as any).icon} size={22} color={(item as any).iconColor} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.textWhite }]}>
                  {item.title}
                </Text>
                <Text style={[styles.menuSubtitle, { color: colors.textGray }]}>
                  {item.subtitle}
                </Text>
              </View>
              {item.badge && (
                <View
                  style={[
                    styles.menuBadge,
                    { backgroundColor: (item as any).badgeColor + '20' },
                  ]}
                >
                  <Text
                    style={[styles.menuBadgeText, { color: (item as any).badgeColor }]}
                  >
                    {item.badge}
                  </Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.redError + '15' }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.redError} style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: colors.redError }]}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: colors.textGray }]}>Phiên bản 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarIcon: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
  // Theme Section
  themeSection: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
  },
  themeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  themeIcon: {
    fontSize: 22,
  },
  themeContent: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeSubtitle: {
    fontSize: 12,
  },
  // Menu
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  menuBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  menuArrow: {
    fontSize: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 20,
  },
});

export default ProfileScreen;
