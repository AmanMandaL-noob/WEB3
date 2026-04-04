@echo off
REM Windows batch setup script

echo.
echo ===================================================
echo   DeFi DEX System - Setup Script (Windows)
echo ===================================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js v16+
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo OK: Node.js %NODE_VERSION% found
echo.

REM Check npm
echo [2/5] Checking npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo OK: npm %NPM_VERSION% found
echo.

REM Install contracts
echo [3/5] Installing contracts dependencies...
cd contracts
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to install contracts dependencies
    exit /b 1
)
echo OK: Contracts dependencies installed
echo.

REM Install frontend
echo [4/5] Installing frontend dependencies...
cd ..\frontend
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)
echo OK: Frontend dependencies installed
echo.

REM Install bot
echo [5/5] Installing bot dependencies...
cd ..\bot
call npm install >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Failed to install bot dependencies
    exit /b 1
)
echo OK: Bot dependencies installed
echo.

echo ===================================================
echo OK: Setup completed successfully!
echo ===================================================
echo.

echo Next steps:
echo   1. Open Terminal 1: cd contracts ^&^& npx hardhat node
echo   2. Open Terminal 2: cd contracts ^&^& npx hardhat run scripts/deploy.js --network localhost
echo   3. Open Terminal 3: cd frontend ^&^& npm start
echo   4. Open Terminal 4: cd bot ^&^& node bot.js
echo.
echo Frontend URL: http://localhost:3000
echo Blockchain RPC: http://127.0.0.1:8545
echo.
pause
