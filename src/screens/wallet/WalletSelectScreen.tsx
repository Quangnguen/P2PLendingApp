import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme, useWeb3 } from '@/providers';
import { useToast } from '@/store';
import { RootStackParamList } from '@/navigation/types';
import { GANACHE_ACCOUNTS, CURRENT_CHAIN } from '@/config/walletconnect';

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

const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];

const WalletSelectScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { connection, selectWallet, getProvider } = useWeb3();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [accounts, setAccounts] = useState<AccountInfo[]>(
    GANACHE_ACCOUNTS.map(a => ({
      ...a,
      ethBalance: '...',
      usdtBalance: '...',
      isLoading: true,
    }))
  );
  const [selectedAddress, setSelectedAddress] = useState<string>(
    connection.address ?? GANACHE_ACCOUNTS[0].address
  );
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadAllBalances = useCallback(async () => {
    const { ethers } = await import('ethers');
    const provider = getProvider();
    if (!provider) {
      setAccounts(prev =>
        prev.map(a => ({ ...a, ethBalance: 'N/A', usdtBalance: 'N/A', isLoading: false }))
      );
      return;
    }

    const ERC20_ABI = [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
    ];

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

  const selectedAccount = accounts.find(a => a.address.toLowerCase() === selectedAddress.toLowerCase())
    ?? accounts[0];

  const isAlreadyConnected =
    selectedAddress.toLowerCase() === connection.address?.toLowerCase();

  const handleConnect = async () => {
    if (isAlreadyConnected) {
      toast.info(`Đã kết nối ví này rồi.`, 'Đã kết nối');
      navigation.goBack();
      return;
    }

    setConnecting(true);
    try {
      await selectWallet(selectedAddress);
      toast.success(
        `${selectedAccount?.label}\n${selectedAddress.slice(0, 10)}...${selectedAddress.slice(-6)}`,
        'Kết nối thành công'
      );
      navigation.goBack();
    } catch (err: any) {
      toast.error(err.message || 'Không thể kết nối ví', 'Lỗi');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.overlay}>
      <StatusBar backgroundColor="rgba(0,0,0,0.7)" barStyle="light-content" />

      {/* Tap outside to dismiss */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} />

      {/* Bottom sheet card */}
      <View
        style={[
          styles.sheet,
          { backgroundColor: colors.darkSurface, paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* Drag handle */}
        <View style={[styles.handle, { backgroundColor: colors.darkBorder }]} />

        {/* App connection header */}
        <View style={styles.appHeader}>
          <View style={[styles.appIconBox, { backgroundColor: '#1A3A6B' }]}>
            <Ionicons name="swap-horizontal" size={28} color="#3B82F6" />
          </View>
          <View style={styles.appTitleCol}>
            <Text style={[styles.appName, { color: colors.textWhite }]}>P2P Lending</Text>
            <Text style={[styles.appDomain, { color: colors.textGray }]}>
              p2plending.app muốn kết nối với ví của bạn
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: colors.darkBorder }]} />

        {/* Network badge */}
        <View style={styles.networkRow}>
          <Text style={[styles.sectionLabel, { color: colors.textGray }]}>Mạng</Text>
          <LinearGradient colors={['#0f2544', '#1a3a6b']} style={styles.networkBadge}>
            <View style={styles.networkDot} />
            <Text style={[styles.networkName, { color: '#60A5FA' }]}>
              {CURRENT_CHAIN.name}
            </Text>
            <Text style={[styles.chainId, { color: colors.textGray }]}>
              (Chain ID: {CURRENT_CHAIN.id})
            </Text>
          </LinearGradient>
        </View>

        {/* Selected account */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLabel, { color: colors.textGray }]}>Tài khoản</Text>
          <TouchableOpacity onPress={loadAllBalances}>
            <Ionicons name="refresh-outline" size={16} color={colors.textGray} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.accountRow,
            {
              backgroundColor: colors.darkBackground,
              borderColor: showAccountPicker ? '#3B82F6' : colors.darkBorder,
              borderWidth: 1.5,
            },
          ]}
          onPress={() => setShowAccountPicker(v => !v)}
          activeOpacity={0.8}
        >
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[selectedAccount?.index ?? 0] }]}>
            <Text style={styles.avatarEmoji}>{selectedAccount?.emoji}</Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <View style={styles.accountNameRow}>
              <Text style={[styles.accountName, { color: colors.textWhite }]}>
                {selectedAccount?.label}
              </Text>
              {isAlreadyConnected && (
                <View style={[styles.connectedBadge, { backgroundColor: '#10B98120' }]}>
                  <View style={styles.connectedDot} />
                  <Text style={styles.connectedText}>Đang kết nối</Text>
                </View>
              )}
            </View>
            <Text style={[styles.accountAddress, { color: colors.textGray }]}>
              {selectedAddress.slice(0, 10)}...{selectedAddress.slice(-8)}
            </Text>
            {selectedAccount?.isLoading ? (
              <ActivityIndicator size="small" color={colors.textGray} style={{ alignSelf: 'flex-start', marginTop: 2 }} />
            ) : (
              <Text style={[styles.accountBalance, { color: '#60A5FA' }]}>
                {selectedAccount?.usdtBalance !== 'Err' ? `${selectedAccount?.usdtBalance} USDT` : '—'}
                {'  '}
                <Text style={{ color: colors.textGray }}>
                  {selectedAccount?.ethBalance !== 'Err' ? `${selectedAccount?.ethBalance} ETH` : ''}
                </Text>
              </Text>
            )}
          </View>

          <Ionicons
            name={showAccountPicker ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textGray}
          />
        </TouchableOpacity>

        {/* Account picker dropdown */}
        {showAccountPicker && (
          <View style={[styles.picker, { backgroundColor: colors.darkBackground, borderColor: colors.darkBorder }]}>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
              {accounts.map(acc => {
                const isSelected = acc.address.toLowerCase() === selectedAddress.toLowerCase();
                const isCurrent = acc.address.toLowerCase() === connection.address?.toLowerCase();
                return (
                  <TouchableOpacity
                    key={acc.index}
                    style={[
                      styles.pickerItem,
                      isSelected && { backgroundColor: '#3B82F610' },
                    ]}
                    onPress={() => {
                      setSelectedAddress(acc.address);
                      setShowAccountPicker(false);
                    }}
                  >
                    <View style={[styles.pickerAvatar, { backgroundColor: AVATAR_COLORS[acc.index] }]}>
                      <Text style={{ fontSize: 14 }}>{acc.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.pickerLabel, { color: colors.textWhite }]}>
                        {acc.label}
                        {isCurrent && (
                          <Text style={{ color: '#10B981', fontSize: 11 }}> • Đang dùng</Text>
                        )}
                      </Text>
                      <Text style={[styles.pickerAddress, { color: colors.textGray }]}>
                        {acc.address.slice(0, 10)}...{acc.address.slice(-6)}
                      </Text>
                    </View>
                    <Text style={[styles.pickerBalance, { color: '#60A5FA' }]}>
                      {acc.isLoading ? '...' : acc.usdtBalance !== 'Err' ? `${acc.usdtBalance} USDT` : '—'}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#3B82F6" style={{ marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Permissions list */}
        <View style={[styles.permissionsBox, { backgroundColor: colors.darkBackground, borderColor: colors.darkBorder }]}>
          <Text style={[styles.permissionsTitle, { color: colors.textGray }]}>
            Ứng dụng sẽ có thể:
          </Text>
          {[
            { icon: 'eye-outline', text: 'Xem địa chỉ ví và số dư' },
            { icon: 'document-text-outline', text: 'Gửi yêu cầu giao dịch' },
            { icon: 'lock-closed-outline', text: 'Không thể truy cập private key' },
          ].map((item, i) => (
            <View key={i} style={styles.permissionItem}>
              <Ionicons name={item.icon as any} size={14} color="#10B981" />
              <Text style={[styles.permissionText, { color: colors.textGray }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btnCancel, { borderColor: colors.darkBorder }]}
            onPress={() => navigation.goBack()}
            disabled={connecting}
          >
            <Text style={[styles.btnCancelText, { color: colors.textWhite }]}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnConnect, { opacity: connecting ? 0.7 : 1 }]}
            onPress={handleConnect}
            disabled={connecting}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              style={styles.btnConnectGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {connecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnConnectText}>
                  {isAlreadyConnected ? 'Đã kết nối' : 'Kết nối'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },

  // App header
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  appIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitleCol: { flex: 1 },
  appName: { fontSize: 17, fontWeight: '700', marginBottom: 3 },
  appDomain: { fontSize: 13, lineHeight: 18 },

  divider: { height: 1, marginBottom: 16 },

  // Network
  networkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  networkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  networkName: { fontSize: 13, fontWeight: '600' },
  chainId: { fontSize: 11 },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Account row
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  accountNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  accountName: { fontSize: 15, fontWeight: '600' },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  connectedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981' },
  connectedText: { fontSize: 10, color: '#10B981', fontWeight: '600' },
  accountAddress: { fontSize: 12, marginBottom: 2 },
  accountBalance: { fontSize: 13, fontWeight: '600' },

  // Picker
  picker: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  pickerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerLabel: { fontSize: 13, fontWeight: '600', marginBottom: 1 },
  pickerAddress: { fontSize: 11 },
  pickerBalance: { fontSize: 12, fontWeight: '600' },

  // Permissions
  permissionsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
    gap: 6,
  },
  permissionsTitle: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 },
  permissionItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  permissionText: { fontSize: 13 },

  // Buttons
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCancelText: { fontSize: 16, fontWeight: '600' },
  btnConnect: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnConnectGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnConnectText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default WalletSelectScreen;
