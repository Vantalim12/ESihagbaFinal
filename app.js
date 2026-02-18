// Blockchain Transaction Tracker Frontend - Browser JavaScript Version
// ICP Integration and UI Management

// Global state
let canisterActor = null;
let isConnected = false;
let currentUser = null;
let systemStats = null;

// Configuration
const CANISTER_ID =
  window.location.hostname === "localhost"
    ? "yvo33-jqaaa-aaaaf-qbxra-cai" // Your deployed backend canister
    : "yvo33-jqaaa-aaaaf-qbxra-cai"; // Your deployed backend canister

const HOST =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:4943"
    : "https://ic0.app";

// Access ICP libraries from global scope
const getICPLibraries = () => {
  const HttpAgent = window.ic?.HttpAgent;
  const Actor = window.ic?.Actor;
  const IDL = window.ic?.IDL;
  const Principal = window.ic?.Principal;

  return { HttpAgent, Actor, IDL, Principal };
};

// IDL Interface Definition
const createIDL = ({ IDL }) => {
  const Role = IDL.Variant({
    Admin: IDL.Null,
    User: IDL.Null,
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
  });

  const Result = (ok, err) => IDL.Variant({ ok: ok, err: err });

  return IDL.Service({
    whoami: IDL.Func([], [IDL.Principal], ["query"]),
    healthCheck: IDL.Func([], [IDL.Bool], ["query"]),
    registerUser: IDL.Func(
      [Role, IDL.Text, IDL.Text],
      [Result(User, IDL.Text)],
      []
    ),
    createWallet: IDL.Func(
      [IDL.Text, WalletType, IDL.Opt(IDL.Text)],
      [Result(Wallet, IDL.Text)],
      []
    ),
    getWallet: IDL.Func([IDL.Nat], [IDL.Opt(Wallet)], ["query"]),
    getUserWallets: IDL.Func([], [IDL.Vec(Wallet)], ["query"]),
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
      ],
      [Result(Transaction, IDL.Text)],
      []
    ),
    getTransaction: IDL.Func([IDL.Nat], [IDL.Opt(Transaction)], ["query"]),
    getAllTransactions: IDL.Func([], [IDL.Vec(Transaction)], ["query"]),
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
  });
};

// Initialize application
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupForms();
  await initializeConnection();
  await loadInitialData();
});

// Connection Management
async function initializeConnection() {
  try {
    updateConnectionStatus("connecting", "Connecting to ICP...");

    const { HttpAgent, Actor, IDL } = getICPLibraries();

    if (!HttpAgent || !Actor || !IDL) {
      throw new Error("ICP libraries not loaded properly");
    }

    const agent = new HttpAgent({ host: HOST });

    // Only fetch root key for local development
    if (HOST.includes("127.0.0.1") || HOST.includes("localhost")) {
      await agent.fetchRootKey();
    }

    canisterActor = Actor.createActor(createIDL({ IDL }), {
      agent,
      canisterId: CANISTER_ID,
    });

    // Test connection with health check
    const healthCheck = await canisterActor.healthCheck();
    if (healthCheck) {
      isConnected = true;
      updateConnectionStatus("connected", "Connected to ICP");
      updateCanisterInfo(CANISTER_ID);
    } else {
      throw new Error("Health check failed");
    }
  } catch (error) {
    console.error("Connection failed:", error);
    isConnected = false;
    updateConnectionStatus("error", "Failed to connect to ICP");
    showToast("Failed to connect to backend", "error");
  }
}

function updateConnectionStatus(status, message) {
  const statusElement = document.getElementById("connection-status");
  const statusIcon = document.getElementById("status-icon");
  const statusText = document.getElementById("status-text");

  if (!statusElement || !statusIcon || !statusText) return;

  statusElement.className = "connection-status";
  statusIcon.className = "fas fa-circle";
  statusText.textContent = message;

  const indicator = statusElement.querySelector(".status-indicator");
  if (indicator) {
    indicator.className = `status-indicator ${status}`;
  }
}

