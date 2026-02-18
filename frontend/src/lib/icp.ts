import { Actor, HttpAgent } from "@dfinity/agent";
import type { Identity } from "@dfinity/agent";

// Canister ID for the backend (mainnet / production)
// Override with VITE_BACKEND_CANISTER_ID for local staging (local replica)
export const CANISTER_ID = "bw7nk-yaaaa-aaaan-q3d5a-cai";

// IDL Factory
export const idlFactory = ({ IDL }: { IDL: any }) => {
  const Role = IDL.Variant({
    SuperAdmin: IDL.Null,
    LGU: IDL.Null,
    BarangayTreasury: IDL.Null,
    Auditor: IDL.Null,
  });

  const User = IDL.Record({
    id: IDL.Nat,
    principal: IDL.Principal,
    role: Role,
    name: IDL.Text,
    email: IDL.Text,
    createdAt: IDL.Int,
    isActive: IDL.Bool,
  });

  const WalletType = IDL.Variant({
    InternetIdentity: IDL.Null,
    Ledger: IDL.Null,
    Plug: IDL.Null,
    Stoic: IDL.Null,
    Other: IDL.Text,
  });

  const TokenType = IDL.Variant({
    ICP: IDL.Null,
    ICRC1: IDL.Text,
    Other: IDL.Text,
  });

  const TransactionType = IDL.Variant({
    Transfer: IDL.Null,
    Mint: IDL.Null,
    Burn: IDL.Null,
    Swap: IDL.Null,
    Stake: IDL.Null,
    Unstake: IDL.Null,
    BudgetDistribution: IDL.Null,
    Other: IDL.Text,
  });

  const TransactionStatus = IDL.Variant({
    Pending: IDL.Null,
    Confirmed: IDL.Null,
    Failed: IDL.Null,
    Cancelled: IDL.Null,
  });

  const Wallet = IDL.Record({
    id: IDL.Nat,
    address: IDL.Text,
    walletType: WalletType,
    owner: IDL.Principal,
    walletLabel: IDL.Opt(IDL.Text),
    createdAt: IDL.Int,
    isActive: IDL.Bool,
    totalTransactions: IDL.Nat,
    lastTransactionAt: IDL.Opt(IDL.Int),
  });

  // Budget Category (must be before Transaction)
  const BudgetCategory = IDL.Variant({
    Infrastructure: IDL.Null,
    Healthcare: IDL.Null,
    Education: IDL.Null,
    SocialWelfare: IDL.Null,
    PublicSafety: IDL.Null,
    Administration: IDL.Null,
    Environment: IDL.Null,
    Other: IDL.Text,
  });

  const Transaction = IDL.Record({
    id: IDL.Nat,
    hash: IDL.Text,
    fromAddress: IDL.Text,
    toAddress: IDL.Text,
    amount: IDL.Nat,
    tokenType: TokenType,
    transactionType: TransactionType,
    status: TransactionStatus,
    blockHeight: IDL.Opt(IDL.Nat),
    timestamp: IDL.Int,
    fee: IDL.Nat,
    memo: IDL.Opt(IDL.Text),
    createdBy: IDL.Principal,
    confirmedAt: IDL.Opt(IDL.Int),
    failureReason: IDL.Opt(IDL.Text),
    budgetId: IDL.Opt(IDL.Nat),
    category: IDL.Opt(BudgetCategory),
  });

  // Allocation Period
  const AllocationPeriod = IDL.Variant({
    Q1: IDL.Null,
    Q2: IDL.Null,
    Q3: IDL.Null,
    Q4: IDL.Null,
    SemiAnnual1: IDL.Null,
    SemiAnnual2: IDL.Null,
    Annual: IDL.Null,
  });

  const AllocationStatus = IDL.Variant({
    Draft: IDL.Null,
    Approved: IDL.Null,
    Released: IDL.Null,
    FullySpent: IDL.Null,
    Expired: IDL.Null,
    Cancelled: IDL.Null,
  });

  // Budget Allocation
  const BudgetAllocation = IDL.Record({
    id: IDL.Nat,
    category: BudgetCategory,
    barangayId: IDL.Opt(IDL.Nat),
    period: AllocationPeriod,
    allocatedAmount: IDL.Nat,
    spentAmount: IDL.Nat,
    fiscalYear: IDL.Nat,
    description: IDL.Opt(IDL.Text),
    status: AllocationStatus,
    createdBy: IDL.Principal,
    createdAt: IDL.Int,
    updatedAt: IDL.Int,
  });

  // Barangay
  const Barangay = IDL.Record({
    id: IDL.Nat,
    name: IDL.Text,
    code: IDL.Text,
    walletAddress: IDL.Opt(IDL.Text),
    captain: IDL.Opt(IDL.Text),
    treasurer: IDL.Opt(IDL.Principal),
    population: IDL.Opt(IDL.Nat),
    highValueThreshold: IDL.Nat,
    lastWalletChange: IDL.Opt(IDL.Int),
    createdAt: IDL.Int,
    updatedAt: IDL.Int,
    isActive: IDL.Bool,
  });

  // Monthly Expenditure
  const MonthlyExpenditure = IDL.Record({
    month: IDL.Nat,
    year: IDL.Nat,
    totalExpenditure: IDL.Nat,
    transactionCount: IDL.Nat,
  });

  // Event Status
  const EventStatus = IDL.Variant({
    Upcoming: IDL.Null,
    Ongoing: IDL.Null,
    Completed: IDL.Null,
    Cancelled: IDL.Null,
  });

  // Event
  const Event = IDL.Record({
    id: IDL.Nat,
    title: IDL.Text,
    description: IDL.Text,
    location: IDL.Text,
    startDate: IDL.Int,
    endDate: IDL.Int,
    budgetAllocated: IDL.Nat,
    budgetSpent: IDL.Nat,
    status: EventStatus,
    category: IDL.Opt(BudgetCategory),
    createdBy: IDL.Principal,
    createdAt: IDL.Int,
    updatedAt: IDL.Int,
  });

  // Audit Action
  const AuditAction = IDL.Variant({
    CreateTransaction: IDL.Null,
    UpdateTransaction: IDL.Null,
    CreateWallet: IDL.Null,
    UpdateWallet: IDL.Null,
    CreateEvent: IDL.Null,
    UpdateEvent: IDL.Null,
    CreateBudget: IDL.Null,
    UpdateBudget: IDL.Null,
    CreateUser: IDL.Null,
    ViewTransaction: IDL.Null,
    ViewWallet: IDL.Null,
    Login: IDL.Null,
    Logout: IDL.Null,
    CreateBarangay: IDL.Null,
    UpdateBarangay: IDL.Null,
    AllocateBudget: IDL.Null,
    DistributeBudget: IDL.Null,
    ApproveBudget: IDL.Null,
    CancelBudget: IDL.Null,
    RolloverBudget: IDL.Null,
    ClosePeriod: IDL.Null,
    RequestHighValueApproval: IDL.Null,
    ApproveHighValue: IDL.Null,
    RejectHighValue: IDL.Null,
    RequestWalletChange: IDL.Null,
    ApproveWalletChange: IDL.Null,
    RejectWalletChange: IDL.Null,
    UpdateThreshold: IDL.Null,
  });

  // Audit Log
  const AuditLog = IDL.Record({
    id: IDL.Nat,
    action: AuditAction,
    entityType: IDL.Text,
    entityId: IDL.Nat,
    userId: IDL.Principal,
    timestamp: IDL.Int,
    details: IDL.Text,
  });

  // Phase 6: Security Types
  const HighValueStatus = IDL.Variant({
    PendingApproval: IDL.Null,
    Approved: IDL.Null,
    Rejected: IDL.Null,
    Expired: IDL.Null,
  });

  const HighValueRequest = IDL.Record({
    id: IDL.Nat,
    budgetId: IDL.Nat,
    requestedBy: IDL.Principal,
    amount: IDL.Nat,
    fromWallet: IDL.Text,
    toWallet: IDL.Text,
    reason: IDL.Text,
    status: HighValueStatus,
    approvals: IDL.Vec(IDL.Principal),
    requiredApprovals: IDL.Nat,
    createdAt: IDL.Int,
    resolvedAt: IDL.Opt(IDL.Int),
    rejectedBy: IDL.Opt(IDL.Principal),
    rejectionReason: IDL.Opt(IDL.Text),
  });

  const WalletChangeStatus = IDL.Variant({
    PendingApproval: IDL.Null,
    Approved: IDL.Null,
    Rejected: IDL.Null,
  });

  const WalletChangeRequest = IDL.Record({
    id: IDL.Nat,
    barangayId: IDL.Nat,
    oldWallet: IDL.Opt(IDL.Text),
    newWallet: IDL.Text,
    requestedBy: IDL.Principal,
    reason: IDL.Text,
    status: WalletChangeStatus,
    approvedBy: IDL.Opt(IDL.Principal),
    createdAt: IDL.Int,
    resolvedAt: IDL.Opt(IDL.Int),
  });

  // Category Distribution response
  const CategoryDistributionItem = IDL.Record({
    category: BudgetCategory,
    allocated: IDL.Nat,
    spent: IDL.Nat,
  });

  // Public Budget Summary
  const PublicBudgetSummary = IDL.Record({
    totalBudget: IDL.Nat,
    totalSpent: IDL.Nat,
    remainingBudget: IDL.Nat,
    categoryBreakdown: IDL.Vec(IDL.Record({
      category: IDL.Text,
      allocated: IDL.Nat,
      spent: IDL.Nat,
    })),
  });

  // Public Event (simplified)
  const PublicEvent = IDL.Record({
    title: IDL.Text,
    description: IDL.Text,
    location: IDL.Text,
    startDate: IDL.Int,
    endDate: IDL.Int,
    budgetAllocated: IDL.Nat,
  });

  // Public Transaction (simplified)
  const PublicTransaction = IDL.Record({
    date: IDL.Int,
    amount: IDL.Nat,
    purpose: IDL.Text,
  });

  const Result = (ok: any, err: any) => IDL.Variant({ ok: ok, err: err });

  return IDL.Service({
    // Auth
    whoami: IDL.Func([], [IDL.Principal], ["query"]),
    healthCheck: IDL.Func([], [IDL.Bool], ["query"]),
    registerUser: IDL.Func(
      [Role, IDL.Text, IDL.Text],
      [Result(User, IDL.Text)],
      []
    ),

    // Wallets
    createWallet: IDL.Func(
      [IDL.Text, WalletType, IDL.Opt(IDL.Text)],
      [Result(Wallet, IDL.Text)],
      []
    ),
    getWallet: IDL.Func([IDL.Nat], [IDL.Opt(Wallet)], ["query"]),
    getUserWallets: IDL.Func([], [IDL.Vec(Wallet)], ["query"]),
    getAllWallets: IDL.Func([], [IDL.Vec(Wallet)], ["query"]),

    // Transactions
    recordTransaction: IDL.Func(
      [
        IDL.Text,
        IDL.Text,
        IDL.Nat,
        TokenType,
        TransactionType,
        IDL.Opt(IDL.Text),
        IDL.Opt(IDL.Nat),
        IDL.Opt(IDL.Text),
        IDL.Opt(IDL.Nat),
        IDL.Opt(BudgetCategory),
      ],
      [Result(Transaction, IDL.Text)],
      []
    ),
    getTransaction: IDL.Func([IDL.Nat], [IDL.Opt(Transaction)], ["query"]),
    getAllTransactions: IDL.Func([], [IDL.Vec(Transaction)], ["query"]),
    getTransactionsPaginated: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [
        IDL.Record({
          transactions: IDL.Vec(Transaction),
          total: IDL.Nat,
          page: IDL.Nat,
          limit: IDL.Nat,
          hasMore: IDL.Bool,
        }),
      ],
      ["query"]
    ),
    getTransactionCount: IDL.Func([], [IDL.Nat], ["query"]),
    getTransactionsByAddress: IDL.Func(
      [IDL.Text],
      [IDL.Vec(Transaction)],
      ["query"]
    ),
    getTransactionsByStatus: IDL.Func(
      [TransactionStatus],
      [IDL.Vec(Transaction)],
      ["query"]
    ),
    confirmTransaction: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [Result(Transaction, IDL.Text)],
      []
    ),
    failTransaction: IDL.Func(
      [IDL.Nat, IDL.Text],
      [Result(Transaction, IDL.Text)],
      []
    ),

    // System Stats
    getSystemStats: IDL.Func(
      [],
      [
        IDL.Record({
          totalTransactions: IDL.Nat,
          totalWallets: IDL.Nat,
          totalUsers: IDL.Nat,
          pendingTransactions: IDL.Nat,
          confirmedTransactions: IDL.Nat,
          failedTransactions: IDL.Nat,
          totalVolume: IDL.Nat,
        }),
      ],
      ["query"]
    ),

    // Budget Management
    createBudgetAllocation: IDL.Func(
      [BudgetCategory, IDL.Nat, IDL.Nat, IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat), AllocationPeriod],
      [Result(BudgetAllocation, IDL.Text)],
      []
    ),
    updateBudgetSpent: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [Result(BudgetAllocation, IDL.Text)],
      []
    ),
    getAllBudgetAllocations: IDL.Func(
      [IDL.Opt(IDL.Nat)],
      [IDL.Vec(BudgetAllocation)],
      ["query"]
    ),
    getCategoryDistribution: IDL.Func(
      [IDL.Nat],
      [IDL.Vec(CategoryDistributionItem)],
      ["query"]
    ),
    getMonthlyExpenditure: IDL.Func(
      [IDL.Nat],
      [IDL.Vec(MonthlyExpenditure)],
      ["query"]
    ),

    // Event Management
    createEvent: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Int, IDL.Int, IDL.Nat, IDL.Opt(BudgetCategory)],
      [Result(Event, IDL.Text)],
      []
    ),
    updateEventStatus: IDL.Func(
      [IDL.Nat, EventStatus],
      [Result(Event, IDL.Text)],
      []
    ),
    recordEventExpense: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Text],
      [Result(Event, IDL.Text)],
      []
    ),
    getEvent: IDL.Func([IDL.Nat], [IDL.Opt(Event)], ["query"]),
    getAllEvents: IDL.Func([], [IDL.Vec(Event)], ["query"]),
    getUpcomingEvents: IDL.Func([IDL.Nat], [IDL.Vec(Event)], ["query"]),

    // Audit Trail
    getRecentActivity: IDL.Func([IDL.Nat], [IDL.Vec(AuditLog)], ["query"]),
    getAuditLogs: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [
        IDL.Record({
          logs: IDL.Vec(AuditLog),
          total: IDL.Nat,
          hasMore: IDL.Bool,
        }),
      ],
      ["query"]
    ),

    // Public Citizen Portal APIs (no auth required)
    getPublicBudgetSummary: IDL.Func(
      [IDL.Nat],
      [PublicBudgetSummary],
      ["query"]
    ),
    getPublicEvents: IDL.Func([], [IDL.Vec(PublicEvent)], ["query"]),
    getPublicTransactionHistory: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [
        IDL.Record({
          transactions: IDL.Vec(PublicTransaction),
          total: IDL.Nat,
          hasMore: IDL.Bool,
        }),
      ],
      ["query"]
    ),

    // Public Barangay Wallet Transparency (no auth)
    getPublicBarangayWallets: IDL.Func(
      [],
      [IDL.Vec(IDL.Record({
        walletId: IDL.Nat,
        address: IDL.Text,
        walletLabel: IDL.Text,
        walletType: IDL.Text,
        totalTransactions: IDL.Nat,
        totalSpent: IDL.Nat,
        totalReceived: IDL.Nat,
      }))],
      ["query"]
    ),
    getPublicWalletTransactions: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Nat],
      [IDL.Record({
        transactions: IDL.Vec(IDL.Record({
          id: IDL.Nat,
          hash: IDL.Text,
          fromAddress: IDL.Text,
          toAddress: IDL.Text,
          amount: IDL.Nat,
          tokenType: IDL.Text,
          status: IDL.Text,
          timestamp: IDL.Int,
          memo: IDL.Text,
        })),
        total: IDL.Nat,
        hasMore: IDL.Bool,
      })],
      ["query"]
    ),

    // Admin: Register user by admin
    registerUserByAdmin: IDL.Func(
      [IDL.Principal, Role, IDL.Text, IDL.Text],
      [Result(User, IDL.Text)],
      []
    ),

    // Barangay Management
    registerBarangay: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat)],
      [Result(Barangay, IDL.Text)],
      []
    ),
    updateBarangay: IDL.Func(
      [IDL.Nat, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat)],
      [Result(Barangay, IDL.Text)],
      []
    ),
    linkBarangayWallet: IDL.Func(
      [IDL.Nat, IDL.Text],
      [Result(Barangay, IDL.Text)],
      []
    ),
    getAllBarangays: IDL.Func([], [IDL.Vec(Barangay)], ["query"]),
    getBarangay: IDL.Func([IDL.Nat], [IDL.Opt(Barangay)], ["query"]),
    getBarangayBudgets: IDL.Func(
      [IDL.Nat, IDL.Opt(IDL.Nat)],
      [IDL.Vec(BudgetAllocation)],
      ["query"]
    ),

    // Budget Distribution
    distributeBudget: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
      [Result(Transaction, IDL.Text)],
      []
    ),
    updateBudgetStatus: IDL.Func(
      [IDL.Nat, AllocationStatus],
      [Result(BudgetAllocation, IDL.Text)],
      []
    ),

    // Phase 5: Budget Lifecycle
    approveBudget: IDL.Func(
      [IDL.Nat],
      [Result(BudgetAllocation, IDL.Text)],
      []
    ),
    cancelBudget: IDL.Func(
      [IDL.Nat, IDL.Text],
      [Result(BudgetAllocation, IDL.Text)],
      []
    ),
    closePeriod: IDL.Func(
      [IDL.Nat, AllocationPeriod],
      [Result(IDL.Nat, IDL.Text)],
      []
    ),
    rolloverBudget: IDL.Func(
      [IDL.Nat, IDL.Nat, AllocationPeriod],
      [Result(BudgetAllocation, IDL.Text)],
      []
    ),

    // Phase 6: High-Value Multi-Sig
    approveHighValueRequest: IDL.Func(
      [IDL.Nat],
      [Result(HighValueRequest, IDL.Text)],
      []
    ),
    rejectHighValueRequest: IDL.Func(
      [IDL.Nat, IDL.Text],
      [Result(HighValueRequest, IDL.Text)],
      []
    ),
    getPendingHighValueRequests: IDL.Func(
      [],
      [IDL.Vec(HighValueRequest)],
      ["query"]
    ),
    getHighValueRequest: IDL.Func(
      [IDL.Nat],
      [IDL.Opt(HighValueRequest)],
      ["query"]
    ),
    getAllHighValueRequests: IDL.Func(
      [],
      [IDL.Vec(HighValueRequest)],
      ["query"]
    ),
    setBarangayThreshold: IDL.Func(
      [IDL.Nat, IDL.Nat],
      [Result(Barangay, IDL.Text)],
      []
    ),

    // Phase 6: Wallet Recovery
    requestWalletChange: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Text],
      [Result(WalletChangeRequest, IDL.Text)],
      []
    ),
    approveWalletChange: IDL.Func(
      [IDL.Nat],
      [Result(WalletChangeRequest, IDL.Text)],
      []
    ),
    rejectWalletChange: IDL.Func(
      [IDL.Nat, IDL.Text],
      [Result(WalletChangeRequest, IDL.Text)],
      []
    ),
    getPendingWalletChanges: IDL.Func(
      [],
      [IDL.Vec(WalletChangeRequest)],
      ["query"]
    ),
    getWalletChangeHistory: IDL.Func(
      [IDL.Nat],
      [IDL.Vec(WalletChangeRequest)],
      ["query"]
    ),
    getAllWalletChangeRequests: IDL.Func(
      [],
      [IDL.Vec(WalletChangeRequest)],
      ["query"]
    ),

    // Phase 7: Monitoring
    getCanisterMetrics: IDL.Func(
      [],
      [IDL.Record({
        totalTransactions: IDL.Nat,
        totalWallets: IDL.Nat,
        totalUsers: IDL.Nat,
        totalBalances: IDL.Nat,
        totalEvents: IDL.Nat,
        totalBudgets: IDL.Nat,
        totalAuditLogs: IDL.Nat,
        totalBarangays: IDL.Nat,
        totalHighValueRequests: IDL.Nat,
        totalWalletChangeRequests: IDL.Nat,
        timestamp: IDL.Int,
      })],
      ["query"]
    ),
    getSecurityOverview: IDL.Func(
      [],
      [IDL.Record({
        pendingHighValueRequests: IDL.Nat,
        pendingWalletChanges: IDL.Nat,
        approvedHighValueRequests: IDL.Nat,
        rejectedHighValueRequests: IDL.Nat,
        totalAuditLogs: IDL.Nat,
        recentAuditCount: IDL.Nat,
        timestamp: IDL.Int,
      })],
      ["query"]
    ),
  });
};


// Create Actor (optionally with authenticated identity from Internet Identity)
export const createBackendActor = async (identity?: Identity) => {
  const useMainnet =
    import.meta.env.VITE_USE_MAINNET === "true" ||
    import.meta.env.VITE_USE_MAINNET === "1";
  const isLocalHost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  const host = useMainnet || !isLocalHost
    ? "https://ic0.app"
    : "http://127.0.0.1:4943";

  const agent = new HttpAgent({ host, identity });

  if (host.includes("127.0.0.1") || host.includes("localhost")) {
    try {
      await agent.fetchRootKey();
    } catch (err) {
      console.warn("Unable to fetch root key. Check if local replica is running");
    }
  }

  const canisterId =
    (import.meta.env.VITE_BACKEND_CANISTER_ID as string) || CANISTER_ID;

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
  });
};

