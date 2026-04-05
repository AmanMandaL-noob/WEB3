# 🚀 DeFi DEX Protocol + MEV Bot System

A complete mini Uniswap-like DEX system with a sophisticated mempool bot for MEV sandwich attack simulation.

**Status:** Production-Ready | **Difficulty:** Senior Level | **Components:** 3 (Contracts, Frontend, Bot)

---

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Running the System](#running-the-system)
6. [Component Details](#component-details)
7. [Testing Guide](#testing-guide)
8. [MEV Sandwich Attack Explanation](#mev-sandwich-attack-explanation)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Blockchain (Anvil)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Smart Contracts (Hardhat)                    │   │
│  ├─ MockToken (ERC20): USDC, DAI, WETH                 │   │
│  ├─ DexPool: Liquidity Pool (x*y=k formula)            │   │
│  └─ DexOperator: Transaction executor                  │   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Mempool (Transaction Queue)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ↑                           ↑
           │                           │
      ┌────┴─────────┐         ┌──────┴──────┐
      │   Frontend    │         │   MEV Bot    │
      │   (React)     │         │ (Node.js)    │
      │               │         │              │
      │ • MetaMask    │         │ • Monitoring │
      │ • Swap UI     │         │ • Decoding   │
      │ • Liquidity   │         │ • Execution  │
      │ • Positions   │         │ • Analysis   │
      └───────────────┘         └──────────────┘
```

---

## ✨ Features

### 1. **Smart Contracts** 
- ✅ `MockToken.sol` - ERC20 tokens (USDC, DAI, WETH)
- ✅ `DexPool.sol` - AMM pool with x*y=k formula
- ✅ `DexOperator.sol` - Contract for MEV operations

### 2. **Frontend dApp (React)**
- ✅ MetaMask wallet integration
- ✅ Swap interface with slippage control
- ✅ Liquidity pool operations (add/remove)
- ✅ Position management dashboard
- ✅ Modern, responsive UI design
- ✅ Real-time balance updates

### 3. **Mempool Bot (Node.js)**
- ✅ Transaction monitoring
- ✅ Calldata decoding
- ✅ Sandwich attack simulation
- ✅ Profit calculation
- ✅ Real-time gas price optimization

---

## 📦 Prerequisites

### Required Tools
- **Node.js**: v16+ (https://nodejs.org/)
- **npm**: v8+ (comes with Node.js)
- **Git**: For version control
- **MetaMask**: Browser extension

### System Requirements
- **RAM**: 4GB minimum
- **Disk**: 2GB free space
- **OS**: Windows, macOS, Linux

---

## 🔧 Installation & Setup

### Step 1: Clone/Setup Project Structure

```bash
cd "g:\DEFI 2"

# Verify directory structure
```

The project has three main folders:
- `contracts/` - Smart contracts
- `frontend/` - React dApp
- `bot/` - MEV bot

### Step 2: Install Smart Contracts Dependencies

```bash
cd contracts
npm install
```

**Expected output:**
```
added X packages in Y seconds
```

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 4: Install Bot Dependencies

```bash
cd ../bot
npm install
```

---

## 🚀 Running the System

### Terminal 1: Start Local Blockchain (Anvil)

```bash
cd contracts
npx hardhat node --hostname 0.0.0.0
```

**Expected output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545

Accounts (10 available) and private keys:
(0) 0xf39... (1000 ETH)
(1) 0x70... (1000 ETH)
...

listening on 127.0.0.1:8545
```

**Keep this terminal running!** ⚠️

---

### Terminal 2: Deploy Contracts

```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Expected output:**
```
Starting deployment...
Deploying contracts with account: 0xf39...

Deploying Token A (USDC)...
Token A deployed to: 0x5FbDB...

Deploying Token B (DAI)...
Token B deployed to: 0xe7f1...

Deploying Token C (WETH)...
Token C deployed to: 0x9fE4...

Deploying DEX Pool (USDC/DAI)...
Pool AB deployed to: 0xCf7e...

Deploying DEX Pool (DAI/WETH)...
Pool BC deployed to: 0x98Ab...

Deploying DEX Operator...
Operator deployed to: 0xf8a...

✅ DEPLOYMENT COMPLETE

Token A (USDC): 0x5FbDB...
Token B (DAI): 0xe7f1...
Token C (WETH): 0x9fE4...
Pool AB (USDC/DAI): 0xCf7e...
Pool BC (DAI/WETH): 0x98Ab...
Operator: 0xf8a...
```

**Save these addresses!** You'll need them for the frontend and bot.

---

### Terminal 3: Start Frontend

```bash
cd frontend
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view defi-dapp in the browser.
  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000

Note that the development build is not optimized.
```

**Open your browser to:** http://localhost:3000

---

### Terminal 4: Start MEV Bot

```bash
cd bot
node bot.js
```

**Expected output:**
```
🚀 Mempool Bot Started
📍 Pool Address: 0xCf7e...
💼 Bot Address: 0xf39...
🔗 RPC: http://127.0.0.1:8545

📨 Pending transaction detected: 0x...
```

**The bot is now listening for transactions!** ⚠️

---

## 🧩 Component Details

### Smart Contracts

#### DexPool.sol
- **x*y=k formula** for price discovery
- **0.3% fee** on each swap
- **Liquidity tokens (LP)** for position tracking
- **Price oracles** via `getPrice0()` and `getPrice1()`

Key functions:
```solidity
function swap(uint256 amountIn, uint256 minAmountOut, address tokenIn) 
  → Returns output amount

function addLiquidity(uint256 amount0, uint256 amount1, uint256 minLiquidity)
  → Returns LP tokens minted

function removeLiquidity(uint256 liquidity, uint256 minAmount0, uint256 minAmount1)
  → Returns token amounts
```

#### MockToken.sol
- Standard ERC20 implementation
- Configurable decimals (6 or 18)
- Minting capability for testing

#### DexOperator.sol
- Facilitates swaps from external contracts
- Used by MEV bot for transactions

---

### Frontend Features

#### Wallet Integration
- **MetaMask connection/disconnection**
- **Real-time balance display**
- **Network detection**
- **Account switching support**

#### Swap Interface
- **Token input/output selection**
- **Slippage tolerance control (0.1%, 0.5%, 1.0%, custom)**
- **Real-time price estimates**
- **Transaction status indicators**

#### Liquidity Management
- **Add liquidity** with two token amounts
- **Remove liquidity** by burning LP tokens
- **View active positions**
- **Fee earnings tracking**

#### UI/UX
- Modern glassmorphic design
- Dark theme optimized for traders
- Responsive layout (mobile & desktop)
- Real-time gas price display

---

### MEV Bot Features

#### Mempool Monitoring
```javascript
// Listens for pending transactions targeting the DEX pool
provider.on('pending', async (txHash) => {
  // Analyze transaction
  // Determine if exploitable
  // Execute sandwich attack if profitable
});
```

#### Transaction Decoding
- **Function selector parsing**
- **Calldata extraction**
- **Parameter decoding**
- **Gas price analysis**

#### Sandwich Attack Logic
1. **Front-Run**: Buy tokens to increase price
2. **Victim**: Their transaction executes at worse price
3. **Back-Run**: Sell tokens at inflated prices
4. **Profit**: Capture price difference

---

## 🧪 Testing Guide

### Test 1: MetaMask Connection

1. Open frontend (http://localhost:3000)
2. Click "Connect MetaMask"
3. **Expected:** Wallet connects, shows address and balance

### Test 2: Add Liquidity

1. Navigate to "Liquidity" tab
2. Enter amounts for both tokens (e.g., 100 USDC + 100 DAI)
3. Click "Add Liquidity"
4. **Expected:** Transaction confirms, LP tokens appear in balance

### Test 3: Execute Swap

1. Navigate to "Swap" tab
2. Select token pair
3. Enter swap amount
4. Adjust slippage if needed
5. Click "Swap"
6. **Expected:** Output calculated, transaction confirmed

### Test 4: Trigger MEV Bot

**In a separate terminal:**
```bash
cd contracts
npx hardhat run scripts/test-transaction.js --network localhost
```

**Expected in bot terminal:**
```
📨 Pending transaction detected: 0x...
🔍 Function: swap
⚠️ Exploitable! Profitability: HIGH
🥪 [SANDWICH ATTACK INITIATED]
  2️⃣ [EXECUTION] Starting sandwich sequence...
  3️⃣ [VICTIM] Waiting for transaction...
  4️⃣ [EXIT] Executing back-run...
✅ Sandwich attack completed!
```

---

## 🥪 MEV Sandwich Attack Explanation

### What is MEV (Maximal Extractable Value)?

MEV is the profit a bot can extract by reordering/inserting transactions on-chain.

### How the Sandwich Attack Works

```
MEMPOOL STATE:
├─ Tx 1: Victim swap 100 DAI → USDC
├─ Tx 2: (bot inserts front-run)
├─ Tx 3: (victim executes at worse price)
└─ Tx 4: (bot inserts back-run)

PRICE IMPACT:
Victim's swap moves price against them:
- Before: 1 DAI = 1 USDC
- Front-run: Bot buys DAI → increases to 1.005
- Victim: Swaps at 1.005 (worse than expected)
- Back-run: Bot sells at 1.005 (profit!)

PROFIT CALCULATION:
- Bot spends: 100 gas
- Bot makes: Difference in price × amount
- Net: Profit if price movement > gas cost
```

### Real-World Impact

This represents **real MEV** that:
- ✅ Happens on actual exchanges (Uniswap, dYdX)
- ✅ Costs users money (~$10B annually)
- ✅ Is why MEV protection exists (MEV-Burn, etc.)

---

## 🐛 Troubleshooting

### Issue: MetaMask Won't Connect

**Symptom:** "MetaMask not installed" error

**Solution:**
```bash
# 1. Install MetaMask extension
# 2. Open MetaMask
# 3. Create account or import existing
# 4. Switch to localhost network (127.0.0.1:8545)
# 5. Refresh browser
```

### Issue: Contracts Not Found

**Symptom:** "Contract at address does not exist"

**Solution:**
```bash
# 1. Verify deployment completed successfully
# 2. Check deployment addresses match frontend
# 3. Restart blockchain: Ctrl+C then npx hardhat node
# 4. Redeploy: npx hardhat run scripts/deploy.js
```

### Issue: Bot Not Detecting Transactions

**Symptom:** Bot runs but doesn't show pending transactions

**Solution:**
```bash
# 1. Ensure blockchain is running (Terminal 1)
# 2. Check RPC URL matches: http://127.0.0.1:8545
# 3. Verify contract addresses in bot config
# 4. Restart bot: Ctrl+C then node bot.js
```

### Issue: Gas Estimation Failed

**Symptom:** "call revert exception" in transaction

**Solution:**
```bash
# 1. Increase gas limit in code
# 2. Check token approvals are working
# 3. Ensure sufficient balance
# 4. Reset blockchain state: Ctrl+C then npx hardhat node
```

---

## 📊 Architecture Decisions

### Why x*y=k Formula?
- Simple and proven
- Efficient calculation
- Gas-optimized
- Same as Uniswap V2 & Balancer

### Why Hardhat for Contracts?
- Better DX than Truffle
- HardHat node = perfect for local testing
- Industry standard

### Why React for Frontend?
- Component reusability
- State management (context API)
- Web3 library integration (ethers.js)
- Hot reload for development

### Why Node.js for Bot?
- Async/await support
- Perfect for monitoring loops
- Quick execution
- Easy deployment

---

## 🎯 What's Implemented vs. What Could Be Enhanced

### ✅ Fully Implemented
- [x] Local blockchain with contracts
- [x] DEX pool with AMM logic
- [x] Frontend with wallet integration
- [x] Swap functionality
- [x] Liquidity management
- [x] Mempool monitoring
- [x] Transaction decoding
- [x] Sandwich attack execution
- [x] Profit calculation
- [x] Modern UI/UX

### ⚠️ Partial (Production Would Include)
- [ ] Advanced slippage protection
- [ ] Multi-hop routing
- [ ] Liquidity mining rewards
- [ ] Flash loans
- [ ] Price oracles (Chainlink)
- [ ] governance tokens (DAO)

### 🔄 Alternative Implementations
- **Contracts**: Could use Solidity 0.7.x with different optimizer
- **Frontend**: Could use Vue.js, Svelte instead of React
- **Bot**: Could use Rust (faster execution) or Go

---

## 📚 Additional Resources

- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf)
- [Flashbots MEV Documentation](https://docs.flashbots.net/)
- [Solidity Security Best Practices](https://docs.soliditylang.org/)]
- [ethers.js Documentation](https://docs.ethers.org/)
- [MEV-Explore Dashboard](https://mev-explore.flashbots.net/)

---

## 💡 Tips for Best Results

1. **Keep all 4 terminals open** during testing
2. **Use consistent addresses** between components
3. **Monitor bot output** for transaction details
4. **Start with small amounts** (1-10 tokens)
5. **Check gas prices** - set reasonable limits
6. **Use 0.5% slippage** for stable pairs
7. **Record successful attacks** for presentation

---

## 📞 Support

For issues:
1. Check the Troubleshooting section
2. Verify all prerequisites are installed
3. Ensure addresses are correctly configured
4. Check browser console for frontend errors
5. Check terminal output for backend errors

---

**Built with ❤️ for Web3 Engineers**

*Last Updated: 2024*
#   W E B 3  
 #   W E B 3  
 #   W E B 3  
 