function updateCanisterInfo(canisterId) {
  const canisterInfo = document.getElementById("canister-info");
  if (!canisterInfo) return;

  if (
    canisterId &&
    canisterId !== "YOUR_LOCAL_CANISTER_ID" &&
    canisterId !== "YOUR_MAINNET_CANISTER_ID"
  ) {
    canisterInfo.textContent = `Canister: ${canisterId}`;
  } else {
    canisterInfo.innerHTML =
      '<span style="color: var(--error-color);">⚠️ Please configure your canister ID</span>';
  }
}

// Data Loading
async function loadInitialData() {
  if (!isConnected || !canisterActor) return;

  try {
    showLoading(true);

    // Load system stats
    await loadSystemStats();

    // Try to get current user info
    await getCurrentUser();

    // Load initial dashboard data
    if (getCurrentSection() === "dashboard") {
      await loadDashboardData();
    }
  } catch (error) {
    console.error("Error loading initial data:", error);
    showToast("Error loading data", "error");
  } finally {
    showLoading(false);
  }
}

async function loadSystemStats() {
  if (!canisterActor) return;

  try {
    systemStats = await canisterActor.getSystemStats();
    updateStatsDisplay();
  } catch (error) {
    console.error("Error loading system stats:", error);
  }
}

async function getCurrentUser() {
  if (!canisterActor) return;

  try {
    const principal = await canisterActor.whoami();
    updateProfileDisplay(principal);
  } catch (error) {
    console.error("Error getting current user:", error);
  }
}

async function loadDashboardData() {
  if (!canisterActor) return;

  try {
    const transactions = await canisterActor.getAllTransactions();
    const recentTransactions = transactions.slice(-5).reverse(); // Get last 5 transactions
    displayRecentTransactions(recentTransactions);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
}

// Navigation
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const navToggle = document.getElementById("nav-toggle");
  const navMenu = document.getElementById("nav-menu");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      showSection(section);

      // Update active nav link
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // Close mobile menu
      if (navMenu) navMenu.classList.remove("active");
    });
  });

  // Mobile menu toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.toggle("active");
    });
  }
}

function showSection(sectionName) {
  const sections = document.querySelectorAll(".content-section");
  sections.forEach((section) => section.classList.remove("active"));

  const targetSection = document.getElementById(sectionName);
  if (targetSection) {
    targetSection.classList.add("active");
    loadSectionData(sectionName);
  }
}

function getCurrentSection() {
  const activeSection = document.querySelector(".content-section.active");
  return activeSection ? activeSection.id : "dashboard";
}

async function loadSectionData(sectionName) {
  if (!isConnected) return;

  try {
    switch (sectionName) {
      case "dashboard":
        await loadDashboardData();
        break;
      case "transactions":
        await loadAllTransactions();
        break;
      case "wallets":
        await loadUserWallets();
        break;
      case "profile":
        await getCurrentUser();
        break;
    }
  } catch (error) {
    console.error(`Error loading ${sectionName} data:`, error);
    showToast(`Error loading ${sectionName} data`, "error");
  }
}

// Display Functions
function updateStatsDisplay() {
  if (!systemStats) return;

  const totalTxElement = document.getElementById("total-transactions");
  const confirmedTxElement = document.getElementById("confirmed-transactions");
  const pendingTxElement = document.getElementById("pending-transactions");
  const walletsElement = document.getElementById("total-wallets");

  if (totalTxElement)
    totalTxElement.textContent = systemStats.totalTransactions.toString();
  if (confirmedTxElement)
    confirmedTxElement.textContent =
      systemStats.confirmedTransactions.toString();
  if (pendingTxElement)
    pendingTxElement.textContent = systemStats.pendingTransactions.toString();
  if (walletsElement)
    walletsElement.textContent = systemStats.totalWallets.toString();
}

