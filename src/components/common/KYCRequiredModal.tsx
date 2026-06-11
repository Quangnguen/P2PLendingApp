import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/providers';

interface KYCRequiredModalProps {
  visible: boolean;
  /** 'loan' = tạo yêu cầu vay, 'invest' = cho vay / đầu tư */
  reason?: 'loan' | 'invest';
  onVerify: () => void;
  onDismiss: () => void;
}

const REASON_CONFIG = {
  loan: {
    title: 'Cần xác thực danh tính',
    subtitle: 'Bạn phải hoàn thành KYC trước khi tạo yêu cầu vay',
  },
  invest: {
    title: 'Cần xác thực danh tính',
    subtitle: 'Bạn phải hoàn thành KYC trước khi cho vay / đầu tư',
  },
};

const STEPS = [
  { icon: 'id-card-outline',      label: 'Chụp CCCD/CMND',   desc: 'Mặt trước & mặt sau' },
  { icon: 'scan-outline',         label: 'Xác minh khuôn mặt', desc: 'Selfie nhanh 10 giây' },
  { icon: 'checkmark-shield-outline', label: 'Hoàn tất',     desc: 'Xác nhận thông tin' },
];

const KYCRequiredModal: React.FC<KYCRequiredModalProps> = ({
  visible,
  reason = 'loan',
  onVerify,
  onDismiss,
}) => {
  const { colors } = useTheme();
  const config = REASON_CONFIG[reason];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.darkSurface }]}>

          {/* ── Header icon ── */}
          <View style={styles.iconOuter}>
            <View style={[styles.iconInner, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name="shield-checkmark-outline" size={44} color="#3b82f6" />
            </View>
          </View>

          {/* ── Titles ── */}
          <Text style={[styles.title, { color: colors.textWhite }]}>{config.title}</Text>
          <Text style={[styles.subtitle, { color: colors.textGray }]}>{config.subtitle}</Text>

          {/* ── Step list ── */}
          <View style={[styles.stepsBox, { backgroundColor: colors.darkBackground, borderColor: colors.darkBorder }]}>
            {STEPS.map((step, i) => (
              <View key={i} style={[styles.stepRow, i < STEPS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.darkBorder }]}>
                <View style={[styles.stepIconWrap, { backgroundColor: '#3b82f615' }]}>
                  <Ionicons name={step.icon as any} size={20} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepLabel, { color: colors.textWhite }]}>{step.label}</Text>
                  <Text style={[styles.stepDesc, { color: colors.textGray }]}>{step.desc}</Text>
                </View>
                <View style={[styles.stepNum, { backgroundColor: '#3b82f620' }]}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Note ── */}
          <View style={[styles.note, { backgroundColor: '#f59e0b12', borderColor: '#f59e0b30' }]}>
            <Ionicons name="time-outline" size={14} color="#f59e0b" style={{ marginRight: 6 }} />
            <Text style={[styles.noteText, { color: '#f59e0b' }]}>
              Quá trình xác thực chỉ mất khoảng 2-3 phút
            </Text>
          </View>

          {/* ── Buttons ── */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onVerify}
            activeOpacity={0.85}
          >
            <Ionicons name="shield-checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>Xác thực ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.darkBorder }]}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textGray }]}>Để sau</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  iconOuter: {
    marginBottom: 16,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  stepsBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#3b82f6',
    fontSize: 11,
    fontWeight: '700',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default KYCRequiredModal;
