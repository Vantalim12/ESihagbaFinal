# Blockchain Transaction Tracker

A secure, transparent, and efficient blockchain transaction tracking system built on the **Internet Computer Protocol (ICP)** using **Motoko** for the backend.

## 🏗️ Architecture Overview

```
Client Applications ↔ ICP Canister (Motoko) ↔ Internet Computer Blockchain
                              ↓
                         Identity & Authentication
                              ↓
                      Transaction Data & State Management
```

## 🚀 Features

- **Transaction Recording**: Record and track blockchain transactions across multiple networks
- **Multi-Token Support**: Support for ICP, ICRC-1 tokens, and custom tokens
- **Wallet Management**: Create and manage multiple cryptocurrency wallets
- **Real-time Status Tracking**: Monitor transaction status from pending to confirmed
- **Role-Based Access Control**: Admin, User, and Auditor permission levels
- **Comprehensive Statistics**: Track volume, transaction counts, and network activity
- **Blockchain Security**: All data secured on ICP blockchain with orthogonal persistence

## 📋 Supported Transaction Types

- **Transfer**: Standard token transfers between addresses
- **Mint**: Token creation transactions
- **Burn**: Token destruction transactions
- **Swap**: Token exchange transactions
- **Stake/Unstake**: Staking and unstaking operations
- **Custom**: Support for other transaction types

## 🛠️ Technology Stack

### Backend

- **Language**: Motoko
- **Platform**: Internet Computer Protocol
- **Features**: Actor model, orthogonal persistence, WebAssembly compilation
- **Storage**: On-chain data persistence with automatic backup/restore

### Supported Networks

- **Internet Computer**: Native ICP transactions
- **ICRC-1 Tokens**: Standard token interface support
- **Extensible**: Framework for adding additional blockchain networks

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)

   ```bash
   # Download from https://nodejs.org/
   ```

2. **DFX (DFINITY Canister SDK)**

   ```bash
   sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
   ```

3. **Git** (for version control)
   ```bash
   # Download from https://git-scm.com/
   ```

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)

**For Linux/macOS:**

```bash
# Clone the repository
git clone <your-repo-url>
cd blockchain-transaction-tracker

# Run automated deployment
./deploy.sh
```

**For Windows:**

```cmd
# Clone the repository
git clone <your-repo-url>
cd blockchain-transaction-tracker

# Run automated deployment
deploy.bat
```

### Option 2: Manual Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Local ICP Network**

   ```bash
   # Start the local replica
   dfx start --background
   ```

3. **Deploy Backend Canister**

   ```bash
   # Deploy to local network
   dfx deploy backend
   ```

4. **Test the Deployment**

   ```bash
   # Run health check
   dfx canister call backend healthCheck

   # Get system statistics
   dfx canister call backend getSystemStats
   ```

## 📝 Available Commands

```bash
# Development
npm start                  # Deploy locally and start services
npm test                   # Run health check test

# Deployment
npm run deploy:local       # Deploy to local ICP network
npm run deploy:ic          # Deploy to IC mainnet

# DFX Commands
dfx start                  # Start local ICP replica
dfx stop                   # Stop local ICP replica
dfx deploy backend         # Deploy backend canister
dfx canister status backend # Check backend canister status
```

## 🏗️ Project Structure

```
blockchain-transaction-tracker/
├── dfx.json                    # DFX configuration
├── package.json               # Node.js dependencies and scripts
├── deploy.sh                  # Unix deployment script
├── deploy.bat                 # Windows deployment script
├── test_api.js               # API testing script
├── README.md                 # This file
│
└── src/
    └── backend/              # Motoko canisters
        ├── main.mo           # Main transaction tracking logic
        ├── types.mo          # Data type definitions
        └── utils.mo          # Utility functions
```

## 🔐 API Overview

### User Management

- `registerUser(role, name, email)` - Register a new user
- `whoami()` - Get current user identity

### Wallet Management

