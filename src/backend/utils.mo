import Time "mo:base/Time";
import Types "types";
import Nat "mo:base/Nat";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import Char "mo:base/Char";
import Array "mo:base/Array";
import Int "mo:base/Int";
import Principal "mo:base/Principal";

module {
    type Role = Types.Role;
    type TransactionType = Types.TransactionType;
    type TokenType = Types.TokenType;
    type WalletType = Types.WalletType;
    type TransactionStatus = Types.TransactionStatus;
    type AllocationPeriod = Types.AllocationPeriod;
    type AllocationStatus = Types.AllocationStatus;

    // Hash functions for HashMap
    public func natHash(n: Nat): Hash.Hash = 
        Text.hash(debug_show(n));
    
    public func natEqual(a: Nat, b: Nat): Bool = a == b;

    // ========================================
    // PERMISSION SYSTEM
    // ========================================

    // Transaction permissions
    public func canViewTransactions(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (#BarangayTreasury) { true };
            case (#Auditor) { true };
        }
    };

    public func canCreateTransactions(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (#BarangayTreasury) { false };
            case (#Auditor) { false };
        }
    };

    public func canModifyTransactions(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { false };
            case (#BarangayTreasury) { false };
            case (#Auditor) { false };
        }
    };

    // Barangay management permissions
    public func canManageBarangays(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (#BarangayTreasury) { false };
            case (#Auditor) { false };
        }
    };

    // Budget permissions
    public func canAllocateBudget(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (#BarangayTreasury) { false };
            case (#Auditor) { false };
        }
    };

    public func canDistributeBudget(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (#BarangayTreasury) { false };
            case (#Auditor) { false };
        }
    };

    // Role checks
    public func isAdmin(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (_) { false };
        }
    };

    public func isSuperAdmin(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (_) { false };
        }
    };

    public func isBarangayUser(role: Role): Bool {
        switch (role) {
            case (#BarangayTreasury) { true };
            case (_) { false };
        }
    };

    // Event permissions
    public func canManageEvents(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (#BarangayTreasury) { false };
            case (#Auditor) { false };
        }
    };

    // User management permissions
    public func canManageUsers(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (#BarangayTreasury) { false };
            case (#Auditor) { false };
        }
    };

    // ========================================
    // TRANSACTION UTILITIES
    // ========================================

    public func generateTransactionId(): Nat {
        Int.abs(Time.now())
    };

    public func calculateTransactionFee(tokenType: TokenType, _amount: Nat): Nat {
        switch (tokenType) {
            case (#ICP) { 10_000 };       // 0.0001 ICP
            case (#ICRC1(_)) { 1_000 };
            case (#Other(_)) { 5_000 };
        }
    };

    // ========================================
    // ADDRESS UTILITIES
    // ========================================

    public func isValidAddress(address: Text): Bool {
        address.size() > 10 and address.size() < 100
    };

    public func normalizeAddress(address: Text): Text {
        let normalized = Text.replace(address, #char ' ', "-");
        normalized
    };

    // ========================================
    // HASH UTILITIES
    // ========================================

    public func generateTransactionHash(
        fromAddress: Text,
        toAddress: Text,
        amount: Nat,
        timestamp: Time.Time
    ): Text {
        let dataString = fromAddress # toAddress # debug_show(amount) # debug_show(timestamp);
        debug_show(Text.hash(dataString))
    };

    public func verifyTransactionHash(
        hash: Text,
        fromAddress: Text,
        toAddress: Text,
        amount: Nat,
        timestamp: Time.Time
    ): Bool {
        let expectedHash = generateTransactionHash(fromAddress, toAddress, amount, timestamp);
        hash == expectedHash
    };

    // ========================================
    // TOKEN UTILITIES
    // ========================================

    public func getTokenName(tokenType: TokenType): Text {
        switch (tokenType) {
            case (#ICP) { "Internet Computer Protocol" };
            case (#ICRC1(canisterId)) { "ICRC-1 Token (" # canisterId # ")" };
            case (#Other(name)) { name };
        }
    };

    public func getTokenSymbol(tokenType: TokenType): Text {
        switch (tokenType) {
            case (#ICP) { "ICP" };
            case (#ICRC1(_)) { "ICRC1" };
            case (#Other(name)) { name };
        }
    };

    public func formatTokenAmount(amount: Nat, tokenType: TokenType): Text {
        switch (tokenType) {
            case (#ICP) {
                let icpAmount = amount / 100_000_000;
                let remainder = amount % 100_000_000;
                debug_show(icpAmount) # "." # debug_show(remainder) # " ICP"
            };
            case (#ICRC1(_)) {
                let tokenAmount = amount / 100_000_000;
                let remainder = amount % 100_000_000;
                debug_show(tokenAmount) # "." # debug_show(remainder)
            };
            case (#Other(_)) {
                debug_show(amount)
            };
        }
    };

    // ========================================
    // WALLET UTILITIES
    // ========================================

    public func getWalletTypeName(walletType: WalletType): Text {
        switch (walletType) {
            case (#InternetIdentity) { "Internet Identity" };
            case (#Ledger) { "Ledger Hardware Wallet" };
            case (#Plug) { "Plug Wallet" };
            case (#Stoic) { "Stoic Wallet" };
            case (#Other(name)) { name };
        }
    };

    // ========================================
    // TIME UTILITIES
    // ========================================

    public func formatTimestamp(timestamp: Time.Time): Text {
        debug_show(timestamp)
    };

    public func isRecentTransaction(timestamp: Time.Time): Bool {
        let dayInNanoseconds = 24 * 60 * 60 * 1_000_000_000;
        let oneDayAgo = Time.now() - dayInNanoseconds;
        timestamp > oneDayAgo
    };

    // ========================================
    // STATUS UTILITIES
    // ========================================

    public func getTransactionStatusText(status: TransactionStatus): Text {
        switch (status) {
            case (#Pending) { "Pending" };
            case (#Confirmed) { "Confirmed" };
            case (#Failed) { "Failed" };
            case (#Cancelled) { "Cancelled" };
        }
    };

    public func isTransactionFinal(status: TransactionStatus): Bool {
        switch (status) {
            case (#Pending) { false };
            case (#Confirmed) { true };
            case (#Failed) { true };
            case (#Cancelled) { true };
        }
    };

    // ========================================
    // DATA VALIDATION
    // ========================================

    public func validateTransactionAmount(amount: Nat): Bool {
        amount > 0 and amount < 1_000_000_000_000_000
    };

    public func validateEmail(email: Text): Bool {
        email.size() > 5 and Text.contains(email, #text "@") and Text.contains(email, #text ".")
    };

    // ========================================
    // SEARCH & PAGINATION UTILITIES
    // ========================================

    public func matchesFilter<T>(
        item: T,
        filter: (T) -> Bool
    ): Bool {
        filter(item)
    };

    public func calculateTotalPages(totalItems: Nat, pageSize: Nat): Nat {
        if (pageSize == 0) { 0 }
        else { (totalItems + pageSize - 1) / pageSize }
    };

    public func getPageSlice<T>(items: [T], page: Nat, pageSize: Nat): [T] {
        let startIndex = page * pageSize;
        let endIndex = startIndex + pageSize;
        let itemsSize = items.size();
        
        if (startIndex >= itemsSize) { [] }
        else {
            let actualEndIndex = if (endIndex > itemsSize) { itemsSize } else { endIndex };
            Array.tabulate<T>(actualEndIndex - startIndex, func(i: Nat): T {
                items[startIndex + i]
            })
        }
    };

    // ========================================
    // PERIOD & ALLOCATION UTILITIES
    // ========================================

    /// Returns the start month (1-12) for an AllocationPeriod
    public func getPeriodStartMonth(period: AllocationPeriod): Nat {
        switch (period) {
            case (#Q1) { 1 };
            case (#Q2) { 4 };
            case (#Q3) { 7 };
            case (#Q4) { 10 };
            case (#SemiAnnual1) { 1 };
            case (#SemiAnnual2) { 7 };
            case (#Annual) { 1 };
        }
    };

    /// Returns the end month (1-12) for an AllocationPeriod
    public func getPeriodEndMonth(period: AllocationPeriod): Nat {
        switch (period) {
            case (#Q1) { 3 };
            case (#Q2) { 6 };
            case (#Q3) { 9 };
            case (#Q4) { 12 };
            case (#SemiAnnual1) { 6 };
            case (#SemiAnnual2) { 12 };
            case (#Annual) { 12 };
        }
    };

    /// Checks if a period has expired given the current time (nanoseconds since epoch)
    public func isPeriodExpired(period: AllocationPeriod, fiscalYear: Nat, nowNanos: Int): Bool {
        let endMonth = getPeriodEndMonth(period);
        // Calculate the end timestamp: last nanosecond of endMonth in fiscalYear
        // Approximate: (fiscalYear - 1970) years in days, plus endMonth cumulative days
        let yearsSince1970 = if (fiscalYear > 1970) { fiscalYear - 1970 } else { 0 };
        let leapYears = yearsSince1970 / 4;
        let baseDays = yearsSince1970 * 365 + leapYears;
        // Cumulative days at end of each month (non-leap)
        let monthEndDays: [Nat] = [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
        let periodEndDays = baseDays + monthEndDays[endMonth - 1];
        let periodEndNanos = periodEndDays * 86400 * 1_000_000_000;
        Int.abs(nowNanos) > periodEndNanos
    };

    /// Validates legal allocation status transitions
    public func canTransitionStatus(from: AllocationStatus, to: AllocationStatus): Bool {
        switch (from, to) {
            case (#Draft, #Approved) { true };
            case (#Draft, #Cancelled) { true };
            case (#Approved, #Released) { true };
            case (#Approved, #Cancelled) { true };
            case (#Approved, #Expired) { true };
            case (#Released, #FullySpent) { true };
            case (#Released, #Expired) { true };
            case (#Expired, #Draft) { true }; // rollover creates new Draft
            case (_, _) { false };
        }
    };

    // ========================================
    // SECURITY: HIGH-VALUE & WALLET RECOVERY
    // ========================================

    /// Checks if a distribution amount exceeds the per-barangay threshold
    public func isHighValueDistribution(amount: Nat, threshold: Nat): Bool {
        amount >= threshold
    };

    /// Checks if a wallet change is within the cooldown period (7 days default)
    public func isWithinCooldown(lastChangeTime: ?Time.Time, cooldownNs: Int): Bool {
        switch (lastChangeTime) {
            case null { false }; // never changed, no cooldown
            case (?lastTime) {
                let now = Time.now();
                (now - lastTime) < cooldownNs
            };
        }
    };

    /// Only SuperAdmin or LGU can approve high-value requests
    public func canApproveHighValue(role: Role): Bool {
        switch (role) {
            case (#SuperAdmin) { true };
            case (#LGU) { true };
            case (_) { false };
        }
    };

    /// Checks if a principal has already approved a request (prevents duplicate multi-sig)
    public func hasAlreadyApproved(approvals: [Principal], principal: Principal): Bool {
        Array.find<Principal>(approvals, func(p) { Principal.equal(p, principal) }) != null
    };

    // ========================================
    // GENERAL SECURITY UTILITIES
    // ========================================

    public func sanitizeText(input: Text): Text {
        input
    };

    public func maskSensitiveData(data: Text): Text {
        if (data.size() <= 8) { "****" }
        else {
            "****" # data # "****"
        }
    };
}