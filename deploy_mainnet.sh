#!/bin/bash

# Blockchain Transaction Tracker - ICP Mainnet Deployment Script
# This script helps you deploy to the Internet Computer mainnet

set -e  # Exit on any error

echo "🚀 Blockchain Transaction Tracker - ICP Mainnet Deployment"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_important() {
    echo -e "${MAGENTA}[IMPORTANT]${NC} $1"
}

# Check if dfx is installed
check_dfx() {
    if ! command -v dfx &> /dev/null; then
        print_error "DFX is not installed. Please install it first:"
        print_error "sh -ci \"\$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
        exit 1
    fi
    print_success "DFX is installed: $(dfx --version)"
}

# Check cycles wallet
check_wallet() {
    print_status "Checking cycles wallet configuration..."
    
    if ! dfx identity get-wallet --network ic &> /dev/null; then
        print_error "No cycles wallet configured for mainnet!"
        print_error "You need to:"
        print_error "1. Get cycles from DFINITY or exchange"
        print_error "2. Set up a cycles wallet"
        print_error "3. Configure wallet ID with: dfx identity --network ic set-wallet <WALLET_ID>"
        exit 1
    fi
    
    WALLET_ID=$(dfx identity get-wallet --network ic)
    print_success "Cycles wallet configured: $WALLET_ID"
    
    # Check balance
    print_status "Checking cycles balance..."
    BALANCE=$(dfx wallet --network ic balance)
    print_success "Current balance: $BALANCE"
    
    # Warn if balance is low
    if [[ "$BALANCE" == *"0."* ]] || [[ "$BALANCE" == "0 TC" ]]; then
        print_warning "Your cycles balance appears to be low!"
        print_warning "Make sure you have enough cycles for deployment (typically ~1-5 TC)"
    fi
}

# Deploy to mainnet
deploy_to_mainnet() {
    print_status "Deploying to ICP mainnet..."
    print_important "This will consume cycles from your wallet!"
    
    read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled by user"
        exit 0
    fi
    
    print_status "Starting mainnet deployment..."
    dfx deploy --network ic backend
    
    # Get canister ID
    CANISTER_ID=$(dfx canister id backend --network ic)
    print_success "Backend deployed to mainnet with canister ID: $CANISTER_ID"
    
    # Save canister ID to environment file
    echo "export BACKEND_CANISTER_ID_MAINNET=$CANISTER_ID" > .env.mainnet
    print_success "Mainnet canister ID saved to .env.mainnet file"
}

# Test mainnet deployment
test_mainnet() {
    print_status "Testing mainnet deployment..."
    
    # Source the environment file to get canister ID
    if [ -f ".env.mainnet" ]; then
        source .env.mainnet
    fi
    
    # Test the health check endpoint
    if dfx canister --network ic call backend healthCheck; then
        print_success "Mainnet health check passed!"
    else
        print_error "Mainnet health check failed!"
        return 1
    fi
}

# Show mainnet usage information
show_mainnet_usage() {
    echo ""
    print_success "Mainnet deployment completed successfully! 🎉"
    echo ""
    echo "📍 Your canister is now live on the Internet Computer!"
    
    if [ -f ".env.mainnet" ]; then
        source .env.mainnet
        echo ""
        echo "🆔 Canister ID: $BACKEND_CANISTER_ID_MAINNET"
        echo "🌐 Canister URL: https://$BACKEND_CANISTER_ID_MAINNET.ic0.app"
        echo ""
        echo "🔧 Management commands:"
        echo "  dfx canister --network ic status backend"
        echo "  dfx canister --network ic call backend healthCheck"
        echo "  dfx canister --network ic call backend getSystemStats"
        echo ""
        echo "💰 Check cycles usage:"
        echo "  dfx wallet --network ic balance"
        echo "  dfx canister --network ic status backend"
        echo ""
        echo "📊 Monitor your canister:"
        echo "  https://dashboard.internetcomputer.org/canister/$BACKEND_CANISTER_ID_MAINNET"
    fi
    
    print_important "Save your canister ID somewhere safe!"
    print_important "You'll need it to interact with your deployed application."
}

# Main deployment process
main() {
    print_status "Starting mainnet deployment process..."
    
    check_dfx
    check_wallet
    deploy_to_mainnet
    
    if test_mainnet; then
        print_success "All mainnet deployment steps completed!"
        show_mainnet_usage
    else
        print_error "Deployment completed but tests failed. Check your deployment."
    fi
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Blockchain Transaction Tracker Mainnet Deployment Script"
        echo ""
        echo "Prerequisites:"
        echo "  1. Install DFX: sh -ci \"\$(curl -fsSL https://sdk.dfinity.org/install.sh)\""
        echo "  2. Get cycles from DFINITY or exchange"
        echo "  3. Set up cycles wallet"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Check setup without deploying"
        echo ""
        ;;
    --check)
        print_status "Checking mainnet deployment setup..."
        check_dfx
        check_wallet
        print_success "Setup check completed!"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        print_error "Use --help for usage information"
        exit 1
        ;;
esac

