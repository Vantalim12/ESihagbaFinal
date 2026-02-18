import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Nat "mo:base/Nat";

import Types "types";
import Utils "utils";

persistent actor BlockchainTransactionTracker {
    
    // Type definitions
    type Transaction = Types.Transaction;
    type Wallet = Types.Wallet;
    type Balance = Types.Balance;
    type User = Types.User;
    type Role = Types.Role;
    type TransactionType = Types.TransactionType;
    type TransactionStatus = Types.TransactionStatus;
    type TokenType = Types.TokenType;
    type WalletType = Types.WalletType;
    type TransactionFilter = Types.TransactionFilter;
    type BudgetCategory = Types.BudgetCategory;
    type BudgetAllocation = Types.BudgetAllocation;
    type AllocationPeriod = Types.AllocationPeriod;
    type AllocationStatus = Types.AllocationStatus;
    type Barangay = Types.Barangay;
    type Event = Types.Event;
    type EventStatus = Types.EventStatus;
    type AuditLog = Types.AuditLog;
    type AuditAction = Types.AuditAction;
    type MonthlyExpenditure = Types.MonthlyExpenditure;
    type HighValueRequest = Types.HighValueRequest;
    type HighValueStatus = Types.HighValueStatus;
    type WalletChangeRequest = Types.WalletChangeRequest;
    type WalletChangeStatus = Types.WalletChangeStatus;
    type Result<T, E> = Result.Result<T, E>;

    // Variables for state persistence (implicitly stable in persistent actor)
    private var nextTransactionId: Nat = 1;
    private var nextWalletId: Nat = 1;
    private var nextUserId: Nat = 1;
    private var nextEventId: Nat = 1;
    private var nextBudgetId: Nat = 1;
    private var nextAuditId: Nat = 1;
    private var nextBarangayId: Nat = 1;
    private var nextHighValueRequestId: Nat = 1;
    private var nextWalletChangeRequestId: Nat = 1;
    private var walletChangeCooldownNs: Int = 604_800_000_000_000; // 7 days in nanoseconds
    
    // Arrays for data persistence across upgrades (implicitly stable in persistent actor)
    // Note: For migration, we'll use a temporary variable if needed
    private var transactionsEntries: [(Nat, Transaction)] = [];
    private var walletsEntries: [(Nat, Wallet)] = [];
    private var usersEntries: [(Principal, User)] = [];
    private var balancesEntries: [(Text, Balance)] = []; // Key: walletId#tokenType
    private var userWalletsEntries: [(Principal, [Nat])] = [];
    private var eventsEntries: [(Nat, Event)] = [];
    private var budgetAllocationsEntries: [(Nat, BudgetAllocation)] = [];
    private var auditLogsEntries: [(Nat, AuditLog)] = [];
    private var barangaysEntries: [(Nat, Barangay)] = [];
    private var highValueRequestsEntries: [(Nat, HighValueRequest)] = [];
    private var walletChangeRequestsEntries: [(Nat, WalletChangeRequest)] = [];

    // Working state (transient = not persisted directly, uses preupgrade/postupgrade)
    private transient var transactions = HashMap.HashMap<Nat, Transaction>(100, Utils.natEqual, Utils.natHash);
    private transient var wallets = HashMap.HashMap<Nat, Wallet>(50, Utils.natEqual, Utils.natHash);
    private transient var users = HashMap.HashMap<Principal, User>(20, Principal.equal, Principal.hash);
    private transient var balances = HashMap.HashMap<Text, Balance>(100, func(a: Text, b: Text): Bool { a == b }, Text.hash);
    private transient var userWallets = HashMap.HashMap<Principal, [Nat]>(20, Principal.equal, Principal.hash);
    private transient var events = HashMap.HashMap<Nat, Event>(50, Utils.natEqual, Utils.natHash);
    private transient var budgetAllocations = HashMap.HashMap<Nat, BudgetAllocation>(50, Utils.natEqual, Utils.natHash);
    private transient var auditLogs = HashMap.HashMap<Nat, AuditLog>(200, Utils.natEqual, Utils.natHash);
    private transient var barangays = HashMap.HashMap<Nat, Barangay>(50, Utils.natEqual, Utils.natHash);
    private transient var highValueRequests = HashMap.HashMap<Nat, HighValueRequest>(20, Utils.natEqual, Utils.natHash);
    private transient var walletChangeRequests = HashMap.HashMap<Nat, WalletChangeRequest>(20, Utils.natEqual, Utils.natHash);

    // Initialize system on canister start
    system func preupgrade() {
        transactionsEntries := Iter.toArray(transactions.entries());
        walletsEntries := Iter.toArray(wallets.entries());
        usersEntries := Iter.toArray(users.entries());
        balancesEntries := Iter.toArray(balances.entries());
        userWalletsEntries := Iter.toArray(userWallets.entries());
        eventsEntries := Iter.toArray(events.entries());
        budgetAllocationsEntries := Iter.toArray(budgetAllocations.entries());
        auditLogsEntries := Iter.toArray(auditLogs.entries());
        barangaysEntries := Iter.toArray(barangays.entries());
        highValueRequestsEntries := Iter.toArray(highValueRequests.entries());
        walletChangeRequestsEntries := Iter.toArray(walletChangeRequests.entries());
    };

    system func postupgrade() {
        transactions := HashMap.fromIter<Nat, Transaction>(transactionsEntries.vals(), transactionsEntries.size(), Utils.natEqual, Utils.natHash);
        wallets := HashMap.fromIter<Nat, Wallet>(walletsEntries.vals(), walletsEntries.size(), Utils.natEqual, Utils.natHash);
        users := HashMap.fromIter<Principal, User>(usersEntries.vals(), usersEntries.size(), Principal.equal, Principal.hash);
        balances := HashMap.fromIter<Text, Balance>(balancesEntries.vals(), balancesEntries.size(), func(a: Text, b: Text): Bool { a == b }, Text.hash);
        userWallets := HashMap.fromIter<Principal, [Nat]>(userWalletsEntries.vals(), userWalletsEntries.size(), Principal.equal, Principal.hash);
        events := HashMap.fromIter<Nat, Event>(eventsEntries.vals(), eventsEntries.size(), Utils.natEqual, Utils.natHash);
        budgetAllocations := HashMap.fromIter<Nat, BudgetAllocation>(budgetAllocationsEntries.vals(), budgetAllocationsEntries.size(), Utils.natEqual, Utils.natHash);
        auditLogs := HashMap.fromIter<Nat, AuditLog>(auditLogsEntries.vals(), auditLogsEntries.size(), Utils.natEqual, Utils.natHash);
        barangays := HashMap.fromIter<Nat, Barangay>(barangaysEntries.vals(), barangaysEntries.size(), Utils.natEqual, Utils.natHash);
        highValueRequests := HashMap.fromIter<Nat, HighValueRequest>(highValueRequestsEntries.vals(), highValueRequestsEntries.size(), Utils.natEqual, Utils.natHash);
        walletChangeRequests := HashMap.fromIter<Nat, WalletChangeRequest>(walletChangeRequestsEntries.vals(), walletChangeRequestsEntries.size(), Utils.natEqual, Utils.natHash);
        transactionsEntries := [];
        walletsEntries := [];
        usersEntries := [];
        balancesEntries := [];
        userWalletsEntries := [];
        eventsEntries := [];
        budgetAllocationsEntries := [];
        auditLogsEntries := [];
        barangaysEntries := [];
        highValueRequestsEntries := [];
        walletChangeRequestsEntries := [];
    };

    // Authentication and Authorization
    public query(msg) func whoami(): async Principal {
        msg.caller
    };

    public shared(msg) func registerUser(role: Role, name: Text, email: Text): async Result<User, Text> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case (?existingUser) {
                #err("User already registered")
            };
            case null {
                if (not Utils.validateEmail(email)) {
                    return #err("Invalid email format");
                };

                // RBAC Security: Check if this is the first user (bootstrap admin)
                let isFirstUser = users.size() == 0;
                
                // Security: Only first user can register themselves as Admin
                // Subsequent users can only register as User or Auditor
                switch (role) {
                    case (#SuperAdmin) {
                        if (not isFirstUser) {
                            return #err("Only the first user can register as SuperAdmin. Please contact an administrator.");
                        };
                    };
                    case (#LGU) {
                        if (not isFirstUser) {
                            return #err("LGU accounts must be created by a SuperAdmin.");
                        };
                    };
                    case (#BarangayTreasury) { };
                    case (#Auditor) { };
                };

                let newUser: User = {
                    id = nextUserId;
                    principal = caller;
                    role = role;
                    name = Utils.sanitizeText(name);
                    email = Utils.sanitizeText(email);
                    createdAt = Time.now();
                    isActive = true;
                };
                
                users.put(caller, newUser);
                logAction(
                    #CreateUser,
                    "User",
                    nextUserId,
                    caller,
                    "Registered user with role " # (switch (role) {
                        case (#SuperAdmin) { "SuperAdmin" };
                        case (#LGU) { "LGU" };
                        case (#BarangayTreasury) { "BarangayTreasury" };
                        case (#Auditor) { "Auditor" };
                    })
                );
                nextUserId += 1;
                #ok(newUser)
            };
        }
    };

    // Admin-only function to register other users (including admins)
    public shared(msg) func registerUserByAdmin(
        targetPrincipal: Principal,
        role: Role,
        name: Text,
        email: Text
    ): async Result<User, Text> {
        let caller = msg.caller;
        
        // Only admins can register other users
        switch (users.get(caller)) {
            case null {
                return #err("User not registered");
            };
            case (?callerUser) {
                if (not Utils.canManageUsers(callerUser.role)) {
                    return #err("Only SuperAdmin or LGU can register other users");
                };
            };
        };
        
        // Check if target user already exists
        switch (users.get(targetPrincipal)) {
            case (?existingUser) {
                return #err("User already registered");
            };
            case null {
                if (not Utils.validateEmail(email)) {
                    return #err("Invalid email format");
                };

                let newUser: User = {
                    id = nextUserId;
                    principal = targetPrincipal;
                    role = role;
                    name = Utils.sanitizeText(name);
                    email = Utils.sanitizeText(email);
                    createdAt = Time.now();
                    isActive = true;
                };
                
                users.put(targetPrincipal, newUser);
                logAction(
                    #CreateUser,
                    "User",
                    nextUserId,
                    caller,
                    "Admin registered user " # Principal.toText(targetPrincipal) # " with role " # (switch (role) {
                        case (#SuperAdmin) { "SuperAdmin" };
                        case (#LGU) { "LGU" };
                        case (#BarangayTreasury) { "BarangayTreasury" };
                        case (#Auditor) { "Auditor" };
                    })
                );
                nextUserId += 1;
                #ok(newUser)
            };
        }
    };

    // Wallet Management
    public shared(msg) func createWallet(
        address: Text,
        walletType: WalletType,
        walletLabel: ?Text
    ): async Result<Wallet, Text> {
        let caller = msg.caller;
        
        // Check if user is registered
        switch (users.get(caller)) {
            case null {
                return #err("User not registered");
            };
            case (?user) {
                if (not user.isActive) {
                    return #err("User account is not active");
                };
            };
        };

        if (not Utils.isValidAddress(address)) {
            return #err("Invalid wallet address format");
        };

        let normalizedAddress = Utils.normalizeAddress(address);

        let newWallet: Wallet = {
            id = nextWalletId;
            address = normalizedAddress;
            walletType = walletType;
            owner = caller;
            walletLabel = walletLabel;
            createdAt = Time.now();
            isActive = true;
            totalTransactions = 0;
            lastTransactionAt = null;
        };

        wallets.put(nextWalletId, newWallet);
        
        // Update user wallets mapping
        switch (userWallets.get(caller)) {
            case null {
                userWallets.put(caller, [nextWalletId]);
            };
            case (?existingWallets) {
                userWallets.put(caller, Array.append<Nat>(existingWallets, [nextWalletId]));
            };
        };

        logAction(#CreateWallet, "Wallet", nextWalletId, caller,
            "Created wallet with address " # normalizedAddress);
        nextWalletId += 1;
        #ok(newWallet)
    };

    public query(msg) func getWallet(id: Nat): async ?Wallet {
        let caller = msg.caller;
        switch (wallets.get(id)) {
            case null { null };
            case (?wallet) {
                // Check if user has permission to view this wallet
                switch (users.get(caller)) {
                    case null { null };
                    case (?user) {
                        if (wallet.owner == caller or Utils.isAdmin(user.role) or user.role == #Auditor) {
                            ?wallet
                        } else { null }
                    };
                }
            };
        }
    };

    public query(msg) func getUserWallets(): async [Wallet] {
        let caller = msg.caller;
        switch (userWallets.get(caller)) {
            case null { [] };
            case (?walletIds) {
                Array.mapFilter<Nat, Wallet>(walletIds, func(id: Nat): ?Wallet {
                    wallets.get(id)
                })
            };
        }
    };

    // Transaction Management
    public shared(msg) func recordTransaction(
        fromAddress: Text,
        toAddress: Text,
        amount: Nat,
        tokenType: TokenType,
        transactionType: TransactionType,
        hash: ?Text,
        blockHeight: ?Nat,
        memo: ?Text,
        budgetId: ?Nat,
        category: ?BudgetCategory
    ): async Result<Transaction, Text> {
        let caller = msg.caller;
        
        // Check user permissions
        switch (users.get(caller)) {
            case null {
                return #err("User not registered");
            };
            case (?user) {
                if (not Utils.canCreateTransactions(user.role)) {
                    return #err("Insufficient permissions to create transactions");
                };
            };
        };

        if (not Utils.validateTransactionAmount(amount)) {
            return #err("Invalid transaction amount");
        };

        if (not Utils.isValidAddress(fromAddress) or not Utils.isValidAddress(toAddress)) {
            return #err("Invalid address format");
        };

        // Validate budgetId if provided
        switch (budgetId) {
            case (?bid) {
                switch (budgetAllocations.get(bid)) {
                    case null { return #err("Budget allocation not found") };
                    case (?_budget) { };
                };
            };
            case null { };
        };

        let normalizedFromAddress = Utils.normalizeAddress(fromAddress);
        let normalizedToAddress = Utils.normalizeAddress(toAddress);
        let fee = Utils.calculateTransactionFee(tokenType, amount);
        let timestamp = Time.now();
        
        let transactionHash = switch (hash) {
            case (?h) { h };
            case null {
                Utils.generateTransactionHash(normalizedFromAddress, normalizedToAddress, amount, timestamp)
            };
        };

        let newTransaction: Transaction = {
            id = nextTransactionId;
            hash = transactionHash;
            fromAddress = normalizedFromAddress;
            toAddress = normalizedToAddress;
            amount = amount;
            tokenType = tokenType;
            transactionType = transactionType;
            status = #Pending;
            blockHeight = blockHeight;
            timestamp = timestamp;
            fee = fee;
            memo = memo;
            createdBy = caller;
            confirmedAt = null;
            failureReason = null;
            budgetId = budgetId;
            category = category;
        };

        transactions.put(nextTransactionId, newTransaction);
        logAction(#CreateTransaction, "Transaction", nextTransactionId, caller, 
            "Created transaction of " # debug_show(amount) # " from " # normalizedFromAddress # " to " # normalizedToAddress);
        nextTransactionId += 1;
        #ok(newTransaction)
    };

    public shared(msg) func confirmTransaction(transactionId: Nat, blockHeight: Nat): async Result<Transaction, Text> {
        let caller = msg.caller;
        
        // Check user permissions
        switch (users.get(caller)) {
            case null {
                return #err("User not registered");
            };
            case (?user) {
                if (not Utils.canModifyTransactions(user.role)) {
                    return #err("Insufficient permissions to modify transactions");
                };
            };
        };

        switch (transactions.get(transactionId)) {
            case null {
                #err("Transaction not found")
            };
            case (?transaction) {
                if (transaction.status != #Pending) {
                    return #err("Transaction is not in pending status");
                };

                let updatedTransaction: Transaction = {
                    id = transaction.id;
                    hash = transaction.hash;
                    fromAddress = transaction.fromAddress;
                    toAddress = transaction.toAddress;
                    amount = transaction.amount;
                    tokenType = transaction.tokenType;
                    transactionType = transaction.transactionType;
                    status = #Confirmed;
                    blockHeight = ?blockHeight;
                    timestamp = transaction.timestamp;
                    fee = transaction.fee;
                    memo = transaction.memo;
                    createdBy = transaction.createdBy;
                    confirmedAt = ?Time.now();
                    failureReason = null;
                    budgetId = transaction.budgetId;
                    category = transaction.category;
                };
                
                transactions.put(transactionId, updatedTransaction);
                
                // Auto-update budget spent amount when transaction is confirmed
                switch (transaction.budgetId) {
                    case (?bid) {
                        switch (budgetAllocations.get(bid)) {
                            case (?budget) {
                                let updatedBudget: BudgetAllocation = {
                                    id = budget.id;
                                    category = budget.category;
                                    barangayId = budget.barangayId;
                                    period = budget.period;
                                    allocatedAmount = budget.allocatedAmount;
                                    spentAmount = budget.spentAmount + transaction.amount;
                                    fiscalYear = budget.fiscalYear;
                                    description = budget.description;
                                    status = budget.status;
                                    createdBy = budget.createdBy;
                                    createdAt = budget.createdAt;
                                    updatedAt = Time.now();
                                };
                                budgetAllocations.put(bid, updatedBudget);
                                logAction(#UpdateBudget, "Budget", bid, caller,
                                    "Auto-updated spent by " # debug_show(transaction.amount) # " from tx #" # debug_show(transactionId));
                            };
                            case null { };
                        };
                    };
                    case null { };
                };
                
                logAction(#UpdateTransaction, "Transaction", transactionId, caller,
                    "Confirmed transaction at block " # debug_show(blockHeight));
                #ok(updatedTransaction)
            };
        }
    };

    public shared(msg) func failTransaction(transactionId: Nat, reason: Text): async Result<Transaction, Text> {
        let caller = msg.caller;
        
        // Check user permissions
        switch (users.get(caller)) {
            case null {
                return #err("User not registered");
            };
            case (?user) {
                if (not Utils.canModifyTransactions(user.role)) {
                    return #err("Insufficient permissions to modify transactions");
                };
            };
        };

        switch (transactions.get(transactionId)) {
            case null {
                #err("Transaction not found")
            };
            case (?transaction) {
                if (transaction.status != #Pending) {
                    return #err("Transaction is not in pending status");
                };

                let updatedTransaction: Transaction = {
                    id = transaction.id;
                    hash = transaction.hash;
                    fromAddress = transaction.fromAddress;
                    toAddress = transaction.toAddress;
                    amount = transaction.amount;
                    tokenType = transaction.tokenType;
                    transactionType = transaction.transactionType;
                    status = #Failed;
                    blockHeight = transaction.blockHeight;
                    timestamp = transaction.timestamp;
                    fee = transaction.fee;
                    memo = transaction.memo;
                    createdBy = transaction.createdBy;
                    confirmedAt = null;
                    failureReason = ?reason;
                    budgetId = transaction.budgetId;
                    category = transaction.category;
                };
                
                transactions.put(transactionId, updatedTransaction);
                logAction(#UpdateTransaction, "Transaction", transactionId, caller,
                    "Failed transaction: " # reason);
                #ok(updatedTransaction)
            };
        }
    };

    // Query functions
    public query func getTransaction(id: Nat): async ?Transaction {
        transactions.get(id)
    };

    public query func getAllTransactions(): async [Transaction] {
        Iter.toArray(transactions.vals())
    };

    // Paginated transaction query - CRITICAL for scalability
    public query func getTransactionsPaginated(page: Nat, limit: Nat): async {
        transactions: [Transaction];
        total: Nat;
        page: Nat;
        limit: Nat;
        hasMore: Bool;
    } {
        let allTx = Iter.toArray(transactions.vals());
        let total = allTx.size();
        
        // Ensure reasonable limit (max 100 per page)
        let safeLimit = if (limit > 100) { 100 } else if (limit < 1) { 10 } else { limit };
        let safePage = if (page < 1) { 1 } else { page };
        
        let startIndex = (safePage - 1) * safeLimit;
        
        if (startIndex >= total) {
            return {
                transactions = [];
                total = total;
                page = safePage;
                limit = safeLimit;
                hasMore = false;
            };
        };
        
        let endIndex = if (startIndex + safeLimit > total) { total } else { startIndex + safeLimit };
        
        // Sort by timestamp descending (most recent first)
        let sorted = Array.sort<Transaction>(allTx, func(a: Transaction, b: Transaction): { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less }
            else if (a.timestamp < b.timestamp) { #greater }
            else { #equal }
        });
        
        // Slice the array for pagination
        var result: [Transaction] = [];
        var i = startIndex;
        while (i < endIndex) {
            result := Array.append<Transaction>(result, [sorted[i]]);
            i += 1;
        };
        
        {
            transactions = result;
            total = total;
            page = safePage;
            limit = safeLimit;
            hasMore = endIndex < total;
        }
    };

    // Get total transaction count (lightweight query)
    public query func getTransactionCount(): async Nat {
        transactions.size()
    };

    public query(msg) func getTransactionsByAddress(address: Text): async [Transaction] {
        let caller = msg.caller;
        
        // Check permissions
        switch (users.get(caller)) {
            case null { [] };
            case (?user) {
                let normalizedAddress = Utils.normalizeAddress(address);
                let allTransactions = Iter.toArray(transactions.vals());
                Array.filter<Transaction>(allTransactions, func(tx: Transaction): Bool {
                    tx.fromAddress == normalizedAddress or tx.toAddress == normalizedAddress
                })
            };
        }
    };

    public query(msg) func getTransactionsByStatus(status: TransactionStatus): async [Transaction] {
        let caller = msg.caller;
        
        // Check permissions
        switch (users.get(caller)) {
            case null { [] };
            case (?user) {
                if (not Utils.canViewTransactions(user.role)) {
                    []
                } else {
                    let allTransactions = Iter.toArray(transactions.vals());
                    Array.filter<Transaction>(allTransactions, func(tx: Transaction): Bool {
                        tx.status == status
                    })
                }
            };
        }
    };

    // Statistics
    public query func getSystemStats(): async {
        totalTransactions: Nat;
        totalWallets: Nat;
        totalUsers: Nat;
        pendingTransactions: Nat;
        confirmedTransactions: Nat;
        failedTransactions: Nat;
        totalVolume: Nat;
    } {
        let allTransactions = Iter.toArray(transactions.vals());
        let pendingCount = Array.filter<Transaction>(allTransactions, func(tx: Transaction): Bool {
            tx.status == #Pending
        }).size();
        let confirmedCount = Array.filter<Transaction>(allTransactions, func(tx: Transaction): Bool {
            tx.status == #Confirmed
        }).size();
        let failedCount = Array.filter<Transaction>(allTransactions, func(tx: Transaction): Bool {
            tx.status == #Failed
        }).size();
        
        let totalVolume = Array.foldLeft<Transaction, Nat>(allTransactions, 0, func(sum: Nat, tx: Transaction): Nat {
            if (tx.status == #Confirmed) { sum + tx.amount } else { sum }
        });

        {
            totalTransactions = transactions.size();
            totalWallets = wallets.size();
            totalUsers = users.size();
            pendingTransactions = pendingCount;
            confirmedTransactions = confirmedCount;
            failedTransactions = failedCount;
            totalVolume = totalVolume;
        }
    };

    // Health check
    public query func healthCheck(): async Bool {
        true
    };

    // Admin functions
    public query(msg) func getAllUsers(): async [User] {
        let caller = msg.caller;
        switch (users.get(caller)) {
            case null { [] };
            case (?user) {
                if (Utils.isAdmin(user.role)) {
                    Iter.toArray(users.vals())
                } else { [] }
            };
        }
    };

    public query(msg) func getAllWallets(): async [Wallet] {
        let caller = msg.caller;
        switch (users.get(caller)) {
            case null { [] };
            case (?user) {
                if (Utils.isAdmin(user.role) or user.role == #Auditor) {
                    Iter.toArray(wallets.vals())
                } else { [] }
            };
        }
    };

    // ========================================
    // INTERNAL: Audit Logging Helper
    // ========================================
    
    private func logAction(
        action: AuditAction,
        entityType: Text,
        entityId: Nat,
        userId: Principal,
        details: Text
    ): () {
        let log: AuditLog = {
            id = nextAuditId;
            action = action;
            entityType = entityType;
            entityId = entityId;
            userId = userId;
            timestamp = Time.now();
            details = details;
        };
        auditLogs.put(nextAuditId, log);
        nextAuditId += 1;
    };

    // ========================================
    // BUDGET MANAGEMENT
    // ========================================
    
    public shared(msg) func createBudgetAllocation(
        category: BudgetCategory,
        allocatedAmount: Nat,
        fiscalYear: Nat,
        description: ?Text,
        barangayId: ?Nat,
        period: AllocationPeriod
    ): async Result<BudgetAllocation, Text> {
        let caller = msg.caller;
        
        // Check permissions
        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canAllocateBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can create budget allocations");
                };
            };
        };

        // Validate barangayId if provided
        switch (barangayId) {
            case (?bid) {
                switch (barangays.get(bid)) {
                    case null { return #err("Barangay not found") };
                    case (?_) { };
                };

                // Prevent duplicate active allocations for same barangay+period+year
                let allBudgets = Iter.toArray(budgetAllocations.vals());
                let duplicate = Array.find<BudgetAllocation>(allBudgets, func(b: BudgetAllocation): Bool {
                    switch (b.barangayId) {
                        case (?existingBid) {
                            existingBid == bid and
                            b.period == period and
                            b.fiscalYear == fiscalYear and
                            b.status != #Cancelled and
                            b.status != #Expired
                        };
                        case null { false };
                    }
                });
                switch (duplicate) {
                    case (?_) { return #err("Active allocation already exists for this barangay, period, and fiscal year") };
                    case null { };
                };
            };
            case null { };
        };

        let newBudget: BudgetAllocation = {
            id = nextBudgetId;
            category = category;
            barangayId = barangayId;
            period = period;
            allocatedAmount = allocatedAmount;
            spentAmount = 0;
            fiscalYear = fiscalYear;
            description = description;
            status = #Draft;
            createdBy = caller;
            createdAt = Time.now();
            updatedAt = Time.now();
        };

        budgetAllocations.put(nextBudgetId, newBudget);
        logAction(#AllocateBudget, "Budget", nextBudgetId, caller, "Created budget for fiscal year " # debug_show(fiscalYear));
        nextBudgetId += 1;
        #ok(newBudget)
    };

    public shared(msg) func updateBudgetSpent(budgetId: Nat, amount: Nat): async Result<BudgetAllocation, Text> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canAllocateBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can update budget");
                };
            };
        };

        switch (budgetAllocations.get(budgetId)) {
            case null { #err("Budget allocation not found") };
            case (?budget) {
                let newSpent = budget.spentAmount + amount;
                // Auto-transition to FullySpent if spent >= allocated
                let newStatus = if (newSpent >= budget.allocatedAmount and budget.status == #Released) {
                    #FullySpent
                } else {
                    budget.status
                };
                let updated: BudgetAllocation = {
                    id = budget.id;
                    category = budget.category;
                    barangayId = budget.barangayId;
                    period = budget.period;
                    allocatedAmount = budget.allocatedAmount;
                    spentAmount = newSpent;
                    fiscalYear = budget.fiscalYear;
                    description = budget.description;
                    status = newStatus;
                    createdBy = budget.createdBy;
                    createdAt = budget.createdAt;
                    updatedAt = Time.now();
                };
                budgetAllocations.put(budgetId, updated);
                logAction(#UpdateBudget, "Budget", budgetId, caller, "Updated spent amount by " # debug_show(amount));
                #ok(updated)
            };
        }
    };

    public query func getCategoryDistribution(fiscalYear: Nat): async [{
        category: BudgetCategory;
        allocated: Nat;
        spent: Nat;
    }] {
        let allBudgets = Iter.toArray(budgetAllocations.vals());
        let yearBudgets = Array.filter<BudgetAllocation>(allBudgets, func(b: BudgetAllocation): Bool {
            b.fiscalYear == fiscalYear
        });
        Array.map<BudgetAllocation, { category: BudgetCategory; allocated: Nat; spent: Nat }>(
            yearBudgets,
            func(b: BudgetAllocation): { category: BudgetCategory; allocated: Nat; spent: Nat } {
                { category = b.category; allocated = b.allocatedAmount; spent = b.spentAmount }
            }
        )
    };

    // Helper function to extract month from timestamp (nanoseconds since epoch)
    // Returns month (1-12) if timestamp falls in targetYear, null otherwise
    private func getMonthFromTimestamp(timestamp: Time.Time, targetYear: Nat): ?Nat {
        // Convert nanoseconds to seconds (epoch: Jan 1, 1970)
        let secondsSinceEpoch = Int.abs(timestamp / 1_000_000_000);
        
        // Calculate days since epoch
        let daysSinceEpoch = secondsSinceEpoch / 86400; // 86400 seconds per day
        
        // Approximate years since epoch (accounting for leap years: ~365.25 days/year)
        // Use integer division: days / 365.25 ≈ days * 4 / 1461
        let yearsSinceEpoch = (daysSinceEpoch * 4) / 1461; // 1461 = 365.25 * 4
        let calculatedYear = 1970 + yearsSinceEpoch;
        
        // Only process if year matches target
        if (calculatedYear != targetYear) { return null };
        
        // Calculate days into the current year
        // Account for leap years: every 4 years, but not every 100, but yes every 400
        let leapYears = yearsSinceEpoch / 4 - yearsSinceEpoch / 100 + yearsSinceEpoch / 400;
        let daysIntoYear = daysSinceEpoch - (yearsSinceEpoch * 365) - leapYears;
        
        // Safety check: ensure daysIntoYear is non-negative and reasonable
        if (daysIntoYear < 0 or daysIntoYear >= 366) {
            return null;
        };
        
        // Determine month based on cumulative days at start of each month
        // Check if it's a leap year
        let isLeapYear = (calculatedYear % 4 == 0 and calculatedYear % 100 != 0) or (calculatedYear % 400 == 0);
        
        // Cumulative days at start of each month (non-leap year)
        // Index: 0=Jan start, 1=Feb start, ..., 12=year end
        let monthBoundaries = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
        
        var month: Nat = 1;
        var found = false;
        
        while (month <= 12 and not found) {
            // Safe array access: month is 1-12, so month-1 is 0-11 (valid)
            let startDays = if (month == 1) { 0 } else { monthBoundaries[month - 1] };
            let endDays = if (month == 12) {
                365 + (if (isLeapYear) { 1 } else { 0 })
            } else if (month == 2 and isLeapYear) {
                monthBoundaries[month] + 1 // February has 29 days in leap year
            } else {
                monthBoundaries[month]
            };
            
            if (daysIntoYear >= startDays and daysIntoYear < endDays) {
                found := true;
            } else {
                month += 1;
            };
        };
        
        if (found and month >= 1 and month <= 12) {
            ?month
        } else {
            null // Return null if not found
        }
    };

    public query func getMonthlyExpenditure(year: Nat): async [MonthlyExpenditure] {
        let allTransactions = Iter.toArray(transactions.vals());
        
        // Filter confirmed transactions for the target year
        let confirmedTx = Array.filter<Transaction>(allTransactions, func(tx: Transaction): Bool {
            tx.status == #Confirmed
        });
        
        // Initialize 12 months with zero values
        var monthlyTotals: [var (Nat, Nat)] = Array.init<(Nat, Nat)>(12, (0, 0)); // (amount, count)
        
        // Group transactions by month
        for (tx in confirmedTx.vals()) {
            switch (getMonthFromTimestamp(tx.timestamp, year)) {
                case null { }; // Skip if not in target year
                case (?month) {
                    if (month >= 1 and month <= 12) {
                        let idx = month - 1; // 0-indexed
                        let current = monthlyTotals[idx];
                        monthlyTotals[idx] := (current.0 + tx.amount, current.1 + 1);
                    };
                };
            };
        };
        
        // Convert to MonthlyExpenditure array
        var monthlyData: [MonthlyExpenditure] = [];
        var month: Nat = 1;
        
        while (month <= 12) {
            let idx = month - 1;
            let (amount, count) = monthlyTotals[idx];
            
            monthlyData := Array.append<MonthlyExpenditure>(monthlyData, [{
                month = month;
                year = year;
                totalExpenditure = amount;
                transactionCount = count;
            }]);
            month += 1;
        };
        
        monthlyData
    };

    public query func getAllBudgetAllocations(fiscalYear: ?Nat): async [BudgetAllocation] {
        let allBudgets = Iter.toArray(budgetAllocations.vals());
        switch (fiscalYear) {
            case null { allBudgets };
            case (?year) {
                Array.filter<BudgetAllocation>(allBudgets, func(b: BudgetAllocation): Bool {
                    b.fiscalYear == year
                })
            };
        }
    };

    // ========================================
    // EVENT MANAGEMENT
    // ========================================
    
    public shared(msg) func createEvent(
        title: Text,
        description: Text,
        location: Text,
        startDate: Time.Time,
        endDate: Time.Time,
        budgetAllocated: Nat,
        category: ?BudgetCategory
    ): async Result<Event, Text> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canManageEvents(user.role)) {
                    return #err("Only SuperAdmin or LGU can create events");
                };
            };
        };

        let newEvent: Event = {
            id = nextEventId;
            title = Utils.sanitizeText(title);
            description = Utils.sanitizeText(description);
            location = Utils.sanitizeText(location);
            startDate = startDate;
            endDate = endDate;
            budgetAllocated = budgetAllocated;
            budgetSpent = 0;
            status = #Upcoming;
            category = category;
            createdBy = caller;
            createdAt = Time.now();
            updatedAt = Time.now();
        };

        events.put(nextEventId, newEvent);
        logAction(#CreateEvent, "Event", nextEventId, caller, "Created event: " # title);
        nextEventId += 1;
        #ok(newEvent)
    };

    public shared(msg) func updateEventStatus(eventId: Nat, status: EventStatus): async Result<Event, Text> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canManageEvents(user.role)) {
                    return #err("Only SuperAdmin or LGU can update events");
                };
            };
        };

        switch (events.get(eventId)) {
            case null { #err("Event not found") };
            case (?event) {
                let updated: Event = {
                    id = event.id;
                    title = event.title;
                    description = event.description;
                    location = event.location;
                    startDate = event.startDate;
                    endDate = event.endDate;
                    budgetAllocated = event.budgetAllocated;
                    budgetSpent = event.budgetSpent;
                    status = status;
                    category = event.category;
                    createdBy = event.createdBy;
                    createdAt = event.createdAt;
                    updatedAt = Time.now();
                };
                events.put(eventId, updated);
                logAction(#UpdateEvent, "Event", eventId, caller, "Updated event status");
                #ok(updated)
            };
        }
    };

    public shared(msg) func recordEventExpense(eventId: Nat, amount: Nat, memo: Text): async Result<Event, Text> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.isAdmin(user.role)) {
                    return #err("Insufficient permissions");
                };
            };
        };

        switch (events.get(eventId)) {
            case null { #err("Event not found") };
            case (?event) {
                let updated: Event = {
                    id = event.id;
                    title = event.title;
                    description = event.description;
                    location = event.location;
                    startDate = event.startDate;
                    endDate = event.endDate;
                    budgetAllocated = event.budgetAllocated;
                    budgetSpent = event.budgetSpent + amount;
                    status = event.status;
                    category = event.category;
                    createdBy = event.createdBy;
                    createdAt = event.createdAt;
                    updatedAt = Time.now();
                };
                events.put(eventId, updated);
                logAction(#UpdateEvent, "Event", eventId, caller, "Added expense: " # memo);
                #ok(updated)
            };
        }
    };

    public query func getUpcomingEvents(limit: Nat): async [Event] {
        let allEvents = Iter.toArray(events.vals());
        let now = Time.now();
        
        let upcoming = Array.filter<Event>(allEvents, func(e: Event): Bool {
            (e.status == #Upcoming or e.status == #Ongoing) and e.startDate >= now
        });
        
        let sorted = Array.sort<Event>(upcoming, func(a: Event, b: Event): { #less; #equal; #greater } {
            if (a.startDate < b.startDate) { #less }
            else if (a.startDate > b.startDate) { #greater }
            else { #equal }
        });
        
        if (sorted.size() <= limit) { sorted }
        else {
            Array.tabulate<Event>(limit, func(i: Nat): Event { sorted[i] })
        }
    };

    public query func getAllEvents(): async [Event] {
        let allEvents = Iter.toArray(events.vals());
        Array.sort<Event>(allEvents, func(a: Event, b: Event): { #less; #equal; #greater } {
            if (a.startDate > b.startDate) { #less }
            else if (a.startDate < b.startDate) { #greater }
            else { #equal }
        })
    };

    public query func getEvent(id: Nat): async ?Event {
        events.get(id)
    };

    // ========================================
    // AUDIT TRAIL
    // ========================================
    
    public query func getRecentActivity(limit: Nat): async [AuditLog] {
        let allLogs = Iter.toArray(auditLogs.vals());
        
        let sorted = Array.sort<AuditLog>(allLogs, func(a: AuditLog, b: AuditLog): { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less }
            else if (a.timestamp < b.timestamp) { #greater }
            else { #equal }
        });
        
        if (sorted.size() <= limit) { sorted }
        else {
            Array.tabulate<AuditLog>(limit, func(i: Nat): AuditLog { sorted[i] })
        }
    };

    public query(msg) func getAuditLogs(page: Nat, limit: Nat): async {
        logs: [AuditLog];
        total: Nat;
        hasMore: Bool;
    } {
        let caller = msg.caller;
        
        // Check permissions
        switch (users.get(caller)) {
            case null { return { logs = []; total = 0; hasMore = false } };
            case (?user) {
                if (not Utils.isAdmin(user.role) and user.role != #Auditor) {
                    return { logs = []; total = 0; hasMore = false };
                };
            };
        };

        let allLogs = Iter.toArray(auditLogs.vals());
        let total = allLogs.size();
        
        let safeLimit = if (limit > 100) { 100 } else if (limit < 1) { 10 } else { limit };
        let safePage = if (page < 1) { 1 } else { page };
        let startIndex = (safePage - 1) * safeLimit;
        
        if (startIndex >= total) {
            return { logs = []; total = total; hasMore = false };
        };
        
        let endIndex = if (startIndex + safeLimit > total) { total } else { startIndex + safeLimit };
        
        let sorted = Array.sort<AuditLog>(allLogs, func(a: AuditLog, b: AuditLog): { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less }
            else if (a.timestamp < b.timestamp) { #greater }
            else { #equal }
        });
        
        var result: [AuditLog] = [];
        var i = startIndex;
        while (i < endIndex) {
            result := Array.append<AuditLog>(result, [sorted[i]]);
            i += 1;
        };
        
        { logs = result; total = total; hasMore = endIndex < total }
    };

    // ========================================
    // PUBLIC CITIZEN PORTAL APIs
    // ========================================
    
    public query func getPublicBudgetSummary(fiscalYear: Nat): async {
        totalBudget: Nat;
        totalSpent: Nat;
        remainingBudget: Nat;
        categoryBreakdown: [{ category: Text; allocated: Nat; spent: Nat }];
    } {
        let allBudgets = Iter.toArray(budgetAllocations.vals());
        let yearBudgets = Array.filter<BudgetAllocation>(allBudgets, func(b: BudgetAllocation): Bool {
            b.fiscalYear == fiscalYear
        });
        
        let totalBudget = Array.foldLeft<BudgetAllocation, Nat>(yearBudgets, 0, func(sum: Nat, b: BudgetAllocation): Nat {
            sum + b.allocatedAmount
        });
        
        let totalSpent = Array.foldLeft<BudgetAllocation, Nat>(yearBudgets, 0, func(sum: Nat, b: BudgetAllocation): Nat {
            sum + b.spentAmount
        });
        
        let categoryBreakdown = Array.map<BudgetAllocation, { category: Text; allocated: Nat; spent: Nat }>(
            yearBudgets,
            func(b: BudgetAllocation): { category: Text; allocated: Nat; spent: Nat } {
                let catName = switch (b.category) {
                    case (#Infrastructure) { "Infrastructure" };
                    case (#Healthcare) { "Healthcare" };
                    case (#Education) { "Education" };
                    case (#SocialWelfare) { "Social Welfare" };
                    case (#PublicSafety) { "Public Safety" };
                    case (#Administration) { "Administration" };
                    case (#Environment) { "Environment" };
                    case (#Other(name)) { name };
                };
                { category = catName; allocated = b.allocatedAmount; spent = b.spentAmount }
            }
        );
        
        {
            totalBudget = totalBudget;
            totalSpent = totalSpent;
            remainingBudget = if (totalBudget > totalSpent) { totalBudget - totalSpent } else { 0 };
            categoryBreakdown = categoryBreakdown;
        }
    };

    public query func getPublicEvents(): async [{
        title: Text;
        description: Text;
        location: Text;
        startDate: Time.Time;
        endDate: Time.Time;
        budgetAllocated: Nat;
    }] {
        let allEvents = Iter.toArray(events.vals());
        let publicEvents = Array.filter<Event>(allEvents, func(e: Event): Bool {
            e.status == #Upcoming or e.status == #Ongoing
        });
        
        Array.map<Event, { title: Text; description: Text; location: Text; startDate: Time.Time; endDate: Time.Time; budgetAllocated: Nat }>(
            publicEvents,
            func(e: Event): { title: Text; description: Text; location: Text; startDate: Time.Time; endDate: Time.Time; budgetAllocated: Nat } {
                {
                    title = e.title;
                    description = e.description;
                    location = e.location;
                    startDate = e.startDate;
                    endDate = e.endDate;
                    budgetAllocated = e.budgetAllocated;
                }
            }
        )
    };

    public query func getPublicTransactionHistory(page: Nat, limit: Nat): async {
        transactions: [{ date: Time.Time; amount: Nat; purpose: Text }];
        total: Nat;
        hasMore: Bool;
    } {
        let allTx = Iter.toArray(transactions.vals());
        let confirmedTx = Array.filter<Transaction>(allTx, func(tx: Transaction): Bool {
            tx.status == #Confirmed
        });
        let total = confirmedTx.size();
        
        let safeLimit = if (limit > 50) { 50 } else if (limit < 1) { 10 } else { limit };
        let safePage = if (page < 1) { 1 } else { page };
        let startIndex = (safePage - 1) * safeLimit;
        
        if (startIndex >= total) {
            return { transactions = []; total = total; hasMore = false };
        };
        
        let endIndex = if (startIndex + safeLimit > total) { total } else { startIndex + safeLimit };
        
        let sorted = Array.sort<Transaction>(confirmedTx, func(a: Transaction, b: Transaction): { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less }
            else if (a.timestamp < b.timestamp) { #greater }
            else { #equal }
        });
        
        var result: [{ date: Time.Time; amount: Nat; purpose: Text }] = [];
        var i = startIndex;
        while (i < endIndex) {
            let tx = sorted[i];
            let purpose = switch (tx.memo) {
                case (?m) { m };
                case null { "Transaction" };
            };
            result := Array.append<{ date: Time.Time; amount: Nat; purpose: Text }>(result, [{
                date = tx.timestamp;
                amount = tx.amount;
                purpose = purpose;
            }]);
            i += 1;
        };
        
        { transactions = result; total = total; hasMore = endIndex < total }
    };

    // ========================================
    // PUBLIC: Barangay Wallet Transparency (No Auth)
    // ========================================

    // Get all wallets with their transaction summary - fully public
    public query func getPublicBarangayWallets(): async [{
        walletId: Nat;
        address: Text;
        walletLabel: Text;
        walletType: Text;
        totalTransactions: Nat;
        totalSpent: Nat;
        totalReceived: Nat;
    }] {
        let allWallets = Iter.toArray(wallets.vals());
        let allTx = Iter.toArray(transactions.vals());
        
        Array.map<Wallet, {
            walletId: Nat;
            address: Text;
            walletLabel: Text;
            walletType: Text;
            totalTransactions: Nat;
            totalSpent: Nat;
            totalReceived: Nat;
        }>(
            allWallets,
            func(w: Wallet): {
                walletId: Nat;
                address: Text;
                walletLabel: Text;
                walletType: Text;
                totalTransactions: Nat;
                totalSpent: Nat;
                totalReceived: Nat;
            } {
                let walletLabel = switch (w.walletLabel) {
                    case (?l) { l };
                    case null { "Barangay Wallet #" # debug_show(w.id) };
                };
                let walletTypeName = Utils.getWalletTypeName(w.walletType);
                
                // Calculate totals from confirmed transactions
                let confirmedTx = Array.filter<Transaction>(allTx, func(tx: Transaction): Bool {
                    tx.status == #Confirmed and (tx.fromAddress == w.address or tx.toAddress == w.address)
                });
                
                let spent = Array.foldLeft<Transaction, Nat>(confirmedTx, 0, func(sum: Nat, tx: Transaction): Nat {
                    if (tx.fromAddress == w.address) { sum + tx.amount } else { sum }
                });
                
                let received = Array.foldLeft<Transaction, Nat>(confirmedTx, 0, func(sum: Nat, tx: Transaction): Nat {
                    if (tx.toAddress == w.address) { sum + tx.amount } else { sum }
                });
                
                {
                    walletId = w.id;
                    address = w.address;
                    walletLabel = walletLabel;
                    walletType = walletTypeName;
                    totalTransactions = confirmedTx.size();
                    totalSpent = spent;
                    totalReceived = received;
                }
            }
        )
    };

    // Get transactions for a specific wallet address - fully public, includes hash for explorer links
    public query func getPublicWalletTransactions(walletAddress: Text, page: Nat, limit: Nat): async {
        transactions: [{
            id: Nat;
            hash: Text;
            fromAddress: Text;
            toAddress: Text;
            amount: Nat;
            tokenType: Text;
            status: Text;
            timestamp: Time.Time;
            memo: Text;
        }];
        total: Nat;
        hasMore: Bool;
    } {
        let normalizedAddress = Utils.normalizeAddress(walletAddress);
        let allTx = Iter.toArray(transactions.vals());
        
        // Get all confirmed transactions involving this wallet
        let walletTx = Array.filter<Transaction>(allTx, func(tx: Transaction): Bool {
            (tx.fromAddress == normalizedAddress or tx.toAddress == normalizedAddress)
            and tx.status == #Confirmed
        });
        
        let total = walletTx.size();
        
        let safeLimit = if (limit > 50) { 50 } else if (limit < 1) { 10 } else { limit };
        let safePage = if (page < 1) { 1 } else { page };
        let startIndex = (safePage - 1) * safeLimit;
        
        if (startIndex >= total) {
            return { transactions = []; total = total; hasMore = false };
        };
        
        let endIndex = if (startIndex + safeLimit > total) { total } else { startIndex + safeLimit };
        
        // Sort by timestamp descending (newest first)
        let sorted = Array.sort<Transaction>(walletTx, func(a: Transaction, b: Transaction): { #less; #equal; #greater } {
            if (a.timestamp > b.timestamp) { #less }
            else if (a.timestamp < b.timestamp) { #greater }
            else { #equal }
        });
        
        var result: [{
            id: Nat;
            hash: Text;
            fromAddress: Text;
            toAddress: Text;
            amount: Nat;
            tokenType: Text;
            status: Text;
            timestamp: Time.Time;
            memo: Text;
        }] = [];
        var i = startIndex;
        while (i < endIndex) {
            let tx = sorted[i];
            let tokenName = Utils.getTokenSymbol(tx.tokenType);
            let statusText = Utils.getTransactionStatusText(tx.status);
            let memoText = switch (tx.memo) {
                case (?m) { m };
                case null { "" };
            };
            result := Array.append(result, [{
                id = tx.id;
                hash = tx.hash;
                fromAddress = tx.fromAddress;
                toAddress = tx.toAddress;
                amount = tx.amount;
                tokenType = tokenName;
                status = statusText;
                timestamp = tx.timestamp;
                memo = memoText;
            }]);
            i += 1;
        };
        
        { transactions = result; total = total; hasMore = endIndex < total }
    };

    // ========================================
    // BARANGAY MANAGEMENT
    // ========================================

    public shared(msg) func registerBarangay(
        name: Text,
        code: Text,
        captain: ?Text,
        population: ?Nat
    ): async Result<Barangay, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canManageBarangays(user.role)) {
                    return #err("Only SuperAdmin or LGU can register barangays");
                };
            };
        };

        // Check for duplicate code
        let allBarangays = Iter.toArray(barangays.vals());
        let duplicate = Array.find<Barangay>(allBarangays, func(b: Barangay): Bool {
            b.code == code
        });
        switch (duplicate) {
            case (?_) { return #err("Barangay with code " # code # " already exists") };
            case null { };
        };

        let newBarangay: Barangay = {
            id = nextBarangayId;
            name = Utils.sanitizeText(name);
            code = Utils.sanitizeText(code);
            walletAddress = null;
            captain = captain;
            treasurer = null;
            population = population;
            highValueThreshold = 1_000_000; // default 1M
            lastWalletChange = null;
            createdAt = Time.now();
            updatedAt = Time.now();
            isActive = true;
        };

        barangays.put(nextBarangayId, newBarangay);
        logAction(#CreateBarangay, "Barangay", nextBarangayId, caller, "Registered barangay: " # name);
        nextBarangayId += 1;
        #ok(newBarangay)
    };

    public shared(msg) func updateBarangay(
        barangayId: Nat,
        name: ?Text,
        captain: ?Text,
        population: ?Nat
    ): async Result<Barangay, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canManageBarangays(user.role)) {
                    return #err("Only SuperAdmin or LGU can update barangays");
                };
            };
        };

        switch (barangays.get(barangayId)) {
            case null { #err("Barangay not found") };
            case (?brgy) {
                let updated: Barangay = {
                    id = brgy.id;
                    name = switch (name) { case (?n) { Utils.sanitizeText(n) }; case null { brgy.name } };
                    code = brgy.code;
                    walletAddress = brgy.walletAddress;
                    captain = switch (captain) { case (?c) { ?c }; case null { brgy.captain } };
                    treasurer = brgy.treasurer;
                    population = switch (population) { case (?p) { ?p }; case null { brgy.population } };
                    highValueThreshold = brgy.highValueThreshold;
                    lastWalletChange = brgy.lastWalletChange;
                    createdAt = brgy.createdAt;
                    updatedAt = Time.now();
                    isActive = brgy.isActive;
                };
                barangays.put(barangayId, updated);
                logAction(#UpdateBarangay, "Barangay", barangayId, caller, "Updated barangay");
                #ok(updated)
            };
        }
    };

    public shared(msg) func linkBarangayWallet(
        barangayId: Nat,
        walletAddress: Text
    ): async Result<Barangay, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?_user) { };
        };

        if (not Utils.isValidAddress(walletAddress)) {
            return #err("Invalid wallet address");
        };

        switch (barangays.get(barangayId)) {
            case null { #err("Barangay not found") };
            case (?brgy) {
                let updated: Barangay = {
                    id = brgy.id;
                    name = brgy.name;
                    code = brgy.code;
                    walletAddress = ?Utils.normalizeAddress(walletAddress);
                    captain = brgy.captain;
                    treasurer = ?caller;
                    population = brgy.population;
                    highValueThreshold = brgy.highValueThreshold;
                    lastWalletChange = brgy.lastWalletChange;
                    createdAt = brgy.createdAt;
                    updatedAt = Time.now();
                    isActive = brgy.isActive;
                };
                barangays.put(barangayId, updated);
                logAction(#UpdateBarangay, "Barangay", barangayId, caller, "Linked wallet: " # walletAddress);
                #ok(updated)
            };
        }
    };

    public query func getAllBarangays(): async [Barangay] {
        Iter.toArray(barangays.vals())
    };

    public query func getBarangay(id: Nat): async ?Barangay {
        barangays.get(id)
    };

    public query func getBarangayBudgets(barangayId: Nat, fiscalYear: ?Nat): async [BudgetAllocation] {
        let allBudgets = Iter.toArray(budgetAllocations.vals());
        Array.filter<BudgetAllocation>(allBudgets, func(b: BudgetAllocation): Bool {
            let matchBarangay = switch (b.barangayId) {
                case (?bid) { bid == barangayId };
                case null { false };
            };
            let matchYear = switch (fiscalYear) {
                case (?year) { b.fiscalYear == year };
                case null { true };
            };
            matchBarangay and matchYear
        })
    };

    // Combined distribute function: updates allocation status + creates transaction
    public shared(msg) func distributeBudget(
        budgetId: Nat,
        fromWalletAddress: Text,
        memo: ?Text
    ): async Result<Transaction, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canDistributeBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can distribute budgets");
                };
            };
        };

        // Get budget allocation
        switch (budgetAllocations.get(budgetId)) {
            case null { return #err("Budget allocation not found") };
            case (?budget) {
                // Validate status: must be Approved to distribute
                switch (budget.status) {
                    case (#Approved) { };
                    case (#Draft) { return #err("Budget must be approved before distribution. Current status: Draft") };
                    case (#Released) { return #err("Budget has already been distributed") };
                    case (#FullySpent) { return #err("Budget is fully spent") };
                    case (#Expired) { return #err("Budget period has expired") };
                    case (#Cancelled) { return #err("Budget has been cancelled") };
                };
                // Get barangay wallet
                let toAddress = switch (budget.barangayId) {
                    case null { return #err("Budget has no linked barangay") };
                    case (?bid) {
                        switch (barangays.get(bid)) {
                            case null { return #err("Barangay not found") };
                            case (?brgy) {
                                switch (brgy.walletAddress) {
                                    case null { return #err("Barangay has no linked wallet") };
                                    case (?addr) { addr };
                                };
                            };
                        };
                    };
                };

                let remaining = if (budget.allocatedAmount > budget.spentAmount) {
                    budget.allocatedAmount - budget.spentAmount
                } else { 0 };

                if (remaining == 0) {
                    return #err("No remaining budget to distribute");
                };

                // HIGH-VALUE THRESHOLD GATE: check per-barangay threshold
                switch (budget.barangayId) {
                    case (?bid) {
                        switch (barangays.get(bid)) {
                            case (?brgy) {
                                if (Utils.isHighValueDistribution(remaining, brgy.highValueThreshold)) {
                                    // Auto-create a HighValueRequest instead of distributing
                                    let request: HighValueRequest = {
                                        id = nextHighValueRequestId;
                                        budgetId = budgetId;
                                        requestedBy = caller;
                                        amount = remaining;
                                        fromWallet = fromWalletAddress;
                                        toWallet = toAddress;
                                        reason = "Auto-created: distribution exceeds threshold of " # debug_show(brgy.highValueThreshold);
                                        status = #PendingApproval;
                                        approvals = [];
                                        requiredApprovals = 2;
                                        createdAt = Time.now();
                                        resolvedAt = null;
                                        rejectedBy = null;
                                        rejectionReason = null;
                                    };
                                    highValueRequests.put(nextHighValueRequestId, request);
                                    logAction(#RequestHighValueApproval, "HighValueRequest", nextHighValueRequestId, caller,
                                        "High-value distribution of " # debug_show(remaining) # " for budget #" # debug_show(budgetId) # " (threshold: " # debug_show(brgy.highValueThreshold) # ")");
                                    nextHighValueRequestId += 1;
                                    return #err("HIGH_VALUE_GATE: Distribution of " # debug_show(remaining) # " exceeds threshold of " # debug_show(brgy.highValueThreshold) # ". Approval request #" # debug_show(nextHighValueRequestId - 1) # " created. Requires 2 admin approvals.");
                                };
                            };
                            case null { };
                        };
                    };
                    case null { };
                };

                // Create transaction
                let normalizedFrom = Utils.normalizeAddress(fromWalletAddress);
                let timestamp = Time.now();
                let fee = Utils.calculateTransactionFee(#ICP, remaining);
                let txHash = Utils.generateTransactionHash(normalizedFrom, toAddress, remaining, timestamp);

                let distributionMemo = switch (memo) {
                    case (?m) { m };
                    case null { "Budget distribution #" # debug_show(budgetId) };
                };

                let newTx: Transaction = {
                    id = nextTransactionId;
                    hash = txHash;
                    fromAddress = normalizedFrom;
                    toAddress = toAddress;
                    amount = remaining;
                    tokenType = #ICP;
                    transactionType = #BudgetDistribution;
                    status = #Pending;
                    blockHeight = null;
                    timestamp = timestamp;
                    fee = fee;
                    memo = ?distributionMemo;
                    createdBy = caller;
                    confirmedAt = null;
                    failureReason = null;
                    budgetId = ?budgetId;
                    category = ?budget.category;
                };

                transactions.put(nextTransactionId, newTx);

                // Update budget status to Released
                let updatedBudget: BudgetAllocation = {
                    id = budget.id;
                    category = budget.category;
                    barangayId = budget.barangayId;
                    period = budget.period;
                    allocatedAmount = budget.allocatedAmount;
                    spentAmount = budget.spentAmount + remaining;
                    fiscalYear = budget.fiscalYear;
                    description = budget.description;
                    status = #Released;
                    createdBy = budget.createdBy;
                    createdAt = budget.createdAt;
                    updatedAt = Time.now();
                };
                budgetAllocations.put(budgetId, updatedBudget);

                logAction(#DistributeBudget, "Budget", budgetId, caller,
                    "Distributed " # debug_show(remaining) # " to " # toAddress);
                logAction(#CreateTransaction, "Transaction", nextTransactionId, caller,
                    "Budget distribution tx from " # normalizedFrom # " to " # toAddress);

                nextTransactionId += 1;
                #ok(newTx)
            };
        }
    };

    // Update budget allocation status
    public shared(msg) func updateBudgetStatus(budgetId: Nat, status: AllocationStatus): async Result<BudgetAllocation, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canAllocateBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can update budget status");
                };
            };
        };

        switch (budgetAllocations.get(budgetId)) {
            case null { #err("Budget allocation not found") };
            case (?budget) {
                let updated: BudgetAllocation = {
                    id = budget.id;
                    category = budget.category;
                    barangayId = budget.barangayId;
                    period = budget.period;
                    allocatedAmount = budget.allocatedAmount;
                    spentAmount = budget.spentAmount;
                    fiscalYear = budget.fiscalYear;
                    description = budget.description;
                    status = status;
                    createdBy = budget.createdBy;
                    createdAt = budget.createdAt;
                    updatedAt = Time.now();
                };
                budgetAllocations.put(budgetId, updated);
                logAction(#UpdateBudget, "Budget", budgetId, caller, "Updated budget status");
                #ok(updated)
            };
        }
    };

    // ========================================
    // PHASE 5: BUDGET LIFECYCLE MANAGEMENT
    // ========================================

    /// Approve a budget allocation (Draft → Approved)
    public shared(msg) func approveBudget(budgetId: Nat): async Result<BudgetAllocation, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canAllocateBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can approve budgets");
                };
            };
        };

        switch (budgetAllocations.get(budgetId)) {
            case null { #err("Budget allocation not found") };
            case (?budget) {
                if (not Utils.canTransitionStatus(budget.status, #Approved)) {
                    return #err("Cannot approve budget. Current status: " # debug_show(budget.status) # ". Only Draft allocations can be approved.");
                };

                let updated: BudgetAllocation = {
                    id = budget.id;
                    category = budget.category;
                    barangayId = budget.barangayId;
                    period = budget.period;
                    allocatedAmount = budget.allocatedAmount;
                    spentAmount = budget.spentAmount;
                    fiscalYear = budget.fiscalYear;
                    description = budget.description;
                    status = #Approved;
                    createdBy = budget.createdBy;
                    createdAt = budget.createdAt;
                    updatedAt = Time.now();
                };
                budgetAllocations.put(budgetId, updated);
                logAction(#ApproveBudget, "Budget", budgetId, caller, "Approved budget allocation for fiscal year " # debug_show(budget.fiscalYear));
                #ok(updated)
            };
        }
    };

    /// Cancel a budget allocation (Draft/Approved → Cancelled)
    public shared(msg) func cancelBudget(budgetId: Nat, reason: Text): async Result<BudgetAllocation, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canAllocateBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can cancel budgets");
                };
            };
        };

        switch (budgetAllocations.get(budgetId)) {
            case null { #err("Budget allocation not found") };
            case (?budget) {
                if (not Utils.canTransitionStatus(budget.status, #Cancelled)) {
                    return #err("Cannot cancel budget. Current status: " # debug_show(budget.status) # ". Only Draft or Approved allocations can be cancelled.");
                };

                let cancelNote = switch (budget.description) {
                    case (?desc) { ?(desc # " [CANCELLED: " # reason # "]") };
                    case null { ?("[CANCELLED: " # reason # "]") };
                };

                let updated: BudgetAllocation = {
                    id = budget.id;
                    category = budget.category;
                    barangayId = budget.barangayId;
                    period = budget.period;
                    allocatedAmount = budget.allocatedAmount;
                    spentAmount = budget.spentAmount;
                    fiscalYear = budget.fiscalYear;
                    description = cancelNote;
                    status = #Cancelled;
                    createdBy = budget.createdBy;
                    createdAt = budget.createdAt;
                    updatedAt = Time.now();
                };
                budgetAllocations.put(budgetId, updated);
                logAction(#CancelBudget, "Budget", budgetId, caller, "Cancelled budget: " # reason);
                #ok(updated)
            };
        }
    };

    /// Close a period: bulk-expire allocations that are past their period end date
    public shared(msg) func closePeriod(fiscalYear: Nat, period: AllocationPeriod): async Result<Nat, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.isSuperAdmin(user.role) and not Utils.canAllocateBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can close periods");
                };
            };
        };

        let now = Time.now();

        // Verify period is actually expired
        if (not Utils.isPeriodExpired(period, fiscalYear, now)) {
            return #err("Period has not yet ended. Cannot close an active period.");
        };

        let allBudgets = Iter.toArray(budgetAllocations.vals());
        var expiredCount: Nat = 0;

        for (budget in allBudgets.vals()) {
            if (budget.fiscalYear == fiscalYear and budget.period == period) {
                // Only expire Approved or Released (not Draft, FullySpent, Cancelled, or already Expired)
                let shouldExpire = switch (budget.status) {
                    case (#Approved) { true };
                    case (#Released) { true };
                    case (_) { false };
                };

                if (shouldExpire) {
                    let updated: BudgetAllocation = {
                        id = budget.id;
                        category = budget.category;
                        barangayId = budget.barangayId;
                        period = budget.period;
                        allocatedAmount = budget.allocatedAmount;
                        spentAmount = budget.spentAmount;
                        fiscalYear = budget.fiscalYear;
                        description = budget.description;
                        status = #Expired;
                        createdBy = budget.createdBy;
                        createdAt = budget.createdAt;
                        updatedAt = Time.now();
                    };
                    budgetAllocations.put(budget.id, updated);
                    expiredCount += 1;
                };
            };
        };

        logAction(#ClosePeriod, "Budget", 0, caller,
            "Closed period " # debug_show(period) # " for FY " # debug_show(fiscalYear) # ": " # debug_show(expiredCount) # " allocations expired");
        #ok(expiredCount)
    };

    /// Roll over an expired budget: carry unspent balance to a new period/year as a new Draft
    public shared(msg) func rolloverBudget(
        budgetId: Nat,
        newFiscalYear: Nat,
        newPeriod: AllocationPeriod
    ): async Result<BudgetAllocation, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canAllocateBudget(user.role)) {
                    return #err("Only SuperAdmin or LGU can rollover budgets");
                };
            };
        };

        switch (budgetAllocations.get(budgetId)) {
            case null { #err("Budget allocation not found") };
            case (?budget) {
                // Only expired allocations can be rolled over
                switch (budget.status) {
                    case (#Expired) { };
                    case (_) { return #err("Only expired allocations can be rolled over. Current status: " # debug_show(budget.status)) };
                };

                // Calculate unspent amount
                let unspent = if (budget.allocatedAmount > budget.spentAmount) {
                    budget.allocatedAmount - budget.spentAmount
                } else { 0 };

                if (unspent == 0) {
                    return #err("No unspent balance to roll over");
                };

                // Check for duplicate in target period
                let allBudgets = Iter.toArray(budgetAllocations.vals());
                let duplicate = Array.find<BudgetAllocation>(allBudgets, func(b: BudgetAllocation): Bool {
                    switch (b.barangayId, budget.barangayId) {
                        case (?existingBid, ?srcBid) {
                            existingBid == srcBid and
                            b.period == newPeriod and
                            b.fiscalYear == newFiscalYear and
                            b.status != #Cancelled and
                            b.status != #Expired
                        };
                        case (_, _) { false };
                    }
                });
                switch (duplicate) {
                    case (?_) { return #err("Active allocation already exists for this barangay in the target period and fiscal year") };
                    case null { };
                };

                // Create new allocation with rolled-over amount
                let rolloverDesc = switch (budget.description) {
                    case (?desc) { ?(desc # " [Rolled over from FY" # debug_show(budget.fiscalYear) # " " # debug_show(budget.period) # ", budget #" # debug_show(budgetId) # "]") };
                    case null { ?("[Rolled over from FY" # debug_show(budget.fiscalYear) # " " # debug_show(budget.period) # ", budget #" # debug_show(budgetId) # "]") };
                };

                let newBudget: BudgetAllocation = {
                    id = nextBudgetId;
                    category = budget.category;
                    barangayId = budget.barangayId;
                    period = newPeriod;
                    allocatedAmount = unspent;
                    spentAmount = 0;
                    fiscalYear = newFiscalYear;
                    description = rolloverDesc;
                    status = #Draft;
                    createdBy = caller;
                    createdAt = Time.now();
                    updatedAt = Time.now();
                };

                budgetAllocations.put(nextBudgetId, newBudget);
                logAction(#RolloverBudget, "Budget", nextBudgetId, caller,
                    "Rolled over " # debug_show(unspent) # " from budget #" # debug_show(budgetId) # " to FY" # debug_show(newFiscalYear) # " " # debug_show(newPeriod));
                nextBudgetId += 1;
                #ok(newBudget)
            };
        }
    };

    // ========================================
    // PHASE 6: SECURITY — HIGH-VALUE MULTI-SIG
    // ========================================

    /// Approve a high-value distribution request (multi-sig: 2-of-N distinct admins)
    public shared(msg) func approveHighValueRequest(requestId: Nat): async Result<HighValueRequest, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canApproveHighValue(user.role)) {
                    return #err("Only SuperAdmin or LGU can approve high-value requests");
                };
            };
        };

        switch (highValueRequests.get(requestId)) {
            case null { #err("High-value request not found") };
            case (?request) {
                if (request.status != #PendingApproval) {
                    return #err("Request is not pending approval. Status: " # debug_show(request.status));
                };

                // Check if caller has already approved
                if (Utils.hasAlreadyApproved(request.approvals, caller)) {
                    return #err("You have already approved this request. A different admin must provide the second approval.");
                };

                // Add caller to approvals
                let newApprovals = Array.append<Principal>(request.approvals, [caller]);

                // Check if we have enough approvals
                if (newApprovals.size() >= request.requiredApprovals) {
                    // Execute the distribution
                    switch (budgetAllocations.get(request.budgetId)) {
                        case null { return #err("Budget allocation not found") };
                        case (?budget) {
                            let toAddress = request.toWallet;
                            let remaining = request.amount;
                            let normalizedFrom = Utils.normalizeAddress(request.fromWallet);
                            let timestamp = Time.now();
                            let fee = Utils.calculateTransactionFee(#ICP, remaining);
                            let txHash = Utils.generateTransactionHash(normalizedFrom, toAddress, remaining, timestamp);

                            let newTx: Transaction = {
                                id = nextTransactionId;
                                hash = txHash;
                                fromAddress = normalizedFrom;
                                toAddress = toAddress;
                                amount = remaining;
                                tokenType = #ICP;
                                transactionType = #BudgetDistribution;
                                status = #Pending;
                                blockHeight = null;
                                timestamp = timestamp;
                                fee = fee;
                                memo = ?("High-value distribution #" # debug_show(request.budgetId) # " (approved via multi-sig request #" # debug_show(requestId) # ")");
                                createdBy = caller;
                                confirmedAt = null;
                                failureReason = null;
                                budgetId = ?request.budgetId;
                                category = ?budget.category;
                            };
                            transactions.put(nextTransactionId, newTx);

                            // Update budget status to Released
                            let updatedBudget: BudgetAllocation = {
                                id = budget.id;
                                category = budget.category;
                                barangayId = budget.barangayId;
                                period = budget.period;
                                allocatedAmount = budget.allocatedAmount;
                                spentAmount = budget.spentAmount + remaining;
                                fiscalYear = budget.fiscalYear;
                                description = budget.description;
                                status = #Released;
                                createdBy = budget.createdBy;
                                createdAt = budget.createdAt;
                                updatedAt = Time.now();
                            };
                            budgetAllocations.put(request.budgetId, updatedBudget);

                            logAction(#DistributeBudget, "Budget", request.budgetId, caller,
                                "High-value distribution of " # debug_show(remaining) # " approved via multi-sig (#" # debug_show(requestId) # ")");
                            logAction(#CreateTransaction, "Transaction", nextTransactionId, caller,
                                "Multi-sig approved distribution from " # normalizedFrom # " to " # toAddress);
                            nextTransactionId += 1;
                        };
                    };

                    // Mark request as approved
                    let updatedRequest: HighValueRequest = {
                        id = request.id;
                        budgetId = request.budgetId;
                        requestedBy = request.requestedBy;
                        amount = request.amount;
                        fromWallet = request.fromWallet;
                        toWallet = request.toWallet;
                        reason = request.reason;
                        status = #Approved;
                        approvals = newApprovals;
                        requiredApprovals = request.requiredApprovals;
                        createdAt = request.createdAt;
                        resolvedAt = ?Time.now();
                        rejectedBy = null;
                        rejectionReason = null;
                    };
                    highValueRequests.put(requestId, updatedRequest);
                    logAction(#ApproveHighValue, "HighValueRequest", requestId, caller,
                        "High-value request fully approved (" # debug_show(newApprovals.size()) # "/" # debug_show(request.requiredApprovals) # ")");
                    #ok(updatedRequest)
                } else {
                    // Partial approval — update approvals list
                    let updatedRequest: HighValueRequest = {
                        id = request.id;
                        budgetId = request.budgetId;
                        requestedBy = request.requestedBy;
                        amount = request.amount;
                        fromWallet = request.fromWallet;
                        toWallet = request.toWallet;
                        reason = request.reason;
                        status = #PendingApproval;
                        approvals = newApprovals;
                        requiredApprovals = request.requiredApprovals;
                        createdAt = request.createdAt;
                        resolvedAt = null;
                        rejectedBy = null;
                        rejectionReason = null;
                    };
                    highValueRequests.put(requestId, updatedRequest);
                    logAction(#ApproveHighValue, "HighValueRequest", requestId, caller,
                        "Partial approval (" # debug_show(newApprovals.size()) # "/" # debug_show(request.requiredApprovals) # ")");
                    #ok(updatedRequest)
                };
            };
        }
    };

    /// Reject a high-value distribution request
    public shared(msg) func rejectHighValueRequest(requestId: Nat, reason: Text): async Result<HighValueRequest, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.canApproveHighValue(user.role)) {
                    return #err("Only SuperAdmin or LGU can reject high-value requests");
                };
            };
        };

        switch (highValueRequests.get(requestId)) {
            case null { #err("High-value request not found") };
            case (?request) {
                if (request.status != #PendingApproval) {
                    return #err("Request is not pending approval");
                };

                let updatedRequest: HighValueRequest = {
                    id = request.id;
                    budgetId = request.budgetId;
                    requestedBy = request.requestedBy;
                    amount = request.amount;
                    fromWallet = request.fromWallet;
                    toWallet = request.toWallet;
                    reason = request.reason;
                    status = #Rejected;
                    approvals = request.approvals;
                    requiredApprovals = request.requiredApprovals;
                    createdAt = request.createdAt;
                    resolvedAt = ?Time.now();
                    rejectedBy = ?caller;
                    rejectionReason = ?Utils.sanitizeText(reason);
                };
                highValueRequests.put(requestId, updatedRequest);
                logAction(#RejectHighValue, "HighValueRequest", requestId, caller,
                    "Rejected: " # reason);
                #ok(updatedRequest)
            };
        }
    };

    /// Get all pending high-value requests
    public query func getPendingHighValueRequests(): async [HighValueRequest] {
        let allRequests = Iter.toArray(highValueRequests.vals());
        Array.filter<HighValueRequest>(allRequests, func(r: HighValueRequest): Bool {
            r.status == #PendingApproval
        })
    };

    /// Get a single high-value request
    public query func getHighValueRequest(id: Nat): async ?HighValueRequest {
        highValueRequests.get(id)
    };

    /// Get all high-value requests (any status)
    public query func getAllHighValueRequests(): async [HighValueRequest] {
        Iter.toArray(highValueRequests.vals())
    };

    /// Set per-barangay high-value threshold (SuperAdmin only)
    public shared(msg) func setBarangayThreshold(barangayId: Nat, threshold: Nat): async Result<Barangay, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.isSuperAdmin(user.role)) {
                    return #err("Only SuperAdmin can update thresholds");
                };
            };
        };

        switch (barangays.get(barangayId)) {
            case null { #err("Barangay not found") };
            case (?brgy) {
                let updated: Barangay = {
                    id = brgy.id;
                    name = brgy.name;
                    code = brgy.code;
                    walletAddress = brgy.walletAddress;
                    captain = brgy.captain;
                    treasurer = brgy.treasurer;
                    population = brgy.population;
                    highValueThreshold = threshold;
                    lastWalletChange = brgy.lastWalletChange;
                    createdAt = brgy.createdAt;
                    updatedAt = Time.now();
                    isActive = brgy.isActive;
                };
                barangays.put(barangayId, updated);
                logAction(#UpdateThreshold, "Barangay", barangayId, caller,
                    "Updated high-value threshold to " # debug_show(threshold));
                #ok(updated)
            };
        }
    };

    // ========================================
    // PHASE 6: SECURITY — WALLET RECOVERY
    // ========================================

    /// Request a wallet change for a barangay (enforces 7-day cooldown)
    public shared(msg) func requestWalletChange(barangayId: Nat, newWallet: Text, reason: Text): async Result<WalletChangeRequest, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?_user) { };
        };

        if (not Utils.isValidAddress(newWallet)) {
            return #err("Invalid wallet address");
        };

        switch (barangays.get(barangayId)) {
            case null { return #err("Barangay not found") };
            case (?brgy) {
                // Enforce cooldown
                if (Utils.isWithinCooldown(brgy.lastWalletChange, walletChangeCooldownNs)) {
                    return #err("Wallet change is within 7-day cooldown period. Please try again later.");
                };

                // Check for existing pending request
                let allRequests = Iter.toArray(walletChangeRequests.vals());
                let pending = Array.find<WalletChangeRequest>(allRequests, func(r: WalletChangeRequest): Bool {
                    r.barangayId == barangayId and r.status == #PendingApproval
                });
                switch (pending) {
                    case (?_) { return #err("A wallet change request is already pending for this barangay") };
                    case null { };
                };

                let request: WalletChangeRequest = {
                    id = nextWalletChangeRequestId;
                    barangayId = barangayId;
                    oldWallet = brgy.walletAddress;
                    newWallet = Utils.normalizeAddress(newWallet);
                    requestedBy = caller;
                    reason = Utils.sanitizeText(reason);
                    status = #PendingApproval;
                    approvedBy = null;
                    createdAt = Time.now();
                    resolvedAt = null;
                };
                walletChangeRequests.put(nextWalletChangeRequestId, request);
                logAction(#RequestWalletChange, "WalletChangeRequest", nextWalletChangeRequestId, caller,
                    "Wallet change requested for barangay #" # debug_show(barangayId));
                nextWalletChangeRequestId += 1;
                #ok(request)
            };
        }
    };

    /// Approve a wallet change request (SuperAdmin only)
    public shared(msg) func approveWalletChange(requestId: Nat): async Result<WalletChangeRequest, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.isSuperAdmin(user.role)) {
                    return #err("Only SuperAdmin can approve wallet changes");
                };
            };
        };

        switch (walletChangeRequests.get(requestId)) {
            case null { #err("Wallet change request not found") };
            case (?request) {
                if (request.status != #PendingApproval) {
                    return #err("Request is not pending approval");
                };

                // Update barangay wallet
                switch (barangays.get(request.barangayId)) {
                    case null { return #err("Barangay not found") };
                    case (?brgy) {
                        let updatedBarangay: Barangay = {
                            id = brgy.id;
                            name = brgy.name;
                            code = brgy.code;
                            walletAddress = ?request.newWallet;
                            captain = brgy.captain;
                            treasurer = brgy.treasurer;
                            population = brgy.population;
                            highValueThreshold = brgy.highValueThreshold;
                            lastWalletChange = ?Time.now();
                            createdAt = brgy.createdAt;
                            updatedAt = Time.now();
                            isActive = brgy.isActive;
                        };
                        barangays.put(request.barangayId, updatedBarangay);
                    };
                };

                // Update request status
                let updatedRequest: WalletChangeRequest = {
                    id = request.id;
                    barangayId = request.barangayId;
                    oldWallet = request.oldWallet;
                    newWallet = request.newWallet;
                    requestedBy = request.requestedBy;
                    reason = request.reason;
                    status = #Approved;
                    approvedBy = ?caller;
                    createdAt = request.createdAt;
                    resolvedAt = ?Time.now();
                };
                walletChangeRequests.put(requestId, updatedRequest);
                logAction(#ApproveWalletChange, "WalletChangeRequest", requestId, caller,
                    "Approved wallet change for barangay #" # debug_show(request.barangayId) # " to " # request.newWallet);
                #ok(updatedRequest)
            };
        }
    };

    /// Reject a wallet change request (SuperAdmin only)
    public shared(msg) func rejectWalletChange(requestId: Nat, reason: Text): async Result<WalletChangeRequest, Text> {
        let caller = msg.caller;

        switch (users.get(caller)) {
            case null { return #err("User not registered") };
            case (?user) {
                if (not Utils.isSuperAdmin(user.role)) {
                    return #err("Only SuperAdmin can reject wallet changes");
                };
            };
        };

        switch (walletChangeRequests.get(requestId)) {
            case null { #err("Wallet change request not found") };
            case (?request) {
                if (request.status != #PendingApproval) {
                    return #err("Request is not pending approval");
                };

                let updatedRequest: WalletChangeRequest = {
                    id = request.id;
                    barangayId = request.barangayId;
                    oldWallet = request.oldWallet;
                    newWallet = request.newWallet;
                    requestedBy = request.requestedBy;
                    reason = request.reason;
                    status = #Rejected;
                    approvedBy = ?caller;
                    createdAt = request.createdAt;
                    resolvedAt = ?Time.now();
                };
                walletChangeRequests.put(requestId, updatedRequest);
                logAction(#RejectWalletChange, "WalletChangeRequest", requestId, caller,
                    "Rejected wallet change for barangay #" # debug_show(request.barangayId) # ": " # reason);
                #ok(updatedRequest)
            };
        }
    };

    /// Get all pending wallet change requests
    public query func getPendingWalletChanges(): async [WalletChangeRequest] {
        let allRequests = Iter.toArray(walletChangeRequests.vals());
        Array.filter<WalletChangeRequest>(allRequests, func(r: WalletChangeRequest): Bool {
            r.status == #PendingApproval
        })
    };

    /// Get wallet change history for a specific barangay
    public query func getWalletChangeHistory(barangayId: Nat): async [WalletChangeRequest] {
        let allRequests = Iter.toArray(walletChangeRequests.vals());
        Array.filter<WalletChangeRequest>(allRequests, func(r: WalletChangeRequest): Bool {
            r.barangayId == barangayId
        })
    };

    /// Get all wallet change requests
    public query func getAllWalletChangeRequests(): async [WalletChangeRequest] {
        Iter.toArray(walletChangeRequests.vals())
    };

    // ─── Phase 7: Monitoring ───────────────────────────────────

    /// Returns canister-level metrics: entry counts per data store
    public query func getCanisterMetrics(): async {
        totalTransactions: Nat;
        totalWallets: Nat;
        totalUsers: Nat;
        totalBalances: Nat;
        totalEvents: Nat;
        totalBudgets: Nat;
        totalAuditLogs: Nat;
        totalBarangays: Nat;
        totalHighValueRequests: Nat;
        totalWalletChangeRequests: Nat;
        timestamp: Int;
    } {
        {
            totalTransactions = transactions.size();
            totalWallets = wallets.size();
            totalUsers = users.size();
            totalBalances = balances.size();
            totalEvents = events.size();
            totalBudgets = budgetAllocations.size();
            totalAuditLogs = auditLogs.size();
            totalBarangays = barangays.size();
            totalHighValueRequests = highValueRequests.size();
            totalWalletChangeRequests = walletChangeRequests.size();
            timestamp = Time.now();
        }
    };

    /// Returns security overview: pending counts + recent audit activity
    public query func getSecurityOverview(): async {
        pendingHighValueRequests: Nat;
        pendingWalletChanges: Nat;
        approvedHighValueRequests: Nat;
        rejectedHighValueRequests: Nat;
        totalAuditLogs: Nat;
        recentAuditCount: Nat;
        timestamp: Int;
    } {
        let allHV = Iter.toArray(highValueRequests.vals());
        let allWC = Iter.toArray(walletChangeRequests.vals());
        let now = Time.now();
        let oneDayAgo = now - 86_400_000_000_000; // 24h in nanoseconds

        var pendingHV: Nat = 0;
        var approvedHV: Nat = 0;
        var rejectedHV: Nat = 0;
        for (r in allHV.vals()) {
            switch (r.status) {
                case (#PendingApproval) { pendingHV += 1 };
                case (#Approved) { approvedHV += 1 };
                case (#Rejected) { rejectedHV += 1 };
                case (_) {};
            };
        };

        var pendingWC: Nat = 0;
        for (r in allWC.vals()) {
            switch (r.status) {
                case (#PendingApproval) { pendingWC += 1 };
                case (_) {};
            };
        };

        var recentAudit: Nat = 0;
        for (log in auditLogs.vals()) {
            if (log.timestamp >= oneDayAgo) {
                recentAudit += 1;
            };
        };

        {
            pendingHighValueRequests = pendingHV;
            pendingWalletChanges = pendingWC;
            approvedHighValueRequests = approvedHV;
            rejectedHighValueRequests = rejectedHV;
            totalAuditLogs = auditLogs.size();
            recentAuditCount = recentAudit;
            timestamp = now;
        }
    };
}
