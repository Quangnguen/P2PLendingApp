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
      // JsonRpcProvider kết nối đến node Ethereum qua HTTP
      // CURRENT_CHAIN.rpcUrl = URL của Infura
      return new ethers.providers.JsonRpcProvider(CURRENT_CHAIN.rpcUrl);
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
    } catch (err) {
      console.error('Error fetching balances:', err);
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
   * 
   * Mục đích: User không cần kết nối lại mỗi lần mở app
   */
  useEffect(() => {
    const loadSavedSession = async () => {
      try {
        // Đọc từ AsyncStorage
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (savedData) {
          // Parse JSON
          const { address, chainId } = JSON.parse(savedData);
          
          // Validate và normalize address
          let normalizedAddress: string;
          try {
            // getAddress sẽ throw error nếu address không hợp lệ
            normalizedAddress = ethers.utils.getAddress(address);
          } catch {
            // Address không hợp lệ, xóa session cũ
            await AsyncStorage.removeItem(STORAGE_KEY);
            return;
          }
          
          // Cập nhật state
          setConnection({
            address: normalizedAddress,
            chainId,
            isConnected: true,
            isConnecting: false,
          });
          
          // Fetch số dư
          const balanceData = await fetchBalances(normalizedAddress);
          setBalances({
            eth: balanceData.eth,
            usdt: balanceData.usdt,
            isLoading: false,
          });
        }
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
      /**
       * Phiên bản 1: Prompt nhập địa chỉ
       * 
       * Phiên bản 2 (sẽ làm): WalletConnect Modal
       * - Hiển thị QR code
       * - User quét bằng MetaMask
       * - Tự động kết nối
       */
      
      // Tạm thời dùng Alert.prompt (chỉ hoạt động trên iOS)
      // Android sẽ dùng Modal riêng
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
          'plain-text'
        );
      } else {
        // Android: Hiển thị hướng dẫn mở MetaMask
        Alert.alert(
          '🦊 Kết nối MetaMask',
          'Vui lòng:\n\n1. Mở MetaMask\n2. Copy địa chỉ ví\n3. Quay lại đây và paste',
          [
            {
              text: 'Mở MetaMask',
              onPress: async () => {
                const metamaskUrl = 'metamask://';
                const canOpen = await Linking.canOpenURL(metamaskUrl);
                if (canOpen) {
                  await Linking.openURL(metamaskUrl);
                } else {
                  Alert.alert('Lỗi', 'MetaMask chưa được cài đặt');
                }
                setConnection(prev => ({ ...prev, isConnecting: false }));
              },
            },
            {
              text: 'Paste địa chỉ',
              onPress: () => {
                // Sẽ handle bằng clipboard
                setConnection(prev => ({ ...prev, isConnecting: false }));
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
   * Sẽ implement đầy đủ ở Ngày 13
   * Hiện tại chỉ là placeholder
   */
//   const sendTransaction = useCallback(async (
//     tx: ethers.providers.TransactionRequest
//   ): Promise<string | null> => {
//     Alert.alert(
//       '⚠️ Chưa hỗ trợ',
//       'Tính năng ký giao dịch sẽ được thêm khi tích hợp WalletConnect đầy đủ'
//     );
//     return null;
//   }, []);

  // =====================
  // SIGN MESSAGE (Placeholder)
  // =====================
  
  /**
   * Ký message
   * 
   * Sẽ implement đầy đủ ở Ngày 13
   */
//   const signMessage = useCallback(async (message: string): Promise<string | null> => {
//     Alert.alert(
//       '⚠️ Chưa hỗ trợ',
//       'Tính năng ký message sẽ được thêm khi tích hợp WalletConnect đầy đủ'
//     );
//     return null;
//   }, []);

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
    // sendTransaction,
    // signMessage,
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