# 🧪 Complete Testing Guide

This guide walks through testing every feature of the DeFi DEX system.

## ✅ Pre-Testing Checklist

- [ ] Node.js v16+ installed
- [ ] All dependencies installed (`npm install` in all folders)
- [ ] Hardhat node running in Terminal 1
- [ ] Contracts deployed in Terminal 2
- [ ] Frontend running in Terminal 3
- [ ] MetaMask installed and configured
- [ ] Saved deployment addresses

---

## 🧪 Test Suite 1: Smart Contracts

### Test 1.1: Token Deployment

**Expected**: All tokens deployed with correct initial supply

```bash
# Check logs from deploy script
# Should see:
# Token A deployed to: 0x5FbDB...
# Token B deployed to: 0xe7f1...
# Token C deployed to: 0x9fE4...
```

✅ **Pass**: Addresses printed and non-zero
❌ **Fail**: Error or zero address

### Test 1.2: Pool Initialization

**Expected**: DEX pools created with correct initial liquidity

Check Terminal 2 output:
```
✅ Pool AB deployed to: 0xCf7e...
✅ Pool BC deployed to: 0x98Ab...
✅ Added initial liquidity to USDC/DAI pool
✅ Added initial liquidity to DAI/WETH pool
```

✅ **Pass**: Both pools show successful liquidity addition
❌ **Fail**: Errors or failed transactions

### Test 1.3: Token Balance Query

**Expected**: Deployed tokens have correct initial balance

```javascript
// In browser console:
// This would require direct contract interaction
// For now, trust deploy script output
```

---

## 🧪 Test Suite 2: Frontend Functionality

### Test 2.1: Page Load

1. Open http://localhost:3000
2. Check page loads without errors
3. Look for "DeFi DEX" title and logo

✅ **Pass**: Clean page with header and hero section
❌ **Fail**: Error message, blank page, or console errors

### Test 2.2: MetaMask Connection

**Before**: Not connected

1. Click **"Connect MetaMask"** button
2. MetaMask popup should appear
3. Approve connection
4. Check wallet address appears in header

**Expected**: 
- Account shows as `0xf39...` or similar
- Balance shows as ~1000 ETH
- Address truncated format: `0xf39...`

✅ **Pass**: Wallet connected, address and balance displayed
❌ **Fail**: MetaMask popup doesn't appear or connection fails

**Troubleshooting**:
```
If MetaMask popup doesn't appear:
1. Check MetaMask is installed
2. MetaMask should be on localhost network (127.0.0.1:8545)
3. Close other dApps in MetaMask
4. Try incognito window
```

### Test 2.3: Disconnect Button

1. Click **"Disconnect"** button
2. Should switch back to "Connect MetaMask" button
3. Wallet info disappears

✅ **Pass**: Button toggle works, wallet info cleared
❌ **Fail**: Button doesn't respond or state doesn't change

### Test 2.4: Hero Section Display

When wallet connected, should see:

```
Total Value Locked: $2.5M
24h Volume: $1.2M
Available Pools: 2
```

✅ **Pass**: Stats cards display with values
❌ **Fail**: Cards don't show or show as undefined

---

## 🧪 Test Suite 3: Manual Swap (UI Navigation)

### Test 3.1: Open Swap Modal

1. Click **"Swap"** button in navigation
2. Modal should open with title "🔄 Swap Tokens"

**Expected Modal Content**:
- Input field for "You Pay"
- Arrow separator (⬇️)
- Output field for "You Receive" (disabled)
- Slippage tolerance selector
- "Swap" button

✅ **Pass**: Modal displays all elements
❌ **Fail**: Modal doesn't open or elements missing

### Test 3.2: Close Swap Modal

1. Click **X** button in top right
2. Modal should close

✅ **Pass**: Modal closes cleanly
❌ **Fail**: Click doesn't close modal

### Test 3.3: Slippage Control

