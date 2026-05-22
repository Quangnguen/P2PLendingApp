// src/screens/wallet/WalletScreen.tsx
import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
  Linking,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useWeb3 } from '../../providers';
import { GANACHE_ACCOUNTS } from '@/config/walletconnect';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '@/store';

const WalletScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  // Sử dụng hook mới
  const {
    connection,
    balances,
    connect,
    disconnect,
    refreshBalances,
    error,
    formatAddress,
    formatBalance,
  } = useWeb3();
  const toast = useToast();

  const [refreshing, setRefreshing] = useState(false);

  // Tự động refresh balance mỗi lần vào tab Ví
  // (Quan trọng: sau khi repay, ETH đã về on-chain nhưng app cần refresh để hiển thị)
  useFocusEffect(
    useCallback(() => {
      refreshBalances();
    }, [refreshBalances])
  );

  // Lấy network name
  const getNetworkName = () => {
    if (connection.chainId === 11155111) return 'Sepolia';
    if (connection.chainId === 1) return 'Ethereum';
    return 'Unknown';
  };

  // Copy địa chỉ ví
  const handleCopyAddress = () => {
    if (connection.address) {
      Clipboard.setString(connection.address);
      toast.success('Địa chỉ ví đã được sao chép', 'Đã sao chép');
    }
  };

  // Xác nhận ngắt kết nối
  const handleDisconnect = () => {
    Alert.alert(
      'Ngắt kết nối',
      'Bạn có chắc muốn ngắt kết nối ví không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Ngắt kết nối', onPress: disconnect, style: 'destructive' },
      ],
    );
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBalances();
    setRefreshing(false);
  };

  // Mở MetaMask
  const openMetaMask = async () => {
    const metamaskUrl = 'metamask://';
    const canOpen = await Linking.canOpenURL(metamaskUrl);
    if (canOpen) {
      await Linking.openURL(metamaskUrl);
    } else {
      Alert.alert(
        'MetaMask chưa cài đặt',
        'Bạn cần cài đặt MetaMask để sử dụng',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tải MetaMask',
            onPress: () =>
              Linking.openURL(
                'https://play.google.com/store/apps/details?id=io.metamask',
              ),
          },
        ],
      );
    }
  };

  // Xem trên Etherscan
  const viewOnEtherscan = () => {
    if (connection.address) {
      Linking.openURL(`https://sepolia.etherscan.io/address/${connection.address}`);
    }
  };

  // =====================
  // RENDER - DISCONNECTED
  // =====================
  if (!connection.isConnected) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <View style={styles.heroSection}>
          <View style={styles.walletIconLarge}>
            <Ionicons name="wallet-outline" size={40} color="#667eea" />
          </View>
          <Text style={styles.heroTitle}>Kết nối Ví của bạn</Text>
          <Text style={styles.heroSubtitle}>
            Kết nối ví MetaMask để giao dịch trên blockchain
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={connect}
          disabled={connection.isConnecting}
          activeOpacity={0.8}>
          {connection.isConnecting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="link-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Kết nối Ví</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.metamaskButton}
          onPress={openMetaMask}
          activeOpacity={0.8}>
          <Ionicons name="globe-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.metamaskButtonText}>Mở MetaMask</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="warning-outline" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          </View>
        )}

        <View style={styles.instructionsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="list-outline" size={18} color="#333" />
            <Text style={styles.instructionsTitle}>Hướng dẫn</Text>
          </View>
          <Text style={styles.instructionsText}>
            1. Mở MetaMask trên điện thoại{'\n'}
            2. Chuyển sang mạng Sepolia{'\n'}
            3. Copy địa chỉ ví{'\n'}
            4. Nhấn "Kết nối Ví" và paste
          </Text>
        </View>
      </ScrollView>
    );
  }

  // =====================
  // RENDER - CONNECTED
  // =====================
  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>{getNetworkName()}</Text>
        </View>
      </View>

      {/* Wallet Card */}
      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>Địa chỉ ví</Text>
        <TouchableOpacity onPress={handleCopyAddress}>
          <Text style={styles.addressText}>
            {formatAddress(connection.address)}
          </Text>
          <Text style={styles.fullAddress}>{connection.address}</Text>
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Ionicons name="cash-outline" size={20} color="#333" />
          <Text style={styles.balanceTitle}>Số dư</Text>
        </View>

        <View style={styles.tokenRow}>
          <Text style={styles.tokenName}>ETH</Text>
          <Text style={styles.tokenBalance}>
            {formatBalance(balances.eth, 6)} ETH
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.tokenRow}>
          <Text style={styles.tokenName}>USDT</Text>
          <Text style={styles.tokenBalance}>
            {formatBalance(balances.usdt, 2)} USDT
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopyAddress}>
          <Ionicons name="copy-outline" size={16} color="#333" />
          <Text style={{ marginLeft: 4 }}>Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={viewOnEtherscan}>
          <Ionicons name="search-outline" size={16} color="#333" />
          <Text style={{ marginLeft: 4 }}>Etherscan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={openMetaMask}>
          <Ionicons name="globe-outline" size={16} color="#333" />
          <Text style={{ marginLeft: 4 }}>MetaMask</Text>
        </TouchableOpacity>
      </View>

      {/* Switch Wallet (Ganache Demo) */}
      {(() => {
        const currentAccount = GANACHE_ACCOUNTS.find(
          a => a.address.toLowerCase() === connection.address?.toLowerCase()
        );
        return (
          <TouchableOpacity
            style={styles.switchWalletButton}
            onPress={() => navigation.navigate('WalletSelect')}
            activeOpacity={0.8}
          >
            <View style={styles.switchWalletEmoji}>
              <Ionicons name="wallet-outline" size={22} color="#60A5FA" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchWalletLabel}>
                {currentAccount?.label || 'Ví Ganache'}
              </Text>
              <Text style={styles.switchWalletSub}>Nhấn để đổi sang ví khác</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b8bb5" />
          </TouchableOpacity>
        );
      })()}

      {/* Disconnect */}
      <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="power-outline" size={18} color="#e74c3c" />
          <Text style={styles.disconnectText}>Ngắt kết nối</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  walletIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletEmoji: {},
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metamaskButton: {
    backgroundColor: '#f6851b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  metamaskIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  metamaskButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
  },
  instructionsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  instructionsText: {
    color: '#666',
    lineHeight: 22,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#28a745',
    marginRight: 6,
  },
  networkText: {
    color: '#155724',
    fontSize: 12,
  },
  walletCard: {
    backgroundColor: '#667eea',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 8,
  },
  addressText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  fullAddress: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tokenName: {
    fontSize: 16,
  },
  tokenBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disconnectButton: {
    marginHorizontal: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 10,
    marginBottom: 30,
  },
  disconnectText: {
    color: '#e74c3c',
  },
  switchWalletButton: {
    backgroundColor: '#1a2a3a',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#2a4a6a',
  },
  switchWalletEmoji: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e3a6b', justifyContent: 'center' as const, alignItems: 'center' as const },
  switchWalletLabel: { color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 2 },
  switchWalletSub: { color: '#6b8bb5', fontSize: 12 },
});

export default WalletScreen;