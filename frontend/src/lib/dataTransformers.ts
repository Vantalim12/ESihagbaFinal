/**
 * Utility functions to transform backend data (bigint, nanoseconds, variants)
 * into frontend-friendly formats (numbers, Date objects, strings)
 */

import type { 
  Transaction as FrontendTransaction, 
  Wallet as FrontendWallet,
  TransactionStatus,
  TransactionType,
  TokenType,
  WalletType
} from '@/types';

import type {
  Transaction as BackendTransaction,
  Wallet as BackendWallet,
  TransactionStatus as BackendTransactionStatus,
  TransactionType as BackendTransactionType,
  TokenType as BackendTokenType,
  WalletType as BackendWalletType,
} from '@/types/backend';

// Convert ICP nanoseconds timestamp to Date
export function nsToDate(ns: bigint): Date {
  // ICP timestamps are in nanoseconds, JS uses milliseconds
  return new Date(Number(ns / 1_000_000n));
}

// Extract variant key from backend variant type
function getVariantKey<T extends object>(variant: T): string {
  const keys = Object.keys(variant);
  return keys.length > 0 ? keys[0] : 'Unknown';
}

// Convert backend TransactionStatus variant to frontend string
export function transformTransactionStatus(status: BackendTransactionStatus): TransactionStatus {
  const key = getVariantKey(status);
  return key as TransactionStatus;
}

// Convert backend TransactionType variant to frontend string
export function transformTransactionType(txType: BackendTransactionType): TransactionType {
  const key = getVariantKey(txType);
  if (key === 'Other') {
    return 'Custom';
  }
  return key as TransactionType;
}

// Convert backend TokenType variant to frontend string
export function transformTokenType(tokenType: BackendTokenType): TokenType {
  const key = getVariantKey(tokenType);
  if (key === 'ICRC1') {
    return 'ICRC1';
  }
  if (key === 'Other') {
    return 'Custom';
  }
  return key as TokenType;
}

// Convert backend WalletType variant to frontend string
export function transformWalletType(walletType: BackendWalletType): WalletType {
  const key = getVariantKey(walletType);
  if (key === 'Other') {
    return 'Custom';
  }
  return key as WalletType;
}

// Get optional value from backend optional type (array with 0 or 1 elements)
function getOptional<T>(opt: T[] | []): T | undefined {
  return opt.length > 0 ? opt[0] : undefined;
}

// Transform a single backend transaction to frontend format
export function transformTransaction(tx: BackendTransaction): FrontendTransaction {
  const blockHeight = getOptional(tx.blockHeight as bigint[] | []);
  const confirmedAt = getOptional(tx.confirmedAt as bigint[] | []);
  const memo = getOptional(tx.memo as string[] | []);
  const failureReason = getOptional(tx.failureReason as string[] | []);
  
  // Handle new optional fields (budgetId and category)
  const budgetIdOpt = (tx as any).budgetId;
  const categoryOpt = (tx as any).category;
  const budgetId = budgetIdOpt && budgetIdOpt.length > 0 ? Number(budgetIdOpt[0]) : undefined;
  const category = categoryOpt && categoryOpt.length > 0 ? getVariantKey(categoryOpt[0]) : undefined;

  return {
    id: tx.id.toString(),
    hash: tx.hash,
    fromAddress: tx.fromAddress,
    toAddress: tx.toAddress,
    amount: Number(tx.amount), // Keep as raw amount (e8s for ICP)
    tokenType: transformTokenType(tx.tokenType),
    transactionType: transformTransactionType(tx.transactionType),
    status: transformTransactionStatus(tx.status),
    blockHeight: blockHeight !== undefined ? Number(blockHeight) : undefined,
    timestamp: nsToDate(tx.timestamp),
    fee: Number(tx.fee),
    memo,
    createdBy: tx.createdBy.toString(),
    confirmedAt: confirmedAt !== undefined ? nsToDate(confirmedAt) : undefined,
    failureReason,
    budgetId,
    category,
  };
}

// Transform array of backend transactions
export function transformTransactions(txs: BackendTransaction[]): FrontendTransaction[] {
  return txs.map(transformTransaction);
}

// Transform a single backend wallet to frontend format
export function transformWallet(wallet: BackendWallet): FrontendWallet {
  const label = getOptional(wallet.walletLabel as string[] | []);
  const lastTxAt = getOptional(wallet.lastTransactionAt as bigint[] | []);

  return {
    id: wallet.id.toString(),
    address: wallet.address,
    walletType: transformWalletType(wallet.walletType),
    owner: wallet.owner.toString(),
    label,
    createdAt: nsToDate(wallet.createdAt),
    active: wallet.isActive,
    totalTransactions: Number(wallet.totalTransactions),
    lastTransactionAt: lastTxAt !== undefined ? nsToDate(lastTxAt) : undefined,
  };
}

// Transform array of backend wallets
export function transformWallets(wallets: BackendWallet[]): FrontendWallet[] {
  return wallets.map(transformWallet);
}

// Format amount for display (convert e8s to human-readable)
export function formatTokenAmount(amount: number, tokenType: TokenType = 'ICP'): string {
  // ICP uses 8 decimal places (e8s)
  if (tokenType === 'ICP' || tokenType === 'ICRC1') {
    const value = amount / 100_000_000;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`;
    return value.toFixed(4);
  }
  return amount.toString();
}

// Format currency for PHP display
export function formatCurrencyPHP(amount: number): string {
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(0)}K`;
  return `₱${amount.toFixed(2)}`;
}