- `createWallet(address, walletType, label)` - Create a new wallet
- `getWallet(id)` - Get wallet information
- `getUserWallets()` - Get all user's wallets

### Transaction Management

- `recordTransaction(...)` - Record a new transaction
- `confirmTransaction(id, blockHeight)` - Mark transaction as confirmed
- `failTransaction(id, reason)` - Mark transaction as failed
- `getTransaction(id)` - Get transaction details
- `getTransactionsByAddress(address)` - Get transactions for an address
- `getTransactionsByStatus(status)` - Filter transactions by status

### System Information

- `getSystemStats()` - Get system-wide statistics
- `healthCheck()` - Check system health

## 🧪 Testing the API

Use the provided test script to interact with your deployed canister:

```bash
# Run comprehensive API tests
node test_api.js

# Test specific endpoints with dfx
dfx canister call backend healthCheck
dfx canister call backend getSystemStats
```

## 👥 User Roles & Permissions

| Role        | Permissions                                                        |
| ----------- | ------------------------------------------------------------------ |
| **Admin**   | Full access: manage all data, modify transactions, view everything |
| **User**    | Create wallets and transactions, view own data                     |
| **Auditor** | Read-only access: view all transactions and wallets                |

## 📊 Transaction Status Flow

```
Pending → Confirmed ✅
    ↓
   Failed ❌
    ↓
  Cancelled 🚫
```

- **Pending**: Transaction recorded but not yet confirmed on blockchain
- **Confirmed**: Transaction verified and included in a block
- **Failed**: Transaction rejected or failed to process
- **Cancelled**: Transaction manually cancelled before confirmation

## 🚀 Deployment

### Local Deployment

```bash
# Using deployment script (recommended)
./deploy.sh

# Or manually
dfx start --background
dfx deploy backend
```

### IC Mainnet Deployment

```bash
# Ensure you have cycles for deployment
dfx wallet balance

# Deploy to mainnet
npm run deploy:ic
```

## 🔧 Configuration

The system supports various token types and wallet integrations:

### Supported Token Types

- **ICP**: Native Internet Computer tokens
- **ICRC-1**: Standard token interface
- **Custom**: Extensible for additional token types

### Supported Wallet Types

- Internet Identity
- Ledger Hardware Wallet
- Plug Wallet
- Stoic Wallet
- Custom wallet types

## 🐛 Troubleshooting

### Common Issues

1. **DFX won't start**

   ```bash
   dfx stop
   dfx start --clean --background
   ```

2. **Canister deployment fails**

   ```bash
   dfx stop
   rm -rf .dfx
   dfx start --background
   dfx deploy backend
   ```

3. **Permission denied errors**

   - Ensure user is registered: `dfx canister call backend registerUser '(variant { User }, "Your Name", "email@example.com")'`

4. **Transaction recording fails**
   - Verify address format is correct
   - Check that amount is greater than 0
   - Ensure user has sufficient permissions

## 📚 API Examples

### Register a User

```bash
dfx canister call backend registerUser '(variant { User }, "John Doe", "john@example.com")'
```

### Create a Wallet

```bash
dfx canister call backend createWallet '("test-address-123", variant { InternetIdentity }, opt "My Wallet")'
```

### Record a Transaction

```bash
dfx canister call backend recordTransaction '(
  "sender-address",
  "receiver-address",
  100000000:nat,
  variant { ICP },
  variant { Transfer },
  null,
  null,
  opt "Payment for services"
)'
```

### Get System Statistics

```bash
dfx canister call backend getSystemStats
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For technical support or questions:

- Create an issue in the repository
- Check the troubleshooting section above
- Review the API documentation

## 🌟 Features Roadmap

- [ ] Multi-network support (Bitcoin, Ethereum)
- [ ] Advanced filtering and search
- [ ] Transaction fee optimization
- [ ] Batch transaction processing
- [ ] Real-time notifications
- [ ] Enhanced security features
- [ ] Performance optimizations

---

**Built with ❤️ for transparent blockchain transaction tracking on the Internet Computer Protocol**