1. Open Swap modal again
2. Click "0.1%" button
3. Value should highlight in blue
4. Current slippage shows below

✅ **Pass**: Buttons toggle correctly
❌ **Fail**: Buttons don't highlight or don't toggle

---

## 🧪 Test Suite 4: Manual Liquidity (UI Navigation)

### Test 4.1: Open Liquidity Modal

1. Click **"Liquidity"** button in navigation
2. Modal should open with title "💧 Liquidity Management"

**Expected Content**:
- Two tabs: "Add Liquidity" and "Remove Liquidity"
- Two input fields for token amounts
- "Add Liquidity" button

✅ **Pass**: Modal displays with both tabs
❌ **Fail**: Modal missing tabs or inputs

### Test 4.2: Switch Tabs

1. Click "Remove Liquidity" tab
2. Should show only one input for "LP Tokens to Remove"

✅ **Pass**: Tab switches correctly, inputs update
❌ **Fail**: Tab doesn't switch or content doesn't update

### Test 4.3: Close Liquidity Modal

1. Click **X** button
2. Modal should close

✅ **Pass**: Modal closes
❌ **Fail**: Doesn't close

---

## 🧪 Test Suite 5: Positions Modal

### Test 5.1: Open Positions Modal

1. Click **"Positions"** button in navigation
2. Modal opens with "📍 Your Positions" title

**Expected**:
- Empty state message: "No active positions"
- Subtext: "Add liquidity to start earning fees"

✅ **Pass**: Empty state displays correctly
❌ **Fail**: Shows error or blank

---

## 🧪 Test Suite 6: Smart Contract Interaction

### Prerequisites
- Contracts deployed
- MetaMask connected with account 0xf39...
- Transaction 1 tokens in account

### Test 6.1: Execute Swap (Full Flow)

Since swaps require actual contract interaction, here's the manual test:

```bash
# In Terminal 2, run:
cd contracts
npx hardhat run scripts/test-transaction.js --network localhost
```

**Expected Terminal 2 Output**:
```
🧪 Test Transaction Generator
📍 Contracts loaded:
   Token A: 0x5FbDB...
💰 Funding user account...
✅ User funded with 1000 tokens
🔐 Approving token spending...
✅ Token approved
🔄 Executing swap (BOT WILL ATTACK THIS!)...
📤 Transaction submitted: 0x...
✅ Transaction confirmed in block 5
```

✅ **Pass**: Transaction executes without errors
❌ **Fail**: Transaction fails or approval error

### Test 6.2: Check Bot Detection

While test transaction is running, check Terminal 4 (Bot):

**Expected Bot Output**:
```
📨 Pending transaction detected: 0x...
👤 From: 0x...
⛽ Gas Price: 30.0 gwei
🔍 Function: swap
⚠️ Exploitable! Profitability: HIGH
📋 Sandwich Strategy:
  Front-run: BUY
  Back-run: SELL
```

✅ **Pass**: Bot detects transaction and analyzes it
❌ **Fail**: Bot shows no detection or error

---

## 🧪 Test Suite 7: MEV Bot Sandwich Attack

### Test 7.1: Full Sandwich Attack Execution

Continue from Test 6.2 - bot should execute:

**Expected Bot Output Sequence**:
```
🥪 [SANDWICH ATTACK INITIATED]
══════════════════════════════════

1️⃣ [PREPARATION] Checking balances...
💰 Initial balance: X.X tokens

2️⃣ [EXECUTION] Starting sandwich sequence...
🤖 [FRONT-RUN] Executing buy transaction...
📊 Gas price: 45.0 gwei
💰 Amount: 1.0 tokens
🔐 Approving token spending...
✅ Token approved
🔄 Executing swap...
✅ Front-run executed! TX: 0x...

3️⃣ [VICTIM] Waiting for transaction to execute...
⏳ [VICTIM] Waiting for victim transaction...
🎯 Watching: 0x...
✅ Victim transaction confirmed in block 6

4️⃣ [EXIT] Executing back-run...
📈 [BACK-RUN] Executing sell transaction...
🔐 Approving token spending...
✅ Token approved
🔄 Executing swap...
✅ Back-run executed! TX: 0x...

5️⃣ [ANALYSIS] Computing profitability...
💹 [PROFIT ANALYSIS]
Initial Balance: X tokens
Final Balance: Y tokens
Net Tokens Gained: Z tokens
Gas Cost: 0.X ETH
Net Profit: Z.X tokens

✅ Sandwich attack completed!
```

