// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @dev Simple AMM/DEX Pool Contract
 * Similar to Uniswap V2 with x*y=k formula
 */
contract DexPool is ERC20, ReentrancyGuard, Ownable, Pausable {
    IERC20 public token0;
    IERC20 public token1;
    
    uint256 public reserve0;
    uint256 public reserve1;
    
    uint256 public constant FEE_PERCENTAGE = 30; // 0.3% fee
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    uint256 public feeCollected0;
    uint256 public feeCollected1;
    
    uint256 public lastKValue;

    event Swap(
        address indexed swapper,
        uint256 amountIn,
        uint256 amountOut,
        address indexed tokenIn,
        address indexed tokenOut
    );
    
    event LiquidityAdded(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );
    
    event LiquidityRemoved(
        address indexed provider,
        uint256 amount0,
        uint256 amount1,
        uint256 liquidity
    );

    constructor(
        IERC20 _token0,
        IERC20 _token1,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) {
        require(address(_token0) != address(0), "Invalid token0");
        require(address(_token1) != address(0), "Invalid token1");
        require(_token0 != _token1, "Tokens must be different");
        
        token0 = _token0;
        token1 = _token1;
    }

    /**
     * @dev Add liquidity to the pool
     */
    function addLiquidity(
        uint256 amount0,
        uint256 amount1,
        uint256 minLiquidity
    ) external nonReentrant returns (uint256 liquidity) {
        require(amount0 > 0 && amount1 > 0, "Amounts must be greater than 0");
        
        uint256 balance0Before = token0.balanceOf(address(this));
        uint256 balance1Before = token1.balanceOf(address(this));
        
        // Transfer tokens to pool
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);
        
        uint256 balance0After = token0.balanceOf(address(this));
        uint256 balance1After = token1.balanceOf(address(this));
        
        uint256 amount0Received = balance0After - balance0Before;
        uint256 amount1Received = balance1After - balance1Before;
        
        if (totalSupply() == 0) {
            // Initial liquidity
            liquidity = sqrt(amount0Received * amount1Received);
        } else {
            // Standard AMM formula
            uint256 liquidity0 = (amount0Received * totalSupply()) / reserve0;
            uint256 liquidity1 = (amount1Received * totalSupply()) / reserve1;
            liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
        }
        
        require(liquidity >= minLiquidity, "Insufficient liquidity minted");
        
        _mint(msg.sender, liquidity);
        
        reserve0 = balance0After;
        reserve1 = balance1After;
        lastKValue = reserve0 * reserve1;
        
        emit LiquidityAdded(msg.sender, amount0Received, amount1Received, liquidity);
        
        return liquidity;
    }

    /**
     * @dev Remove liquidity from the pool
     */
    function removeLiquidity(
        uint256 liquidity,
        uint256 minAmount0,
        uint256 minAmount1
    ) external nonReentrant returns (uint256 amount0, uint256 amount1) {
        require(liquidity > 0, "Liquidity must be greater than 0");
        require(balanceOf(msg.sender) >= liquidity, "Insufficient liquidity");
        
        amount0 = (liquidity * reserve0) / totalSupply();
        amount1 = (liquidity * reserve1) / totalSupply();
        
        require(amount0 >= minAmount0, "Insufficient amount0");
        require(amount1 >= minAmount1, "Insufficient amount1");
        
        _burn(msg.sender, liquidity);
        
        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);
        
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
        lastKValue = reserve0 * reserve1;
        
        emit LiquidityRemoved(msg.sender, amount0, amount1, liquidity);
        
        return (amount0, amount1);
    }

    /**
     * @dev Swap tokens
     * Can swap token0 for token1 or token1 for token0
     */
    function swap(
        uint256 amountIn,
        uint256 minAmountOut,
        IERC20 tokenIn
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn == token0 || tokenIn == token1, "Invalid token");
        
        IERC20 tokenOut = tokenIn == token0 ? token1 : token0;
        uint256 reserveIn = tokenIn == token0 ? reserve0 : reserve1;
        uint256 reserveOut = tokenIn == token0 ? reserve1 : reserve0;
        
        // Transfer input token to pool
        uint256 balanceBefore = tokenOut.balanceOf(address(this));
        tokenIn.transferFrom(msg.sender, address(this), amountIn);
        
        // Calculate output with fee
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENTAGE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
        
        require(amountOut >= minAmountOut, "Insufficient output amount");
        require(amountOut > 0, "Invalid output amount");
        
        // Check invariant
        uint256 newReserveIn = tokenIn == token0 
            ? token0.balanceOf(address(this))
            : token1.balanceOf(address(this));
        uint256 newReserveOut = tokenOut.balanceOf(address(this)) - amountOut;
        
        require(
            newReserveIn * newReserveOut >= lastKValue,
            "K invariant violated"
        );
        
        // Transfer output token
        tokenOut.transfer(msg.sender, amountOut);
        
        // Update reserves
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
        lastKValue = reserve0 * reserve1;
        
        emit Swap(msg.sender, amountIn, amountOut, address(tokenIn), address(tokenOut));
        
        return amountOut;
    }

    /**
     * @dev Get input amount needed for desired output
     */
    function getAmountIn(
        uint256 amountOut,
        IERC20 tokenIn
    ) external view returns (uint256 amountIn) {
        require(amountOut > 0, "Amount must be greater than 0");
        require(tokenIn == token0 || tokenIn == token1, "Invalid token");
        
        uint256 reserveIn = tokenIn == token0 ? reserve0 : reserve1;
        uint256 reserveOut = tokenIn == token0 ? reserve1 : reserve0;
        
        uint256 numerator = reserveIn * amountOut * FEE_DENOMINATOR;
        uint256 denominator = (reserveOut - amountOut) * (FEE_DENOMINATOR - FEE_PERCENTAGE);
        amountIn = (numerator / denominator) + 1;
        
        return amountIn;
    }

    /**
     * @dev Get output amount for given input
     */
    function getAmountOut(
        uint256 amountIn,
        IERC20 tokenIn
    ) external view returns (uint256 amountOut) {
        require(amountIn > 0, "Amount must be greater than 0");
        require(tokenIn == token0 || tokenIn == token1, "Invalid token");
        
        uint256 reserveIn = tokenIn == token0 ? reserve0 : reserve1;
        uint256 reserveOut = tokenIn == token0 ? reserve1 : reserve0;
        
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_PERCENTAGE);
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        amountOut = numerator / denominator;
        
        return amountOut;
    }

    /**
     * @dev Get price of token0 in terms of token1
     */
    function getPrice0() external view returns (uint256) {
        if (reserve0 == 0) return 0;
        return (reserve1 * 1e18) / reserve0;
    }

    /**
     * @dev Get price of token1 in terms of token0
     */
    function getPrice1() external view returns (uint256) {
        if (reserve1 == 0) return 0;
        return (reserve0 * 1e18) / reserve1;
    }

    /**
     * @dev Helper function to calculate square root
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    /**
     * @dev Get reserves
     */
    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }
}