function displayRecentTransactions(transactions) {
  const container = document.getElementById("recent-transactions");
  if (!container) return;

  container.innerHTML = "";

  if (transactions.length === 0) {
    container.innerHTML =
      '<p class="text-muted text-center">No transactions found</p>';
    return;
  }

  transactions.forEach((tx) => {
    const txElement = createTransactionElement(tx);
    container.appendChild(txElement);
  });
}

function createTransactionElement(tx) {
  const div = document.createElement("div");
  div.className = "transaction-item";

  const statusDisplay = getTransactionStatusDisplay(tx);
  const amount = Number(tx.amount) / 100000000; // Convert from e8s to ICP
  const tokenType = Object.keys(tx.tokenType)[0];
  const txType = Object.keys(tx.transactionType)[0];

  div.innerHTML = `
    <div class="transaction-details">
      <div class="transaction-hash">${tx.hash}</div>
      <div class="transaction-addresses">
        <span class="address">${truncateAddress(tx.fromAddress)}</span>
        <i class="fas fa-arrow-right"></i>
        <span class="address">${truncateAddress(tx.toAddress)}</span>
      </div>
      <div class="transaction-type">${txType}</div>
    </div>
    <div class="transaction-meta">
      <div class="transaction-amount">${amount.toFixed(8)} ${tokenType}</div>
      <span class="status-badge ${statusDisplay.statusClass}">${
    statusDisplay.statusText
  }</span>
    </div>
  `;

  return div;
}

function getTransactionStatusDisplay(tx) {
  const statusClass = `status-${
    "Pending" in tx.status
      ? "pending"
      : "Confirmed" in tx.status
      ? "confirmed"
      : "failed"
  }`;
  const statusText = Object.keys(tx.status)[0];
  const amount = Number(tx.amount) / 100000000;
  const tokenType = Object.keys(tx.tokenType)[0];
  const txType = Object.keys(tx.transactionType)[0];

  return { statusClass, statusText, amount, tokenType, txType };
}

async function loadAllTransactions() {
  if (!canisterActor) return;

  try {
    showLoading(true);
    const transactions = await canisterActor.getAllTransactions();
    displayTransactionsList(transactions);
  } catch (error) {
    console.error("Error loading transactions:", error);
    showToast("Error loading transactions", "error");
  } finally {
    showLoading(false);
  }
}

function displayTransactionsList(transactions) {
  const container = document.getElementById("transactions-list");
  if (!container) return;

  container.innerHTML = "";

  if (transactions.length === 0) {
    container.innerHTML =
      '<p class="text-muted text-center">No transactions found</p>';
    return;
  }

  // Sort by timestamp (newest first)
  transactions.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  transactions.forEach((tx) => {
    const txElement = createTransactionElement(tx);
    container.appendChild(txElement);
  });
}

async function loadUserWallets() {
  if (!canisterActor) return;

  try {
    showLoading(true);
    const wallets = await canisterActor.getUserWallets();
    displayWallets(wallets);
  } catch (error) {
    console.error("Error loading wallets:", error);
    showToast("Error loading wallets", "error");
  } finally {
    showLoading(false);
  }
}

function displayWallets(wallets) {
  const container = document.getElementById("wallets-grid");
  if (!container) return;

  container.innerHTML = "";

  if (wallets.length === 0) {
    container.innerHTML =
      '<p class="text-muted text-center">No wallets found</p>';
    return;
  }

  wallets.forEach((wallet) => {
    const walletElement = createWalletElement(wallet);
    container.appendChild(walletElement);
  });
}

function createWalletElement(wallet) {
  const div = document.createElement("div");
  div.className = "wallet-card";

  const display = getWalletDisplay(wallet);

  div.innerHTML = `
    <div class="wallet-header">
      <div class="wallet-label">${display.label}</div>
      <div class="wallet-type">${display.walletType}</div>
    </div>
    <div class="wallet-address">${wallet.address}</div>
    <div class="wallet-stats">
      <div class="wallet-stat">
        <strong>${wallet.totalTransactions}</strong>
        <div class="text-small text-muted">Transactions</div>
      </div>
      <div class="wallet-stat text-right">
        <strong>${display.lastTransaction}</strong>
        <div class="text-small text-muted">Last Activity</div>
      </div>
    </div>
  `;

  return div;
}

