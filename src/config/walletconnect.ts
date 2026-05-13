export const WALLET_CONNECT_METADATA = {
  // Tên app - hiển thị trong MetaMask
  name: 'P2P Lending',
  
  // Mô tả ngắn về app
  description: 'Ứng dụng vay ngang hàng P2P trên blockchain',
  
  // URL website của app (có thể để placeholder)
  url: 'https://p2plending.app',
  
  // Icon app - hiển thị trong MetaMask
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
  
  // Deep link redirect sau khi kết nối
  // Format: your-app-scheme://
  redirect: {
    native: 'p2plending://',        // Custom URL scheme
    universal: 'https://p2plending.app',  // Universal link
  },
};

export const SUPPORTED_CHAINS = {
  // Ganache Local (đang dùng để dev/test)
  GANACHE: {
    id: 1337,
    name: 'Ganache Local',
    // Physical device (USB): cần chạy trước:
    //   adb reverse tcp:7545 tcp:7545
    //   adb reverse tcp:9000 tcp:9000
    // Emulator Android: đổi thành 'http://10.0.2.2:7545'
    rpcUrl: 'http://localhost:7545',
    blockExplorer: '', // Ganache không có block explorer
    wcNamespace: 'eip155:1337',
  },
  
  // Sepolia Testnet (backup - không dùng nữa)
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/03eb07775e554e7cb53082b6e55b0e2e',
    blockExplorer: 'https://sepolia.etherscan.io',
    wcNamespace: 'eip155:11155111',
  },
  
  // Ethereum Mainnet (để sau khi production)
  MAINNET: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/03eb07775e554e7cb53082b6e55b0e2e',
    blockExplorer: 'https://etherscan.io',
    wcNamespace: 'eip155:1',
  },
};

// ============================================================
// Chain đang sử dụng — ĐỔI Ở ĐÂY khi muốn switch network
// ============================================================
export const CURRENT_CHAIN = SUPPORTED_CHAINS.GANACHE;

export const PROVIDER_CONFIG = {
  // Project ID từ WalletConnect Cloud
  projectId: process.env.WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  
  // Metadata của app
  metadata: WALLET_CONNECT_METADATA,
  
  // Các chain được hỗ trợ (format: ["eip155:1337"])
  chains: [CURRENT_CHAIN.wcNamespace],
  
  // Các method mà app cần quyền sử dụng
  methods: [
    'eth_sendTransaction',    // Gửi giao dịch
    'eth_signTransaction',    // Ký giao dịch
    'personal_sign',          // Ký message
    'eth_sign',               // Ký data
    'eth_signTypedData',      // Ký typed data (EIP-712)
    'eth_signTypedData_v4',   // Ký typed data v4
  ],
  
  // Các events mà app muốn lắng nghe
  events: [
    'chainChanged',           // User đổi network
    'accountsChanged',        // User đổi account
    'disconnect',             // User ngắt kết nối
  ],
};

// ============================================================
// Contract Addresses — cập nhật sau khi deploy lên Ganache
// ============================================================
export const CONTRACT_ADDRESSES = {
  USDT: '0x857e0F68a924683409BC508d7442aAC6abe0b762',
  PRICE_ORACLE: '0xbd4394856c8b4Da879EfBA92cE2A10e4A6b88F64',
  COLLATERAL_MANAGER: '0xA2b99329a9a9085bEE555Aa0dd981d728909C080',
  P2P_LENDING: '0xFb895590BDeC93D62E2cd77FC837559a2eE5ef5E',
};
