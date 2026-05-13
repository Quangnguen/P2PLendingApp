import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@/store';
import { useTheme } from '@/providers';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatDate } from '@/utils/formatters';

const PersonalInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const getKycStatusText = (status?: string) => {
    switch (status) {
      case 'verified': return 'Đã xác minh';
      case 'pending': return 'Đang chờ xử lý';
      case 'rejected': return 'Bị từ chối';
      default: return 'Chưa xác minh';
    }
  };

  const getKycStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return colors.greenSuccess;
      case 'pending': return colors.yellowWarning;
      case 'rejected': return colors.redError;
      default: return colors.textGray;
    }
  };

  const InfoItem = ({ label, value, icon }: { label: string; value?: string; icon: string }) => (
    <View style={[styles.infoItem, { borderBottomColor: colors.darkBorder }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.darkBackground }]}>
        <Ionicons name={icon} size={20} color={colors.accentBlue} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.textGray }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: value ? colors.textWhite : colors.textGray }]}>
          {value || 'Chưa cập nhật'}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Thông tin cá nhân</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.accentBlue + '20' }]}>
            <Text style={[styles.avatarText, { color: colors.accentBlue }]}>
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textWhite }]}>{user?.fullName || 'Người dùng'}</Text>
          
          <View style={[styles.kycBadge, { backgroundColor: getKycStatusColor(user?.kycStatus) + '20' }]}>
            <Ionicons 
              name={user?.kycStatus === 'verified' ? 'checkmark-circle' : 'time'} 
              size={14} 
              color={getKycStatusColor(user?.kycStatus)} 
            />
            <Text style={[styles.kycText, { color: getKycStatusColor(user?.kycStatus) }]}>
              {getKycStatusText(user?.kycStatus)}
            </Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={[styles.card, { backgroundColor: colors.darkSurface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Thông tin liên hệ</Text>
          <InfoItem 
            icon="mail-outline" 
            label="Email" 
            value={user?.email} 
          />
          <InfoItem 
            icon="call-outline" 
            label="Số điện thoại" 
            value={user?.phoneNumber} 
          />
          <InfoItem 
            icon="location-outline" 
            label="Địa chỉ" 
            value={user?.address} 
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.darkSurface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Thông tin định danh</Text>
          <InfoItem 
            icon="person-outline" 
            label="Họ và tên" 
            value={user?.fullName} 
          />
          <InfoItem 
            icon="card-outline" 
            label="Số CCCD/CMND" 
            value={user?.idNumber} 
          />
          <InfoItem 
            icon="calendar-outline" 
            label="Ngày sinh" 
            value={user?.dateOfBirth ? formatDate(new Date(user.dateOfBirth)) : undefined} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  kycText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default PersonalInfoScreen;
