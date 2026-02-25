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
  // Sepolia Testnet (đang dùng để test)
  SEPOLIA: {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/03eb07775e554e7cb53082b6e55b0e2e',
    blockExplorer: 'https://sepolia.etherscan.io',
    // Format cho WalletConnect
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

// Chain đang sử dụng
export const CURRENT_CHAIN = SUPPORTED_CHAINS.SEPOLIA;

export const PROVIDER_CONFIG = {
  // Project ID từ WalletConnect Cloud
  projectId: process.env.WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  
  // Metadata của app
  metadata: WALLET_CONNECT_METADATA,
  
  // Các chain được hỗ trợ (format: ["eip155:11155111"])
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

export const CONTRACT_ADDRESSES = {
  USDT: '0xA61EB64B9D110A21254Fdb9BD7cDf4FE8f29B6D9',
  PRICE_ORACLE: '0x9E016fC5772eC8e5A5d0D743FbF340Bd5cE5813f',
  COLLATERAL_MANAGER: '0xe01a408C1d0e941d6cF29f1CBa8723ed7827379B',
  P2P_LENDING: '0x302dEb3eB093D20CA0759C11bFde6b4a83456841',
};
