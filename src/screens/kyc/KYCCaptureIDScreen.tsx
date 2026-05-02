import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import { kycApi, IDRecognitionResult } from '../../api/kyc.api';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  
  const [capturedImage, setCapturedImage] = useState<Asset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<IDRecognitionResult | null>(null);

  // Chụp ảnh bằng camera
  const handleCapture = async () => {
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
        Alert.alert('Lỗi', result.errorMessage || 'Không thể mở camera');
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        setCapturedImage(asset);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể truy cập camera');
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
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh');
    }
  };

  // Gửi ảnh lên FPT.AI OCR
  const handleSubmit = async () => {
    if (!capturedImage?.uri) return;

    setIsProcessing(true);
    try {
      const response = await kycApi.recognizeID(capturedImage.uri);

      if (response.success && response.data) {
        setOcrResult(response.data);

        if (isFrontSide) {
          // Mặt trước xong → chụp mặt sau
          Alert.alert(
            'Nhận dạng thành công! ✅',
            `Họ tên: ${response.data.name}\nSố CCCD: ${response.data.id}\nNgày sinh: ${response.data.dob}`,
            [
              {
                text: 'Tiếp tục chụp mặt sau',
                onPress: () => {
                  // Truyền cả uri và dữ liệu OCR mặt trước qua params
                  navigation.replace('KYCCaptureID', { 
                    side: 'back',
                    frontImageUri: capturedImage.uri,
                    frontIdInfo: response.data
                  });
                },
              },
            ],
          );
        } else {
          // Mặt sau xong → gộp thông tin với mặt trước đã nhận dạng
          const frontIdInfo = route.params.frontIdInfo || {};
          const frontImageUri = route.params.frontImageUri || '';
          
          // Gộp dữ liệu: ưu tiên mặt trước cho các trường cá nhân, mặt sau cho ngày cấp/nơi cấp
          const mergedInfo = {
            ...frontIdInfo,
            ...response.data,
            // Đảm bảo không bị ghi đè các trường quan trọng nếu mặt sau trả về rỗng
            name: frontIdInfo.name || response.data.name,
            id: frontIdInfo.id || response.data.id,
          };
          
          navigation.navigate('KYCVerifyInfo', {
            idInfo: mergedInfo,
            frontImageUri: frontImageUri,
            backImageUri: capturedImage.uri
          });
        }
      }
    } catch (error: any) {
      Alert.alert(
        'Lỗi nhận dạng',
        error.response?.data?.message || 'Không nhận dạng được. Vui lòng chụp lại rõ hơn.',
      );
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
        <Text style={[styles.instructionText, { color: colors.textWhite }]}>
          {isFrontSide
            ? '📸 Chụp rõ mặt trước CMND/CCCD → Gửi FPT.AI nhận dạng'
            : '📸 Chụp rõ mặt sau CMND/CCCD'}
        </Text>
        <View style={[styles.apiBadge, { backgroundColor: colors.greenSuccess + '20' }]}>
          <Text style={[styles.apiBadgeText, { color: colors.greenSuccess }]}>
            🤖 FPT.AI OCR (Thật)
          </Text>
        </View>
      </View>

      {/* Image Preview Area */}
      <View style={styles.cameraContainer}>
        {capturedImage?.uri ? (
          // Ảnh đã chụp
          <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} resizeMode="contain" />
        ) : (
          // Placeholder
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraPlaceholderText}>📷</Text>
            <Text style={[styles.cameraPlaceholderSubtext, { color: colors.textGray }]}>
              Nhấn chụp ảnh hoặc chọn từ thư viện
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
              <View style={styles.frameCenter}>
                <Text style={[styles.frameCenterText, { color: colors.textGray }]}>
                  {isFrontSide ? '🪪 Mặt trước CCCD' : '📱 Mặt sau CCCD'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
            <Text style={[styles.processingText, { color: colors.textWhite }]}>
              🤖 Đang gửi FPT.AI nhận dạng...
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, { backgroundColor: colors.accentBlue }]} />
          <View style={[styles.progressLine, { backgroundColor: colors.darkBorder }]} />
          <View style={[styles.progressDot, { backgroundColor: !isFrontSide ? colors.accentBlue : colors.darkSurface }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.textGray }]}>
          {isFrontSide ? 'Bước 1/2: Mặt trước' : 'Bước 2/2: Mặt sau'}
        </Text>

        {capturedImage ? (
          // Đã chụp → xác nhận hoặc chụp lại
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.retakeButton, { borderColor: colors.darkBorder }]}
              onPress={handleRetake}
            >
              <Text style={[styles.retakeButtonText, { color: colors.textGray }]}>🔄 Chụp lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.accentBlue }]}
              onPress={handleSubmit}
              disabled={isProcessing}
            >
              <Text style={[styles.submitButtonText, { color: colors.textWhite }]}>
                {isProcessing ? '⏳ Đang xử lý...' : '✅ Gửi nhận dạng'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Chưa chụp → nút chụp + chọn ảnh
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.galleryButton, { borderColor: colors.darkBorder }]}
              onPress={handlePickFromGallery}
            >
              <Text style={[styles.galleryButtonText, { color: colors.textGray }]}>🖼️ Thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.captureButton, { backgroundColor: colors.accentBlue }]}
              onPress={handleCapture}
            >
              <View style={[styles.captureButtonInner, { backgroundColor: colors.textWhite }]}>
                <Text style={styles.captureButtonText}>📸</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
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
  closeButton: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSpacer: { width: 40 },
  instructionCard: {
    marginHorizontal: 16, marginVertical: 8, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  instructionText: { fontSize: 14, textAlign: 'center', marginBottom: 8 },
  apiBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  apiBadgeText: { fontSize: 12, fontWeight: '600' },
  cameraContainer: {
    flex: 1, marginHorizontal: 16, marginVertical: 8, borderRadius: 16, overflow: 'hidden', position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center',
  },
  cameraPlaceholderText: { fontSize: 64, marginBottom: 16 },
  cameraPlaceholderSubtext: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  capturedImage: { flex: 1, width: '100%' },
  frameOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  frame: { width: FRAME_WIDTH, height: FRAME_HEIGHT, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30 },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  frameCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  frameCenterText: { fontSize: 14 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
  },
  processingText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
  bottomControls: { padding: 16, alignItems: 'center' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5 },
  progressLine: { width: 40, height: 2, marginHorizontal: 8 },
  progressText: { fontSize: 12, marginBottom: 16 },
  actionButtons: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', gap: 12,
  },
  captureButton: {
    width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center',
  },
  captureButtonInner: {
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
  },
  captureButtonText: { fontSize: 28 },
  galleryButton: {
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  galleryButtonText: { fontSize: 14, fontWeight: '600' },
  retakeButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1,
  },
  retakeButtonText: { fontSize: 14, fontWeight: '600' },
  submitButton: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  submitButtonText: { fontSize: 14, fontWeight: '600' },
});

export default KYCCaptureIDScreen;
