# ⚡ Step-by-Step Execution Guide

Copy and paste these commands exactly in the right order.

---

## 📋 Prerequisites Check

**Verify before starting:**

```bash
node --version    # Should be v16 or higher
npm --version     # Should be v8 or higher
```

If not installed, download from https://nodejs.org/

---

## 🚀 Start System (Follow in Order)

### Step 1: Install All Dependencies (Run Once)

**Windows:**
```bash
setup.bat
```

**macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

Wait for all dependencies to install. Should see "Setup completed successfully!"

---

### Step 2: Open 4 Terminal Windows

You'll need these running simultaneously:
- Terminal 1: Blockchain
- Terminal 2: Contracts deployment
- Terminal 3: Frontend
- Terminal 4: MEV Bot

---

## 💻 Terminal Commands

### 📍 TERMINAL 1: Setup Local Blockchain

```bash
cd "g:\DEFI 2"
cd contracts
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545
Accounts (10 available) and private keys:
(0) 0xf39Fd6e51aad88F6F4ce6aB4B2d5dA2d51d23c04 (1000 ETH)
Listening on 127.0.0.1:8545
```

**⚠️ KEEP THIS RUNNING!** Don't close this terminal.

---

### 📍 TERMINAL 2: Deploy Smart Contracts

Wait 2-3 seconds after Terminal 1 starts, then run:

```bash
cd "g:\DEFI 2"
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
Starting deployment...
Token A deployed to: 0x5FbDB2315678afccb333f8a9c21625564e89b11c
Token B deployed to: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Token C deployed to: 0x9fE46Ffb3e47bbad7b88a9f6ad39b4c8b7a9d6c4
Pool AB deployed to: 0xCf7eD3AccA90604F110cE3f86b4D4e3CddAe4c79
Pool BC deployed to: 0x98Ab8b25e4a99c2ef0d352bD48e850e8da93f4bc
Operator deployed to: 0xf8aF5e7aF8A7bFB5c8dBf8b0F8e9D5c6BfA7D3c8

Deployment addresses saved to deploymentAddresses.json
```

**✅ Copy these addresses!** You'll need them if setting up bot manually.

---

### 📍 TERMINAL 3: Start React Frontend

```bash
cd "g:\DEFI 2"
cd frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view defi-dapp in the browser.
  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Browser will open automatically at http://localhost:3000**

---

### 📍 TERMINAL 4: Start MEV Bot

```bash
cd "g:\DEFI 2"
cd bot
node bot.js
```

**Expected Output:**
```
🚀 Mempool Bot Started
📍 Pool Address: 0xCf7eD3AccA90604F110cE3f86b4D4e3CddAe4c79
💼 Bot Address: 0xf39Fd6e51aad88F6F4ce6aB4B2d5dA2d51d23c04
🔗 RPC: http://127.0.0.1:8545
```

**✅ Bot is now watching for transactions!**

---

## 🧪 Test the System

### Step 1: Connect MetaMask

1. Click **"Connect MetaMask"** button on http://localhost:3000
2. MetaMask popup appears
3. Click **"Approve"**
4. Should see your wallet address and ~1000 ETH balance

### Step 2: Trigger Bot Detection

In a **5th terminal** (or wait a bit), trigger a test swap:

```bash
cd "g:\DEFI 2"
cd contracts
npx hardhat run scripts/test-transaction.js --network localhost
```

**Watch Terminal 4 output:**
```
📨 Pending transaction detected: 0x...
⚠️ Exploitable! Profitability: HIGH
🥪 [SANDWICH ATTACK INITIATED]
✅ Sandwich attack completed!
```

---

## 🧪 Quick Manual Test (No 5th Terminal)

If you don't want to run test-transaction.js:

### Using the Frontend:

1. **Open Frontend** at http://localhost:3000
2. **Connect MetaMask** button
3. **Navigate to "Liquidity"** tab
4. **Enter amounts**: 100 USDC + 100 DAI
5. **Click "Add Liquidity"**
6. **Check Terminal 4** for bot activity

---

## 🛑 Stopping Everything

### To Stop (Ctrl+C in each terminal):

**Terminal 1**: `Ctrl+C` (Kill blockchain)
**Terminal 2**: `Ctrl+C` (Just ends script)
**Terminal 3**: `Ctrl+C` (Kill React)
**Terminal 4**: `Ctrl+C` (Kill bot)

---

## 🔍 Monitoring Checklist

### Watch These Terminal Outputs

**Terminal 1** (Blockchain):
```
Block #1 mined at position http://127.0.0.1:8545
  Miner: 0x19eAd...
