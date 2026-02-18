#!/usr/bin/env node

// Simple API testing script for Blockchain Transaction Tracker
// Run with: node test_api.js

const { Actor, HttpAgent } = require("@dfinity/agent");
const { Principal } = require("@dfinity/principal");

// This will be populated after deployment
const CANISTER_ID =
  process.env.BACKEND_CANISTER_ID_MAINNET ||
  process.env.BACKEND_CANISTER_ID ||
  "YOUR_CANISTER_ID_HERE";

const agent = new HttpAgent({
  host: "https://ic0.app", // ICP Mainnet
});

// IDL interface for the backend canister
const idl = ({ IDL }) => {
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
    label: IDL.Opt(IDL.Text),
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

async function testAPI() {
  console.log("🚀 Starting Blockchain Transaction Tracker API Tests");
  console.log("📡 Connecting to ICP mainnet...");

  // Note: fetchRootKey() is not needed for mainnet (only for local development)

  try {
    const actor = Actor.createActor(idl, {
      agent,
      canisterId: CANISTER_ID,
    });

    console.log("\n✅ Connected to canister:", CANISTER_ID);

    // Test 1: Health Check
    console.log("\n🏥 Testing health check...");
    const healthCheck = await actor.healthCheck();
    console.log("Health check result:", healthCheck);

    // Test 2: Who Am I
    console.log("\n👤 Testing identity...");
    const identity = await actor.whoami();
    console.log("Current identity:", identity.toString());

    // Test 3: Register User
    console.log("\n📝 Testing user registration...");
    try {
      const userResult = await actor.registerUser(
        { User: null },
        "Test User",
        "test@example.com"
      );
      if (userResult.ok) {
        console.log("✅ User registered successfully:", userResult.ok);
      } else {
        console.log("❌ User registration failed:", userResult.err);
      }
    } catch (error) {
      console.log("❌ User registration error:", error.message);
    }

    // Test 4: Create Wallet
    console.log("\n💳 Testing wallet creation...");
    try {
      const walletResult = await actor.createWallet(
        "test-address-123456789",
        { InternetIdentity: null },
        ["Test Wallet"]
      );
      if (walletResult.ok) {
        console.log("✅ Wallet created successfully:", walletResult.ok);
      } else {
        console.log("❌ Wallet creation failed:", walletResult.err);
      }
    } catch (error) {
      console.log("❌ Wallet creation error:", error.message);
    }

    // Test 5: Record Transaction
    console.log("\n💸 Testing transaction recording...");
    try {
      const txResult = await actor.recordTransaction(
        "test-from-address",
        "test-to-address",
        100000000, // 1 ICP in e8s
        { ICP: null },
        { Transfer: null },
        [],
        [],
        ["Test transaction"]
      );
      if (txResult.ok) {
        console.log("✅ Transaction recorded successfully:", txResult.ok);
      } else {
        console.log("❌ Transaction recording failed:", txResult.err);
      }
    } catch (error) {
      console.log("❌ Transaction recording error:", error.message);
    }

    // Test 6: Get System Stats
    console.log("\n📊 Testing system statistics...");
    try {
      const stats = await actor.getSystemStats();
      console.log("✅ System statistics:", stats);
    } catch (error) {
      console.log("❌ System statistics error:", error.message);
    }

    // Test 7: Get All Transactions
    console.log("\n📋 Testing transaction listing...");
    try {
      const transactions = await actor.getAllTransactions();
      console.log("✅ All transactions:", transactions);
    } catch (error) {
      console.log("❌ Transaction listing error:", error.message);
    }

    console.log("\n🎉 API testing completed!");
  } catch (error) {
    console.error("❌ Failed to connect to canister:", error.message);
    console.log("\n💡 Make sure your canister is deployed to ICP mainnet:");
    console.log("   ./deploy_mainnet.sh");
    console.log("   or set BACKEND_CANISTER_ID_MAINNET environment variable");
  }
}

// Usage instructions
function printUsage() {
  console.log(`
📖 Blockchain Transaction Tracker API Tester

Usage:
  node test_api.js

Prerequisites:
  1. Install dependencies: npm install
  2. Deploy to ICP mainnet: ./deploy_mainnet.sh
  3. Run this script: node test_api.js

Environment Variables:
  BACKEND_CANISTER_ID_MAINNET - Mainnet canister ID (from deployment)
  BACKEND_CANISTER_ID - Alternative canister ID

Examples:
  # Basic usage (reads from .env.mainnet)
  node test_api.js

  # With custom canister ID
  BACKEND_CANISTER_ID_MAINNET=your-canister-id node test_api.js
`);
}

// Check if help is requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printUsage();
  process.exit(0);
}

// Run the tests
testAPI().catch(console.error);
