import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Note: Cần cài đặt react-native-camera hoặc expo-camera để sử dụng camera thật
// Đây là UI placeholder, bạn cần tích hợp camera library

type KYCCaptureIDScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCCaptureID'>;
  route: RouteProp<RootStackParamList, 'KYCCaptureID'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_WIDTH = SCREEN_WIDTH - 48;
const FRAME_HEIGHT = FRAME_WIDTH * 0.63; // Tỉ lệ chuẩn của CCCD

const KYCCaptureIDScreen: React.FC<KYCCaptureIDScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { side } = route.params;
  const isFrontSide = side === 'front';
  
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanStatus, setScanStatus] = useState(
    isFrontSide ? 'Căn chỉnh CCCD vào khung' : 'Đang tìm mã QR...'
  );

  const handleCapture = () => {
    setIsCapturing(true);
    
    // Simulate capture process
    setTimeout(() => {
      setIsCapturing(false);
      
      if (isFrontSide) {
        // Go to back side
        navigation.replace('KYCCaptureID', { side: 'back' });
      } else {
        // Go to preview/verify info
        navigation.navigate('KYCVerifyInfo');
      }
    }, 1500);
  };

  const handleSkipCamera = () => {
    // Demo mode - skip camera
    if (isFrontSide) {
      navigation.replace('KYCCaptureID', { side: 'back' });
    } else {
      navigation.navigate('KYCVerifyInfo');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.darkSurface }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
          {isFrontSide ? 'MẶT TRƯỚC' : 'MẶT SAU'}
        </Text>
        
        <TouchableOpacity
          style={[styles.flashButton, { backgroundColor: colors.darkSurface }]}
          onPress={() => setIsFlashOn(!isFlashOn)}
        >
          <Text style={styles.flashButtonText}>
            {isFlashOn ? '⚡' : '🔦'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instruction Card */}
      <View style={[styles.instructionCard, { backgroundColor: colors.darkSurface }]}>
        <Text style={[styles.instructionText, { color: colors.textWhite }]}>
          {isFrontSide
            ? 'Vui lòng đặt mặt trước của CCCD/CMND vào khung'
            : 'Đặt mặt sau để quét mã QR'
          }
        </Text>
        {!isFrontSide && (
          <View style={styles.scanStatusContainer}>
            <Text style={styles.scanStatusIcon}>🔍</Text>
            <Text style={[styles.scanStatusText, { color: colors.accentBlue }]}>{scanStatus}</Text>
          </View>
        )}
      </View>

      {/* Camera Preview Area */}
      <View style={styles.cameraContainer}>
        {/* Placeholder for camera - in real app, use react-native-camera */}
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.cameraPlaceholderText}>📷</Text>
          <Text style={[styles.cameraPlaceholderSubtext, { color: colors.textGray }]}>Camera Preview</Text>
        </View>

        {/* ID Frame Overlay */}
        <View style={styles.frameOverlay}>
          <View style={styles.frame}>
            {/* Corner markers */}
            <View style={[styles.corner, styles.cornerTopLeft, { borderColor: colors.accentBlue }]} />
            <View style={[styles.corner, styles.cornerTopRight, { borderColor: colors.accentBlue }]} />
            <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: colors.accentBlue }]} />
            <View style={[styles.corner, styles.cornerBottomRight, { borderColor: colors.accentBlue }]} />
            
            {/* Center hint */}
            <View style={styles.frameCenter}>
              <Text style={[styles.frameCenterText, { color: colors.textGray }]}>
                {isFrontSide ? '🪪 Mặt trước CCCD' : '📱 Mã QR mặt sau'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, { backgroundColor: colors.darkSurface }, isFrontSide && { backgroundColor: colors.accentBlue }]} />
          <View style={[styles.progressLine, { backgroundColor: colors.darkBorder }]} />
          <View style={[styles.progressDot, { backgroundColor: colors.darkSurface }, !isFrontSide && { backgroundColor: colors.accentBlue }]} />
        </View>
        
        <Text style={[styles.progressText, { color: colors.textGray }]}>
          {isFrontSide ? 'Bước 1/2: Mặt trước' : 'Bước 2/2: Mặt sau'}
        </Text>

        {/* Capture Button */}
        <TouchableOpacity
          style={[styles.captureButton, { backgroundColor: colors.accentBlue }, isCapturing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isCapturing}
        >
          <View style={[styles.captureButtonInner, { backgroundColor: colors.textWhite }]}>
            {isCapturing ? (
              <Text style={styles.captureButtonText}>⏳</Text>
            ) : (
              <Text style={styles.captureButtonText}>📸</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Demo skip button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipCamera}>
          <Text style={[styles.skipButtonText, { color: colors.textGray }]}>Bỏ qua (Demo)</Text>
        </TouchableOpacity>
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
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashButtonText: {
    fontSize: 18,
  },
  instructionCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    textAlign: 'center',
  },
  scanStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  scanStatusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  scanStatusText: {
    fontSize: 12,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    fontSize: 64,
    marginBottom: 16,
  },
  cameraPlaceholderSubtext: {
    fontSize: 16,
  },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  frameCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameCenterText: {
    fontSize: 14,
  },
  bottomControls: {
    padding: 20,
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotActive: {},
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  progressText: {
    fontSize: 12,
    marginBottom: 20,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonText: {
    fontSize: 28,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default KYCCaptureIDScreen;
