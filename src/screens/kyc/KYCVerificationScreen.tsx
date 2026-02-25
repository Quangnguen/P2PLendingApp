import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '../../components/common';
import { useTheme } from '../../providers';
import { RootStackParamList } from '../../navigation/types';
import Ionicons from 'react-native-vector-icons/Ionicons';

type KYCVerificationScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'KYCVerification'>;
};

interface StepInfo {
  stepNumber: number;
  title: string;
  description: string;
  icon: string;
  isActive: boolean;
}

const KYCVerificationScreen: React.FC<KYCVerificationScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();

  const steps: StepInfo[] = [
    {
      stepNumber: 1,
      title: 'Chụp ảnh giấy tờ',
      description: 'Chụp rõ nét mặt trước và mặt sau của CMND/CCCD hoặc Hộ chiếu gốc.',
      icon: '🪪',
      isActive: true,
    },
    {
      stepNumber: 2,
      title: 'Kiểm tra thông tin',
      description: 'Xác nhận lại các thông tin được trích xuất tự động từ giấy tờ của bạn.',
      icon: '✅',
      isActive: false,
    },
    {
      stepNumber: 3,
      title: 'Quét khuôn mặt',
      description: 'Thực hiện sinh trắc học khuôn mặt để đảm bảo chính chủ.',
      icon: '🤳',
      isActive: false,
    },
  ];

  const importantNotes = [
    'Sử dụng giấy tờ gốc, không chụp bản photo',
    'Đảm bảo ánh sáng đủ, không bị lóa',
    'Giấy tờ không bị mờ, rách, hoặc che khuất',
    'Thông tin trên giấy tờ phải còn hiệu lực',
  ];

  const renderStep = (step: StepInfo) => (
    <View
      key={step.stepNumber}
      style={[
        styles.stepCard,
        { backgroundColor: colors.darkSurface, borderColor: colors.darkBorder },
        step.isActive && { borderColor: colors.accentBlue + '50', backgroundColor: colors.accentBlue + '10' },
      ]}
    >
      <View style={styles.stepHeader}>
        <View style={[styles.stepNumber, { backgroundColor: colors.darkBackground }, step.isActive && { backgroundColor: colors.accentBlue }]}>
          <Text style={[styles.stepNumberText, { color: colors.textGray }, step.isActive && { color: colors.textWhite }]}>
            {step.stepNumber}
          </Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.textWhite }]}>{step.title}</Text>
          <Text style={[styles.stepDescription, { color: colors.textGray }]}>{step.description}</Text>
        </View>
        <Text style={styles.stepIcon}>{step.icon}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
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
        {/* Shield Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.accentBlue + '25' }]}>
          <Text style={styles.shieldIcon}>🛡️</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.textWhite }]}>Quy trình xác minh</Text>
        <Text style={[styles.subtitle, { color: colors.textGray }]}>
          Vui lòng chuẩn bị giấy tờ tuỳ thân và thực hiện các bước sau
        </Text>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          {steps.map(renderStep)}
        </View>

        {/* Important Notes */}
        <View style={[styles.notesContainer, { backgroundColor: colors.darkSurface }]}>
          <Text style={[styles.notesTitle, { color: colors.textWhite }]}>📋 Lưu ý quan trọng</Text>
          {importantNotes.map((note, index) => (
            <View key={index} style={styles.noteItem}>
              <Text style={[styles.noteBullet, { color: colors.accentBlue }]}>•</Text>
              <Text style={[styles.noteText, { color: colors.textGray }]}>{note}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.darkBackground }]}>
        <Button
          title="Tiếp tục"
          onPress={() => navigation.navigate('KYCCaptureID', { side: 'front' })}
        />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  shieldIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  stepCardActive: {},
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberActive: {},
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepNumberTextActive: {},
  stepContent: {
    flex: 1,
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  stepIcon: {
    fontSize: 24,
  },
  notesContainer: {
    borderRadius: 12,
    padding: 16,
  },
  notesTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  noteBullet: {
    marginRight: 8,
    fontSize: 14,
  },
  noteText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: 24,
  },
});

export default KYCVerificationScreen;
