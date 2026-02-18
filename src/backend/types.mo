import Time "mo:base/Time";
import Principal "mo:base/Principal";

module {
    // ========================================
    // USER & ROLE TYPES
    // ========================================

    public type Role = {
        #SuperAdmin;        // System owner — full control
        #LGU;               // City/Municipal admin — allocates & distributes
        #BarangayTreasury;  // Barangay treasurer — views own budget, links wallet
        #Auditor;           // Read-only audit access
    };

    public type User = {
        id: Nat;
        principal: Principal;
        role: Role;
        name: Text;
        email: Text;
        createdAt: Time.Time;
        isActive: Bool;
    };

    // ========================================
    // BARANGAY ENTITY
    // ========================================

    public type Barangay = {
        id: Nat;
        name: Text;            // "Brgy. San Juan"
        code: Text;            // "SJ-001" — unique identifier
        walletAddress: ?Text;  // Linked wallet address (submitted by barangay)
        captain: ?Text;        // Barangay captain name
        treasurer: ?Principal; // Principal of the barangay treasury user
        population: ?Nat;
        highValueThreshold: Nat; // Per-barangay threshold for multi-sig (default 1_000_000)
        lastWalletChange: ?Time.Time; // Timestamp of last wallet change (for cooldown)
        createdAt: Time.Time;
        updatedAt: Time.Time;
        isActive: Bool;
    };

    // ========================================
    // TRANSACTION TYPES
    // ========================================

    public type TransactionType = {
        #Transfer;
        #Mint;
        #Burn;
        #Swap;
        #Stake;
        #Unstake;
        #BudgetDistribution; // New: explicit budget distribution type
        #Other: Text;
    };

    public type TransactionStatus = {
        #Pending;
        #Confirmed;
        #Failed;
        #Cancelled;
    };

    public type TokenType = {
        #ICP;
        #ICRC1: Text; // Token canister ID
        #Other: Text; // Custom token identifier
    };

    public type Transaction = {
        id: Nat;
        hash: Text; // Transaction hash
        fromAddress: Text;
        toAddress: Text;
        amount: Nat; // Amount in smallest unit (e.g., e8s for ICP)
        tokenType: TokenType;
        transactionType: TransactionType;
        status: TransactionStatus;
        blockHeight: ?Nat; // Block number where transaction was included
        timestamp: Time.Time;
        fee: Nat; // Transaction fee
        memo: ?Text; // Optional memo/note
        createdBy: Principal; // Who recorded this transaction
        confirmedAt: ?Time.Time;
        failureReason: ?Text;
        budgetId: ?Nat; // Link to BudgetAllocation
        category: ?BudgetCategory; // Budget category for auto-update
    };

    // ========================================
    // WALLET TYPES
    // ========================================

    public type WalletType = {
        #InternetIdentity;
        #Ledger;
        #Plug;
        #Stoic;
        #Other: Text;
    };

    public type Wallet = {
        id: Nat;
        address: Text;
        walletType: WalletType;
        owner: Principal;
        walletLabel: ?Text; // Optional label for the wallet
        createdAt: Time.Time;
        isActive: Bool;
        totalTransactions: Nat;
        lastTransactionAt: ?Time.Time;
    };

    // Balance Tracking
    public type Balance = {
        walletId: Nat;
        tokenType: TokenType;
        amount: Nat;
        lastUpdated: Time.Time;
    };

    // ========================================
    // SEARCH & FILTER TYPES
    // ========================================

    public type TransactionFilter = {
        fromAddress: ?Text;
        toAddress: ?Text;
        tokenType: ?TokenType;
        transactionType: ?TransactionType;
        status: ?TransactionStatus;
        dateFrom: ?Time.Time;
        dateTo: ?Time.Time;
        minAmount: ?Nat;
        maxAmount: ?Nat;
    };

    public type WalletFilter = {
        owner: ?Principal;
        walletType: ?WalletType;
        isActive: ?Bool;
    };

    // ========================================
    // PAGINATION TYPES
    // ========================================

    public type PaginationParams = {
        page: Nat;
        pageSize: Nat;
    };

    public type PaginatedResult<T> = {
        data: [T];
        total: Nat;
        page: Nat;
        pageSize: Nat;
        totalPages: Nat;
    };

    // ========================================
    // STATISTICS TYPES
    // ========================================

    public type TransactionStats = {
        totalTransactions: Nat;
        totalVolume: Nat;
        pendingTransactions: Nat;
        confirmedTransactions: Nat;
        failedTransactions: Nat;
        averageTransactionSize: Nat;
        topTokensByVolume: [(TokenType, Nat)];
    };

    public type WalletStats = {
        totalWallets: Nat;
        activeWallets: Nat;
        walletsByType: [(WalletType, Nat)];
        totalBalances: [(TokenType, Nat)];
    };

    // ========================================
    // BUDGET & ALLOCATION TYPES
    // ========================================

    public type BudgetCategory = {
        #Infrastructure;
        #Healthcare;
        #Education;
        #SocialWelfare;
        #PublicSafety;
        #Administration;
        #Environment;
        #Other: Text;
    };

    public type AllocationPeriod = {
        #Q1;           // Jan–Mar
        #Q2;           // Apr–Jun
        #Q3;           // Jul–Sep
        #Q4;           // Oct–Dec
        #SemiAnnual1;  // Jan–Jun
        #SemiAnnual2;  // Jul–Dec
        #Annual;       // Full year
    };

    public type AllocationStatus = {
        #Draft;        // Created, not yet approved
        #Approved;     // Approved by LGU/SuperAdmin
        #Released;     // Funds distributed to barangay
        #FullySpent;   // Budget fully utilized
        #Expired;      // Period ended with unspent funds
        #Cancelled;    // Allocation cancelled
    };

    public type BudgetAllocation = {
        id: Nat;
        category: BudgetCategory;
        barangayId: ?Nat;           // Link to Barangay entity
        period: AllocationPeriod;   // Budget period
        allocatedAmount: Nat;
        spentAmount: Nat;
        fiscalYear: Nat;
        description: ?Text;
        status: AllocationStatus;
        createdBy: Principal;
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    public type MonthlyExpenditure = {
        month: Nat; // 1-12
        year: Nat;
        totalExpenditure: Nat;
        transactionCount: Nat;
    };

    // ========================================
    // EVENT TYPES
    // ========================================

    public type EventStatus = {
        #Upcoming;
        #Ongoing;
        #Completed;
        #Cancelled;
    };

    public type Event = {
        id: Nat;
        title: Text;
        description: Text;
        location: Text;
        startDate: Time.Time;
        endDate: Time.Time;
        budgetAllocated: Nat;
        budgetSpent: Nat;
        status: EventStatus;
        category: ?BudgetCategory;
        createdBy: Principal;
        createdAt: Time.Time;
        updatedAt: Time.Time;
    };

    // ========================================
    // SECURITY: HIGH-VALUE MULTI-SIG TYPES
    // ========================================

    public type HighValueStatus = {
        #PendingApproval;
        #Approved;
        #Rejected;
        #Expired;  // auto-expire after 72h
    };

    public type HighValueRequest = {
        id: Nat;
        budgetId: Nat;
        requestedBy: Principal;
        amount: Nat;
        fromWallet: Text;
        toWallet: Text;
        reason: Text;
        status: HighValueStatus;
        approvals: [Principal];     // list of distinct approvers
        requiredApprovals: Nat;     // default 2
        createdAt: Time.Time;
        resolvedAt: ?Time.Time;
        rejectedBy: ?Principal;
        rejectionReason: ?Text;
    };

    // ========================================
    // SECURITY: WALLET RECOVERY TYPES
    // ========================================

    public type WalletChangeStatus = {
        #PendingApproval;
        #Approved;
        #Rejected;
    };

    public type WalletChangeRequest = {
        id: Nat;
        barangayId: Nat;
        oldWallet: ?Text;
        newWallet: Text;
        requestedBy: Principal;
        reason: Text;
        status: WalletChangeStatus;
        approvedBy: ?Principal;
        createdAt: Time.Time;
        resolvedAt: ?Time.Time;
    };

    // ========================================
    // AUDIT & LOGGING TYPES
    // ========================================

    public type AuditAction = {
        #CreateTransaction;
        #UpdateTransaction;
        #CreateWallet;
        #UpdateWallet;
        #CreateEvent;
        #UpdateEvent;
        #CreateBudget;
        #UpdateBudget;
        #CreateUser;
        #ViewTransaction;
        #ViewWallet;
        #Login;
        #Logout;
        #CreateBarangay;
        #UpdateBarangay;
        #AllocateBudget;
        #DistributeBudget;
        #ApproveBudget;
        #CancelBudget;
        #RolloverBudget;
        #ClosePeriod;
        #RequestHighValueApproval;
        #ApproveHighValue;
        #RejectHighValue;
        #RequestWalletChange;
        #ApproveWalletChange;
        #RejectWalletChange;
        #UpdateThreshold;
    };

    public type AuditLog = {
        id: Nat;
        action: AuditAction;
        entityType: Text;
        entityId: Nat;
        userId: Principal;
        timestamp: Time.Time;
        details: Text;
    };

    // ========================================
    // API RESPONSE TYPES
    // ========================================

    public type ApiResponse<T> = {
        #success: T;
        #error: Text;
    };

    // ========================================
    // BLOCKCHAIN INTEGRATION TYPES
    // ========================================

    public type BlockchainNetwork = {
        #InternetComputer;
        #Bitcoin;
        #Ethereum;
        #Other: Text;
    };

    public type ExternalTransaction = {
        network: BlockchainNetwork;
        hash: Text;
        blockHeight: Nat;
        confirmations: Nat;
        timestamp: Time.Time;
        fromAddress: Text;
        toAddress: Text;
        amount: Text;
        fee: Text;
    };
}