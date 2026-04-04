const { ethers } = require('ethers');

/**
 * Decode swap transaction calldata
 * Extracts trade size, token in, token out, and slippage info
 */
function decodeSwapTransaction(txData) {
  try {
    // Parse function selector
    const functionSelector = txData.data.slice(0, 10);
    
    // Common DEX function selectors
    const swapFunctionSelectors = {
      '0x022c0d9f': 'swap', // Simple swap selector
      '0xfb3bdb41': 'swapExactETHForTokens',
      '0x18cbafe5': 'swapExactTokensForTokens',
      '0x7ff36ab5': 'swapExactETHForTokensSupportingFeeOnTransferTokens',
      '0x38ed1739': 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    };
    
    const functionName = swapFunctionSelectors[functionSelector] || 'unknown';
    
    // Decode the parameters (simplified)
    const decodedData = {
      functionName,
      functionSelector,
      data: txData.data,
      value: txData.value || '0',
      gasPrice: txData.gasPrice || '0',
      gasLimit: txData.gasLimit || '0',
    };
    
    return decodedData;
  } catch (error) {
    console.error('Error decoding transaction:', error);
    return null;
  }
}

/**
 * Analyze if transaction is exploitable
 */
function analyzeExploitability(decodedTx, reserves) {
  if (!decodedTx) return null;
  
  // Check if it's a swap function
  const isSwap = ['swap', 'swapExactTokensForTokens'].includes(decodedTx.functionName);
  
  // Check gas price (lower gas price = easier to frontrun)
  const gasPrice = ethers.utils.formatUnits(decodedTx.gasPrice, 'gwei');
  
  // Check transaction value (larger = more profitable to attack)
  const txValue = ethers.utils.formatEther(decodedTx.value);
  
  return {
    exploitable: isSwap,
    type: 'swap',
    gasPrice: parseFloat(gasPrice),
    estimatedValue: parseFloat(txValue),
    profitability: parseFloat(txValue) > 0.1 ? 'HIGH' : 'MEDIUM',
  };
}

/**
 * Calculate optimal MEV sandwich attack strategy
 */
function calculateSandwichStrategy(victimTx, poolReserves) {
  if (!victimTx) return null;
  
  // Extract victim transaction parameters
  const strategy = {
    // Front-run: Execute same swap BEFORE victim
    frontRun: {
      type: 'BUY',
      description: 'Buy token to increase price',
      estimatedImpact: 'Increases slippage for victim',
      profit: 'Gains tokens at lower price',
    },
    
    // Victim transaction executes here
    
    // Back-run: Exit position AFTER victim
    backRun: {
      type: 'SELL',
      description: 'Sell acquired tokens at inflated price',
      estimatedImpact: 'Captures price increase',
      profit: 'Sells at higher price from victim impact',
    },
    
    // Estimated profit calculation
    estimatedProfit: {
      victimSlippageAdded: '0.5%',
      botProfitMargin: '0.3%',
      estimatedGasProfit: '2000 gwei',
      riskLevel: 'MEDIUM',
    },
  };
  
  return strategy;
}

module.exports = {
  decodeSwapTransaction,
  analyzeExploitability,
  calculateSandwichStrategy,
};
