import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { RouteProp } from '@react-navigation/native';
import { launchCamera, Asset } from 'react-native-image-picker';
import { kycApi } from '../../api/kyc.api';
import { Alert, ActivityIndicator, Image } from 'react-native';
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

  const [capturedSelfie, setCapturedSelfie] = useState<Asset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [instruction, setInstruction] = useState('Đưa khuôn mặt vào khung hình');
  const [progress, setProgress] = useState(0);

  // Animation values
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for glowing elements
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Sweeping scan line animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanAnim]);

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, CIRCLE_SIZE + 10],
  });

  // Chụp ảnh selfie
  const handleCaptureSelfie = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        cameraType: 'front',
        saveToPhotos: false,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        toast.error(result.errorMessage || 'Không thể mở camera', 'Lỗi');
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        setCapturedSelfie(asset);
        await performFaceMatch(asset.uri!);
      }
    } catch (error) {
      toast.error('Không thể truy cập camera', 'Lỗi');
    }
  };

  const performFaceMatch = async (selfieUri: string) => {
    setIsProcessing(true);
    setInstruction('Đang so khớp khuôn mặt...');
    setProgress(30);

    try {
      // Step 2: Match faces
      const response = await kycApi.matchFaces(frontImageUri, selfieUri);

      if (response.success) {
        setProgress(70);
        setInstruction('Đang hoàn tất KYC...');

        // Step 3: Complete KYC
        const completeRes = await kycApi.completeKYC();

        if (completeRes.success) {
          setProgress(100);
          Alert.alert('Thành công', 'Xác thực khuôn mặt thành công!', [
            { text: 'Tiếp tục', onPress: () => navigation.navigate('KYCSuccess') }
          ]);
        }
      } else {
        Alert.alert(
          'Xác thực thất bại',
          `Khuôn mặt không khớp (độ giống: ${response.data.similarity}%). Vui lòng chụp lại.`
        );
        setCapturedSelfie(null);
        setProgress(0);
        setInstruction('Thử lại: Đưa khuôn mặt vào khung hình');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xác thực', 'Lỗi');
      setCapturedSelfie(null);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoSkip = () => {
    navigation.navigate('KYCSuccess');
  };

  const getProgressColor = () => {
    if (progress === 0) return colors.textGray;
    return progress >= 100 ? colors.greenSuccess : colors.accentBlue;
  };

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
        {/* Instruction Text */}
        <View style={styles.instructionContainer}>
          <Text style={[styles.instructionTitle, { color: colors.textWhite }]}>{instruction}</Text>
          {!isProcessing && (
            <Text style={[styles.instructionSubtitle, { color: colors.textGray }]}>
              Đảm bảo khuôn mặt được chiếu sáng đều và không có vật cản
            </Text>
          )}
        </View>

        {/* Camera Preview with Face Frame */}
        <View style={styles.cameraContainer}>
          <View
            style={[
              styles.cameraPlaceholder,
              {
                backgroundColor: colors.darkSurface,
                borderColor: colors.accentBlue + '30',
                borderWidth: 2,
              }
            ]}
          >
            {capturedSelfie ? (
              <Image source={{ uri: capturedSelfie.uri }} style={styles.capturedSelfie} />
            ) : (
              <View style={styles.placeholderInner}>
                <Animated.View
                  style={[
                    styles.pulseCircle,
                    {
                      transform: [{ scale: pulseAnim }],
                      borderColor: colors.accentBlue + '15',
                    }
                  ]}
                />
                <Ionicons name="person-outline" size={72} color={colors.accentBlue} />
                <Text style={[styles.cameraPlaceholderText, { color: colors.textWhite }]}>Định vị khuôn mặt</Text>
                <Text style={[styles.cameraPlaceholderNote, { color: colors.textGray }]}>
                  Chụp ảnh selfie bằng camera trước
                </Text>
              </View>
            )}

            {/* Sweep Scan Line */}
            {!capturedSelfie && !isProcessing && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateY }],
                    backgroundColor: colors.accentBlue,
                    shadowColor: colors.accentBlue,
                  }
                ]}
              />
            )}

            {/* Processing Overlay inside circle */}
            {isProcessing && (
              <View style={[styles.processingOverlay, { backgroundColor: 'rgba(10, 15, 30, 0.7)' }]}>
                <ActivityIndicator size="large" color={colors.accentBlue} />
                <Text style={[styles.processingText, { color: colors.textWhite }]}>Đang phân tích...</Text>
              </View>
            )}
          </View>

          {/* Face Frame Overlay (Concentric circular border) */}
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
              <View style={[styles.faceOval, { borderColor: colors.accentBlue + '40' }]}>
                {progress > 0 && (
                  <Text style={[styles.progressText, { color: colors.accentBlue }]}>{progress}%</Text>
                )}
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Progress Bar */}
        {progress > 0 && (
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarBackground, { backgroundColor: colors.darkSurface }]}>
              <View
                style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: colors.accentBlue }]}
              />
            </View>
            <Text style={[styles.progressLabel, { color: colors.accentBlue }]}>Đang xác thực: {progress}%</Text>
          </View>
        )}

        {/* Instructions List */}
        {progress === 0 && (
          <View style={[styles.tipsContainer, { backgroundColor: colors.darkSurface }]}>
            <Text style={[styles.tipsTitle, { color: colors.textWhite }]}>Lưu ý:</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={[styles.tipText, { color: colors.textGray }]}>Đảm bảo đủ ánh sáng</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🚫</Text>
              <Text style={[styles.tipText, { color: colors.textGray }]}>Không đeo kính râm hoặc khẩu trang</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>📱</Text>
              <Text style={[styles.tipText, { color: colors.textGray }]}>Giữ điện thoại ngang tầm mắt</Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomContainer}>
        {!isProcessing ? (
          <>
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.accentBlue }]}
              onPress={handleCaptureSelfie}
            >
              <Text style={[styles.scanButtonText, { color: colors.textWhite }]}>Bắt đầu quét</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoSkip}
            >
              <Text style={[styles.demoButtonText, { color: colors.textGray }]}>
                Bỏ qua (Demo)
              </Text>
            </TouchableOpacity>
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  instructionContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  cameraContainer: {
    height: CIRCLE_SIZE + 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraPlaceholder: {
    width: CIRCLE_SIZE + 20,
    height: CIRCLE_SIZE + 20,
    borderRadius: (CIRCLE_SIZE + 20) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholderInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  pulseCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE - 20,
    height: CIRCLE_SIZE - 20,
    borderRadius: (CIRCLE_SIZE - 20) / 2,
    borderWidth: 2,
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
  cameraPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  cameraPlaceholderNote: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  capturedSelfie: {
    width: '100%',
    height: '100%',
    borderRadius: (CIRCLE_SIZE + 20) / 2,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
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
  progressText: {
    fontSize: 28,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 14,
  },
  tipsContainer: {
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  scanButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    marginTop: 12,
    padding: 12,
  },
  demoButtonText: {
    fontSize: 14,
  },
  scanningNote: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default KYCFaceScanScreen;
