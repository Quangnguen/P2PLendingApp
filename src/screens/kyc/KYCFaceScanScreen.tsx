import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type KYCFaceScanScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCFaceScan'>;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.7;

const KYCFaceScanScreen: React.FC<KYCFaceScanScreenProps> = ({ navigation }) => {
  const [progress, setProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [instruction, setInstruction] = useState('Đưa khuôn mặt vào khung hình');
  const [faceDetected, setFaceDetected] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (isScanning && progress < 100) {
      const timer = setInterval(() => {
        setProgress(prev => {
          const next = prev + 2;
          
          if (next === 20) {
            setInstruction('Nhìn thẳng vào camera');
          } else if (next === 40) {
            setInstruction('Từ từ quay đầu sang trái');
          } else if (next === 60) {
            setInstruction('Từ từ quay đầu sang phải');
          } else if (next === 80) {
            setInstruction('Ngửa đầu lên một chút');
          } else if (next >= 98) {
            setInstruction('Hoàn thành!');
            clearInterval(timer);
            
            setTimeout(() => {
              navigation.navigate('KYCSuccess');
            }, 500);
          }
          
          return Math.min(next, 100);
        });
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [isScanning, progress, navigation]);

  const handleStartScan = () => {
    setFaceDetected(true);
    setIsScanning(true);
    setInstruction('Đang quét khuôn mặt...');
  };

  const handleDemoSkip = () => {
    navigation.navigate('KYCSuccess');
  };

  const getProgressColor = () => {
    if (!faceDetected) return colors.textGray;
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
          {!isScanning && (
            <Text style={[styles.instructionSubtitle, { color: colors.textGray }]}>
              Đảm bảo khuôn mặt được chiếu sáng đều và không có vật cản
            </Text>
          )}
        </View>

        {/* Camera Preview with Face Frame */}
        <View style={styles.cameraContainer}>
          <View style={[styles.cameraPlaceholder, { backgroundColor: colors.darkSurface }]}>
            <Text style={styles.cameraPlaceholderIcon}>👤</Text>
            <Text style={[styles.cameraPlaceholderText, { color: colors.textWhite }]}>Camera Preview</Text>
            <Text style={[styles.cameraPlaceholderNote, { color: colors.textGray }]}>
              (Cần tích hợp react-native-camera)
            </Text>
          </View>

          {/* Face Frame Overlay */}
          <View style={styles.faceFrameContainer}>
            <View
              style={[
                styles.progressRing,
                { borderColor: getProgressColor() },
              ]}
            >
              <View style={[styles.faceOval, { borderColor: colors.accentBlue + '60' }]}>
                {faceDetected && (
                  <Text style={[styles.progressText, { color: colors.accentBlue }]}>{progress}%</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        {isScanning && (
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
        {!isScanning && (
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
        {!isScanning ? (
          <>
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.accentBlue }]}
              onPress={handleStartScan}
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
    height: CIRCLE_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraPlaceholder: {
    width: CIRCLE_SIZE + 20,
    height: CIRCLE_SIZE + 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  cameraPlaceholderText: {
    fontSize: 16,
    marginBottom: 4,
  },
  cameraPlaceholderNote: {
    fontSize: 11,
  },
  faceFrameContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceOval: {
    width: CIRCLE_SIZE * 0.65,
    height: CIRCLE_SIZE * 0.85,
    borderRadius: CIRCLE_SIZE * 0.35,
    borderWidth: 2,
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
