// src/screens/wallet/WalletScreen.tsx
import React, { useState } from 'react';
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
import { useWeb3 } from '../../providers';

const WalletScreen: React.FC = () => {
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

  const [refreshing, setRefreshing] = useState(false);

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
      Alert.alert('✅ Đã sao chép', 'Địa chỉ ví đã được sao chép');
    }
  };

  // Xác nhận ngắt kết nối
  const handleDisconnect = () => {
    Alert.alert(
      '🔌 Ngắt kết nối',
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
        '🦊 MetaMask chưa cài đặt',
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
            <Text style={styles.walletEmoji}>👛</Text>
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
              <Text style={styles.primaryButtonIcon}>🔗</Text>
              <Text style={styles.primaryButtonText}>Kết nối Ví</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.metamaskButton}
          onPress={openMetaMask}
          activeOpacity={0.8}>
          <Text style={styles.metamaskIcon}>🦊</Text>
          <Text style={styles.metamaskButtonText}>Mở MetaMask</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <View style={styles.instructionsCard}>
          <Text style={styles.instructionsTitle}>📋 Hướng dẫn</Text>
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
        <Text style={styles.balanceTitle}>💰 Số dư</Text>

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
          <Text>📋 Copy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={viewOnEtherscan}>
          <Text>🔍 Etherscan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={openMetaMask}>
          <Text>🦊 MetaMask</Text>
        </TouchableOpacity>
      </View>

      {/* Disconnect */}
      <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
        <Text style={styles.disconnectText}>🔌 Ngắt kết nối</Text>
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
  walletEmoji: {
    fontSize: 40,
  },
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
    marginBottom: 16,
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
    paddingHorizontal: 20,
    borderRadius: 10,
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
});

export default WalletScreen;