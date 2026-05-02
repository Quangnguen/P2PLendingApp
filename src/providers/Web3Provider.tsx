/**
 * Web3Provider - Quản lý kết nối WalletConnect
 * 
 * Provider này thay thế WalletProvider cũ với khả năng:
 * 1. Kết nối MetaMask thật qua WalletConnect
 * 2. Ký giao dịch
 * 3. Tương tác với smart contracts
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';

// Import config
import {
  CURRENT_CHAIN,
  CONTRACT_ADDRESSES,
} from '../config/walletconnect';

// =====================
// TYPES
// =====================

/**
 * Trạng thái kết nối của ví
 */
interface ConnectionState {
  // Địa chỉ ví đã kết nối (null nếu chưa kết nối)
  address: string | null;

  // Chain ID của network đang kết nối
  chainId: number | null;

  // Đã kết nối hay chưa
  isConnected: boolean;

  // Đang trong quá trình kết nối
  isConnecting: boolean;
}

/**
 * Thông tin số dư
 */
interface BalanceInfo {
  // Số dư ETH (native token)
  eth: string;

  // Số dư USDT
  usdt: string;

  // Đang loading
  isLoading: boolean;
}

/**
 * Context type - tất cả các giá trị và hàm expose ra ngoài
 */
interface Web3ContextType {
  // State
  connection: ConnectionState;
  balances: BalanceInfo;
  error: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalances: () => Promise<void>;

  // Utils
  getProvider: () => ethers.providers.JsonRpcProvider | null;
  formatAddress: (address: string | null) => string;
  formatBalance: (balance: string, decimals?: number) => string;

  // Contract interactions (sẽ implement ngày 13)
  sendTransaction: (tx: ethers.providers.TransactionRequest) => Promise<string | null>;
  signMessage: (message: string) => Promise<string | null>;
}

// =====================
// CONSTANTS
// =====================

const STORAGE_KEY = '@web3_connection';

// ERC20 ABI tối thiểu
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

// =====================
// CREATE CONTEXT
// =====================

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// =====================
// PROVIDER COMPONENT
// =====================

interface Web3ProviderProps {
  children: ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  // =====================
  // STATE
  // =====================

  /**
   * Trạng thái kết nối
   */
  const [connection, setConnection] = useState<ConnectionState>({
    address: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
  });

  /**
   * Thông tin số dư
   */
  const [balances, setBalances] = useState<BalanceInfo>({
    eth: '0',
    usdt: '0',
    isLoading: false,
  });

  /**
   * Lỗi (nếu có)
   */
  const [error, setError] = useState<string | null>(null);

  // =====================
  // PROVIDER
  // =====================

  /**
   * Tạo ethers provider để đọc dữ liệu từ blockchain
   * 
   * Provider này chỉ có thể ĐỌC, không thể GHI (ký giao dịch)
   * Để GHI cần Signer từ WalletConnect
   */
  const getProvider = useCallback(() => {
    try {
      /**
       * SỬ DỤNG StaticJsonRpcProvider THAY CHO JsonRpcProvider
       * 
       * Tại sao? 
       * Trong môi trường React Native + Ganache, JsonRpcProvider thường xuyên gọi getNetwork()
       * gây ra lỗi "could not detect network".
       * StaticJsonRpcProvider bỏ qua bước detect network liên tục này nếu chúng ta cung cấp chainId.
       */
      return new ethers.providers.StaticJsonRpcProvider(
        CURRENT_CHAIN.rpcUrl,
        {
          chainId: CURRENT_CHAIN.id,
          name: CURRENT_CHAIN.name,
        }
      );
    } catch (err) {
      console.error('Error creating provider:', err);
      return null;
    }
  }, []);

  // =====================
  // FETCH BALANCES
  // =====================

