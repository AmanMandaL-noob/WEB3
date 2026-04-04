const { ethers } = require('ethers');

const POOL_ABI = [
  'function swap(uint256 amountIn, uint256 minAmountOut, address tokenIn) public returns (uint256)',
  'function getReserves() public view returns (uint256, uint256)',
  'function token0() public view returns (address)',
  'function token1() public view returns (address)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function decimals() public view returns (uint8)',
];

/**
 * Execute front-run transaction
 * Buy the token before the victim to increase price
 */
async function executeFrontRun(
  provider,
  signer,
  poolAddress,
  tokenAddress,
  amount,
  privateKey
) {
  try {
    console.log('\n🤖 [FRONT-RUN] Executing buy transaction...');
    
    const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice.mul(ethers.BigNumber.from(150)).div(100); // 150% of current
    
    console.log(`📊 Gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`💰 Amount: ${ethers.utils.formatEther(amount)} tokens`);
    
    // Approve token spending
    console.log('🔐 Approving token spending...');
    let tx = await token.approve(poolAddress, amount, { gasPrice });
    await tx.wait();
    console.log('✅ Token approved');
    
    // Execute swap (front-run)
    console.log('🔄 Executing swap...');
    tx = await pool.swap(amount, 0, tokenAddress, {
      gasPrice,
      gasLimit: ethers.BigNumber.from(300000),
    });
    
    const receipt = await tx.wait();
    console.log(`✅ Front-run executed! TX: ${receipt.transactionHash}`);
    console.log(`📦 Gas used: ${receipt.gasUsed.toString()}`);
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      type: 'FRONT_RUN',
    };
  } catch (error) {
    console.error('❌ Front-run failed:', error.message);
    return {
      success: false,
      error: error.message,
      type: 'FRONT_RUN',
    };
  }
}

/**
 * Wait for victim's transaction and let it execute
 */
async function waitForVictimTransaction(provider, victimTxHash, timeout = 60000) {
  try {
    console.log('\n⏳ [VICTIM] Waiting for victim transaction...');
    console.log(`🎯 Watching: ${victimTxHash}`);
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const receipt = await provider.getTransactionReceipt(victimTxHash);
      
      if (receipt) {
        console.log(`✅ Victim transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`📊 Gas used: ${receipt.gasUsed.toString()}`);
        return {
          success: true,
          receipt,
          blockNumber: receipt.blockNumber,
        };
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('⏱️ Timeout waiting for victim transaction');
    return {
      success: false,
      error: 'Timeout',
    };
  } catch (error) {
    console.error('❌ Error waiting for victim:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Execute back-run transaction
 * Sell the tokens after victim to capture price increase
 */
async function executeBackRun(
  provider,
  signer,
  poolAddress,
  tokenAddress,
  amount,
  minOutput
) {
  try {
    console.log('\n📈 [BACK-RUN] Executing sell transaction...');
    
    const pool = new ethers.Contract(poolAddress, POOL_ABI, signer);
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    
    // Get current gas price (even higher than front-run to ensure inclusion)
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice.mul(ethers.BigNumber.from(200)).div(100); // 200% of current
    
    console.log(`📊 Gas price: ${ethers.utils.formatUnits(gasPrice, 'gwei')} gwei`);
    console.log(`💰 Amount: ${ethers.utils.formatEther(amount)} tokens`);
    
    // Approve token spending
    console.log('🔐 Approving token spending...');
    let tx = await token.approve(poolAddress, amount, { gasPrice });
    await tx.wait();
    console.log('✅ Token approved');
    
    // Execute swap (back-run)
    console.log('🔄 Executing swap...');
    tx = await pool.swap(amount, minOutput, tokenAddress, {
      gasPrice,
      gasLimit: ethers.BigNumber.from(300000),
    });
    
    const receipt = await tx.wait();
    console.log(`✅ Back-run executed! TX: ${receipt.transactionHash}`);
    console.log(`📦 Gas used: ${receipt.gasUsed.toString()}`);
    
    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
      type: 'BACK_RUN',
    };
  } catch (error) {
    console.error('❌ Back-run failed:', error.message);
    return {
      success: false,
      error: error.message,
      type: 'BACK_RUN',
    };
  }
}

/**
 * Monitor token balance before and after
 */
async function getTokenBalance(provider, tokenAddress, userAddress) {
  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await token.balanceOf(userAddress);
    const decimals = await token.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
}

/**
 * Calculate profit from sandwich attack
 */
async function calculateProfit(provider, tokenAddress, initialBalance, finalBalance, ethSpent) {
  const profit = parseFloat(finalBalance) - parseFloat(initialBalance);;
  const gasCost = parseFloat(ethSpent);
  
  console.log('\n💹 [PROFIT ANALYSIS]');
  console.log(`Initial Balance: ${initialBalance} tokens`);
  console.log(`Final Balance: ${finalBalance} tokens`);
  console.log(`Net Tokens Gained: ${profit.toFixed(6)} tokens`);
  console.log(`Gas Cost: ${gasCost.toFixed(6)} ETH`);
  console.log(`Net Profit: ${(profit - gasCost).toFixed(6)} tokens`);
  
  return {
    tokenGain: profit,
    gasCost,
    netProfit: profit - gasCost,
  };
}

module.exports = {
  executeFrontRun,
  waitForVictimTransaction,
  executeBackRun,
  calculateProfit,
  getTokenBalance,
};
