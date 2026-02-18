import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Int "mo:base/Int";

import Types "types";
import Utils "utils";

actor BlockchainTransactionTracker {
    
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
    type Result<T, E> = Result.Result<T, E>;

    // Stable variables for state persistence
    private stable var nextTransactionId: Nat = 1;
    private stable var nextWalletId: Nat = 1;
    private stable var nextUserId: Nat = 1;
    
    // Stable arrays for data persistence across upgrades
    private stable var transactionsEntries: [(Nat, Transaction)] = [];
    private stable var walletsEntries: [(Nat, Wallet)] = [];
    private stable var usersEntries: [(Principal, User)] = [];
    private stable var balancesEntries: [(Text, Balance)] = []; // Key: walletId#tokenType

    // Working state
    private var transactions = HashMap.HashMap<Nat, Transaction>(100, Utils.natEqual, Utils.natHash);
    private var wallets = HashMap.HashMap<Nat, Wallet>(50, Utils.natEqual, Utils.natHash);
    private var users = HashMap.HashMap<Principal, User>(20, Principal.equal, Principal.hash);
    private var balances = HashMap.HashMap<Text, Balance>(100, func(a: Text, b: Text): Bool { a == b }, func(t: Text): Nat { Int.abs(t.size()) });
    private var userWallets = HashMap.HashMap<Principal, [Nat]>(20, Principal.equal, Principal.hash);

    // Initialize system on canister start
    system func preupgrade() {
        transactionsEntries := Iter.toArray(transactions.entries());
        walletsEntries := Iter.toArray(wallets.entries());
        usersEntries := Iter.toArray(users.entries());
        balancesEntries := Iter.toArray(balances.entries());
    };

    system func postupgrade() {
        transactions := HashMap.fromIter<Nat, Transaction>(transactionsEntries.vals(), transactionsEntries.size(), Utils.natEqual, Utils.natHash);
        wallets := HashMap.fromIter<Nat, Wallet>(walletsEntries.vals(), walletsEntries.size(), Utils.natEqual, Utils.natHash);
        users := HashMap.fromIter<Principal, User>(usersEntries.vals(), usersEntries.size(), Principal.equal, Principal.hash);
        balances := HashMap.fromIter<Text, Balance>(balancesEntries.vals(), balancesEntries.size(), func(a: Text, b: Text): Bool { a == b }, func(t: Text): Nat { Int.abs(t.size()) });
        transactionsEntries := [];
        walletsEntries := [];
        usersEntries := [];
        balancesEntries := [];
    };

    // Authentication and Authorization
    public query(msg) func whoami(): async Principal {
        msg.caller
    };

    public func registerUser(role: Role, name: Text, email: Text): async Result<User, Text> {
        let caller = msg.caller;
        
        switch (users.get(caller)) {
            case (?existingUser) {
                #err("User already registered")
            };
            case null {
                if (not Utils.validateEmail(email)) {
                    return #err("Invalid email format");
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
                nextUserId += 1;
                #ok(newUser)
            };
        }
    };

    // Wallet Management
    public func createWallet(msg)(
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
                        if (wallet.owner == caller or user.role == #Admin or user.role == #Auditor) {
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
    public func recordTransaction(msg)(
        fromAddress: Text,
        toAddress: Text,
        amount: Nat,
        tokenType: TokenType,
        transactionType: TransactionType,
        hash: ?Text,
        blockHeight: ?Nat,
        memo: ?Text
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
        };

        transactions.put(nextTransactionId, newTransaction);
        nextTransactionId += 1;
        #ok(newTransaction)
    };

    public func confirmTransaction(msg)(transactionId: Nat, blockHeight: Nat): async Result<Transaction, Text> {
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
                };
                
                transactions.put(transactionId, updatedTransaction);
                #ok(updatedTransaction)
            };
        }
    };

    public func failTransaction(msg)(transactionId: Nat, reason: Text): async Result<Transaction, Text> {
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
                };
                
                transactions.put(transactionId, updatedTransaction);
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
                if (user.role == #Admin) {
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
                if (user.role == #Admin or user.role == #Auditor) {
                    Iter.toArray(wallets.vals())
                } else { [] }
            };
        }
    };
}