```
This shows blocks being created.

**Terminal 2** (Deployment):
```
✅ DEPLOYMENT COMPLETE
```
Should see all contract addresses.

**Terminal 3** (Frontend):
```
Compiled successfully!
You can now view defi-dapp in the browser.
```
Should have no red errors.

**Terminal 4** (Bot):
```
📨 Pending transaction detected: 0x...
```
Should see transaction detection when you interact with dApp.

---

## 🚨 If Something Goes Wrong

### Bot Not Detecting Transactions?
```bash
# Terminal 4: Stop (Ctrl+C) and restart
node bot.js
```

### Contracts Not Found?
```bash
# Terminal 2: Redeploy
npx hardhat run scripts/deploy.js --network localhost
```

### MetaMask Won't Connect?
```bash
# 1. Refresh browser (Ctrl+R or Cmd+R)
# 2. Check MetaMask on localhost network
# 3. Create account if needed
# 4. Try again
```

### Network Error?
```bash
# Terminal 1: Restart blockchain
# Ctrl+C to stop
# npx hardhat node
```

---

## 📊 Expected Sequence of Events

### Timeline for First Run

```
T=0s:     Terminal 1 starts (blockchain running)
T=2s:     Terminal 2 runs (contracts deployed)
T=5s:     Terminal 3 runs (frontend loads)
T=8s:     Terminal 4 runs (bot listening)
T=15s:    User connects MetaMask
T=30s:    Test transaction submitted
T=31s:    Bot detects transaction
T=32s:    Front-run executed
T=33s:    Victim transaction confirmed
T=34s:    Back-run executed
T=35s:    Profit calculated
```

---

## ✅ Success Indicators

### Frontend Ready
- [ ] http://localhost:3000 loads
- [ ] "Connect MetaMask" button visible
- [ ] No red errors in browser console

### Blockchain Ready
- [ ] Terminal 1 shows "Listening on 127.0.0.1:8545"
- [ ] Terminal 2 shows deployment addresses
- [ ] deploymentAddresses.json created

### Bot Ready
- [ ] Terminal 4 shows bot started message
- [ ] RPC connection shown
- [ ] Listening for transactions

### System Ready
- [ ] All 4 terminals running
- [ ] MetaMask connected
- [ ] No errors in any terminal
- [ ] Bot detects test transaction

---

## 🎯 What to Do Next

1. **Test Swap** - Click "Swap" button in frontend
2. **Add Liquidity** - Click "Liquidity" and add some tokens
3. **Monitor Bot** - Watch Terminal 4 for attack execution
4. **View Results** - Check profit calculations in Terminal 4
5. **Review Code** - Open contracts and frontend code
6. **Read Docs** - Check out ARCHITECTURE.md and README.md

---

## 💡 Pro Tips

- Keep all 4 terminals visible (use 4 windows or split screen)
- Use `clear` or `cls` command to clean terminal output
- Monitor gas prices in Terminal 4 output
- Check profits after each attack
- Note transaction hashes for analysis

---

## 🔗 URLs & Addresses

**Frontend**: http://localhost:3000
**RPC**: http://127.0.0.1:8545
**Chain ID**: 31337
**Block Explorer**: None (local only)

---

## 📞 Quick Reference

| Problem | Solution |
|---------|----------|
| Blockchain not responding | Restart Terminal 1 |
| Contracts not deployed | Run Terminal 2 again |
| Frontend blank | Refresh browser (Ctrl+R) |
| Bot not detecting | Restart Terminal 4 |
| MetaMask error | Switch to localhost network |

---

**Ready to go? Follow the steps above! 🚀**
