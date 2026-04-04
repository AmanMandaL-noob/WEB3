const { ethers } = require('ethers');
require('dotenv').config();

const { decodeSwapTransaction, analyzeExploitability, calculateSandwichStrategy } = require('./lib/decoder');
const { executeFrontRun, waitForVictimTransaction, executeBackRun, getTokenBalance, calculateProfit } = require('./lib/executor');

/**
 * Main Mempool Bot
 * Monitors transactions and executes sandwich attacks
 */
class MempoolBot {
  constructor(rpcUrl, privateKey, poolAddress, tokenAddress) {
    this.rpcUrl = rpcUrl;
    this.privateKey = privateKey;
    this.poolAddress = poolAddress;
    this.tokenAddress = tokenAddress;
    
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.signer = this.wallet.connect(this.provider);
    
    this.pendingTransactions = new Map();
    this.executedAttacks = [];
    this.isMonitoring = false;
  }

  /**
   * Start monitoring mempool
   */
  async startMonitoring() {
    console.log('🚀 Mempool Bot Started');
    console.log(`📍 Pool Address: ${this.poolAddress}`);
    console.log(`💼 Bot Address: ${this.wallet.address}`);
    console.log(`🔗 RPC: ${this.rpcUrl}\n`);
    
    this.isMonitoring = true;

    // Listen for pending transactions
    this.provider.on('pending', async (txHash) => {
      try {
        const tx = await this.provider.getTransaction(txHash);
        
        if (!tx) return;
        
        // Check if transaction targets our pool
        if (tx.to && tx.to.toLowerCase() === this.poolAddress.toLowerCase()) {
          await this.handlePendingTransaction(tx);
        }
      } catch (error) {
        // Silently ignore errors (transactions might disappear from mempool)
      }
    });

    // Keep bot running
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n\n🛑 Bot stopped');
        this.stopMonitoring();
        resolve();
      });
    });
  }

  /**
   * Handle pending transaction targeting our pool
   */
  async handlePendingTransaction(tx) {
    try {
      // Avoid analyzing our own transactions
      if (tx.from.toLowerCase() === this.wallet.address.toLowerCase()) {
        return;
      }

      const txHash = tx.hash;
      
      // Skip if we've already seen this transaction
      if (this.pendingTransactions.has(txHash)) {
        return;
      }

      console.log(`\n📨 Pending transaction detected: ${txHash}`);
      console.log(`👤 From: ${tx.from}`);
      console.log(`⛽ Gas Price: ${ethers.utils.formatUnits(tx.gasPrice, 'gwei')} gwei`);
      
      // Decode transaction
      const decodedTx = decodeSwapTransaction(tx);
      
      if (!decodedTx) {
        console.log('❌ Could not decode transaction');
        return;
      }

      console.log(`🔍 Function: ${decodedTx.functionName}`);
      
      // Analyze if exploitable
      const exploitability = analyzeExploitability(decodedTx, {});
      
      if (!exploitability.exploitable) {
        console.log('⏭️ Transaction not exploitable');
        return;
      }

      console.log(`⚠️  Exploitable! Profitability: ${exploitability.profitability}`);
      
      // Calculate sandwich strategy
      const strategy = calculateSandwichStrategy(decodedTx, {});
      console.log('📋 Sandwich Strategy:');
      console.log(`  Front-run: ${strategy.frontRun.type}`);
      console.log(`  Back-run: ${strategy.backRun.type}`);
      
      // Mark as pending
      this.pendingTransactions.set(txHash, {
        decodedTx,
        exploitability,
        timestamp: Date.now(),
      });

      // Attempt sandwich attack
      await this.executeSandwichAttack(tx, decodedTx);
      
    } catch (error) {
      console.error('❌ Error processing transaction:', error.message);
    }
  }

  /**
   * Execute sandwich attack: front-run -> victim -> back-run
   */
  async executeSandwichAttack(victimTx, decodedTx) {
    console.log('\n🥪 [SANDWICH ATTACK INITIATED]');
    console.log('━'.repeat(50));
    
    try {
      // Step 1: Get initial balance
      console.log('\n1️⃣ [PREPARATION] Checking balances...');
      const initialBalance = await getTokenBalance(
        this.provider,
        this.tokenAddress,
        this.wallet.address
      );
      console.log(`💰 Initial balance: ${initialBalance}`);
      
      // Step 2: Execute front-run
      console.log('\n2️⃣ [EXECUTION] Starting sandwich sequence...');
      
      // Use smaller amount for safer trading
      const frontRunAmount = ethers.utils.parseEther('1');
      
      const frontRunResult = await executeFrontRun(
        this.provider,
        this.signer,
        this.poolAddress,
        this.tokenAddress,
        frontRunAmount,
        this.privateKey
      );
      
      if (!frontRunResult.success) {
        console.log('❌ Front-run failed, aborting sandwich');
        return;
      }

      // Step 3: Wait for victim
      console.log('\n3️⃣ [VICTIM] Waiting for transaction to execute...');
      
      const victimWaitResult = await waitForVictimTransaction(
        this.provider,
        victimTx.hash,
        30000 // 30 second timeout
      );
      
      if (!victimWaitResult.success) {
        console.log('⚠️ Victim transaction did not confirm in time');
        // Try back-run anyway
      }

      // Step 4: Execute back-run
      console.log('\n4️⃣ [EXIT] Executing back-run...');
      
      const backRunAmount = ethers.utils.parseEther('1');
      
      const backRunResult = await executeBackRun(
        this.provider,
        this.signer,
        this.poolAddress,
        this.tokenAddress,
        backRunAmount,
        ethers.BigNumber.from(0)
      );
      
      if (!backRunResult.success) {
        console.log('❌ Back-run failed');
      }

      // Step 5: Calculate profit
      console.log('\n5️⃣ [ANALYSIS] Computing profitability...');
      
      const finalBalance = await getTokenBalance(
        this.provider,
        this.tokenAddress,
        this.wallet.address
      );
      
      const gasPrice = ethers.utils.formatUnits(victimTx.gasPrice || '0', 'gwei');
      const estimatedGasCost = ethers.utils.formatEther(
        (frontRunResult.gasUsed || 300000).toString()
      );
      
      await calculateProfit(
        this.provider,
        this.tokenAddress,
        initialBalance,
        finalBalance,
        estimatedGasCost
      );

      // Record attack
      this.executedAttacks.push({
        victimTx: victimTx.hash,
        frontRunTx: frontRunResult.txHash,
        backRunTx: backRunResult.txHash,
        timestamp: Date.now(),
        profitable: parseFloat(finalBalance) > parseFloat(initialBalance),
      });

      console.log('\n✅ Sandwich attack completed!');
      console.log('━'.repeat(50));
      
    } catch (error) {
      console.error('\n❌ Sandwich attack failed:', error.message);
      console.log('━'.repeat(50));
    }
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    this.provider.removeAllListeners('pending');
    console.log(`\n📊 Attack Summary:`);
    console.log(`Total attacks attempted: ${this.executedAttacks.length}`);
    console.log(`Successful attacks: ${this.executedAttacks.filter(a => a.profitable).length}`);
  }

  /**
   * Get attack statistics
   */
  getStats() {
    return {
      totalAttacks: this.executedAttacks.length,
      successfulAttacks: this.executedAttacks.filter(a => a.profitable).length,
      attacks: this.executedAttacks,
    };
  }
}

/**
 * Start bot based on environment variables
 */
async function main() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const privateKey = process.env.PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb476caf365dc60004e8d54ddbc71'; // Default Anvil account
  const poolAddress = process.env.POOL_ADDRESS || '0x5FbDB2315678afccb333f8a9c21625564e89b11c';
  const tokenAddress = process.env.TOKEN_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

  try {
    const bot = new MempoolBot(rpcUrl, privateKey, poolAddress, tokenAddress);
    await bot.startMonitoring();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run bot
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MempoolBot;
