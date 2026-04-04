import { ethers } from 'ethers';

const POOL_ABI = [
  'function addLiquidity(uint256 amount0, uint256 amount1, uint256 minLiquidity) public returns (uint256)',
  'function removeLiquidity(uint256 liquidity, uint256 minAmount0, uint256 minAmount1) public returns (uint256, uint256)',
  'function swap(uint256 amountIn, uint256 minAmountOut, address tokenIn) public returns (uint256)',
  'function getAmountOut(uint256 amountIn, address tokenIn) public view returns (uint256)',
  'function getAmountIn(uint256 amountOut, address tokenIn) public view returns (uint256)',
  'function getReserves() public view returns (uint256, uint256)',
  'function getPrice0() public view returns (uint256)',
  'function getPrice1() public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)',
  'function totalSupply() public view returns (uint256)',
  'function token0() public view returns (address)',
  'function token1() public view returns (address)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address account) public view returns (uint256)',
  'function transfer(address to, uint256 amount) public returns (bool)',
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
  'function name() public view returns (string)',
];

export const getPoolContract = (poolAddress, signer) => {
  return new ethers.Contract(poolAddress, POOL_ABI, signer);
};

export const getTokenContract = (tokenAddress, signer) => {
  return new ethers.Contract(tokenAddress, ERC20_ABI, signer);
};

export const addLiquidity = async (
  poolAddress,
  token0Address,
  token1Address,
  amount0,
  amount1,
  signer
) => {
  try {
    const pool = getPoolContract(poolAddress, signer);
    const token0 = getTokenContract(token0Address, signer);
    const token1 = getTokenContract(token1Address, signer);

    // Get decimals
    const decimals0 = await token0.decimals();
    const decimals1 = await token1.decimals();

    // Format amounts
    const formattedAmount0 = ethers.utils.parseUnits(amount0, decimals0);
    const formattedAmount1 = ethers.utils.parseUnits(amount1, decimals1);

    // Approve tokens
    let tx = await token0.approve(poolAddress, formattedAmount0);
    await tx.wait();

    tx = await token1.approve(poolAddress, formattedAmount1);
    await tx.wait();

    // Add liquidity
    tx = await pool.addLiquidity(formattedAmount0, formattedAmount1, 0);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('Error adding liquidity:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const removeLiquidity = async (
  poolAddress,
  lpAmount,
  signer
) => {
  try {
    const pool = getPoolContract(poolAddress, signer);
    const formattedAmount = ethers.utils.parseEther(lpAmount);

    const tx = await pool.removeLiquidity(formattedAmount, 0, 0);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('Error removing liquidity:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const swap = async (
  poolAddress,
  tokenInAddress,
  amountIn,
  minAmountOut,
  signer
) => {
  try {
    const pool = getPoolContract(poolAddress, signer);
    const tokenIn = getTokenContract(tokenInAddress, signer);

    const decimals = await tokenIn.decimals();
    const formattedAmount = ethers.utils.parseUnits(amountIn, decimals);
    const formattedMinOut = ethers.utils.parseUnits(minAmountOut, 18);

    // Approve token
    let tx = await tokenIn.approve(poolAddress, formattedAmount);
    await tx.wait();

    // Execute swap
    tx = await pool.swap(formattedAmount, formattedMinOut, tokenInAddress);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error('Error swapping:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getTokenBalance = async (tokenAddress, userAddress, provider) => {
  try {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const balance = await token.balanceOf(userAddress);
    const decimals = await token.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error getting token balance:', error);
    return '0';
  }
};

export const getPoolInfo = async (poolAddress, provider) => {
  try {
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const [reserve0, reserve1] = await pool.getReserves();
    const price0 = await pool.getPrice0();
    const price1 = await pool.getPrice1();
    const totalSupply = await pool.totalSupply();
    const token0 = await pool.token0();
    const token1 = await pool.token1();

    return {
      reserve0: ethers.utils.formatEther(reserve0),
      reserve1: ethers.utils.formatEther(reserve1),
      price0: ethers.utils.formatEther(price0),
      price1: ethers.utils.formatEther(price1),
      totalSupply: ethers.utils.formatEther(totalSupply),
      token0,
      token1,
    };
  } catch (error) {
    console.error('Error getting pool info:', error);
    return null;
  }
};

export const getAmountOut = async (poolAddress, amountIn, tokenIn, provider) => {
  try {
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const decimals = await getTokenContract(tokenIn, provider).decimals();
    const formattedAmount = ethers.utils.parseUnits(amountIn, decimals);
    const amountOut = await pool.getAmountOut(formattedAmount, tokenIn);
    return ethers.utils.formatEther(amountOut);
  } catch (error) {
    console.error('Error calculating amount out:', error);
    return '0';
  }
};

export const getLPBalance = async (poolAddress, userAddress, provider) => {
  try {
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const balance = await pool.balanceOf(userAddress);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting LP balance:', error);
    return '0';
  }
};
