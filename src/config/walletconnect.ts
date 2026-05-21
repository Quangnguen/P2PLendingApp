// ============================================================
// Ganache Demo Accounts — Mỗi account có 1000 ETH + 100,000 USDT
// Được mint tự động bởi deploy-ganache.ts (5 accounts đầu)
// Khi Ganache restart: cần copy lại địa chỉ từ Ganache UI
// ============================================================
export const GANACHE_ACCOUNTS = [
  {
    index: 0,
    address: '0x0BA0aF86A2D23e59D002c7084F77F4E4049F5D6C',
    label: 'Account #0 — Deployer',
    emoji: '🏦',
  },
  {
    index: 1,
    address: '0xef81849927B8195D8626B743A88d1911Fc50575F',
    label: 'Account #1 — Alice',
    emoji: '👩',
  },
  {
    index: 2,
    address: '0x45a978d98f3DFC61b334DAd3ffb3c35b10E314A0',
    label: 'Account #2 — Bob',
    emoji: '👨',
  },
  {
    index: 3,
    address: '0xC86196DD31B318477813e04D49AC3c301A138389',
    label: 'Account #3 — Carol',
    emoji: '👩‍💼',
  },
  {
    index: 4,
    address: '0x61559dbF48ef6632FdDaA5bad982365b254f1639',
    label: 'Account #4 — Dave',
    emoji: '👨‍💼',
  },
];

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
    // ✅ Physical device (WiFi): dùng IP máy tính
    // ✅ Physical device (USB): đổi thành 'http://localhost:7545' sau khi chạy adb reverse tcp:7545 tcp:7545
    // ❌ Emulator Android: đổi thành 'http://10.0.2.2:7545'
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
// SYNC: chạy `npx hardhat run scripts/deploy-ganache.ts` để lấy địa chỉ mới
// ============================================================
export const CONTRACT_ADDRESSES = {
  USDT: '0xBe537ceB7613Cf4B13Ac0d2e26Ec09270316530A',
  PRICE_ORACLE: '0x5931Be403F354Cf1A3E7c9118dFc632866E5CEDD',
  CREDIT_SCORE_ORACLE: '0x09e989bCF8077515709Fd5af48B3EFAf67e18Fd0',
  DEBT_TOKEN: '0x52804627e04f4e3593869Ec5d83950277ad6F2cD',
  COLLATERAL_MANAGER: '0xE233853Ff8b578f43c8f0B63Dd16cE1F3eAa3656',
  P2P_LENDING: '0xE4640003192F15d9bC1C57849a9C51419b2BC0CD',
};

