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
          
          // Gộp dữ liệu: ưu tiên mặt trước cho CÁC TRƯỜNG CÁ NHÂN
          // Mặt sau thường chỉ có issue_date, issue_loc — không có name/dob/sex/...
          const mergedInfo = {
            // Thông tin cá nhân: luôn ưu tiên mặt trước
            id:          frontIdInfo.id          || response.data.id          || '',
            name:        frontIdInfo.name        || response.data.name        || '',
            dob:         frontIdInfo.dob         || response.data.dob         || '',
            sex:         frontIdInfo.sex         || response.data.sex         || '',
            nationality: frontIdInfo.nationality || response.data.nationality || 'Việt Nam',
            home:        frontIdInfo.home        || response.data.home        || '',
            address:     frontIdInfo.address     || response.data.address     || '',
            doe:         frontIdInfo.doe         || response.data.doe         || '',
            type:        frontIdInfo.type        || response.data.type        || 'CCCD',
            features:    frontIdInfo.features    || response.data.features    || '',
            // Ngày cấp / Nơi cấp: thường nằm trên mặt sau
            issue_date:  response.data.issue_date || frontIdInfo.issue_date   || '',
            issue_loc:   response.data.issue_loc  || frontIdInfo.issue_loc    || '',
            confidence:  response.data.confidence || frontIdInfo.confidence,
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
            <View style={[styles.apiBadge, { backgroundColor: colors.greenSuccess + '20' }]}>
              <Ionicons name="shield-checkmark" size={14} color={colors.greenSuccess} style={{ marginRight: 4 }} />
              <Text style={[styles.apiBadgeText, { color: colors.greenSuccess }]}>
                  FPT.AI OCR 
              </Text>
            </View>
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
});

export default KYCCaptureIDScreen;
