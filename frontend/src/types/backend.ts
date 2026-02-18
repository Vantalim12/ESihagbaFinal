// Type definitions for Blockchain Transaction Tracker Frontend

// Basic types
export type Result<T, E> = { ok: T } | { err: E };

// User and Authentication Types
export type Role = { Admin: null } | { User: null } | { Auditor: null };

export interface User {
  id: bigint;
  principal: any; // Principal type from @dfinity/principal
  role: Role;
  name: string;
  email: string;
  createdAt: bigint;
  isActive: boolean;
}

// Transaction Types
export type TransactionType =
  | { Transfer: null }
  | { Mint: null }
  | { Burn: null }
  | { Swap: null }
  | { Stake: null }
  | { Unstake: null }
  | { Other: string };

export type TransactionStatus =
  | { Pending: null }
  | { Confirmed: null }
  | { Failed: null }
  | { Cancelled: null };

export type TokenType = { ICP: null } | { ICRC1: string } | { Other: string };

export type BudgetCategory =
  | { Infrastructure: null }
  | { Healthcare: null }
  | { Education: null }
  | { SocialWelfare: null }
  | { PublicSafety: null }
  | { Administration: null }
  | { Environment: null }
  | { Other: string };

export interface Transaction {
  id: bigint;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: bigint;
  tokenType: TokenType;
  transactionType: TransactionType;
  status: TransactionStatus;
  blockHeight: bigint[] | [];
  timestamp: bigint;
  fee: bigint;
  memo: string[] | [];
  createdBy: any; // Principal type
  confirmedAt: bigint[] | [];
  failureReason: string[] | [];
  budgetId: bigint[] | [];
  category: BudgetCategory[] | [];
}

// Wallet/Address Types
export type WalletType =
  | { InternetIdentity: null }
  | { Ledger: null }
  | { Plug: null }
  | { Stoic: null }
  | { Other: string };

export interface Wallet {
  id: bigint;
  address: string;
  walletType: WalletType;
  owner: any; // Principal type
  walletLabel: string[] | [];
  createdAt: bigint;
  isActive: boolean;
  totalTransactions: bigint;
  lastTransactionAt: bigint[] | [];
}

// System Statistics
export interface SystemStats {
  totalTransactions: bigint;
  totalWallets: bigint;
  totalUsers: bigint;
  pendingTransactions: bigint;
  confirmedTransactions: bigint;
  failedTransactions: bigint;
  totalVolume: bigint;
}

// Paginated Response
export interface PaginatedTransactions {
  transactions: Transaction[];
  total: bigint;
  page: bigint;
  limit: bigint;
  hasMore: boolean;
}

// Backend Actor Interface
export interface BackendActor {
  whoami: () => Promise<any>;
  healthCheck: () => Promise<boolean>;
  registerUser: (
    role: Role,
    name: string,
    email: string
  ) => Promise<Result<User, string>>;
  createWallet: (
    address: string,
    walletType: WalletType,
    label: string[] | []
  ) => Promise<Result<Wallet, string>>;
  getWallet: (id: bigint) => Promise<Wallet[] | []>;
  getUserWallets: () => Promise<Wallet[]>;
  recordTransaction: (
    fromAddress: string,
    toAddress: string,
    amount: bigint,
    tokenType: TokenType,
    transactionType: TransactionType,
    hash: string[] | [],
    blockHeight: bigint[] | [],
    memo: string[] | [],
    budgetId: bigint[] | [],
    category: BudgetCategory[] | []
  ) => Promise<Result<Transaction, string>>;
  getTransaction: (id: bigint) => Promise<Transaction[] | []>;
  getAllTransactions: () => Promise<Transaction[]>;
  getTransactionsPaginated: (page: bigint, limit: bigint) => Promise<PaginatedTransactions>;
  getTransactionCount: () => Promise<bigint>;
  getTransactionsByAddress: (address: string) => Promise<Transaction[]>;
  getTransactionsByStatus: (
    status: TransactionStatus
  ) => Promise<Transaction[]>;
  confirmTransaction: (
    transactionId: bigint,
    blockHeight: bigint
  ) => Promise<Result<Transaction, string>>;
  failTransaction: (
    transactionId: bigint,
    reason: string
  ) => Promise<Result<Transaction, string>>;
  getSystemStats: () => Promise<SystemStats>;
}

