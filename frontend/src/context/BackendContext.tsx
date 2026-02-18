import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from 'react';
import { createBackendActor } from '../lib/icp';
import { BackendActor, SystemStats, PaginatedTransactions } from '../types/backend';
import {
  transformTransactions,
  transformWallets
} from '../lib/dataTransformers';
import type { Transaction, Wallet } from '../types';
import { useAuth } from './AuthContext';

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface BudgetAllocation {
  id: number;
  category: string;
  barangayId: number | null;
  period: string;
  allocatedAmount: number;
  spentAmount: number;
  fiscalYear: number;
  description: string | null;
  status: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

export interface Barangay {
  id: number;
  name: string;
  code: string;
  walletAddress: string | null;
  captain: string | null;
  treasurer: string | null;
  population: number | null;
  highValueThreshold: number;
  lastWalletChange: number | null;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
}

export interface HighValueRequest {
  id: number;
  budgetId: number;
  requestedBy: string;
  amount: number;
  fromWallet: string;
  toWallet: string;
  reason: string;
  status: string;
  approvals: string[];
  requiredApprovals: number;
  createdAt: number;
  resolvedAt: number | null;
  rejectedBy: string | null;
  rejectionReason: string | null;
}

export interface WalletChangeRequest {
  id: number;
  barangayId: number;
  oldWallet: string | null;
  newWallet: string;
  requestedBy: string;
  reason: string;
  status: string;
  approvedBy: string | null;
  createdAt: number;
  resolvedAt: number | null;
}

export interface CanisterMetrics {
  totalTransactions: number;
  totalWallets: number;
  totalUsers: number;
  totalBalances: number;
  totalEvents: number;
  totalBudgets: number;
  totalAuditLogs: number;
  totalBarangays: number;
  totalHighValueRequests: number;
  totalWalletChangeRequests: number;
  timestamp: number;
}

export interface SecurityOverview {
  pendingHighValueRequests: number;
  pendingWalletChanges: number;
  approvedHighValueRequests: number;
  rejectedHighValueRequests: number;
  totalAuditLogs: number;
  recentAuditCount: number;
  timestamp: number;
}

export interface BackendEvent {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: number;
  endDate: number;
  status: string;
  category: string | null;
  budgetAllocated: number;
  budgetSpent: number;
  createdBy: string;
  createdAt: number;
}

interface BackendContextType {
  actor: BackendActor | null;
  isConnected: boolean;
  isLoading: boolean;
  systemStats: SystemStats | null;
  principal: string | null;

  // Data
  transactions: Transaction[];
  wallets: Wallet[];
  budgets: BudgetAllocation[];
  events: BackendEvent[];
  barangays: Barangay[];
  pagination: PaginationInfo | null;

  // Actions
  refreshStats: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  fetchWallets: () => Promise<void>;
  fetchBudgets: (fiscalYear?: number) => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchBarangays: () => Promise<void>;

  // Mutations
  registerUser: (role: 'SuperAdmin' | 'LGU' | 'BarangayTreasury' | 'Auditor', name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  createWallet: (address: string, walletType: string, label?: string) => Promise<{ success: boolean; error?: string }>;
  recordTransaction: (
    fromAddress: string,
    toAddress: string,
    amount: number,
    tokenType: string,
    transactionType: string,
    memo?: string,
    budgetId?: number,
    category?: string
  ) => Promise<{ success: boolean; error?: string }>;
  confirmTransaction: (transactionId: number, blockHeight: number) => Promise<{ success: boolean; error?: string }>;
  failTransaction: (transactionId: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  createBudgetAllocation: (category: string, amount: number, fiscalYear: number, description?: string, barangayId?: number, period?: string) => Promise<{ success: boolean; error?: string }>;
  createEvent: (title: string, description: string, location: string, startDate: number, endDate: number, budget: number, category?: string) => Promise<{ success: boolean; error?: string }>;
  updateEventStatus: (eventId: number, status: string) => Promise<{ success: boolean; error?: string }>;
  recordEventExpense: (eventId: number, amount: number, description: string) => Promise<{ success: boolean; error?: string }>;
  registerBarangay: (name: string, code: string, captain?: string, population?: number) => Promise<{ success: boolean; error?: string }>;
  linkBarangayWallet: (barangayId: number, walletAddress: string) => Promise<{ success: boolean; error?: string }>;
  distributeBudget: (budgetId: number, fromWalletAddress: string, memo?: string) => Promise<{ success: boolean; error?: string }>;

  // Phase 5: Budget Lifecycle
  approveBudget: (budgetId: number) => Promise<{ success: boolean; error?: string }>;
  cancelBudget: (budgetId: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  closePeriod: (fiscalYear: number, period: string) => Promise<{ success: boolean; count?: number; error?: string }>;
  rolloverBudget: (budgetId: number, newFiscalYear: number, newPeriod: string) => Promise<{ success: boolean; error?: string }>;

  // Phase 6: High-Value Multi-Sig
  highValueRequests: HighValueRequest[];
  walletChangeRequests: WalletChangeRequest[];
  fetchHighValueRequests: () => Promise<void>;
  fetchWalletChangeRequests: () => Promise<void>;
  approveHighValueRequest: (requestId: number) => Promise<{ success: boolean; error?: string }>;
  rejectHighValueRequest: (requestId: number, reason: string) => Promise<{ success: boolean; error?: string }>;
  setBarangayThreshold: (barangayId: number, threshold: number) => Promise<{ success: boolean; error?: string }>;

  // Phase 6: Wallet Recovery
  requestWalletChange: (barangayId: number, newWallet: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  approveWalletChange: (requestId: number) => Promise<{ success: boolean; error?: string }>;
  rejectWalletChange: (requestId: number, reason: string) => Promise<{ success: boolean; error?: string }>;

  // Phase 7: Monitoring
  canisterMetrics: CanisterMetrics | null;
  securityOverview: SecurityOverview | null;
  fetchCanisterMetrics: () => Promise<void>;
  fetchSecurityOverview: () => Promise<void>;

  error: string | null;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

const DEFAULT_PAGE_SIZE = 20;

export const BackendProvider = ({ children }: { children: ReactNode }) => {
  const { identity, isAuthLoading } = useAuth();
  const [actor, setActor] = useState<BackendActor | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [highValueRequests, setHighValueRequests] = useState<HighValueRequest[]>([]);
  const [walletChangeRequests, setWalletChangeRequests] = useState<WalletChangeRequest[]>([]);
  const [canisterMetrics, setCanisterMetrics] = useState<CanisterMetrics | null>(null);
  const [securityOverview, setSecurityOverview] = useState<SecurityOverview | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedRef = React.useRef<Record<string, number>>({});

  const initActor = useCallback(async () => {
    if (!identity) {
      setActor(null);
      setIsConnected(false);
      setPrincipal(null);
      setSystemStats(null);
      setTransactions([]);
      setWallets([]);
      setBudgets([]);
      setEvents([]);
      setBarangays([]);
      setPagination(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const backendActor = await createBackendActor(identity);
      setActor(backendActor as unknown as BackendActor);

      // Health check
      try {
        const health = await backendActor.healthCheck();
        if (health) {
          setIsConnected(true);
          setError(null);

          // Get principal
          const principalId = await backendActor.whoami();
          setPrincipal(principalId.toString());

          // Initial fetch
          const stats = await backendActor.getSystemStats() as SystemStats;
          setSystemStats(stats);

          // Fetch initial paginated data
          try {
            const paginatedResult = await (backendActor as any).getTransactionsPaginated(
              BigInt(1),
              BigInt(DEFAULT_PAGE_SIZE)
            );
            setTransactions(transformTransactions(paginatedResult.transactions as any[]));
            setPagination({
              total: Number(paginatedResult.total),
              page: Number(paginatedResult.page),
              limit: Number(paginatedResult.limit),
              hasMore: paginatedResult.hasMore,
            });
          } catch (paginationErr) {
            // Fallback to getAllTransactions if pagination not available
            console.warn("Pagination not available, using getAllTransactions:", paginationErr);
            const txData = await backendActor.getAllTransactions();
            setTransactions(transformTransactions(txData as any[]));
          }

        } else {
          setError("Health check failed");
        }
      } catch (healthErr) {
        console.warn("Health check error (might be offline or deploying):", healthErr);
        setError("Backend unreachable");
      }
    } catch (err) {
      console.error("Failed to connect to backend:", err);
      setError("Failed to create actor");
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [identity]);

  useEffect(() => {
    if (!isAuthLoading) {
      initActor();
    }
  }, [isAuthLoading, initActor]);

  const refreshStats = useCallback(async (force = false) => {
    if (!actor || !isConnected) return;
    const now = Date.now();
    if (!force && now - (lastFetchedRef.current['stats'] || 0) < 30_000) return;
    try {
      const stats = await actor.getSystemStats();
      setSystemStats(stats);
      lastFetchedRef.current['stats'] = now;
    } catch (err) {
      console.error("Error refreshing stats:", err);
    }
  }, [actor, isConnected]);

  const fetchTransactions = useCallback(async (page: number = 1, limit: number = DEFAULT_PAGE_SIZE) => {
    if (actor && isConnected) {
      try {
        // Try paginated endpoint first
        try {
          const paginatedResult = await (actor as any).getTransactionsPaginated(
            BigInt(page),
            BigInt(limit)
          );
          setTransactions(transformTransactions(paginatedResult.transactions as any[]));
          setPagination({
            total: Number(paginatedResult.total),
            page: Number(paginatedResult.page),
            limit: Number(paginatedResult.limit),
            hasMore: paginatedResult.hasMore,
          });
        } catch (paginationErr) {
          // Fallback to getAllTransactions
          console.warn("Using fallback getAllTransactions:", paginationErr);
          const txData = await actor.getAllTransactions();
          setTransactions(transformTransactions(txData as any[]));
          setPagination(null);
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
      }
    }
  }, [actor, isConnected]);

  const fetchWallets = useCallback(async () => {
    if (actor && isConnected) {
      try {
        const walletData = await actor.getUserWallets();
        setWallets(transformWallets(walletData as any[]));
      } catch (err) {
        console.error("Error fetching wallets:", err);
      }
    }
  }, [actor, isConnected]);

  const registerUser = useCallback(async (
    role: 'SuperAdmin' | 'LGU' | 'BarangayTreasury' | 'Auditor',
    name: string,
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }

    try {
      const roleVariant = { [role]: null } as any;
      const result = await actor.registerUser(roleVariant, name, email);

      if ('ok' in result) {
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error registering user:", err);
      return { success: false, error: err.message || "Registration failed" };
    }
  }, [actor, refreshStats]);

  const createWallet = useCallback(async (
    address: string,
    walletType: string,
    label?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }

    try {
      const walletTypeVariant = walletType === 'Custom'
        ? { Other: walletType }
        : { [walletType]: null } as any;
      const labelOpt = label ? [label] : [];

      const result = await actor.createWallet(address, walletTypeVariant, labelOpt as any);

      if ('ok' in result) {
        await fetchWallets();
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error creating wallet:", err);
      return { success: false, error: err.message || "Wallet creation failed" };
    }
  }, [actor, fetchWallets, refreshStats]);

  const recordTransaction = useCallback(async (
    fromAddress: string,
    toAddress: string,
    amount: number,
    tokenType: string,
    transactionType: string,
    memo?: string,
    budgetId?: number,
    category?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }

    try {
      const tokenTypeVariant = tokenType === 'Custom' || tokenType === 'ICRC1'
        ? { [tokenType === 'ICRC1' ? 'ICRC1' : 'Other']: tokenType }
        : { [tokenType]: null } as any;

      const txTypeVariant = transactionType === 'Custom'
        ? { Other: transactionType }
        : { [transactionType]: null } as any;

      // Convert amount to e8s (8 decimal places for ICP)
      const amountE8s = BigInt(Math.floor(amount * 100_000_000));

      // Budget and category optional params
      const budgetIdOpt = budgetId !== undefined ? [BigInt(budgetId)] : [];
      const categoryOpt = category
        ? [category === 'Other' ? { Other: 'Other' } : { [category]: null }]
        : [];

      const result = await actor.recordTransaction(
        fromAddress,
        toAddress,
        amountE8s,
        tokenTypeVariant,
        txTypeVariant,
        [], // hash (auto-generated)
        [], // blockHeight
        memo ? [memo] : [],
        budgetIdOpt as any,
        categoryOpt as any
      );

      if ('ok' in result) {
        await fetchTransactions();
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error recording transaction:", err);
      return { success: false, error: err.message || "Transaction recording failed" };
    }
  }, [actor, fetchTransactions, refreshStats]);

  const confirmTransaction = useCallback(async (
    transactionId: number,
    blockHeight: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }

    try {
      const result = await actor.confirmTransaction(BigInt(transactionId), BigInt(blockHeight));

      if ('ok' in result) {
        await fetchTransactions();
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error confirming transaction:", err);
      return { success: false, error: err.message || "Transaction confirmation failed" };
    }
  }, [actor, fetchTransactions, refreshStats]);

  const failTransaction = useCallback(async (
    transactionId: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }

    try {
      const result = await actor.failTransaction(BigInt(transactionId), reason);

      if ('ok' in result) {
        await fetchTransactions();
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error failing transaction:", err);
      return { success: false, error: err.message || "Transaction failure update failed" };
    }
  }, [actor, fetchTransactions, refreshStats]);

  // Budget Management
  const fetchBudgets = useCallback(async (fiscalYear?: number) => {
    if (actor && isConnected) {
      try {
        const yearOpt = fiscalYear !== undefined ? [BigInt(fiscalYear)] : [];
        const data = await (actor as any).getAllBudgetAllocations(yearOpt);
        const transformed: BudgetAllocation[] = (data as any[]).map((b: any) => {
          const categoryKey = Object.keys(b.category)[0];
          const periodKey = Object.keys(b.period)[0];
          const statusKey = Object.keys(b.status)[0];
          return {
            id: Number(b.id),
            category: categoryKey,
            barangayId: b.barangayId.length > 0 ? Number(b.barangayId[0]) : null,
            period: periodKey,
            allocatedAmount: Number(b.allocatedAmount),
            spentAmount: Number(b.spentAmount),
            fiscalYear: Number(b.fiscalYear),
            description: b.description.length > 0 ? b.description[0] : null,
            status: statusKey,
            createdBy: b.createdBy.toString(),
            createdAt: Number(b.createdAt),
            updatedAt: Number(b.updatedAt),
          };
        });
        setBudgets(transformed);
      } catch (err) {
        console.error("Error fetching budgets:", err);
      }
    }
  }, [actor, isConnected]);

  const createBudgetAllocation = useCallback(async (
    category: string,
    amount: number,
    fiscalYear: number,
    description?: string,
    barangayId?: number,
    period: string = 'Annual'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const categoryVariant = category === 'Other'
        ? { Other: 'Other' }
        : { [category]: null } as any;
      const amountBigInt = BigInt(Math.floor(amount * 100_000_000));
      const descOpt = description ? [description] : [];
      const barangayIdOpt = barangayId !== undefined ? [BigInt(barangayId)] : [];
      const periodVariant = { [period]: null } as any;

      const result = await (actor as any).createBudgetAllocation(
        categoryVariant,
        amountBigInt,
        BigInt(fiscalYear),
        descOpt,
        barangayIdOpt,
        periodVariant
      );

      if ('ok' in result) {
        await fetchBudgets(fiscalYear);
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error creating budget allocation:", err);
      return { success: false, error: err.message || "Budget creation failed" };
    }
  }, [actor, fetchBudgets, refreshStats]);

  // Event Management
  const fetchEvents = useCallback(async () => {
    if (actor && isConnected) {
      try {
        const data = await (actor as any).getAllEvents();
        const transformed: BackendEvent[] = (data as any[]).map((e: any) => {
          const statusKey = Object.keys(e.status)[0];
          const categoryKey = e.category.length > 0 ? Object.keys(e.category[0])[0] : null;
          return {
            id: Number(e.id),
            title: e.title,
            description: e.description,
            location: e.location,
            startDate: Number(e.startDate),
            endDate: Number(e.endDate),
            status: statusKey,
            category: categoryKey,
            budgetAllocated: Number(e.budgetAllocated),
            budgetSpent: Number(e.budgetSpent),
            createdBy: e.createdBy.toString(),
            createdAt: Number(e.createdAt),
          };
        });
        setEvents(transformed);
      } catch (err) {
        console.error("Error fetching events:", err);
      }
    }
  }, [actor, isConnected]);

  const createEvent = useCallback(async (
    title: string,
    description: string,
    location: string,
    startDate: number,
    endDate: number,
    budget: number,
    category?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const budgetBigInt = BigInt(Math.floor(budget * 100_000_000));
      const categoryOpt = category
        ? [category === 'Other' ? { Other: 'Other' } : { [category]: null }]
        : [];

      const result = await (actor as any).createEvent(
        title,
        description,
        location,
        BigInt(startDate),
        BigInt(endDate),
        budgetBigInt,
        categoryOpt
      );

      if ('ok' in result) {
        await fetchEvents();
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error creating event:", err);
      return { success: false, error: err.message || "Event creation failed" };
    }
  }, [actor, fetchEvents, refreshStats]);

  const updateEventStatus = useCallback(async (
    eventId: number,
    status: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const statusVariant = { [status]: null } as any;
      const result = await (actor as any).updateEventStatus(BigInt(eventId), statusVariant);

      if ('ok' in result) {
        await fetchEvents();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error updating event status:", err);
      return { success: false, error: err.message || "Event status update failed" };
    }
  }, [actor, fetchEvents]);

  const recordEventExpense = useCallback(async (
    eventId: number,
    amount: number,
    description: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const amountBigInt = BigInt(Math.floor(amount * 100_000_000));
      const result = await (actor as any).recordEventExpense(BigInt(eventId), amountBigInt, description);

      if ('ok' in result) {
        await fetchEvents();
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error recording event expense:", err);
      return { success: false, error: err.message || "Event expense recording failed" };
    }
  }, [actor, fetchEvents, refreshStats]);

  // Barangay Management
  const fetchBarangays = useCallback(async () => {
    if (actor && isConnected) {
      try {
        const data = await (actor as any).getAllBarangays();
        const transformed: Barangay[] = (data as any[]).map((b: any) => ({
          id: Number(b.id),
          name: b.name,
          code: b.code,
          walletAddress: b.walletAddress.length > 0 ? b.walletAddress[0] : null,
          captain: b.captain.length > 0 ? b.captain[0] : null,
          treasurer: b.treasurer.length > 0 ? b.treasurer[0].toString() : null,
          population: b.population.length > 0 ? Number(b.population[0]) : null,
          highValueThreshold: Number(b.highValueThreshold),
          lastWalletChange: b.lastWalletChange?.length > 0 ? Number(b.lastWalletChange[0]) : null,
          createdAt: Number(b.createdAt),
          updatedAt: Number(b.updatedAt),
          isActive: b.isActive,
        }));
        setBarangays(transformed);
      } catch (err) {
        console.error("Error fetching barangays:", err);
      }
    }
  }, [actor, isConnected]);

  const registerBarangay = useCallback(async (
    name: string,
    code: string,
    captain?: string,
    population?: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const captainOpt = captain ? [captain] : [];
      const populationOpt = population !== undefined ? [BigInt(population)] : [];
      const result = await (actor as any).registerBarangay(name, code, captainOpt, populationOpt);
      if ('ok' in result) {
        await fetchBarangays();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error registering barangay:", err);
      return { success: false, error: err.message || "Barangay registration failed" };
    }
  }, [actor, fetchBarangays]);

  const linkBarangayWallet = useCallback(async (
    barangayId: number,
    walletAddress: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const result = await (actor as any).linkBarangayWallet(BigInt(barangayId), walletAddress);
      if ('ok' in result) {
        await fetchBarangays();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error linking barangay wallet:", err);
      return { success: false, error: err.message || "Wallet linking failed" };
    }
  }, [actor, fetchBarangays]);

  const distributeBudget = useCallback(async (
    budgetId: number,
    fromWalletAddress: string,
    memo?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const memoOpt = memo ? [memo] : [];
      const result = await (actor as any).distributeBudget(BigInt(budgetId), fromWalletAddress, memoOpt);
      if ('ok' in result) {
        await fetchTransactions();
        await refreshStats();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error distributing budget:", err);
      return { success: false, error: err.message || "Budget distribution failed" };
    }
  }, [actor, fetchTransactions, refreshStats]);

  // Phase 5: Budget Lifecycle
  const approveBudget = useCallback(async (
    budgetId: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const result = await (actor as any).approveBudget(BigInt(budgetId));
      if ('ok' in result) {
        await fetchBudgets();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error approving budget:", err);
      return { success: false, error: err.message || "Budget approval failed" };
    }
  }, [actor, fetchBudgets]);

  const cancelBudget = useCallback(async (
    budgetId: number,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const result = await (actor as any).cancelBudget(BigInt(budgetId), reason);
      if ('ok' in result) {
        await fetchBudgets();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error cancelling budget:", err);
      return { success: false, error: err.message || "Budget cancellation failed" };
    }
  }, [actor, fetchBudgets]);

  const closePeriod = useCallback(async (
    fiscalYear: number,
    period: string
  ): Promise<{ success: boolean; count?: number; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const periodVariant = { [period]: null } as any;
      const result = await (actor as any).closePeriod(BigInt(fiscalYear), periodVariant);
      if ('ok' in result) {
        await fetchBudgets();
        return { success: true, count: Number(result.ok) };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error closing period:", err);
      return { success: false, error: err.message || "Period closure failed" };
    }
  }, [actor, fetchBudgets]);

  const rolloverBudget = useCallback(async (
    budgetId: number,
    newFiscalYear: number,
    newPeriod: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!actor) {
      return { success: false, error: "Not connected to backend" };
    }
    try {
      const periodVariant = { [newPeriod]: null } as any;
      const result = await (actor as any).rolloverBudget(BigInt(budgetId), BigInt(newFiscalYear), periodVariant);
      if ('ok' in result) {
        await fetchBudgets();
        return { success: true };
      } else {
        return { success: false, error: result.err };
      }
    } catch (err: any) {
      console.error("Error rolling over budget:", err);
      return { success: false, error: err.message || "Budget rollover failed" };
    }
  }, [actor, fetchBudgets]);

  // Phase 6: High-Value Multi-Sig
  const fetchHighValueRequests = useCallback(async () => {
    if (actor && isConnected) {
      try {
        const data = await (actor as any).getAllHighValueRequests();
        const transformed: HighValueRequest[] = (data as any[]).map((r: any) => ({
          id: Number(r.id),
          budgetId: Number(r.budgetId),
          requestedBy: r.requestedBy.toString(),
          amount: Number(r.amount),
          fromWallet: r.fromWallet,
          toWallet: r.toWallet,
          reason: r.reason,
          status: Object.keys(r.status)[0],
          approvals: (r.approvals || []).map((p: any) => p.toString()),
          requiredApprovals: Number(r.requiredApprovals),
          createdAt: Number(r.createdAt),
          resolvedAt: r.resolvedAt?.length > 0 ? Number(r.resolvedAt[0]) : null,
          rejectedBy: r.rejectedBy?.length > 0 ? r.rejectedBy[0].toString() : null,
          rejectionReason: r.rejectionReason?.length > 0 ? r.rejectionReason[0] : null,
        }));
        setHighValueRequests(transformed);
      } catch (err) {
        console.error("Error fetching high-value requests:", err);
      }
    }
  }, [actor, isConnected]);

  const fetchWalletChangeRequests = useCallback(async () => {
    if (actor && isConnected) {
      try {
        const data = await (actor as any).getAllWalletChangeRequests();
        const transformed: WalletChangeRequest[] = (data as any[]).map((r: any) => ({
          id: Number(r.id),
          barangayId: Number(r.barangayId),
          oldWallet: r.oldWallet?.length > 0 ? r.oldWallet[0] : null,
          newWallet: r.newWallet,
          requestedBy: r.requestedBy.toString(),
          reason: r.reason,
          status: Object.keys(r.status)[0],
          approvedBy: r.approvedBy?.length > 0 ? r.approvedBy[0].toString() : null,
          createdAt: Number(r.createdAt),
          resolvedAt: r.resolvedAt?.length > 0 ? Number(r.resolvedAt[0]) : null,
        }));
        setWalletChangeRequests(transformed);
      } catch (err) {
        console.error("Error fetching wallet change requests:", err);
      }
    }
  }, [actor, isConnected]);

  const approveHighValueRequest = useCallback(async (requestId: number): Promise<{ success: boolean; error?: string }> => {
    if (!actor) return { success: false, error: "Not connected to backend" };
    try {
      const result = await (actor as any).approveHighValueRequest(BigInt(requestId));
      if ('ok' in result) {
        await fetchHighValueRequests();
        await fetchBudgets();
        return { success: true };
      }
      return { success: false, error: result.err };
    } catch (err: any) {
      return { success: false, error: err.message || "Approval failed" };
    }
  }, [actor, fetchHighValueRequests, fetchBudgets]);

  const rejectHighValueRequest = useCallback(async (requestId: number, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!actor) return { success: false, error: "Not connected to backend" };
    try {
      const result = await (actor as any).rejectHighValueRequest(BigInt(requestId), reason);
      if ('ok' in result) {
        await fetchHighValueRequests();
        return { success: true };
      }
      return { success: false, error: result.err };
    } catch (err: any) {
      return { success: false, error: err.message || "Rejection failed" };
    }
  }, [actor, fetchHighValueRequests]);

  const setBarangayThreshold = useCallback(async (barangayId: number, threshold: number): Promise<{ success: boolean; error?: string }> => {
    if (!actor) return { success: false, error: "Not connected to backend" };
    try {
      const result = await (actor as any).setBarangayThreshold(BigInt(barangayId), BigInt(threshold));
      if ('ok' in result) {
        await fetchBarangays();
        return { success: true };
      }
      return { success: false, error: result.err };
    } catch (err: any) {
      return { success: false, error: err.message || "Threshold update failed" };
    }
  }, [actor, fetchBarangays]);

  // Phase 6: Wallet Recovery
  const requestWalletChange = useCallback(async (barangayId: number, newWallet: string, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!actor) return { success: false, error: "Not connected to backend" };
    try {
      const result = await (actor as any).requestWalletChange(BigInt(barangayId), newWallet, reason);
      if ('ok' in result) {
        await fetchWalletChangeRequests();
        return { success: true };
      }
      return { success: false, error: result.err };
    } catch (err: any) {
      return { success: false, error: err.message || "Wallet change request failed" };
    }
  }, [actor, fetchWalletChangeRequests]);

  const approveWalletChange = useCallback(async (requestId: number): Promise<{ success: boolean; error?: string }> => {
    if (!actor) return { success: false, error: "Not connected to backend" };
    try {
      const result = await (actor as any).approveWalletChange(BigInt(requestId));
      if ('ok' in result) {
        await fetchWalletChangeRequests();
        await fetchBarangays();
        return { success: true };
      }
      return { success: false, error: result.err };
    } catch (err: any) {
      return { success: false, error: err.message || "Wallet change approval failed" };
    }
  }, [actor, fetchWalletChangeRequests, fetchBarangays]);

  const rejectWalletChange = useCallback(async (requestId: number, reason: string): Promise<{ success: boolean; error?: string }> => {
    if (!actor) return { success: false, error: "Not connected to backend" };
    try {
      const result = await (actor as any).rejectWalletChange(BigInt(requestId), reason);
      if ('ok' in result) {
        await fetchWalletChangeRequests();
        return { success: true };
      }
      return { success: false, error: result.err };
    } catch (err: any) {
      return { success: false, error: err.message || "Wallet change rejection failed" };
    }
  }, [actor, fetchWalletChangeRequests]);

  // Phase 7: Monitoring
  const fetchCanisterMetrics = useCallback(async () => {
    if (!actor || !isConnected) return;
    // Debounce: skip if fetched within 30s
    const now = Date.now();
    if (now - (lastFetchedRef.current['metrics'] || 0) < 30_000) return;
    try {
      const data = await (actor as any).getCanisterMetrics();
      setCanisterMetrics({
        totalTransactions: Number(data.totalTransactions),
        totalWallets: Number(data.totalWallets),
        totalUsers: Number(data.totalUsers),
        totalBalances: Number(data.totalBalances),
        totalEvents: Number(data.totalEvents),
        totalBudgets: Number(data.totalBudgets),
        totalAuditLogs: Number(data.totalAuditLogs),
        totalBarangays: Number(data.totalBarangays),
        totalHighValueRequests: Number(data.totalHighValueRequests),
        totalWalletChangeRequests: Number(data.totalWalletChangeRequests),
        timestamp: Number(data.timestamp),
      });
      lastFetchedRef.current['metrics'] = now;
    } catch (err) {
      console.error("Error fetching canister metrics:", err);
    }
  }, [actor, isConnected]);

  const fetchSecurityOverview = useCallback(async () => {
    if (!actor || !isConnected) return;
    const now = Date.now();
    if (now - (lastFetchedRef.current['security'] || 0) < 30_000) return;
    try {
      const data = await (actor as any).getSecurityOverview();
      setSecurityOverview({
        pendingHighValueRequests: Number(data.pendingHighValueRequests),
        pendingWalletChanges: Number(data.pendingWalletChanges),
        approvedHighValueRequests: Number(data.approvedHighValueRequests),
        rejectedHighValueRequests: Number(data.rejectedHighValueRequests),
        totalAuditLogs: Number(data.totalAuditLogs),
        recentAuditCount: Number(data.recentAuditCount),
        timestamp: Number(data.timestamp),
      });
      lastFetchedRef.current['security'] = now;
    } catch (err) {
      console.error("Error fetching security overview:", err);
    }
  }, [actor, isConnected]);

  const contextValue = useMemo<BackendContextType>(() => ({
    actor,
    isConnected,
    isLoading,
    systemStats,
    principal,
    transactions,
    wallets,
    budgets,
    events,
    barangays,
    pagination,
    refreshStats,
    fetchTransactions,
    fetchWallets,
    fetchBudgets,
    fetchEvents,
    fetchBarangays,
    registerUser,
    createWallet,
    recordTransaction,
    confirmTransaction,
    failTransaction,
    createBudgetAllocation,
    createEvent,
    updateEventStatus,
    recordEventExpense,
    registerBarangay,
    linkBarangayWallet,
    distributeBudget,
    approveBudget,
    cancelBudget,
    closePeriod,
    rolloverBudget,
    highValueRequests,
    walletChangeRequests,
    fetchHighValueRequests,
    fetchWalletChangeRequests,
    approveHighValueRequest,
    rejectHighValueRequest,
    setBarangayThreshold,
    requestWalletChange,
    approveWalletChange,
    rejectWalletChange,
    canisterMetrics,
    securityOverview,
    fetchCanisterMetrics,
    fetchSecurityOverview,
    error,
  }), [
    actor, isConnected, isLoading, systemStats, principal,
    transactions, wallets, budgets, events, barangays, pagination,
    refreshStats, fetchTransactions, fetchWallets, fetchBudgets, fetchEvents, fetchBarangays,
    registerUser, createWallet, recordTransaction, confirmTransaction, failTransaction,
    createBudgetAllocation, createEvent, updateEventStatus, recordEventExpense,
    registerBarangay, linkBarangayWallet, distributeBudget,
    approveBudget, cancelBudget, closePeriod, rolloverBudget,
    highValueRequests, walletChangeRequests,
    fetchHighValueRequests, fetchWalletChangeRequests,
    approveHighValueRequest, rejectHighValueRequest, setBarangayThreshold,
    requestWalletChange, approveWalletChange, rejectWalletChange,
    canisterMetrics, securityOverview, fetchCanisterMetrics, fetchSecurityOverview,
    error,
  ]);

  return (
    <BackendContext.Provider value={contextValue}>
      {children}
    </BackendContext.Provider>
  );
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error('useBackend must be used within a BackendProvider');
  }
  return context;
};
