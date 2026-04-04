// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev DEX Operator contract for executing swaps
 * Can be used by the bot for sandwich attacks
 */
contract DexOperator is Ownable {
    
    struct SwapData {
        address pool;
        uint256 amountIn;
        uint256 minAmountOut;
        address tokenIn;
    }

    event OperatorSwapExecuted(
        address indexed executor,
        address indexed pool,
        uint256 amountIn,
        uint256 amountOut
    );

    /**
     * @dev Execute a swap through the pool
     */
    function executeSwap(
        address pool,
        uint256 amountIn,
        uint256 minAmountOut,
        address tokenIn
    ) external returns (uint256 amountOut) {
        require(pool != address(0), "Invalid pool");
        require(amountIn > 0, "Invalid amount");
        
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(pool, amountIn);
        
        // Call swap on pool
        (bool success, bytes memory data) = pool.call(
            abi.encodeWithSignature(
                "swap(uint256,uint256,address)",
                amountIn,
                minAmountOut,
                tokenIn
            )
        );
        
        require(success, "Swap failed");
        amountOut = abi.decode(data, (uint256));
        
        // Get token out
        address tokenOut = getTwinToken(pool, tokenIn);
        require(tokenOut != address(0), "Invalid token out");
        
        // Transfer to caller
        uint256 balance = IERC20(tokenOut).balanceOf(address(this));
        IERC20(tokenOut).transfer(msg.sender, balance);
        
        emit OperatorSwapExecuted(msg.sender, pool, amountIn, amountOut);
        
        return amountOut;
    }

    /**
     * @dev Get the twin token (other token in pair)
     */
    function getTwinToken(address pool, address token) internal view returns (address) {
        (bool success0, bytes memory data0) = pool.staticcall(
            abi.encodeWithSignature("token0()")
        );
        (bool success1, bytes memory data1) = pool.staticcall(
            abi.encodeWithSignature("token1()")
        );
        
        if (success0 && success1) {
            address token0 = abi.decode(data0, (address));
            address token1 = abi.decode(data1, (address));
            
            if (token == token0) return token1;
            if (token == token1) return token0;
        }
        
        return address(0);
    }

    /**
     * @dev Recover any stuck tokens
     */
    function recoverToken(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
}