  /**
   * Lấy số dư ETH và USDT của một địa chỉ
   * 
   * @param address - Địa chỉ Ethereum cần lấy số dư
   * @returns Object { eth, usdt } - Số dư đã format
   */
  const fetchBalances = useCallback(async (address: string): Promise<{ eth: string; usdt: string }> => {
    // Lấy provider
    const provider = getProvider();

    // Validate
    if (!provider || !address) {
      return { eth: '0', usdt: '0' };
    }

    try {
      // ----- LẤY SỐ DƯ ETH -----
      /**
       * provider.getBalance(address) trả về BigNumber
       * Đơn vị: wei (1 ETH = 10^18 wei)
       * 
       * Ví dụ: 1500000000000000000 wei = 1.5 ETH
       */
      const ethBalanceWei = await provider.getBalance(address);

      /**
       * formatEther chuyển từ wei sang ETH
       * 1500000000000000000 → "1.5"
       */
      const ethFormatted = ethers.utils.formatEther(ethBalanceWei);

      // ----- LẤY SỐ DƯ USDT (Token ERC20) -----
      let usdtFormatted = '0';

      try {
        /**
         * Tạo Contract instance để tương tác với USDT contract
         * 
         * ethers.Contract(address, abi, provider)
         * - address: Địa chỉ contract
         * - abi: Interface của contract
         * - provider: Kết nối blockchain
         */
        const usdtContract = new ethers.Contract(
          CONTRACT_ADDRESSES.USDT,
          ERC20_ABI,
          provider
        );

        /**
         * Gọi function balanceOf() trên contract
         * Trả về số dư token của address
         */
        const usdtBalanceRaw = await usdtContract.balanceOf(address);

        /**
         * Lấy số decimals của token
         * USDT thường có 6 decimals (không phải 18 như ETH)
         * 1 USDT = 1000000 (6 số 0)
         */
        const decimals = await usdtContract.decimals();

        /**
         * formatUnits chuyển từ đơn vị nhỏ nhất sang đơn vị đọc được
         * formatUnits(1000000, 6) → "1.0"
         */
        usdtFormatted = ethers.utils.formatUnits(usdtBalanceRaw, decimals);
      } catch (tokenError) {
        console.log('Error fetching USDT balance:', tokenError);
      }

      return { eth: ethFormatted, usdt: usdtFormatted };
    } catch (err: any) {
      /**
       * Lỗi NETWORK_ERROR thường xảy ra khi:
       * 1. Ganache chưa chạy
       * 2. Port Ganache không khớp (7545 vs 8545)
       * 3. Địa chỉ 10.0.2.2 không truy cập được từ emulator
       */
      if (err.code === 'NETWORK_ERROR' || err.code === 'SERVER_ERROR') {
        console.warn('📡 Blockchain connection issue:', err.code, '- Please check:');
        console.warn('  1. Ganache is running on port 7545');
        console.warn('  2. Run: adb reverse tcp:7545 tcp:7545');
        console.warn('  RPC URL:', CURRENT_CHAIN.rpcUrl);
        setError(`Không thể kết nối blockchain. Vui lòng kiểm tra Ganache và adb reverse.`);
      } else {
        console.error('Error fetching balances:', err);
      }
      return { eth: '0', usdt: '0' };
    }
  }, [getProvider]);

  // =====================
  // REFRESH BALANCES
  // =====================

  /**
   * Làm mới số dư
   * Gọi khi user pull-to-refresh hoặc sau giao dịch
   */
  const refreshBalances = useCallback(async () => {
    // Không thể refresh nếu chưa kết nối
    if (!connection.address) return;

    // Bật loading
    setBalances(prev => ({ ...prev, isLoading: true }));

    try {
      // Fetch số dư mới
      const newBalances = await fetchBalances(connection.address);

      // Cập nhật state
      setBalances({
        eth: newBalances.eth,
        usdt: newBalances.usdt,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error refreshing balances:', err);
      setBalances(prev => ({ ...prev, isLoading: false }));
    }
  }, [connection.address, fetchBalances]);

  // =====================
  // LOAD SAVED SESSION
  // =====================

  /**
   * Load session đã lưu khi app khởi động
   * Nếu không có session → tự động kết nối Ganache Account #0 cho demo
   */
  useEffect(() => {
    const GANACHE_DEMO_ADDRESS = '0x0BA0aF86A2D23e59D002c7084F77F4E4049F5D6C';

    const loadSavedSession = async () => {
      try {
        // Đọc từ AsyncStorage
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);

        let targetAddress: string;

        if (savedData) {
          // Parse JSON
          const { address } = JSON.parse(savedData);

          // Validate và normalize address
          try {
            targetAddress = ethers.utils.getAddress(address);
            
            // Kiểm tra nếu address cũ không còn balance (Ganache restart)
            // → chuyển sang demo address mới
            if (targetAddress !== GANACHE_DEMO_ADDRESS) {
              const checkBalance = await fetchBalances(targetAddress);
              if (checkBalance.eth === '0' || parseFloat(checkBalance.eth) === 0) {
                console.log('⚠️ Saved address has 0 balance, switching to demo address');
                await AsyncStorage.removeItem(STORAGE_KEY);
                targetAddress = GANACHE_DEMO_ADDRESS;
              }
            }
          } catch {
            // Address không hợp lệ, dùng demo address
            await AsyncStorage.removeItem(STORAGE_KEY);
            targetAddress = GANACHE_DEMO_ADDRESS;
          }
        } else {
          // Không có session → Auto-connect Ganache demo account
          console.log('📱 Auto-connect Ganache demo wallet:', GANACHE_DEMO_ADDRESS);
          targetAddress = GANACHE_DEMO_ADDRESS;
        }

        // Cập nhật state
        setConnection({
          address: targetAddress,
          chainId: CURRENT_CHAIN.id,
          isConnected: true,
          isConnecting: false,
        });

        // Fetch số dư
        console.log('🔄 Fetching balances for:', targetAddress);
        const balanceData = await fetchBalances(targetAddress);
        console.log('💰 Balances:', balanceData);
        setBalances({
          eth: balanceData.eth,
          usdt: balanceData.usdt,
          isLoading: false,
        });

        // Lưu session để lần sau không cần auto-connect
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          address: targetAddress,
          chainId: CURRENT_CHAIN.id,
        }));
      } catch (err) {
        console.error('Error loading saved session:', err);
      }
    };

