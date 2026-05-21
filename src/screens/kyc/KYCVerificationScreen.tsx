import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Button } from '../../components/common';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { kycApi } from '../../api/kyc.api';

type KYCVerificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCVerification'>;
};

const KYCVerificationScreen: React.FC<KYCVerificationScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();

  const [kycStatus, setKycStatus] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadKYCStatus = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const result = await kycApi.getKYCStatus();
      setKycStatus(result);
    } catch (e) {
      // giữ state cũ nếu lỗi mạng
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadKYCStatus();
    }, [loadKYCStatus]),
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.darkSurface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textWhite} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Xác minh danh tính</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
          <Text style={[styles.loadingText, { color: colors.textGray }]}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = kycStatus?.status;

  // ── COMPLETED — Giao diện đơn giản ────────────────────────────────────────
  if (status === 'COMPLETED') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.darkSurface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textWhite} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Xác minh danh tính</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.centeredScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => { setIsRefreshing(true); loadKYCStatus(true); }}
              tintColor={colors.accentBlue}
            />
          }
        >
          {/* Big success icon */}
          <View style={[styles.successCircle, { backgroundColor: '#10b981' + '20' }]}>
            <Ionicons name="shield-checkmark" size={64} color="#10b981" />
          </View>

          <Text style={[styles.successTitle, { color: colors.textWhite }]}>Xác thực thành công!</Text>
          <Text style={[styles.successSub, { color: colors.textGray }]}>
            Danh tính của bạn đã được xác minh. Bạn có thể sử dụng đầy đủ các tính năng của ứng dụng.
          </Text>

          {/* Compact info strip */}
          {kycStatus?.idInfo?.name && (
            <View style={[styles.infoStrip, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
              <Ionicons name="person-circle-outline" size={20} color="#10b981" style={{ marginRight: 10 }} />
              <Text style={[styles.infoStripName, { color: colors.textWhite }]} numberOfLines={1}>
                {kycStatus.idInfo.name}
              </Text>
              {kycStatus.idInfo.id && (
                <Text style={[styles.infoStripId, { color: colors.textGray }]}>
                  {'  ·  '}{kycStatus.idInfo.id}
                </Text>
              )}
            </View>
          )}

          {kycStatus?.faceMatchScore != null && (
            <View style={[styles.faceRow, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
              <Ionicons name="scan-outline" size={18} color="#a78bfa" style={{ marginRight: 8 }} />
              <Text style={[styles.faceLabel, { color: colors.textGray }]}>Độ khớp khuôn mặt</Text>
              <Text style={[styles.faceScore, { color: kycStatus.faceMatchScore >= 60 ? '#10b981' : '#ef4444' }]}>
                {kycStatus.faceMatchScore}%
              </Text>
            </View>
          )}

          <Text style={[styles.pullHint, { color: colors.textGray }]}>Kéo xuống để làm mới</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── REQUIRE_REVERIFY — Hiện lý do + nút xác minh lại ─────────────────────
  if (status === 'REQUIRE_REVERIFY') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.darkSurface }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textWhite} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Xác minh danh tính</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.centeredScroll} showsVerticalScrollIndicator={false}>
          {/* Warning icon */}
          <View style={[styles.successCircle, { backgroundColor: '#fbbf24' + '20' }]}>
            <Ionicons name="refresh-circle" size={64} color="#fbbf24" />
          </View>

          <Text style={[styles.successTitle, { color: colors.textWhite }]}>Yêu cầu xác minh lại</Text>
          <Text style={[styles.successSub, { color: colors.textGray }]}>
            Admin đã yêu cầu bạn thực hiện xác minh KYC lại. Vui lòng đọc lý do và thực hiện lại.
          </Text>

          {/* Reason banner */}
          {kycStatus?.reKycReason && (
            <View style={[styles.reasonCard, { backgroundColor: '#fbbf2415', borderColor: '#fbbf2440' }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#fbbf24" style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.reasonLabel, { color: '#fbbf24' }]}>Lý do từ Admin</Text>
                <Text style={[styles.reasonText, { color: colors.textWhite }]}>{kycStatus.reKycReason}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.bottomContainer, { backgroundColor: colors.darkBackground }]}>
          <Button
            title="Xác minh lại ngay"
            onPress={() => navigation.navigate('KYCCaptureID', { side: 'front' })}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── Chưa xác thực — hướng dẫn 3 bước ────────────────────────────────────
  const steps = [
    { n: 1, title: 'Chụp ảnh giấy tờ', desc: 'Chụp rõ nét mặt trước và mặt sau CMND/CCCD.', icon: 'id-card-outline', color: '#60a5fa', active: true },
    { n: 2, title: 'Kiểm tra thông tin', desc: 'Xác nhận thông tin được OCR trích xuất tự động.', icon: 'checkmark-circle-outline', color: '#a78bfa', active: false },
    { n: 3, title: 'Quét khuôn mặt', desc: 'So sánh khuôn mặt với ảnh trên giấy tờ.', icon: 'scan-outline', color: '#34d399', active: false },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.darkSurface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Xác minh danh tính</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroIcon, { backgroundColor: colors.accentBlue + '20' }]}>
          <Ionicons name="shield-outline" size={48} color={colors.accentBlue} />
        </View>
        <Text style={[styles.title, { color: colors.textWhite }]}>Xác minh danh tính</Text>
        <Text style={[styles.subtitle, { color: colors.textGray }]}>
          Hoàn thành KYC để sử dụng đầy đủ tính năng vay và đầu tư
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Quy trình xác minh</Text>
        {steps.map((s) => (
          <View
            key={s.n}
            style={[
              styles.stepCard,
              { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder },
              s.active && { borderColor: s.color + '50', backgroundColor: s.color + '0d' },
            ]}
          >
            <View style={[styles.stepNum, { backgroundColor: s.active ? s.color : colors.darkBackground }]}>
              <Text style={[styles.stepNumText, { color: s.active ? '#fff' : colors.textGray }]}>{s.n}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.stepTitle, { color: colors.textWhite }]}>{s.title}</Text>
              <Text style={[styles.stepDesc, { color: colors.textGray }]}>{s.desc}</Text>
            </View>
            <View style={[styles.stepIconBox, { backgroundColor: s.color + '18' }]}>
              <Ionicons name={s.icon as any} size={22} color={s.color} />
            </View>
          </View>
        ))}

        <View style={[styles.notesCard, { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder }]}>
          <Text style={[styles.notesTitle, { color: colors.textWhite }]}>📋 Lưu ý quan trọng</Text>
          {[
            'Sử dụng giấy tờ gốc, không chụp bản photo',
            'Đảm bảo ánh sáng đủ, ảnh rõ nét không bị lóa',
            'Giấy tờ không bị mờ, rách hoặc che khuất',
            'Thông tin trên giấy tờ phải còn hiệu lực',
          ].map((n, i) => (
            <View key={i} style={styles.noteItem}>
              <Ionicons name="chevron-forward" size={14} color={colors.accentBlue} style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={[styles.noteItemText, { color: colors.textGray }]}>{n}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { backgroundColor: colors.darkBackground }]}>
        <Button
          title="Bắt đầu xác minh"
          onPress={() => navigation.navigate('KYCCaptureID', { side: 'front' })}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },

  // Loading / centered
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },

  // Success / Reverify centered scroll
  centeredScroll: {
    flexGrow: 1, alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 40,
  },
  successCircle: {
    width: 120, height: 120, borderRadius: 60,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  successSub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },

  infoStrip: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 10,
  },
  infoStripName: { fontSize: 15, fontWeight: '700', flex: 1 },
  infoStripId: { fontSize: 12 },

  faceRow: {
    flexDirection: 'row', alignItems: 'center',
    width: '100%', borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20,
  },
  faceLabel: { flex: 1, fontSize: 13 },
  faceScore: { fontSize: 16, fontWeight: '700' },

  pullHint: { fontSize: 12, marginTop: 8 },

  // Re-KYC reason card
  reasonCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    width: '100%', borderRadius: 14, borderWidth: 1,
    padding: 16, marginBottom: 16,
  },
  reasonLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  reasonText: { fontSize: 14, lineHeight: 20 },

  // Unverified
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  heroIcon: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 28 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  stepCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    padding: 16, marginBottom: 12,
  },
  stepNum: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumText: { fontSize: 14, fontWeight: '700' },
  stepTitle: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  stepDesc: { fontSize: 13, lineHeight: 19 },
  stepIconBox: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginLeft: 10,
  },
  notesCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 4,
  },
  notesTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  noteItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  noteItemText: { flex: 1, fontSize: 13, lineHeight: 19 },

  bottomContainer: { padding: 16, paddingBottom: 24 },
});

export default KYCVerificationScreen;
