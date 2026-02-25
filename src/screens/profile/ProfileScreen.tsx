import React from 'react';
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
import { useAppDispatch, useAuth, logout } from '@/store';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const menuItems = [
    {
      icon: '👤',
      title: 'Thông tin cá nhân',
      subtitle: 'Xem và chỉnh sửa thông tin',
      onPress: () => {},
    },
    {
      icon: '🔐',
      title: 'Bảo mật',
      subtitle: 'Mật khẩu, xác thực 2 bước',
      onPress: () => {},
    },
    {
      icon: '🏦',
      title: 'Tài khoản ngân hàng',
      subtitle: 'Quản lý tài khoản liên kết',
      onPress: () => navigation.navigate('BankConnections'),
    },
    {
      icon: '🆔',
      title: 'Xác minh danh tính (KYC)',
      subtitle: 'Hoàn tất xác minh để vay',
      onPress: () => navigation.navigate('KYCVerification'),
      badge: 'Chưa xác minh',
      badgeColor: colors.yellowWarning,
    },
    {
      icon: '📜',
      title: 'Lịch sử giao dịch',
      subtitle: 'Xem tất cả giao dịch',
      onPress: () => navigation.navigate('Wallet'),
    },
    {
      icon: '🔔',
      title: 'Thông báo',
      subtitle: 'Cài đặt thông báo',
      onPress: () => {},
    },
    {
      icon: '❓',
      title: 'Trợ giúp & Hỗ trợ',
      subtitle: 'FAQ, liên hệ hỗ trợ',
      onPress: () => {},
    },
    {
      icon: '📄',
      title: 'Điều khoản & Chính sách',
      subtitle: 'Điều khoản sử dụng',
      onPress: () => {},
    },
  ];

  const handleLogout = async () => {
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
              <Text style={styles.editAvatarIcon}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.fullName || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(15000000)}
              </Text>
              <Text style={styles.statLabel}>Tổng đầu tư</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Khoản vay</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>750</Text>
              <Text style={styles.statLabel}>Điểm tín dụng</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Theme Switch Section */}
        <View style={[styles.themeSection, { backgroundColor: colors.darkSurface }]}>
          <View style={styles.themeSwitchRow}>
            <View style={styles.themeIconContainer}>
              <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
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
              <View style={[styles.menuIcon, { backgroundColor: colors.darkBackground }]}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
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
                    { backgroundColor: item.badgeColor + '20' },
                  ]}
                >
                  <Text
                    style={[styles.menuBadgeText, { color: item.badgeColor }]} 
                  >
                    {item.badge}
                  </Text>
                </View>
              )}
              <Text style={[styles.menuArrow, { color: colors.textGray }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.redError + '15' }]} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
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
