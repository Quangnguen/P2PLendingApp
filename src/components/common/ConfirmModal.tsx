import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/providers';

type ConfirmModalVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_CONFIG: Record<ConfirmModalVariant, { icon: string; color: string }> = {
  danger:  { icon: 'trash-outline',       color: '#ef4444' },
  warning: { icon: 'warning-outline',     color: '#f59e0b' },
  info:    { icon: 'information-circle-outline', color: '#3b82f6' },
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { colors } = useTheme();
  const { icon, color } = VARIANT_CONFIG[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.darkSurface }]}>
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={28} color={color} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textWhite }]}>{title}</Text>

          {/* Message */}
          <Text style={[styles.message, { color: colors.textGray }]}>{message}</Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.darkBorder }]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.textGray }]}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: color }]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: '100%',
    height: 1,
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ConfirmModal;
