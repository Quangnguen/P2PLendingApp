/**
 * WalletSelectScreen — Chọn ví Ganache Demo
 *
 * Hiển thị danh sách 5 Ganache accounts.
 * Mỗi account có địa chỉ, số dư ETH/USDT thật từ blockchain.
 * User chọn → ví được lưu AsyncStorage + MongoDB.
 *
 * ⚠️ Lưu ý: Cần chạy Ganache trước khi vào màn hình này.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme, useWeb3 } from '@/providers';
import { useToast } from '@/store';
import { RootStackParamList } from '@/navigation/types';
import { GANACHE_ACCOUNTS } from '@/config/walletconnect';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
};

interface AccountInfo {
  index: number;
  address: string;
  label: string;
  emoji: string;
  ethBalance: string;
  usdtBalance: string;
  isLoading: boolean;
}

const WalletSelectScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { connection, selectWallet, getProvider } = useWeb3();
  const toast = useToast();
  const [accounts, setAccounts] = useState<AccountInfo[]>(
    GANACHE_ACCOUNTS.map(a => ({
      ...a,
      ethBalance: '...',
      usdtBalance: '...',
      isLoading: true,
    }))
  );
  const [switching, setSwitching] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Đọc balance của tất cả accounts từ Ganache
  const loadAllBalances = useCallback(async () => {
    const { ethers } = await import('ethers');
    const provider = getProvider();
    if (!provider) {
      setAccounts(prev =>
        prev.map(a => ({ ...a, ethBalance: 'N/A', usdtBalance: 'N/A', isLoading: false }))
      );
      return;
    }

    // ERC20 ABI tối thiểu
    const ERC20_ABI = [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];

    // Lấy balance song song cho tất cả accounts
    const updated = await Promise.all(
      GANACHE_ACCOUNTS.map(async (account) => {
        try {
          const [ethWei, usdtRaw] = await Promise.all([
            provider.getBalance(account.address),
            (async () => {
              try {
                const { CONTRACT_ADDRESSES } = await import('@/config/walletconnect');
                const usdt = new ethers.Contract(CONTRACT_ADDRESSES.USDT, ERC20_ABI, provider);
                const [raw, dec] = await Promise.all([
                  usdt.balanceOf(account.address),
                  usdt.decimals(),
                ]);
                return ethers.utils.formatUnits(raw, dec);
              } catch {
                return '0';
              }
            })(),
          ]);

          return {
            ...account,
            ethBalance: parseFloat(ethers.utils.formatEther(ethWei)).toFixed(2),
            usdtBalance: parseFloat(usdtRaw).toFixed(0),
            isLoading: false,
          };
        } catch {
          return { ...account, ethBalance: 'Err', usdtBalance: 'Err', isLoading: false };
        }
      })
    );

    setAccounts(updated);
  }, [getProvider]);

  useEffect(() => {
    loadAllBalances();
  }, [loadAllBalances]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllBalances();
    setRefreshing(false);
  };

  const handleSelect = async (address: string, label: string) => {
    if (address.toLowerCase() === connection.address?.toLowerCase()) {
      toast.info(`Bạn đang dùng ví này rồi.\n${label}`, 'Đã kết nối');
      return;
    }

    Alert.alert(
      '🔄 Chuyển ví',
      `Chuyển sang ${label}?\n${address.slice(0, 10)}...${address.slice(-6)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSwitching(address);
            try {
              await selectWallet(address);
              toast.success(`Đã chuyển sang ${label}\nVí: ${address.slice(0, 10)}...${address.slice(-6)}`, 'Thành công');
              navigation.goBack();
            } catch (err: any) {
              toast.error(err.message || 'Không thể chuyển ví', 'Lỗi');
            } finally {
              setSwitching(null);
            }
          },
        },
      ]
    );
  };

  const isCurrentWallet = (address: string) =>
    address.toLowerCase() === connection.address?.toLowerCase();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.darkBackground }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textWhite} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textWhite }]}>
          Chọn ví Ganache
        </Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <LinearGradient
        colors={['#1e3a5f', '#0d2137']}
        style={styles.infoBanner}
      >
        <Ionicons name="information-circle" size={20} color={colors.accentBlue} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.infoText, { color: colors.textWhite }]}>
            Mỗi user nên chọn 1 ví riêng để demo P2P thật sự.
          </Text>
          <Text style={[styles.infoSubText, { color: colors.textGray }]}>
            Mỗi ví có 100,000 USDT + ETH từ Ganache deploy.
          </Text>
        </View>
      </LinearGradient>

      {/* Account List */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {accounts.map((account) => {
          const isCurrent = isCurrentWallet(account.address);
          const isSwitching = switching === account.address;

          return (
            <TouchableOpacity
              key={account.index}
              style={[
                styles.accountCard,
                {
                  backgroundColor: isCurrent
                    ? colors.accentBlue + '20'
                    : colors.darkSurface,
                  borderColor: isCurrent ? colors.accentBlue : colors.darkBorder,
                  borderWidth: isCurrent ? 2 : 1,
                },
              ]}
              onPress={() => handleSelect(account.address, account.label)}
              activeOpacity={0.8}
              disabled={!!switching}
            >
              {/* Left: Emoji + Label */}
              <View style={styles.accountLeft}>
                <View
                  style={[
                    styles.emojiWrapper,
                    {
                      backgroundColor: isCurrent
                        ? colors.accentBlue + '30'
                        : colors.darkBackground,
                    },
                  ]}
                >
                  <Text style={styles.emoji}>{account.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.accountLabel, { color: colors.textWhite }]}>
                      {account.label}
                    </Text>
                    {isCurrent && (
                      <View
                        style={[styles.activeBadge, { backgroundColor: colors.accentBlue }]}
                      >
                        <Text style={styles.activeBadgeText}>Đang dùng</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.addressText, { color: colors.textGray }]}
                    numberOfLines={1}
                  >
                    {account.address.slice(0, 18)}...{account.address.slice(-6)}
                  </Text>
                </View>
              </View>

              {/* Right: Balances + Action */}
              <View style={styles.accountRight}>
                {account.isLoading ? (
                  <ActivityIndicator size="small" color={colors.textGray} />
                ) : (
                  <View style={styles.balances}>
                    <Text style={[styles.balanceItem, { color: colors.textWhite }]}>
                      {account.usdtBalance !== 'Err' ? `${account.usdtBalance} USDT` : '—'}
                    </Text>
                    <Text style={[styles.balanceItem, { color: colors.textGray }]}>
                      {account.ethBalance !== 'Err' ? `${account.ethBalance} ETH` : '—'}
                    </Text>
                  </View>
                )}

                {isSwitching ? (
                  <ActivityIndicator size="small" color={colors.accentBlue} />
                ) : isCurrent ? (
                  <Ionicons name="checkmark-circle" size={24} color={colors.accentBlue} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textGray} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Hint */}
        <View style={styles.hint}>
          <Ionicons name="warning-outline" size={16} color={colors.yellowWarning} />
          <Text style={[styles.hintText, { color: colors.textGray }]}>
            Nếu balance hiển thị 0 hoặc lỗi, hãy đảm bảo:{'\n'}
            • Ganache đang chạy (port 7545){'\n'}
            • Đã chạy: <Text style={{ color: colors.accentBlue }}>adb reverse tcp:7545 tcp:7545</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
  },
  infoText: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  infoSubText: { fontSize: 12 },

  list: { paddingHorizontal: 20, paddingBottom: 40 },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  accountLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  emojiWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 22 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  accountLabel: { fontSize: 15, fontWeight: '600' },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  addressText: { fontSize: 12 },

  accountRight: {
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 90,
  },
  balances: { alignItems: 'flex-end' },
  balanceItem: { fontSize: 12, fontWeight: '600', marginBottom: 2 },

  hint: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  hintText: { fontSize: 12, lineHeight: 18, flex: 1 },
});

export default WalletSelectScreen;