✅ **Pass**: All 5 steps execute in sequence
❌ **Fail**: Any step fails or shows error

### Test 7.2: Attack Statistics

After successful attack, bot should show:

```
Attack Summary:
Total attacks attempted: 1
Successful attacks: 1
```

✅ **Pass**: Stats match execution
❌ **Fail**: Stats are zero or incorrect

---

## 🧪 Test Suite 8: Network Error Handling

### Test 8.1: Blockchain Disconnect

1. Stop Terminal 1 (hardhat node) with Ctrl+C
2. Try to swap in frontend
3. Should get error message

**Expected**: Error like "Network request failed"

✅ **Pass**: Error handling works
❌ **Fail**: App crashes or freezes

### Test 8.2: Reconnect

1. Restart blockchain: `npx hardhat node`
2. Refresh browser
3. Should reconnect

✅ **Pass**: App recovers after reconnect
❌ **Fail**: Still shows error

---

## 🚀 Quick Test Checklistlist

Run through this in 5 minutes:

```
□ Page loads without errors
□ MetaMask connects
□ Wallet address shows
□ Balance shows (~1000 ETH)
□ All modals open and close
□ Slippage buttons toggle
□ Bot detects test transaction
□ Sandwich attack executes
□ No console errors
```

---

## 📊 Expected vs. Actual Comparison

### Frontend Response Times

| Action | Expected | Acceptable Range |
|--------|----------|------------------|
| Page Load | <2s | <3s |
| MetaMask Connect | <1s | <3s |
| Modal Open | <0.5s | <1s |
| Balance Update | <1s | <2s |

### Blockchain Response Times

| Action | Expected | Acceptable Range |
|--------|----------|------------------|
| Transaction Submit | <0.5s | <1s |
| Block Confirmation | <1s | <2s |
| State Update | <0.5s | <1s |

### Bot Response Times

| Action | Expected | Acceptable Range |
|--------|----------|------------------|
| Detect Tx | <100ms | <500ms |
| Decode Tx | <50ms | <200ms |
| Front-run Execute | <1s | <3s |
| Back-run Execute | <1s | <3s |

---

## 🔍 Browser Console Checks

### Open DevTools (F12)

Should see **NO errors**. Check:

```javascript
// Expected:
// No red errors
// Only info/log messages
// No MetaMask warnings
```

**Common Safe Warnings**:
- `Uncaught SyntaxError` ❌ BAD
- `Network request failed` ❌ BAD  
- `MetaMask warning` ✅ OK
- `Deprecated API` ✅ OK

---

## 🎯 Final Validation Checklist

- [ ] All components deploy without errors
- [ ] Frontend loads and connects MetaMask
- [ ] All UI modals open and close properly
- [ ] Bot detects and analyzes transactions
- [ ] Sandwich attack executes in full sequence
- [ ] No critical errors in browser console
- [ ] No hanging processes or infinite loops
- [ ] Profit calculations show correctly

---

## 📞 If Tests Fail

1. **Check Terminal Output**: Read actual error messages
2. **Verify Prerequisites**: npm, Node.js, MetaMask
3. **Check Network**: MetaMask on localhost
4. **Restart All**: Stop all terminals, restart in order
5. **Check Logs**: Look for deployment addresses
6. **See README.md**: Detailed troubleshooting guide

---

**All tests passing? 🎉 System is working correctly!**
