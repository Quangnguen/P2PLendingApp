import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  Camera,
  useCameraPermission,
  useCameraDevice,
  usePhotoOutput,
  type PhotoFile,
} from 'react-native-vision-camera';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { kycApi } from '../../api/kyc.api';
import { useToast } from '@/store';

type KYCFaceScanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCFaceScan'>;
  route: RouteProp<RootStackParamList, 'KYCFaceScan'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.7;

const KYCFaceScanScreen: React.FC<KYCFaceScanScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { frontImageUri } = route.params;
  const toast = useToast();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const photoOutput = usePhotoOutput({ quality: 0.85 });

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [instruction, setInstruction] = useState('Đưa khuôn mặt vào khung hình');
  const [progress, setProgress] = useState(0);

  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, CIRCLE_SIZE + 10],
  });

  const handleCapture = async () => {
    if (isCapturing || isProcessing) return;
    setIsCapturing(true);
    setInstruction('Đang chụp...');

    try {
      // capturePhotoToFile: chụp và lưu thẳng vào temp file, không cần dispose
      const photoFile: PhotoFile = await photoOutput.capturePhotoToFile({}, {});
      const selfieUri = `file://${photoFile.filePath}`;
      setCapturedUri(selfieUri);
      setIsActive(false);
      await performFaceMatch(selfieUri);
    } catch (err: any) {
      console.error('[KYCFaceScan] capturePhotoToFile failed:', err?.message ?? err);
      toast.error('Không thể chụp ảnh. Vui lòng thử lại.', 'Lỗi');
      setInstruction('Đưa khuôn mặt vào khung hình');
    } finally {
      setIsCapturing(false);
    }
  };

  const performFaceMatch = async (selfieUri: string) => {
    setIsProcessing(true);
    setInstruction('Đang so khớp khuôn mặt...');
    setProgress(30);

    try {
      const response = await kycApi.matchFaces(frontImageUri, selfieUri);

      if (response.success) {
        setProgress(70);
        setInstruction('Đang hoàn tất KYC...');

        const completeRes = await kycApi.completeKYC();
        if (completeRes.success) {
          setProgress(100);
          setInstruction('Xác thực thành công!');
          setTimeout(() => navigation.replace('KYCSuccess'), 800);
        }
      } else {
        Alert.alert(
          'Xác thực thất bại',
          `Khuôn mặt không khớp (độ giống: ${response.data?.similarity ?? 0}%). Vui lòng chụp lại.`,
          [{ text: 'Thử lại', onPress: handleRetake }],
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực', 'Lỗi');
      handleRetake();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setIsActive(true);
    setProgress(0);
    setInstruction('Đưa khuôn mặt vào khung hình');
  };

  const getProgressColor = () => {
    if (progress === 0) return colors.textGray;
    return progress >= 100 ? colors.greenSuccess : colors.accentBlue;
  };

  // ── Không có camera trước ───────────────────────────────────────────────
  if (hasPermission && !device) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off-outline" size={64} color={colors.textGray} />
          <Text style={[styles.permissionTitle, { color: colors.textWhite }]}>Không tìm thấy camera trước</Text>
          <Text style={[styles.permissionText, { color: colors.textGray }]}>
            Thiết bị của bạn không hỗ trợ camera trước.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.darkSurface }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.permissionButtonText, { color: colors.textWhite }]}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Quyền camera chưa được cấp ──────────────────────────────────────────
  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={colors.accentBlue} />
          <Text style={[styles.permissionTitle, { color: colors.textWhite }]}>Cần quyền camera</Text>
          <Text style={[styles.permissionText, { color: colors.textGray }]}>
            Ứng dụng cần quyền truy cập camera để xác thực khuôn mặt.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.accentBlue }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, { color: colors.textWhite }]}>Cấp quyền camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.darkSurface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Xác thực khuôn mặt</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Instruction */}
        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionTitle, { color: colors.textWhite }]}>{instruction}</Text>
          {!isProcessing && (
            <Text style={[styles.instructionSubtitle, { color: colors.textGray }]}>
              Đảm bảo khuôn mặt được chiếu sáng đều và không có vật cản
            </Text>
          )}
        </View>

        {/* Camera/Preview area */}
        <View style={styles.cameraContainer}>
          <View style={[styles.cameraCircle, { borderColor: colors.accentBlue + '30' }]}>
            {capturedUri ? (
              // Ảnh đã chụp
              <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} />
            ) : device ? (
              <Camera
                device={device}
                isActive={isActive}
                outputs={[photoOutput]}
                mirrorMode="auto"
                style={StyleSheet.absoluteFill}
              />
            ) : null}

            {/* Scan line (chỉ khi đang xem live preview) */}
            {!capturedUri && !isCapturing && !isProcessing && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateY }],
                    backgroundColor: colors.accentBlue,
                    shadowColor: colors.accentBlue,
                  },
                ]}
              />
            )}

            {/* Processing overlay */}
            {(isCapturing || isProcessing) && (
              <View style={[styles.processingOverlay, { backgroundColor: 'rgba(10, 15, 30, 0.75)' }]}>
                <ActivityIndicator size="large" color={colors.accentBlue} />
                <Text style={[styles.processingText, { color: colors.textWhite }]}>Đang phân tích...</Text>
              </View>
            )}
          </View>

          {/* Face oval overlay */}
          <View style={styles.faceFrameContainer} pointerEvents="none">
            <Animated.View
              style={[
                styles.progressRing,
                {
                  borderColor: getProgressColor(),
                  transform: isProcessing ? [{ scale: pulseAnim }] : [],
                },
              ]}
            >
              <View style={[styles.faceOval, { borderColor: colors.accentBlue + '60' }]}>
                {progress > 0 && (
                  <Text style={[styles.progressText, { color: colors.accentBlue }]}>{progress}%</Text>
                )}
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Progress bar */}
        {progress > 0 && (
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: colors.darkSurface }]}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.accentBlue }]} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.accentBlue }]}>Đang xác thực: {progress}%</Text>
          </View>
        )}

        {/* Tips */}
        {!capturedUri && progress === 0 && (
          <View style={[styles.tipsContainer, { backgroundColor: colors.darkSurface }]}>
            <Text style={[styles.tipsTitle, { color: colors.textWhite }]}>Lưu ý:</Text>
            {[
              { icon: 'bulb-outline', text: 'Đảm bảo đủ ánh sáng' },
              { icon: 'ban-outline', text: 'Không đeo kính râm hoặc khẩu trang' },
              { icon: 'phone-portrait-outline', text: 'Giữ điện thoại ngang tầm mắt' },
            ].map((tip, i) => (
              <View key={i} style={styles.tipItem}>
                <Ionicons name={tip.icon as any} size={16} color={colors.accentBlue} style={styles.tipIcon} />
                <Text style={[styles.tipText, { color: colors.textGray }]}>{tip.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Bottom actions */}
      <View style={styles.bottomContainer}>
        {!isCapturing && !isProcessing ? (
          <>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: capturedUri ? colors.darkSurface : colors.accentBlue }]}
              onPress={capturedUri ? handleRetake : handleCapture}
            >
              <Ionicons
                name={capturedUri ? 'refresh' : 'camera'}
                size={20}
                color={colors.textWhite}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.captureButtonText, { color: colors.textWhite }]}>
                {capturedUri ? 'Chụp lại' : 'Chụp ảnh'}
              </Text>
            </TouchableOpacity>

            {__DEV__ && (
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => navigation.navigate('KYCSuccess')}
              >
                <Text style={[styles.demoButtonText, { color: colors.textGray }]}>
                  Bỏ qua (Demo)
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <Text style={[styles.scanningNote, { color: colors.textGray }]}>
            Vui lòng giữ nguyên tư thế và làm theo hướng dẫn
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },

  content: { flex: 1, paddingHorizontal: 16 },

  instructionContainer: { alignItems: 'center', marginVertical: 16 },
  instructionTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  instructionSubtitle: { fontSize: 14, textAlign: 'center' },

  // Camera area
  cameraContainer: {
    height: CIRCLE_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraCircle: {
    width: CIRCLE_SIZE + 20,
    height: CIRCLE_SIZE + 20,
    borderRadius: (CIRCLE_SIZE + 20) / 2,
    overflow: 'hidden',
    borderWidth: 2,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d1117',
  },

  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: { marginTop: 12, fontSize: 14, fontWeight: '600' },

  faceFrameContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: CIRCLE_SIZE + 32,
    height: CIRCLE_SIZE + 32,
    borderRadius: (CIRCLE_SIZE + 32) / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: (CIRCLE_SIZE + 20) * 0.8,
    height: (CIRCLE_SIZE + 20) * 0.8,
    borderRadius: ((CIRCLE_SIZE + 20) * 0.8) / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: { fontSize: 28, fontWeight: '700' },

  progressBarContainer: { marginTop: 24, alignItems: 'center' },
  progressBarBackground: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressLabel: { marginTop: 8, fontSize: 14 },

  tipsContainer: { marginTop: 24, borderRadius: 16, padding: 20 },
  tipsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  tipItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  tipIcon: { marginRight: 12, width: 24 },
  tipText: { fontSize: 14, flex: 1 },

  bottomContainer: { padding: 16, paddingBottom: 24, alignItems: 'center' },
  captureButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  captureButtonText: { fontSize: 16, fontWeight: '600' },
  demoButton: { marginTop: 12, padding: 12 },
  demoButtonText: { fontSize: 14 },
  scanningNote: { fontSize: 14, textAlign: 'center' },

  // Permission screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  permissionText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  permissionButtonText: { fontSize: 16, fontWeight: '600' },
});

export default KYCFaceScanScreen;
