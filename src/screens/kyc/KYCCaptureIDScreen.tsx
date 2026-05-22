import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
  Modal,
  Animated,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import { kycApi, IDRecognitionResult } from '../../api/kyc.api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useToast } from '@/store';

type KYCCaptureIDScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCCaptureID'>;
  route: RouteProp<RootStackParamList, 'KYCCaptureID'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_WIDTH = SCREEN_WIDTH - 48;
const FRAME_HEIGHT = FRAME_WIDTH * 0.63;

const KYCCaptureIDScreen: React.FC<KYCCaptureIDScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { side } = route.params;
  const isFrontSide = side === 'front';
  const toast = useToast();

  const [capturedImage, setCapturedImage] = useState<Asset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<IDRecognitionResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [pendingOcrData, setPendingOcrData] = useState<IDRecognitionResult | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const openResultModal = (data: IDRecognitionResult) => {
    setPendingOcrData(data);
    setShowResultModal(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
    ]).start();
  };

  const closeResultModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShowResultModal(false);
      setPendingOcrData(null);
    });
  };

  const ensureCameraPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Cần quyền camera',
        message: 'Ứng dụng cần quyền truy cập camera để chụp ảnh CCCD.',
        buttonPositive: 'Đồng ý',
        buttonNegative: 'Từ chối',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  // Chụp ảnh bằng camera
  const handleCapture = async () => {
    const hasPermission = await ensureCameraPermission();
    if (!hasPermission) {
      toast.error('Cần cấp quyền camera để chụp ảnh', 'Thiếu quyền');
      return;
    }
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        saveToPhotos: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        toast.error(result.errorMessage || 'Không thể mở camera', 'Lỗi');
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        setCapturedImage(asset);
      }
    } catch (error) {
      toast.error('Không thể truy cập camera', 'Lỗi');
    }
  };

  // Chọn ảnh từ thư viện
  const handlePickFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      if (result.didCancel) return;
      const asset = result.assets?.[0];
      if (asset) {
        setCapturedImage(asset);
      }
    } catch (error) {
      toast.error('Không thể mở thư viện ảnh', 'Lỗi');
    }
  };

  // Gửi ảnh lên Backend OCR (Tesseract.js local)
  const handleSubmit = async () => {
    if (!capturedImage?.uri) return;

    setIsProcessing(true);
    try {
      const response = await kycApi.recognizeID(capturedImage.uri, isFrontSide ? 'front' : 'back');

      if (response.success && response.data) {
        setOcrResult(response.data);

        if (isFrontSide) {
          // Mặt trước xong → hiện modal kết quả
          openResultModal(response.data);
        } else {
          // Mặt sau xong → gộp thông tin với mặt trước đã nhận dạng
          const frontIdInfo = route.params.frontIdInfo || {};
          const frontImageUri = route.params.frontImageUri || '';

          // Gộp dữ liệu: ưu tiên mặt trước cho CÁC TRƯỜNG CÁ NHÂN
          // Mặt sau thường chỉ có issue_date, issue_loc — không có name/dob/sex/...
          const mergedInfo = {
            // Thông tin cá nhân: luôn ưu tiên mặt trước
            id: frontIdInfo.id || response.data.id || '',
            name: frontIdInfo.name || response.data.name || '',
            dob: frontIdInfo.dob || response.data.dob || '',
            sex: frontIdInfo.sex || response.data.sex || '',
            nationality: frontIdInfo.nationality || response.data.nationality || 'Việt Nam',
            home: frontIdInfo.home || response.data.home || '',
            address: frontIdInfo.address || response.data.address || '',
            doe: frontIdInfo.doe || response.data.doe || '',
            type: frontIdInfo.type || response.data.type || 'CCCD',
            features: frontIdInfo.features || response.data.features || '',
            // Ngày cấp / Nơi cấp: thường nằm trên mặt sau
            issue_date: response.data.issue_date || frontIdInfo.issue_date || '',
            issue_loc: response.data.issue_loc || frontIdInfo.issue_loc || '',
            confidence: response.data.confidence || frontIdInfo.confidence,
          };

          navigation.navigate('KYCVerifyInfo', {
            idInfo: mergedInfo,
            frontImageUri: frontImageUri,
            backImageUri: capturedImage.uri
          });
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không nhận dạng được. Vui lòng chụp lại rõ hơn.', 'Lỗi nhận dạng');
    } finally {
      setIsProcessing(false);
    }
  };

  // Chụp lại
  const handleRetake = () => {
    setCapturedImage(null);
    setOcrResult(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.darkSurface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
          {isFrontSide ? 'MẶT TRƯỚC CCCD' : 'MẶT SAU CCCD'}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Instruction Card */}
      <View style={[styles.instructionCard, { backgroundColor: colors.darkSurface }]}>
        <View style={styles.instructionIconContainer}>
          <Ionicons name="information-circle" size={32} color={colors.accentBlue} />
        </View>
        <View style={styles.instructionTextContainer}>
          <Text style={[styles.instructionText, { color: colors.textWhite }]}>
            {isFrontSide
              ? 'Vui lòng chụp rõ mặt trước CMND/CCCD để hệ thống nhận diện'
              : 'Vui lòng chụp rõ mặt sau CMND/CCCD để hệ thống nhận diện'}
          </Text>
        </View>
      </View>

      {/* Image Preview Area */}
      <View style={styles.cameraWrapper}>
        <TouchableOpacity
          style={[styles.cameraContainer, { backgroundColor: colors.darkSurface }]}
          onPress={capturedImage ? undefined : handleCapture}
          activeOpacity={0.9}
        >
          {capturedImage?.uri ? (
            // Ảnh đã chụp
            <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} resizeMode="contain" />
          ) : (
            // Placeholder
            <View style={styles.cameraPlaceholder}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentBlue + '15' }]}>
                <Ionicons name="id-card-outline" size={56} color={colors.accentBlue} />
              </View>
              <Text style={[styles.cameraPlaceholderTitle, { color: colors.textWhite }]}>
                {isFrontSide ? 'Mặt trước CCCD' : 'Mặt sau CCCD'}
              </Text>
              <Text style={[styles.cameraPlaceholderSubtext, { color: colors.textGray }]}>
                Nhấn vào đây để mở camera hoặc chọn ảnh từ thư viện ở bên dưới
              </Text>
            </View>
          )}

          {/* Frame Overlay (khi chưa chụp) */}
          {!capturedImage && (
            <View style={styles.frameOverlay}>
              <View style={styles.frame}>
                <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.accentBlue }]} />
                <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.accentBlue }]} />
                <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.accentBlue }]} />
                <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.accentBlue }]} />
              </View>
            </View>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={colors.accentBlue} />
              <Text style={[styles.processingText, { color: colors.textWhite }]}>
                Đang xử lý hình ảnh...
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Progress */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, { backgroundColor: colors.accentBlue }]} />
            <View style={[styles.progressLine, { backgroundColor: isFrontSide ? colors.darkBorder : colors.accentBlue }]} />
            <View style={[styles.progressDot, { backgroundColor: !isFrontSide ? colors.accentBlue : colors.darkBorder }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textGray }]}>
            {isFrontSide ? 'Bước 1/2: Mặt trước' : 'Bước 2/2: Mặt sau'}
          </Text>
        </View>

        {capturedImage ? (
          // Đã chụp → xác nhận hoặc chụp lại
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.retakeButton, { borderColor: colors.darkBorder, backgroundColor: colors.darkSurface }]}
              onPress={handleRetake}
              disabled={isProcessing}
            >
              <Ionicons name="refresh" size={20} color={colors.textWhite} style={{ marginRight: 8 }} />
              <Text style={[styles.retakeButtonText, { color: colors.textWhite }]}>Chụp lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.accentBlue }]}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.textWhite} style={{ marginRight: 8 }} />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color={colors.textWhite} style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.submitButtonText, { color: colors.textWhite }]}>
                {isProcessing ? 'Đang xử lý...' : 'Sử dụng ảnh này'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Chưa chụp → nút chụp + chọn ảnh
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.galleryButton, { borderColor: colors.darkBorder, backgroundColor: colors.darkSurface }]}
              onPress={handlePickFromGallery}
            >
              <Ionicons name="images" size={20} color={colors.textWhite} style={{ marginRight: 8 }} />
              <Text style={[styles.galleryButtonText, { color: colors.textWhite }]}>Thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: colors.accentBlue }]}
              onPress={handleCapture}
            >
              <Ionicons name="camera" size={20} color={colors.textWhite} style={{ marginRight: 8 }} />
              <Text style={[styles.captureButtonTextLabel, { color: colors.textWhite }]}>Mở Camera</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* ─── Custom OCR Result Modal ─── */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeResultModal}
      >
        <Animated.View style={[styles.modalBackdrop, { opacity: fadeAnim }]}>
          <Animated.View
            style={[
              styles.modalCard,
              { backgroundColor: colors.darkSurface, transform: [{ translateY: slideAnim }] }
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: '#10b981' + '20' }]}>
                <Ionicons name="checkmark-circle" size={36} color="#10b981" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalTitle, { color: colors.textWhite }]}>Nhận dạng thành công!</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textGray }]}>Vui lòng kiểm tra thông tin bên dưới</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.modalDivider, { backgroundColor: colors.darkBorder }]} />

            {/* OCR Fields */}
            <ScrollView style={styles.modalFields} showsVerticalScrollIndicator={false}>
              {[
                { icon: 'card-outline',         label: 'Số CCCD',    value: pendingOcrData?.id,    color: '#60a5fa' },
                { icon: 'person-outline',        label: 'Họ và tên',  value: pendingOcrData?.name,  color: '#a78bfa' },
                { icon: 'calendar-outline',      label: 'Ngày sinh',  value: pendingOcrData?.dob,   color: '#34d399' },
                { icon: 'male-female-outline',   label: 'Giới tính',  value: pendingOcrData?.sex,   color: '#f59e0b' },
                { icon: 'time-outline',          label: 'Ngày hết hạn', value: pendingOcrData?.doe, color: '#fb923c' },
              ].map((row, i) => (
                <View key={i} style={[styles.modalRow, { borderBottomColor: colors.darkBorder }]}>
                  <View style={[styles.modalRowIcon, { backgroundColor: row.color + '18' }]}>
                    <Ionicons name={row.icon as any} size={18} color={row.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalRowLabel, { color: colors.textGray }]}>{row.label}</Text>
                    <Text
                      style={[
                        styles.modalRowValue,
                        { color: row.value ? colors.textWhite : '#ef4444' }
                      ]}
                    >
                      {row.value || 'Chưa đọc được'}
                    </Text>
                  </View>
                  {row.value
                    ? <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    : <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  }
                </View>
              ))}

              {/* Warning nếu thiếu trường quan trọng */}
              {(!pendingOcrData?.name || !pendingOcrData?.id || !pendingOcrData?.dob) && (
                <View style={styles.modalWarning}>
                  <Ionicons name="information-circle-outline" size={16} color="#fbbf24" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalWarningText, { color: '#fbbf24' }]}>
                    Một số trường chưa đọc được. Bạn có thể chỉnh sửa thủ công ở bước tiếp theo.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              {/* Chụp lại */}
              <TouchableOpacity
                style={[styles.modalBtnSecondary, { borderColor: colors.darkBorder, backgroundColor: 'rgba(255,255,255,0.05)' }]}
                onPress={() => {
                  closeResultModal();
                  // reset để chụp lại
                  setCapturedImage(null);
                  setOcrResult(null);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-reverse-outline" size={18} color={colors.textWhite} />
                <Text style={[styles.modalBtnSecondaryText, { color: colors.textWhite }]}>Chụp lại</Text>
              </TouchableOpacity>

              {/* Tiếp tục */}
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                onPress={() => {
                  closeResultModal();
                  if (capturedImage?.uri && pendingOcrData) {
                    navigation.replace('KYCCaptureID', {
                      side: 'back',
                      frontImageUri: capturedImage.uri,
                      frontIdInfo: pendingOcrData,
                    });
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-forward-circle-outline" size={18} color="#fff" />
                <Text style={styles.modalBtnPrimaryText}>Chụp mặt sau</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  closeButton: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
  headerSpacer: { width: 44 },

  instructionCard: {
    flexDirection: 'row',
    marginHorizontal: 20, marginVertical: 8,
    borderRadius: 16, padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionIconContainer: {
    marginRight: 16,
  },
  instructionTextContainer: {
    flex: 1,
  },
  instructionText: { fontSize: 14, lineHeight: 22, marginBottom: 10, fontWeight: '500' },
  apiBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, flexDirection: 'row', alignItems: 'center'
  },
  apiBadgeText: { fontSize: 12, fontWeight: '700' },

  cameraWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cameraContainer: {
    flex: 1, borderRadius: 24, overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: '#2c2c3e',
    justifyContent: 'center', alignItems: 'center',
  },
  cameraPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, width: '100%',
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  cameraPlaceholderTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  cameraPlaceholderSubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  capturedImage: { width: '100%', height: '100%', borderRadius: 24 },
  frameOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' },
  frame: { width: FRAME_WIDTH - 40, height: (FRAME_WIDTH - 40) * 0.63, position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40 },
  cornerTopLeft: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  cornerTopRight: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  cornerBottomLeft: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  cornerBottomRight: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 10, 15, 0.85)',
    justifyContent: 'center', alignItems: 'center', borderRadius: 24,
  },
  processingText: { marginTop: 20, fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

  bottomControls: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 10 },
  progressWrapper: { alignItems: 'center', marginBottom: 24 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressDot: { width: 12, height: 12, borderRadius: 6 },
  progressLine: { width: 60, height: 4, marginHorizontal: 8, borderRadius: 2 },
  progressText: { fontSize: 14, fontWeight: '600' },

  actionButtons: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16,
  },
  captureButton: {
    flex: 1, flexDirection: 'row', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  captureButtonTextLabel: { fontSize: 16, fontWeight: '700' },
  galleryButton: {
    flex: 1, flexDirection: 'row', height: 56, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  galleryButtonText: { fontSize: 16, fontWeight: '600' },
  retakeButton: {
    flex: 1, flexDirection: 'row', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  retakeButtonText: { fontSize: 16, fontWeight: '600' },
  submitButton: {
    flex: 1, flexDirection: 'row', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  submitButtonText: { fontSize: 16, fontWeight: '700' },

  // ─── OCR Result Modal ───
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 13,
  },
  modalDivider: {
    height: 1,
    marginBottom: 12,
  },
  modalFields: {
    maxHeight: 320,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRowLabel: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: '500',
  },
  modalRowValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  modalWarningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnPrimary: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBtnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default KYCCaptureIDScreen;