function getWalletDisplay(wallet) {
  const walletType = Object.keys(wallet.walletType)[0];
  const label =
    wallet.walletLabel.length > 0
      ? wallet.walletLabel[0]
      : `Wallet ${wallet.id}`;
  const lastTransaction =
    wallet.lastTransactionAt.length > 0
      ? new Date(
          Number(wallet.lastTransactionAt[0]) / 1000000
        ).toLocaleDateString()
      : "Never";

  return { walletType, label, lastTransaction };
}

function updateProfileDisplay(principal) {
  const container = document.getElementById("profile-info");
  if (!container) return;

  container.innerHTML = `
    <h3>Account Information</h3>
    <div class="profile-field">
      <label>Principal ID:</label>
      <div class="profile-value" style="font-family: monospace; font-size: 0.9em; word-break: break-all;">
        ${principal.toString()}
      </div>
    </div>
    <div class="profile-field">
      <label>Status:</label>
      <div class="profile-value">
        ${
          isConnected
            ? '<span style="color: var(--success-color);">✅ Connected</span>'
            : '<span style="color: var(--error-color);">❌ Disconnected</span>'
        }
      </div>
    </div>
  `;
}

// Form Handling
function setupForms() {
  const registerForm = document.getElementById("register-form");
  const transactionForm = document.getElementById("transaction-form");
  const walletForm = document.getElementById("wallet-form");

  if (registerForm)
    registerForm.addEventListener("submit", handleUserRegistration);
  if (transactionForm)
    transactionForm.addEventListener("submit", handleTransactionRecord);
  if (walletForm) walletForm.addEventListener("submit", handleWalletCreation);
}

async function handleUserRegistration(e) {
  e.preventDefault();

  if (!isConnected || !canisterActor) {
    showToast("Not connected to backend", "error");
    return;
  }

  const roleSelect = document.getElementById("role-select");
  const nameInput = document.getElementById("user-name");
  const emailInput = document.getElementById("user-email");

  const role = { [roleSelect.value]: null };
  const name = nameInput.value;
  const email = emailInput.value;

  try {
    showLoading(true);
    const result = await canisterActor.registerUser(role, name, email);

    if ("ok" in result) {
      showToast("User registered successfully!", "success");
      currentUser = result.ok;
      updateProfileDisplay(result.ok.principal);
      e.target.reset();
    } else {
      showToast(`Registration failed: ${result.err}`, "error");
    }
  } catch (error) {
    console.error("Registration error:", error);
    showToast("Registration failed", "error");
  } finally {
    showLoading(false);
  }
}

async function handleTransactionRecord(e) {
  e.preventDefault();

  if (!isConnected || !canisterActor) {
    showToast("Not connected to backend", "error");
    return;
  }

  const fromAddress = document.getElementById("from-address").value;
  const toAddress = document.getElementById("to-address").value;
  const amount = BigInt(
    Math.floor(parseFloat(document.getElementById("amount").value) * 100000000)
  );
  const tokenTypeSelect = document.getElementById("token-type");
  const transactionTypeSelect = document.getElementById("transaction-type");
  const blockHeightInput = document.getElementById("block-height");
  const hashInput = document.getElementById("tx-hash");
  const memoTextarea = document.getElementById("memo");

  const tokenType = { [tokenTypeSelect.value]: null };
  const transactionType = { [transactionTypeSelect.value]: null };
  const blockHeight = blockHeightInput.value
    ? [BigInt(blockHeightInput.value)]
    : [];
  const hash = hashInput.value ? [hashInput.value] : [];
  const memo = memoTextarea.value ? [memoTextarea.value] : [];

  try {
    showLoading(true);
    const result = await canisterActor.recordTransaction(
      fromAddress,
      toAddress,
      amount,
      tokenType,
      transactionType,
      hash,
      blockHeight,
      memo
    );

    if ("ok" in result) {
      showToast("Transaction recorded successfully!", "success");
      closeModal("record-transaction-modal");
      e.target.reset();

      // Refresh data
      await loadSystemStats();
      if (getCurrentSection() === "transactions") {
        await loadAllTransactions();
      } else if (getCurrentSection() === "dashboard") {
        await loadDashboardData();
      }
    } else {
      showToast(`Transaction recording failed: ${result.err}`, "error");
    }
  } catch (error) {
    console.error("Transaction recording error:", error);
    showToast("Transaction recording failed", "error");
  } finally {
    showLoading(false);
  }
}

