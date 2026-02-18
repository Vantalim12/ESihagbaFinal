export type UserRole = 'SuperAdmin' | 'LGU' | 'BarangayTreasury' | 'Auditor';

export type TransactionStatus = 'Pending' | 'Confirmed' | 'Failed' | 'Cancelled';

export type TransactionType = 'Transfer' | 'Mint' | 'Burn' | 'Swap' | 'Stake' | 'Unstake' | 'BudgetDistribution' | 'Custom';

export type TokenType = 'ICP' | 'ICRC1' | 'Custom';

export type WalletType = 'InternetIdentity' | 'Ledger' | 'Plug' | 'Stoic' | 'Custom';

export interface User {
  id: string;
  principal: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: Date;
  active: boolean;
}

export interface Wallet {
  id: string;
  address: string;
  walletType: WalletType;
  owner: string;
  label?: string;
  createdAt: Date;
  active: boolean;
  totalTransactions: number;
  lastTransactionAt?: Date;
}

export interface Transaction {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  tokenType: TokenType;
  transactionType: TransactionType;
  status: TransactionStatus;
  blockHeight?: number;
  timestamp: Date;
  fee: number;
  memo?: string;
  createdBy: string;
  confirmedAt?: Date;
  failureReason?: string;
  budgetId?: number;
  category?: string;
}

export interface SystemStats {
  totalTransactions: number;
  totalWallets: number;
  totalUsers: number;
  pendingTransactions: number;
  confirmedTransactions: number;
  failedTransactions: number;
  totalVolume: number;
}

export interface BudgetStats {
  totalBudget: number;
  utilizedBudget: number;
  remainingBudget: number;
  utilizationPercentage: number;
  quarterlyBreakdown: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

export interface Barangay {
  id: string;
  name: string;
  allocatedBudget: number;
  utilizedBudget: number;
  utilizationPercentage: number;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  details: string;
  severity: 'success' | 'warning' | 'error' | 'info';
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
