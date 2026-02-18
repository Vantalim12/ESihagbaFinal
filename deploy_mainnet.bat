@echo off
REM Blockchain Transaction Tracker - ICP Mainnet Deployment Script for Windows
REM This script helps you deploy to the Internet Computer mainnet

echo 🚀 Blockchain Transaction Tracker - ICP Mainnet Deployment
echo =======================================================

REM Check if dfx is installed
dfx --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ [ERROR] DFX is not installed. Please install it first:
    echo    For Windows: Download from https://github.com/dfinity/sdk/releases
    echo    Or use WSL: sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
    pause
    exit /b 1
)
echo ✅ [SUCCESS] DFX is installed

REM Check cycles wallet
echo 🔍 [INFO] Checking cycles wallet configuration...
dfx identity get-wallet --network ic >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ [ERROR] No cycles wallet configured for mainnet!
    echo.
    echo You need to:
    echo   1. Get cycles from DFINITY or exchange
    echo   2. Set up a cycles wallet
    echo   3. Configure wallet ID with: dfx identity --network ic set-wallet WALLET_ID
    echo.
    echo For help getting cycles, visit: https://internetcomputer.org/docs/current/developer-docs/setup/cycles/
    pause
    exit /b 1
)

for /f %%i in ('dfx identity get-wallet --network ic') do set WALLET_ID=%%i
echo ✅ [SUCCESS] Cycles wallet configured: %WALLET_ID%

REM Check balance
echo 💰 [INFO] Checking cycles balance...
for /f "tokens=*" %%i in ('dfx wallet --network ic balance') do set BALANCE=%%i
echo ✅ [SUCCESS] Current balance: %BALANCE%

REM Warn if balance might be low
echo %BALANCE% | findstr /C:"0." >nul
if %errorlevel% equ 0 (
    echo ⚠️  [WARNING] Your cycles balance might be low!
    echo    Make sure you have enough cycles for deployment (typically 1-5 TC)
)

REM Deploy to mainnet
echo 🚀 [INFO] Ready to deploy to ICP mainnet...
echo ⚠️  [IMPORTANT] This will consume cycles from your wallet!
echo.
set /p "CONFIRM=Are you sure you want to proceed? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo 🛑 [INFO] Deployment cancelled by user
    pause
    exit /b 0
)

echo 📡 [INFO] Starting mainnet deployment...
dfx deploy --network ic backend
if %errorlevel% neq 0 (
    echo ❌ [ERROR] Failed to deploy to mainnet
    echo    Check your cycles balance and network connection
    pause
    exit /b 1
)

REM Get canister ID
for /f %%i in ('dfx canister id backend --network ic') do set CANISTER_ID=%%i
echo ✅ [SUCCESS] Backend deployed to mainnet with canister ID: %CANISTER_ID%

REM Save canister ID to environment file
echo set BACKEND_CANISTER_ID_MAINNET=%CANISTER_ID% > .env.mainnet.bat
echo ✅ [SUCCESS] Mainnet canister ID saved to .env.mainnet.bat file

REM Test mainnet deployment
echo 🏥 [INFO] Testing mainnet deployment...
dfx canister --network ic call backend healthCheck
if %errorlevel% neq 0 (
    echo ❌ [ERROR] Mainnet health check failed!
    echo    Your canister may still be deployed but not responding correctly
) else (
    echo ✅ [SUCCESS] Mainnet health check passed!
)

echo.
echo 🎉 [SUCCESS] Mainnet deployment completed successfully!
echo.
echo 📍 Your canister is now live on the Internet Computer!
echo.
echo 🆔 Canister ID: %CANISTER_ID%
echo 🌐 Canister URL: https://%CANISTER_ID%.ic0.app
echo.
echo 🔧 Management commands:
echo    dfx canister --network ic status backend
echo    dfx canister --network ic call backend healthCheck
echo    dfx canister --network ic call backend getSystemStats
echo.
echo 💰 Check cycles usage:
echo    dfx wallet --network ic balance
echo    dfx canister --network ic status backend
echo.
echo 📊 Monitor your canister:
echo    https://dashboard.internetcomputer.org/canister/%CANISTER_ID%
echo.
echo ⚠️  [IMPORTANT] Save your canister ID somewhere safe!
echo    You'll need it to interact with your deployed application.
echo.
pause