async function handleWalletCreation(e) {
  e.preventDefault();

  if (!isConnected || !canisterActor) {
    showToast("Not connected to backend", "error");
    return;
  }

  const addressInput = document.getElementById("wallet-address");
  const typeSelect = document.getElementById("wallet-type");
  const labelInput = document.getElementById("wallet-label");

  const address = addressInput.value;
  const walletType = { [typeSelect.value]: null };
  const label = labelInput.value ? [labelInput.value] : [];

  try {
    showLoading(true);
    const result = await canisterActor.createWallet(address, walletType, label);

    if ("ok" in result) {
      showToast("Wallet created successfully!", "success");
      closeModal("add-wallet-modal");
      e.target.reset();

      // Refresh data
      await loadSystemStats();
      if (getCurrentSection() === "wallets") {
        await loadUserWallets();
      }
    } else {
      showToast(`Wallet creation failed: ${result.err}`, "error");
    }
  } catch (error) {
    console.error("Wallet creation error:", error);
    showToast("Wallet creation failed", "error");
  } finally {
    showLoading(false);
  }
}

// Filter Functions
async function applyFilters() {
  if (!isConnected || !canisterActor) return;

  const statusFilter = document.getElementById("status-filter").value;
  const addressFilter = document.getElementById("address-filter").value;

  try {
    showLoading(true);
    let transactions;

    if (statusFilter) {
      const status = { [statusFilter]: null };
      transactions = await canisterActor.getTransactionsByStatus(status);
    } else if (addressFilter) {
      transactions = await canisterActor.getTransactionsByAddress(
        addressFilter
      );
    } else {
      transactions = await canisterActor.getAllTransactions();
    }

    displayTransactionsList(transactions);
  } catch (error) {
    console.error("Error applying filters:", error);
    showToast("Error applying filters", "error");
  } finally {
    showLoading(false);
  }
}

function clearFilters() {
  const statusFilter = document.getElementById("status-filter");
  const addressFilter = document.getElementById("address-filter");

  if (statusFilter) statusFilter.value = "";
  if (addressFilter) addressFilter.value = "";
  loadAllTransactions();
}

// Modal Functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// Close modal when clicking outside
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    closeModal(e.target.id);
  }
});

// Loading Overlay
function showLoading(show) {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) return;

  if (show) {
    overlay.classList.add("active");
  } else {
    overlay.classList.remove("active");
  }
}

// Toast Notifications
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon =
    type === "success"
      ? "check-circle"
      : type === "error"
      ? "exclamation-circle"
      : "info-circle";

  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.remove();
  }, 5000);

  // Remove on click
  toast.addEventListener("click", () => {
    toast.remove();
  });
}

// Utility Functions
function truncateAddress(address, start = 8, end = 8) {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

function formatTimestamp(timestamp) {
  return new Date(Number(timestamp) / 1000000).toLocaleString();
}

function formatAmount(amount, decimals = 8) {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(decimals);
}

// Global functions for HTML onclick handlers
window.showSection = showSection;
window.openModal = openModal;
window.closeModal = closeModal;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