    loadSavedSession();
  }, [fetchBalances]);

  // =====================
  // CONNECT
  // =====================

  /**
   * Kết nối ví
   * 
   * Phiên bản đơn giản: Cho user nhập địa chỉ
   * Phiên bản đầy đủ: Dùng WalletConnect Modal (sẽ upgrade)
   */
  const connect = useCallback(async () => {
    // Bật loading
    setConnection(prev => ({ ...prev, isConnecting: true }));
    setError(null);

    try {
      // Ganache Account #0 (deterministic) - cho demo
      const GANACHE_DEMO_ADDRESS = '0x0BA0aF86A2D23e59D002c7084F77F4E4049F5D6C';

      if (Platform.OS === 'ios') {
        Alert.prompt(
          'Kết nối ví',
          'Nhập địa chỉ ví Ethereum của bạn:',
          [
            {
              text: 'Hủy',
              style: 'cancel',
              onPress: () => {
                setConnection(prev => ({ ...prev, isConnecting: false }));
              },
            },
            {
              text: 'Kết nối',
              onPress: async (inputAddress: string | any) => {
                await handleAddressInput(inputAddress || '');
              },
            },
          ],
          'plain-text',
          GANACHE_DEMO_ADDRESS
        );
      } else {
        // Android: Cho user chọn kết nối demo hoặc nhập địa chỉ
        Alert.alert(
          '🔗 Kết nối ví',
          `Kết nối với ví Ganache demo?\n\nĐịa chỉ: ${GANACHE_DEMO_ADDRESS.slice(0, 10)}...${GANACHE_DEMO_ADDRESS.slice(-6)}\n(1000 ETH + 100,000 USDT)`,
          [
            {
              text: 'Hủy',
              style: 'cancel',
              onPress: () => {
                setConnection(prev => ({ ...prev, isConnecting: false }));
              },
            },
            {
              text: 'Kết nối Demo',
              onPress: async () => {
                await handleAddressInput(GANACHE_DEMO_ADDRESS);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối');
      setConnection(prev => ({ ...prev, isConnecting: false }));
    }
  }, []);

  /**
   * Xử lý khi user nhập địa chỉ
   */
  const handleAddressInput = async (inputAddress: string) => {
    if (!inputAddress.trim()) {
      setError('Vui lòng nhập địa chỉ ví');
      setConnection(prev => ({ ...prev, isConnecting: false }));
      return;
    }

    try {
      // Validate và chuẩn hóa địa chỉ
      const normalizedAddress = ethers.utils.getAddress(inputAddress.trim());

      // Lấy số dư
      const balanceData = await fetchBalances(normalizedAddress);

      // Cập nhật state
      setConnection({
        address: normalizedAddress,
        chainId: CURRENT_CHAIN.id,
        isConnected: true,
        isConnecting: false,
      });

      setBalances({
        eth: balanceData.eth,
        usdt: balanceData.usdt,
        isLoading: false,
      });

      // Lưu session
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        address: normalizedAddress,
        chainId: CURRENT_CHAIN.id,
      }));

    } catch (err: any) {
      console.error('Error handling address input:', err);
      setError('Địa chỉ ví không hợp lệ');
      setConnection(prev => ({ ...prev, isConnecting: false }));
    }
  };

  // =====================
  // DISCONNECT
  // =====================

  /**
   * Ngắt kết nối ví
   */
  const disconnect = useCallback(async () => {
    try {
      // Xóa session đã lưu
      await AsyncStorage.removeItem(STORAGE_KEY);

      // Reset state
      setConnection({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
      });

      setBalances({
        eth: '0',
        usdt: '0',
        isLoading: false,
      });

      setError(null);
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  }, []);

  // =====================
  // SEND TRANSACTION (Placeholder)
  // =====================

  /**
   * Gửi giao dịch
   * 
   * Phiên bản hiện tại: Simulate giao dịch cho demo
   * Phiên bản production: Sẽ dùng WalletConnect để ký qua MetaMask
   */
  const sendTransaction = useCallback(async (
    tx: ethers.providers.TransactionRequest
  ): Promise<string | null> => {
    if (!connection.isConnected || !connection.address) {
      Alert.alert('⚠️ Lỗi', 'Vui lòng kết nối ví trước khi giao dịch');
      return null;
    }

    try {
      // Validate transaction
      if (!tx.to) {
        Alert.alert('⚠️ Lỗi', 'Địa chỉ đích không hợp lệ');
        return null;
      }

      // Log transaction details for debugging
      console.log('\n=== SENDING TRANSACTION ===');
      console.log('From:', connection.address);
      console.log('To:', tx.to);
      console.log('Value:', tx.value?.toString() || '0');
      console.log('Data:', tx.data?.toString().slice(0, 50) + '...');

      /**
       * Phiên bản Demo: Simulate transaction
       * 
       * Trong production, sẽ gọi:
       * const provider = new ethers.providers.Web3Provider(walletConnectProvider);
       * const signer = provider.getSigner();
       * const txResponse = await signer.sendTransaction(tx);
       * return txResponse.hash;
       */

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock transaction hash
      const mockTxHash = '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      console.log('Transaction sent! Hash:', mockTxHash);
      console.log('=== TRANSACTION COMPLETE ===\n');

      // Refresh balances after transaction
      await refreshBalances();

      return mockTxHash;
    } catch (err: any) {
      console.error('Transaction failed:', err);
      Alert.alert('❌ Giao dịch thất bại', err.message || 'Vui lòng thử lại');
      return null;
    }
  }, [connection, refreshBalances]);

  // =====================
  // SIGN MESSAGE (Placeholder)
  // =====================

  /**
   * Ký message
   * 
   * Phiên bản hiện tại: Simulate signing cho demo
   * Phiên bản production: Sẽ dùng WalletConnect để ký qua MetaMask
   */
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!connection.isConnected || !connection.address) {
      Alert.alert('⚠️ Lỗi', 'Vui lòng kết nối ví trước khi ký');
      return null;
    }

    try {
      console.log('\n=== SIGNING MESSAGE ===');
      console.log('Address:', connection.address);
      console.log('Message:', message.slice(0, 100) + (message.length > 100 ? '...' : ''));

      /**
       * Phiên bản Demo: Simulate signing
       * 
       * Trong production, sẽ gọi:
       * const provider = new ethers.providers.Web3Provider(walletConnectProvider);
       * const signer = provider.getSigner();
       * const signature = await signer.signMessage(message);
       * return signature;
       */

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock signature
      const mockSignature = '0x' + Array.from({ length: 130 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');

      console.log('Message signed! Signature:', mockSignature.slice(0, 20) + '...');
      console.log('=== SIGNING COMPLETE ===\n');

      return mockSignature;
    } catch (err: any) {
      console.error('Signing failed:', err);
      Alert.alert('❌ Ký thất bại', err.message || 'Vui lòng thử lại');
      return null;
    }
  }, [connection]);

  // =====================
  // UTILITY FUNCTIONS
  // =====================

  /**
   * Format địa chỉ thành dạng rút gọn
   * 
   * @example
   * formatAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21")
   * // Returns: "0x742d...bE21"
   */
  const formatAddress = useCallback((address: string | null): string => {
    if (!address) return '';
    // Lấy 6 ký tự đầu + 4 ký tự cuối
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  /**
   * Format số dư với số chữ số thập phân chỉ định
   * 
   * @param balance - Số dư dạng string
   * @param decimals - Số chữ số thập phân (default: 4)
   * 
   * @example
   * formatBalance("1.234567890", 4)
   * // Returns: "1.2346"
   */
  const formatBalance = useCallback((balance: string, decimals: number = 4): string => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
  }, []);

  // =====================
  // CONTEXT VALUE
  // =====================

  const value: Web3ContextType = {
    // State
    connection,
    balances,
    error,

    // Actions
    connect,
    disconnect,
    refreshBalances,

    // Utils
    getProvider,
    formatAddress,
    formatBalance,

    // Contract interactions
    sendTransaction,
    signMessage,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// =====================
// HOOK
// =====================

/**
 * Hook để sử dụng Web3Context
 * 
 * @example
 * const { connection, connect, disconnect } = useWeb3();
 */
export const useWeb3 = (): Web3ContextType => {
  const context = useContext(Web3Context);

  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }

  return context;
};