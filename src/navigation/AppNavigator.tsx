import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAppDispatch, useAuth, checkAuth, hydrateConnectionsFromCache, loadConnections } from '../store';
import { useTheme } from '../providers';
import { RootStackParamList, BottomTabParamList } from './types';
import { Loading } from '../components/common';

// Screens
import { OnboardingScreen } from '../screens/onboarding';
import { AuthScreen, OtpVerificationScreen, LoginOtpVerificationScreen } from '../screens/auth';
import { HomeScreen } from '../screens/home';
import {
  LoansScreen,
  BrowseLoansScreen,
  CreateLoanScreen,
  LoanDetailScreen,
  ConfirmLoanRequestScreen,
  RepayScreen,
  FundLoanScreen,
  MyInvestmentsScreen,
  EditLoanScreen,
} from '../screens/loans';
import { ProfileScreen } from '../screens/profile';
import { WalletScreen } from '../screens/wallet';
import {
  LinkBankScreen,
  BankConnectionsScreen,
  LinkSuccessScreen,
  BankDetailScreen
} from '../screens/openbanking';
import { MessagesScreen, ChatDetailScreen } from '../screens/messages';
import {
  KYCVerificationScreen,
  KYCCaptureIDScreen,
  KYCVerifyInfoScreen,
  KYCFaceScanScreen,
  KYCSuccessScreen
} from '../screens/kyc';
import VNLinkBankScreen from '@/screens/openbanking/VNLinkBankScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// Tab Bar Icon Component - Gets colors from useTheme
const TabBarIcon: React.FC<{ icon: string; focused: boolean }> = ({
  icon,
  focused,
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.tabIconContainer,
        focused && { backgroundColor: colors.accentBlue + '20' },
      ]}
    >
      <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{icon}</Text>
    </View>
  );
};

// Main Tab Navigator
const MainTabs: React.FC = () => {
  const { colors } = useTheme();

  // Tạo các icon render functions một lần
  const renderHomeIcon = useCallback(
    ({ focused }: { focused: boolean }) => <TabBarIcon icon="🏠" focused={focused} />,
    []
  );
  const renderLoansIcon = useCallback(
    ({ focused }: { focused: boolean }) => <TabBarIcon icon="💰" focused={focused} />,
    []
  );
  const renderWalletIcon = useCallback(
    ({ focused }: { focused: boolean }) => <TabBarIcon icon="👛" focused={focused} />,
    []
  );
  const renderProfileIcon = useCallback(
    ({ focused }: { focused: boolean }) => <TabBarIcon icon="👤" focused={focused} />,
    []
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.darkSurface,
          borderTopColor: colors.darkBorder,
          borderTopWidth: 1,
          height: 80,
          paddingTop: 8,
          paddingBottom: 20,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: colors.accentBlue,
        tabBarInactiveTintColor: colors.textGray,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Trang chủ',
          tabBarIcon: renderHomeIcon,
        }}
      />
      <Tab.Screen
        name="LoansTab"
        component={LoansScreen}
        options={{
          tabBarLabel: 'Khoản vay',
          tabBarIcon: renderLoansIcon,
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletScreen}
        options={{
          tabBarLabel: 'Ví',
          tabBarIcon: renderWalletIcon,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Tài khoản',
          tabBarIcon: renderProfileIcon,
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAuth();
  const { colors, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = useCallback(async () => {
    const result = await dispatch(checkAuth());
    // Nếu user đã đăng nhập, load connections từ cache ngay lập tức
    if (result.payload) {
      dispatch(hydrateConnectionsFromCache());
      // Sau đó sync với API ở background
      dispatch(loadConnections());
    }
    setIsLoading(false);
  }, [dispatch]);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Custom Navigation Theme
  const navigationTheme: Theme = useMemo(
    () => ({
      dark: isDark,
      colors: {
        primary: colors.accentBlue,
        background: colors.darkBackground,
        card: colors.darkSurface,
        text: colors.textWhite,
        border: colors.darkBorder,
        notification: colors.redError,
      },
      fonts: DefaultTheme.fonts,
    }),
    [colors, isDark]
  );

  if (isLoading) {
    return <Loading fullScreen text="Đang tải..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.darkBackground },
          animation: 'slide_from_right',
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen
              name="OtpVerification"
              component={OtpVerificationScreen}
            />
            <Stack.Screen
              name="LoginOtpVerification"
              component={LoginOtpVerificationScreen}
            />
          </>
        ) : (
          // Main Stack
          <>
            <Stack.Screen name="Main" component={MainTabs} />

            {/* Loans Screens */}
            <Stack.Screen name="BrowseLoans" component={BrowseLoansScreen} />
            <Stack.Screen name="CreateLoan" component={CreateLoanScreen} />
            <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
            <Stack.Screen name="ConfirmLoanRequest" component={ConfirmLoanRequestScreen} />
            <Stack.Screen name="RepayLoan" component={RepayScreen} />
            <Stack.Screen name="FundLoan" component={FundLoanScreen} />
            <Stack.Screen name="EditLoan" component={EditLoanScreen} />
            <Stack.Screen name="MyInvestments" component={MyInvestmentsScreen} />

            {/* Open Banking Screens */}
            <Stack.Screen name="LinkBank" component={LinkBankScreen} />
            <Stack.Screen
              name="BankConnections"
              component={BankConnectionsScreen}
            />
            <Stack.Screen name="LinkSuccess" component={LinkSuccessScreen} />
            <Stack.Screen name="BankDetail" component={BankDetailScreen} />
            <Stack.Screen name="VNLinkBank" component={VNLinkBankScreen} />

            {/* Messages Screens */}
            <Stack.Screen name="Messages" component={MessagesScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />

            {/* KYC Screens */}
            <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
            <Stack.Screen name="KYCCaptureID" component={KYCCaptureIDScreen} />
            <Stack.Screen name="KYCVerifyInfo" component={KYCVerifyInfoScreen} />
            <Stack.Screen name="KYCFaceScan" component={KYCFaceScanScreen} />
            <Stack.Screen name="KYCSuccess" component={KYCSuccessScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
  tabIconActive: {
    fontSize: 24,
  },
});

export default AppNavigator;
