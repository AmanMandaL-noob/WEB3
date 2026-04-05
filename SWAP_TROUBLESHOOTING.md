# Swap Transaction Troubleshooting Guide

## Issue: MetaMask Shows Transaction Review But Gets Stuck

### What You Might See:
1. Click "Swap Now" button
2. MetaMask popup appears showing transaction details
3. You click "Confirm"
4. MetaMask popup closes but nothing happens
5. Frontend doesn't update

---

## Solutions (Try in Order):

### Solution 1: Reload the Page ✅
```bash
# In your browser
Press Ctrl+R or refresh the page
```

**Why this works:** Clears any stuck state in the frontend connection.

---

### Solution 2: Check Transaction Status
1. **Open MetaMask Extension**
2. **Click "Activity" tab**
3. **Look for your transaction**
4. Check if it says:
   - ✅ **"Success"** → Swap completed (frontend just didn't update, refresh)
   - ⏳ **"Pending"** → Wait 10-20 seconds then refresh
   - ❌ **"Failed"** → See Solution 3

---

### Solution 3: Check User Balance
Before swapping, verify you have enough tokens:

```bash
# In Terminal 3 (Frontend terminal), check the balance display
# Should show your ETH balance
# Should show > 0 USDC tokens
```

If balance shows 0:
1. Go to "Liquidity" tab first
2. Add some liquidity to get tokens
3. Try swap again

---

### Solution 4: Restart Frontend (If Still Stuck)

**Terminal 3:**
```bash
# Press Ctrl+C to stop the frontend
Ctrl+C

# Restart it
npm start
```

Then try the swap again.

---

### Solution 5: Reset MetaMask Connection

1. **In MetaMask:**
   - Click the icon → Settings → Experimental
   - Toggle "Clear activity tab data"
   
2. **Refresh browser**
3. **Click "Connect MetaMask"** again
4. **Try swap again**

---

### Solution 6: Clear Browser Cache

If nothing else works:
```bash
# Close the browser completely
# Clear cache:
# Chrome: Ctrl+Shift+Delete → Clear all time
# Firefox: Ctrl+Shift+Delete → Everything

# Restart browser
# Go to http://localhost:3001
# Connect MetaMask again
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Insufficient liquidity" | Pool doesn't have enough tokens | Add more liquidity first |
| "Insufficient balance" | Account doesn't have enough USDC | Add liquidity or wait for airdrop |
| "Transaction rejected" | You clicked "Reject" in MetaMask | Try again and click "Confirm" |
| "Contract not found" | Wrong contract address | Redeploy: `npm run deploy` |
| "User denied" | MetaMask popup closed without confirming | Open MetaMask and check Activity tab |

---

## What Was Fixed

**Frontend Improvement (April 2026):**
- ✅ Better error messages
- ✅ Longer transaction confirmation wait time
- ✅ Unlimited token approval (not just amount)
- ✅ Added gas limit to prevent failures
- ✅ Better user feedback during each step

---

## Still Having Issues?

1. **Check Blockchain Terminal** (Terminal 1)
   - Look for any error logs
   - Check for reverted transactions

2. **Check Frontend Console** (Press F12 in browser)
   - Click Console tab
   - Look for red errors
   - Screenshot and share the error

3. **Full Reset:**
   ```bash
   # Kill all terminals (Ctrl+C)
   
   # In Terminal 1:
   cd "g:\DEFI 2\contracts"
   npx hardhat node
   
   # In Terminal 2 (wait 3 seconds):
   cd "g:\DEFI 2\contracts"
   npx hardhat run scripts/deploy.js --network localhost
   
   # In Terminal 3:
   cd "g:\DEFI 2\frontend"
   npm start
   
   # In Terminal 4:
   cd "g:\DEFI 2\bot"
   node bot.js
   ```

---

## Key Things to Remember

✅ **Keep Terminal 1 (Blockchain) always running**
✅ **Connect to localhost:8545 in MetaMask**
✅ **Have liquidity in pool before swapping**
✅ **Check MetaMask Activity tab for actual transaction status**
✅ **Refresh page if frontend looks stuck**

**Happy swapping! 🔄**
