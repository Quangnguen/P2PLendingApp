import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '@/components/common';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadConnections, loadBanks } from '@/store/slices/openBankingSlice';
import { useTheme } from '@/providers';
import { RootStackParamList } from '@/navigation/types';
import { formatCurrency } from '@/utils/formatters';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

type BankConnectionsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BankConnections'>;
};

const BankConnectionsScreen: React.FC<BankConnectionsScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const { connections, banks, isLoading, error } = useAppSelector(state => state.openBanking);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(loadBanks());
    dispatch(loadConnections());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([dispatch(loadBanks()), dispatch(loadConnections())]);
    setRefreshing(false);
  };

  const getBankInfo = (bankId: string) => {
    return banks.find(b => b.id === bankId) || { name: 'Ngân hàng', shortName: 'Bank', logo: '', color: '#999' };
  };

  const totalBalance = connections.reduce((sum, item) => sum + item.balance, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBackground }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>Ví của tôi</Text>
        <TouchableOpacity onPress={() => navigation.navigate('LinkBank')} style={styles.addButton}>
          <Ionicons name="add-circle" size={32} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentBlue} />}
      >
        {/* Total Balance Card */}
        <LinearGradient
          colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.totalBalanceCard, { shadowColor: colors.accentBlue }]}
        >
          <Text style={styles.totalBalanceLabel}>Tổng số dư</Text>
          <Text style={styles.totalBalanceValue}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.totalBalanceSub}>Trên {connections.length} tài khoản liên kết</Text>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: colors.textWhite }]}>Tài khoản liên kết</Text>

        {error && <Text style={{ color: colors.redError, textAlign: 'center', marginBottom: 10 }}>{error}</Text>}

        {!isLoading && connections.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={colors.textGray} />
            <Text style={[styles.emptyTitle, { color: colors.textWhite }]}>Chưa có tài khoản nào</Text>
            <Button
              title="Liên kết ngay"
              onPress={() => navigation.navigate('LinkBank')}
              style={styles.emptyButton}
            />
          </View>
        )}

        {connections.map((account: any, index) => {
          const bankInfo = getBankInfo(account.bankId);
          // Alternate gradients for visual interest
          const gradients = [
            ['#0f2027', '#203a43', '#2c5364'],
            ['#373B44', '#4286f4'],
            ['#485563', '#29323c']
          ];
          const currentGradient = gradients[index % gradients.length];

          return (
            <TouchableOpacity
              key={account.id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('BankDetail', { connectionId: account.id })}
              style={styles.cardContainer}
            >
              <LinearGradient
                colors={currentGradient as any}
                style={styles.creditCard}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <View style={[styles.cardHeader, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                  <View style={styles.bankInfo}>
                    <View style={styles.cardLogoContainer}>
                      <Image source={{ uri: bankInfo.logo }} style={{ width: 30, height: 30 }} resizeMode="contain" />
                    </View>
                    <Text style={styles.cardBankName}>{bankInfo.shortName}</Text>
                  </View>
                  <Ionicons name="wifi" size={20} color="rgba(255,255,255,0.6)" />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardBalanceLabel}>Số dư khả dụng</Text>
                  <Text style={styles.cardBalance}>{formatCurrency(account.balance)}</Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardAccountName}>{account.accountName}</Text>
                  <Text style={styles.cardAccountNumber}>**** {account.accountNumber.slice(-4)}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  backButton: { width: 40, alignItems: 'flex-start' },
  addButton: { width: 40, alignItems: 'flex-end' },

  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  totalBalanceCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 30,
    elevation: 10,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  totalBalanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  totalBalanceValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  totalBalanceSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },

  cardContainer: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  creditCard: {
    borderRadius: 16,
    padding: 20,
    height: 200,
    justifyContent: 'space-between'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  bankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLogoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBankName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    justifyContent: 'center',
  },
  cardBalanceLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  cardBalance: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardAccountName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardAccountNumber: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 2,
  },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyTitle: { fontSize: 18, marginBottom: 20, marginTop: 10 },
  emptyButton: { minWidth: 150 },
});

export default BankConnectionsScreen;