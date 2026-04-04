# Quick Start Guide - DeFi DEX System

## ⚡ 5-Minute Setup

### Windows Users
```bash
# 1. Run setup script
setup.bat

# 2. Start blockchain (Terminal 1)
cd contracts && npx hardhat node

# 3. Deploy contracts (Terminal 2)
cd contracts && npx hardhat run scripts/deploy.js --network localhost

# 4. Start frontend (Terminal 3)
cd frontend && npm start

# 5. Start bot (Terminal 4)
cd bot && node bot.js
```

### macOS/Linux Users
```bash
# 1. Run setup script
chmod +x setup.sh
./setup.sh

# Rest same as Windows
```

## 🎯 First Test

1. **Open http://localhost:3000 in your browser**
2. **Click "Connect MetaMask"**
3. **Switch MetaMask to localhost network (127.0.0.1:8545)**
4. **Go to Liquidity tab → Add Liquidity**
5. **Enter 100 in both fields → Click Add Liquidity**
6. **Check bot terminal - should see activity**

## 📝 Key Addresses (After Deploy)

After running deploy script, save these:
```
Token A (USDC): 0x...
Token B (DAI): 0x...
Pool AB: 0x...
```

(Saved in `contracts/deploymentAddresses.json`)

## 🔧 Troubleshooting Quick Fixes

| Issue | Fix |
|-------|-----|
| MetaMask won't connect | Refresh page, check network is localhost |
| "Contract not found" | Redeploy: `npx hardhat run scripts/deploy.js` |
| Bot not detecting txs | Restart blockchain: Ctrl+C then `npx hardhat node` |
| Transaction takes forever | Increase gas with `gasLimit: 500000` |

## 📊 Watch These Happen

### In Terminal 1 (Blockchain)
```
Block #1 mined at timestamp ...
```

### In Terminal 2 (Deployment)
```
✅ DEPLOYMENT COMPLETE
Pool AB deployed to: 0x...
```

### In Terminal 3 (Frontend)
```
[Connection] MetaMask connected to account 0x...
[Swap] Transaction submitted...
```

### In Terminal 4 (Bot)
```
📨 Pending transaction detected: 0x...
🥪 [SANDWICH ATTACK INITIATED]
✅ Sandwich attack completed!
```

## 💡 What to Do Next

1. **Test all UI features** (Swap, Add/Remove Liquidity, Positions)
2. **Run MEV bot test** with `npx hardhat run scripts/test-transaction.js --network localhost`
3. **Monitor bot output** and verify sandwich attack execution
4. **Check profit calculations** in bot terminal
5. **Review frontend** for clean UX and responsive design

## 🎬 Demo Flow

1. User opens dApp
2. Connects wallet
3. Adds liquidity to pool
4. Executes swap
5. Bot detects swap in mempool
6. Bot executes front-run
7. User's swap executes (at worse price due to bot's trade)
8. Bot executes back-run (sells at inflated price)
9. Bot calculates profit

## 📚 Files to Review

- **Smart Contracts**: `/contracts/contracts/*.sol`
- **Frontend Code**: `/frontend/src/App.js`
- **Bot Logic**: `/bot/bot.js`
- **Full Docs**: `README.md`

---

**Need help?** Check `README.md` for detailed troubleshooting.
