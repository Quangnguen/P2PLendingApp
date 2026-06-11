import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/providers';
import { ConfirmModal } from '@/components/common';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SecurityScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const toggleBiometric = () => {
    setIsBiometricEnabled(previousState => !previousState);
  };

  const toggle2FA = () => {
    if (!is2FAEnabled) {
      Alert.alert(
        'Kích hoạt 2FA',
        'Tính năng đang được phát triển. Trong tương lai, bạn sẽ nhận được mã OTP qua SMS hoặc Authenticator app.',
        [{ text: 'Đóng' }]
      );
    } else {
      setIs2FAEnabled(false);
    }
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword' as any);
  };

  const handleDeviceManagement = () => {
    Alert.alert('Quản lý thiết bị', 'Tính năng đang được phát triển.');
  };

  const handleDeleteAccount = () => setShowDeleteModal(true);

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    hasSwitch, 
    switchValue, 
    onSwitchChange,
    danger
  }: any) => (
    <TouchableOpacity 
      style={[styles.settingItem, { borderBottomColor: colors.darkBorder }]} 
      onPress={hasSwitch ? onSwitchChange : onPress}
      disabled={hasSwitch}
    >
      <View style={[styles.iconContainer, { backgroundColor: danger ? colors.redError + '15' : colors.darkBackground }]}>
        <Ionicons name={icon} size={20} color={danger ? colors.redError : colors.accentBlue} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: danger ? colors.redError : colors.textWhite }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textGray }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.darkBorder, true: colors.accentBlue + '60' }}
          thumbColor={switchValue ? colors.accentBlue : colors.textGray}
          ios_backgroundColor={colors.darkBorder}
        />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={colors.textGray} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Bảo mật</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        
        {/* Authentication Settings */}
        <View style={[styles.section, { backgroundColor: colors.darkSurface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Đăng nhập & Xác thực</Text>
          
          <SettingItem 
            icon="key-outline" 
            title="Đổi mật khẩu" 
            subtitle="Cập nhật mật khẩu định kỳ để bảo vệ tài khoản"
            onPress={handleChangePassword} 
          />
          
          <SettingItem 
            icon="finger-print-outline" 
            title="Đăng nhập bằng Sinh trắc học" 
            subtitle="Sử dụng Face ID / Touch ID để đăng nhập nhanh"
            hasSwitch={true}
            switchValue={isBiometricEnabled}
            onSwitchChange={toggleBiometric}
          />

          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Xác thực 2 bước (2FA)" 
            subtitle="Bảo vệ lớp thứ 2 cho tài khoản của bạn"
            hasSwitch={true}
            switchValue={is2FAEnabled}
            onSwitchChange={toggle2FA}
          />
        </View>

        {/* Device Settings */}
        <View style={[styles.section, { backgroundColor: colors.darkSurface }]}>
          <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Quản lý thiết bị</Text>
          
          <SettingItem 
            icon="phone-portrait-outline" 
            title="Thiết bị đã đăng nhập" 
            subtitle="Xem các thiết bị đang sử dụng tài khoản này"
            onPress={handleDeviceManagement} 
          />
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: colors.darkSurface, marginTop: 12 }]}>
          <SettingItem 
            icon="trash-outline" 
            title="Xóa tài khoản" 
            subtitle="Vô hiệu hóa vĩnh viễn tài khoản và dữ liệu"
            onPress={handleDeleteAccount} 
            danger={true}
          />
        </View>

      </ScrollView>

      <ConfirmModal
        visible={showDeleteModal}
        title="Xóa tài khoản"
        message={'Hành động này không thể hoàn tác và toàn bộ dữ liệu của bạn sẽ bị mất.\n\nVui lòng liên hệ bộ phận hỗ trợ để tiến hành xóa tài khoản.'}
        confirmText="Liên hệ hỗ trợ"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          setShowDeleteModal(false);
          Alert.alert('Hỗ trợ', 'Email: support@p2plending.vn\nHotline: 1900 xxxx');
        }}
        onCancel={() => setShowDeleteModal(false)}
      />
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
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
  settingContent: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default SecurityScreen;
