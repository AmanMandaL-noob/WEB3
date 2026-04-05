import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './context/WalletContext';
import { getTokenBalance, getPoolInfo, getLPBalance, swap as swapTokens, addLiquidity as addLiquidityFunc, removeLiquidity as removeLiquidityFunc, getTokenContract, getPoolContract } from './hooks/useContracts';

const Header = ({ openModal }) => {
  const { account, balance, isConnected, connectWallet, disconnectWallet } = useWallet();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div style={styles.header}>
      <div style={styles.headerContent}>
        <div style={styles.logo}>
          <span style={{ fontSize: '24px', marginRight: '8px' }}>📊</span>
          <span style={styles.logoText}>DeFi DEX</span>
        </div>
        
        <div style={styles.nav}>
          <button 
            style={styles.navButton}
            onClick={() => openModal('swap')}
          >
            🔄 Swap
          </button>
          <button 
            style={styles.navButton}
            onClick={() => openModal('liquidity')}
          >
            💧 Liquidity
          </button>
          <button 
            style={styles.navButton}
            onClick={() => openModal('positions')}
          >
            📍 Positions
          </button>
        </div>

        <div style={styles.wallet}>
          {isConnected ? (
            <div style={styles.connectedWallet}>
              <div style={styles.balanceInfo}>
                <div style={styles.balanceAmount}>{parseFloat(balance).toFixed(3)} ETH</div>
                <div style={styles.balanceLabel}>Balance</div>
              </div>
              <span style={styles.address}>{formatAddress(account)}</span>
              <button
                style={{ ...styles.button, ...styles.disconnectBtn }}
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              style={{ ...styles.button, ...styles.connectBtn }}
              onClick={connectWallet}
            >
              Connect MetaMask
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SwapModal = ({ isOpen, onClose, poolAddress, tokens, deploymentAddresses }) => {
  const { provider, signer, account } = useWallet();
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [estimatedOut, setEstimatedOut] = useState('0');
  const [txReceipt, setTxReceipt] = useState(null);
  const [balanceInfo, setBalanceInfo] = useState({ before: '0', after: '0' });

  const calculateOutput = (amount) => {
    if (!amount || !deploymentAddresses) return '0';
    return amount;
  };

  useEffect(() => {
    if (!isOpen || !deploymentAddresses) return;
    const timer = setTimeout(() => {
      setEstimatedOut(calculateOutput(amountIn));
    }, 300);
    return () => clearTimeout(timer);
  }, [amountIn, deploymentAddresses, isOpen]);

  if (!isOpen || !deploymentAddresses) return null;

  const handleClose = () => {
    setAmountIn('');
    setTxStatus(null);
    onClose();
  };

  const handleSwap = async () => {
    if (!amountIn || !signer) {
      setTxStatus({ success: false, message: 'Please enter amount and connect wallet' });
      return;
    }

    setIsLoading(true);
    setTxStatus(null);
    setTxReceipt(null);

    try {
      setTxStatus({ success: null, message: 'Loading balances...' });

      // Get token and pool contracts
      const tokenInAddress = deploymentAddresses.tokenA; // USDC
      const poolAddress = deploymentAddresses.poolAB;
      const tokenOutAddress = deploymentAddresses.tokenB; // DAI

      const userAddress = await signer.getAddress();
      
      // Get balance before swap
      const tokenOutContract = getTokenContract(tokenOutAddress, signer);
      const balanceBefore = await tokenOutContract.balanceOf(userAddress);
      setBalanceInfo(prev => ({ ...prev, before: ethers.utils.formatEther(balanceBefore) }));

      setTxStatus({ success: null, message: 'Approving tokens...' });

      const tokenContract = getTokenContract(tokenInAddress, signer);
      const poolContract = getPoolContract(poolAddress, signer);

      // Format amount with correct decimals (USDC = 6)
      const decimals = 6;
      const formattedAmount = ethers.utils.parseUnits(amountIn, decimals);

      // Approve tokens to pool with unlimited allowance
      const approveTx = await tokenContract.approve(poolAddress, ethers.constants.MaxUint256);
      
      setTxStatus({ success: null, message: `⏳ Approval pending: ${approveTx.hash.slice(0, 10)}...` });
      const approveReceipt = await approveTx.wait(1);
      if (!approveReceipt) throw new Error('Approval failed - no receipt');

      setTxStatus({ success: null, message: 'Please confirm swap in MetaMask...' });

      // Call swap with tokenIn as an address string
      const swapTx = await poolContract.swap(formattedAmount, 0, tokenInAddress, {
        gasLimit: 500000
      });
      
      setTxStatus({ success: null, message: `⏳ Swap pending: ${swapTx.hash.slice(0, 10)}...` });
      const swapReceipt = await swapTx.wait(1);

      if (!swapReceipt) throw new Error('Swap transaction failed - no receipt');

      // Get balance after swap
      const balanceAfter = await tokenOutContract.balanceOf(userAddress);
      const balanceChange = ethers.utils.formatEther(balanceAfter.sub(balanceBefore));
      
      setBalanceInfo({
        before: ethers.utils.formatEther(balanceBefore),
        after: ethers.utils.formatEther(balanceAfter)
      });

      // Set receipt for display
      setTxReceipt({
        txHash: swapReceipt.transactionHash,
        blockNumber: swapReceipt.blockNumber,
        gasUsed: swapReceipt.gasUsed.toString(),
        status: swapReceipt.status === 1 ? 'Success' : 'Failed',
        amountIn: amountIn,
        amountOut: balanceChange,
        tokenIn: 'USDC',
        tokenOut: 'DAI'
      });

      setTxStatus({
        success: true,
        message: `✅ Swap successful!`
      });

      setAmountIn('');
      
    } catch (error) {
      console.error('Full swap error:', error);
      let errorMsg = error.reason || error.message || 'Unknown error';
      
      if (errorMsg.includes('User denied')) {
        errorMsg = 'Transaction rejected by user';
      } else if (errorMsg.includes('insufficient balance')) {
        errorMsg = 'Insufficient token balance';
      } else if (errorMsg.includes('InsufficientLiquidity')) {
        errorMsg = 'Insufficient liquidity in pool';
      }
      
      setTxStatus({
        success: false,
        message: `❌ Error: ${errorMsg.slice(0, 80)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderTitle}>
            <span>💱</span> Swap Tokens
          </div>
          <button style={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <div style={styles.modalContent}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span>💵 You Pay</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Available: --</span>
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              style={styles.input}
              disabled={isLoading}
            />
            <div style={styles.tokenPair}>
              <span>USDC</span>
              <span>6 decimals</span>
            </div>
          </div>

          <div style={styles.swapArrow} title="Reverse swap" onClick={() => {}}>⬇️</div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span>💸 You Receive</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Est. Output</span>
            </label>
            <input
              type="text"
              value={estimatedOut}
              disabled
              style={{ ...styles.input, ...styles.disabledInput }}
            />
            <div style={styles.tokenPair}>
              <span>DAI</span>
              <span>18 decimals</span>
            </div>
          </div>

          <div style={styles.slippageControl}>
            <label style={styles.slippageLabel}>⚙️ Slippage Tolerance</label>
            <div style={styles.slippageOptions}>
              {['0.1', '0.5', '1.0'].map((val) => (
                <button
                  key={val}
                  style={{
                    ...styles.slippageBtn,
                    ...(slippage === val ? styles.slippageBtnActive : {}),
                  }}
                  onClick={() => setSlippage(val)}
                  disabled={isLoading}
                >
                  {val}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                style={styles.slippageInput}
                disabled={isLoading}
              />
            </div>
          </div>

          {txStatus && (
            <div>
              <div style={{
                ...styles.txStatus,
                backgroundColor: txStatus.success ? '#10b981' : txStatus.success === null ? '#f59e0b' : '#ef4444',
              }}>
                {txStatus.message}
              </div>
              
              {txReceipt && (
                <div style={styles.receiptBox}>
                  <div style={styles.receiptTitle}>📋 Transaction Receipt</div>
                  
                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Transaction Hash:</span>
                    <span style={styles.receiptValue} title={txReceipt.txHash}>
                      {txReceipt.txHash.slice(0, 10)}...{txReceipt.txHash.slice(-8)}
                    </span>
                  </div>
                  
                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Block Number:</span>
                    <span style={styles.receiptValue}>{txReceipt.blockNumber}</span>
                  </div>
                  
                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Status:</span>
                    <span style={{ ...styles.receiptValue, color: '#10b981' }}>
                      ✅ {txReceipt.status}
                    </span>
                  </div>

                  <div style={styles.receiptDivider} />
                  
                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Amount In:</span>
                    <span style={styles.receiptValue}>
                      {parseFloat(txReceipt.amountIn).toFixed(6)} {txReceipt.tokenIn}
                    </span>
                  </div>
                  
                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Amount Out:</span>
                    <span style={{ ...styles.receiptValue, color: '#60a5fa', fontWeight: '700' }}>
                      +{parseFloat(txReceipt.amountOut).toFixed(6)} {txReceipt.tokenOut}
                    </span>
                  </div>

                  <div style={styles.receiptDivider} />
                  
                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Balance Before:</span>
                    <span style={styles.receiptValue}>
                      {parseFloat(balanceInfo.before).toFixed(6)} {txReceipt.tokenOut}
                    </span>
                  </div>
                  
                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Balance After:</span>
                    <span style={{ ...styles.receiptValue, color: '#10b981', fontWeight: '700' }}>
                      {parseFloat(balanceInfo.after).toFixed(6)} {txReceipt.tokenOut}
                    </span>
                  </div>

                  <div style={styles.receiptDivider} />

                  <div style={styles.receiptRow}>
                    <span style={styles.receiptLabel}>Gas Used:</span>
                    <span style={styles.receiptValue}>{txReceipt.gasUsed}</span>
                  </div>

                  <button
                    style={{ ...styles.button, ...styles.primaryBtn, marginTop: '16px' }}
                    onClick={() => {
                      setAmountIn('');
                      setTxReceipt(null);
                      setTxStatus(null);
                      onClose();
                    }}
                  >
                    ✅ Done
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            style={{...styles.button, ...styles.primaryBtn, ...(isLoading ? styles.primaryBtnDisabled : {}), ...(txReceipt ? { display: 'none' } : {})}}
            onClick={handleSwap}
            disabled={isLoading || !amountIn || txReceipt}
          >
            {isLoading ? '⏳ Processing...' : '🔄 Swap Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

const LiquidityModal = ({ isOpen, onClose, poolAddress, tokens, deploymentAddresses }) => {
  const { signer } = useWallet();
  const [tab, setTab] = useState('add');
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [txStatus, setTxStatus] = useState(null);

  if (!isOpen || !deploymentAddresses) return null;

  const handleClose = () => {
    setAmount0('');
    setAmount1('');
    setTxStatus(null);
    onClose();
  };

  const handleAddLiquidity = async () => {
    if (!amount0 || !amount1 || !signer) {
      setTxStatus({ success: false, message: 'Please enter both amounts and connect wallet' });
      return;
    }

    setIsLoading(true);
    setTxStatus(null);

    try {
      setTxStatus({ success: null, message: 'Approving tokens...' });

      const token0 = getTokenContract(deploymentAddresses.tokenA, signer);
      const token1 = getTokenContract(deploymentAddresses.tokenB, signer);

      const amount0Formatted = ethers.utils.parseUnits(amount0, 6); // USDC
      const amount1Formatted = ethers.utils.parseEther(amount1); // DAI

      // Approve tokens
      let tx = await token0.approve(deploymentAddresses.poolAB, amount0Formatted);
      await tx.wait();

      tx = await token1.approve(deploymentAddresses.poolAB, amount1Formatted);
      await tx.wait();

      setTxStatus({ success: null, message: 'Adding liquidity...' });

      // Add liquidity
      const pool = getPoolContract(deploymentAddresses.poolAB, signer);
      tx = await pool.addLiquidity(amount0Formatted, amount1Formatted, 0);
      const receipt = await tx.wait();

      setTxStatus({
        success: true,
        message: `✅ Liquidity added! TX: ${receipt.transactionHash.slice(0, 10)}...`
      });

      setAmount0('');
      setAmount1('');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Add liquidity error:', error);
      setTxStatus({
        success: false,
        message: `❌ Failed: ${error.message.slice(0, 50)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!amount0 || !signer) {
      setTxStatus({ success: false, message: 'Please enter LP token amount' });
      return;
    }

    setIsLoading(true);
    setTxStatus(null);

    try {
      setTxStatus({ success: null, message: 'Removing liquidity...' });

      const pool = getPoolContract(deploymentAddresses.poolAB, signer);
      const lpAmount = ethers.utils.parseEther(amount0);

      const tx = await pool.removeLiquidity(lpAmount, 0, 0);
      const receipt = await tx.wait();

      setTxStatus({
        success: true,
        message: `✅ Liquidity removed! TX: ${receipt.transactionHash.slice(0, 10)}...`
      });

      setAmount0('');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Remove liquidity error:', error);
      setTxStatus({
        success: false,
        message: `❌ Failed: ${error.message.slice(0, 50)}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderTitle}>
            <span>💧</span> Manage Liquidity
          </div>
          <button style={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(tab === 'add' ? styles.tabActive : {}),
            }}
            onClick={() => setTab('add')}
            disabled={isLoading}
          >
            ➕ Add Liquidity
          </button>
          <button
            style={{
              ...styles.tab,
              ...(tab === 'remove' ? styles.tabActive : {}),
            }}
            onClick={() => setTab('remove')}
            disabled={isLoading}
          >
            ➖ Remove Liquidity
          </button>
        </div>

        <div style={styles.modalContent}>
          {tab === 'add' ? (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <span>💵 USDC Amount</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Available: --</span>
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount0}
                  onChange={(e) => setAmount0(e.target.value)}
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              <div style={styles.plus}>+</div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <span>📊 DAI Amount</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Available: --</span>
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount1}
                  onChange={(e) => setAmount1(e.target.value)}
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              <div style={styles.info}>
                <strong>You will receive LP tokens representing your position</strong>
              </div>
            </>
          ) : (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  <span>🔥 LP Tokens to Remove</span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Your LP Balance: --</span>
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amount0}
                  onChange={(e) => setAmount0(e.target.value)}
                  style={styles.input}
                  disabled={isLoading}
                />
              </div>

              <div style={styles.info}>
                <strong>You will receive both tokens back proportionally</strong>
              </div>
            </>
          )}

          {txStatus && (
            <div style={{
              ...styles.txStatus,
              backgroundColor: txStatus.success ? '#10b981' : txStatus.success === null ? '#f59e0b' : '#ef4444',
            }}>
              {txStatus.message}
            </div>
          )}

          <button
            style={{...styles.button, ...styles.primaryBtn, ...(isLoading ? styles.primaryBtnDisabled : {})}}
            onClick={tab === 'add' ? handleAddLiquidity : handleRemoveLiquidity}
            disabled={isLoading || (tab === 'add' ? (!amount0 || !amount1) : !amount0)}
          >
            {isLoading ? '⏳ Processing...' : (tab === 'add' ? '💧 Add Liquidity' : '🔥 Remove Liquidity')}
          </button>
        </div>
      </div>
    </div>
  );
};

const PositionsModal = ({ isOpen, onClose, poolAddress }) => {
  const { account, provider } = useWallet();
  const [positions, setPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={styles.modalHeaderTitle}>
            <span>📍</span> Your Positions
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.modalContent}>
          {positions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyStateIcon}>💼</div>
              <p style={{ fontWeight: '600', marginBottom: '8px', color: '#e0e7ff' }}>No active positions</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Add liquidity to start earning fees from the pool
              </p>
            </div>
          ) : (
            <div>
              {positions.map((pos, idx) => (
                <div key={idx} style={styles.positionCard}>
                  <div style={styles.positionInfo}>
                    <strong>{pos.token0}/{pos.token1}</strong>
                    <div style={styles.positionDetails}>
                      LP Tokens: {pos.lpBalance}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [deploymentAddresses, setDeploymentAddresses] = useState(null);
  const { isConnected } = useWallet();

  // Load deployment addresses on component mount
  useEffect(() => {
    const loadDeploymentAddresses = async () => {
      try {
        const response = await fetch('/deploymentAddresses.json');
        const addresses = await response.json();
        setDeploymentAddresses(addresses);
      } catch (error) {
        console.error('Failed to load deployment addresses:', error);
      }
    };

    loadDeploymentAddresses();
  }, []);

  return (
    <div style={styles.app}>
      <Header openModal={setActiveModal} />
      
      <div style={styles.container}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Welcome to DeFi DEX</h1>
          <p style={styles.heroSubtitle}>Decentralized Exchange & Liquidity Protocol</p>
          
          {!isConnected && (
            <div style={styles.heroAction}>
              <p>Connect your wallet to get started</p>
            </div>
          )}

          {isConnected && (
            <div style={styles.quickStats}>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Total Value Locked</div>
                <div style={styles.statValue}>$2.5M</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>24h Volume</div>
                <div style={styles.statValue}>$1.2M</div>
              </div>
              <div style={styles.stat}>
                <div style={styles.statLabel}>Available Pools</div>
                <div style={styles.statValue}>2</div>
              </div>
            </div>
          )}
        </div>

        {isConnected && (
          <>
            {/* Featured Trading Pairs */}
            <div style={styles.sectionTitle}>
              <span>⭐</span> Featured Trading Pairs
            </div>
            <div style={styles.poolsGrid}>
              <div style={styles.poolCard}>
                <div style={styles.poolCardHeader}>
                  <div style={styles.poolTokens}>
                    <span style={styles.tokenBadge}>💵 USDC</span>
                    <span style={styles.swapIcon}>/</span>
                    <span style={styles.tokenBadge}>📊 DAI</span>
                  </div>
                  <span style={styles.poolBadge}>Trending</span>
                </div>
                <div style={styles.poolCardContent}>
                  <div style={styles.poolStat}>
                    <span style={styles.poolStatLabel}>24h Volume</span>
                    <span style={styles.poolStatValue}>$1.2M</span>
                  </div>
                  <div style={styles.poolStat}>
                    <span style={styles.poolStatLabel}>Liquidity</span>
                    <span style={styles.poolStatValue}>$850K</span>
                  </div>
                  <div style={styles.poolStat}>
                    <span style={styles.poolStatLabel}>Fee Tier</span>
                    <span style={styles.poolStatValue}>0.3%</span>
                  </div>
                </div>
                <button 
                  style={styles.poolActionBtn}
                  onClick={() => setActiveModal('swap')}
                >
                  🔄 Trade Now
                </button>
              </div>

              <div style={styles.poolCard}>
                <div style={styles.poolCardHeader}>
                  <div style={styles.poolTokens}>
                    <span style={styles.tokenBadge}>📊 DAI</span>
                    <span style={styles.swapIcon}>/</span>
                    <span style={styles.tokenBadge}>🔗 WETH</span>
                  </div>
                  <span style={styles.poolBadge}>Active</span>
                </div>
                <div style={styles.poolCardContent}>
                  <div style={styles.poolStat}>
                    <span style={styles.poolStatLabel}>24h Volume</span>
                    <span style={styles.poolStatValue}>$2.1M</span>
                  </div>
                  <div style={styles.poolStat}>
                    <span style={styles.poolStatLabel}>Liquidity</span>
                    <span style={styles.poolStatValue}>$1.2M</span>
                  </div>
                  <div style={styles.poolStat}>
                    <span style={styles.poolStatLabel}>Fee Tier</span>
                    <span style={styles.poolStatValue}>0.3%</span>
                  </div>
                </div>
                <button 
                  style={styles.poolActionBtn}
                  onClick={() => setActiveModal('swap')}
                >
                  🔄 Trade Now
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={styles.sectionTitle}>
              <span>⚡</span> Quick Actions
            </div>
            <div style={styles.actionsGrid}>
              <div style={styles.actionCard} onClick={() => setActiveModal('swap')}>
                <div style={styles.actionIcon}>💱</div>
                <div style={styles.actionTitle}>Swap Tokens</div>
                <div style={styles.actionDesc}>Exchange tokens instantly</div>
              </div>

              <div style={styles.actionCard} onClick={() => setActiveModal('liquidity')}>
                <div style={styles.actionIcon}>💧</div>
                <div style={styles.actionTitle}>Add Liquidity</div>
                <div style={styles.actionDesc}>Earn trading fees</div>
              </div>

              <div style={styles.actionCard} onClick={() => setActiveModal('liquidity')}>
                <div style={styles.actionIcon}>🔥</div>
                <div style={styles.actionTitle}>Remove Liquidity</div>
                <div style={styles.actionDesc}>Withdraw your LP tokens</div>
              </div>

              <div style={styles.actionCard} onClick={() => setActiveModal('positions')}>
                <div style={styles.actionIcon}>📍</div>
                <div style={styles.actionTitle}>View Positions</div>
                <div style={styles.actionDesc}>Manage your liquidity</div>
              </div>
            </div>

            {/* Market Statistics */}
            <div style={styles.sectionTitle}>
              <span>📈</span> Market Overview
            </div>
            <div style={styles.statsGrid}>
              <div style={styles.statsCard}>
                <div style={styles.statsCardIcon}>💰</div>
                <div style={styles.statsCardLabel}>Total Value Locked</div>
                <div style={styles.statsCardValue}>$2,500,000</div>
                <div style={styles.statsCardChange}>↑ 12.5% from last week</div>
              </div>

              <div style={styles.statsCard}>
                <div style={styles.statsCardIcon}>📊</div>
                <div style={styles.statsCardLabel}>24h Trading Volume</div>
                <div style={styles.statsCardValue}>$1,200,000</div>
                <div style={styles.statsCardChange}>↑ 8.3% from yesterday</div>
              </div>

              <div style={styles.statsCard}>
                <div style={styles.statsCardIcon}>👥</div>
                <div style={styles.statsCardLabel}>Active Liquidity Providers</div>
                <div style={styles.statsCardValue}>127</div>
                <div style={styles.statsCardChange}>↑ 5 new providers</div>
              </div>

              <div style={styles.statsCard}>
                <div style={styles.statsCardIcon}>🔗</div>
                <div style={styles.statsCardLabel}>Available Pools</div>
                <div style={styles.statsCardValue}>2</div>
                <div style={styles.statsCardChange}>USDC/DAI • DAI/WETH</div>
              </div>
            </div>
          </>
        )}
      </div>

      {deploymentAddresses && (
        <>
          <SwapModal
            isOpen={activeModal === 'swap'}
            onClose={() => setActiveModal(null)}
            deploymentAddresses={deploymentAddresses}
          />
          
          <LiquidityModal
            isOpen={activeModal === 'liquidity'}
            onClose={() => setActiveModal(null)}
            deploymentAddresses={deploymentAddresses}
          />
        </>
      )}
      
      <PositionsModal
        isOpen={activeModal === 'positions'}
        onClose={() => setActiveModal(null)}
        poolAddress={deploymentAddresses?.poolAB}
      />
    </div>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
    color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    background: 'rgba(10, 14, 39, 0.9)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    backdropFilter: 'blur(20px)',
    padding: '20px 0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '22px',
    fontWeight: 'bold',
    gap: '12px',
  },
  logoText: {
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontSize: '24px',
    fontWeight: '800',
  },
  nav: {
    display: 'flex',
    gap: '16px',
    flex: 1,
    justifyContent: 'center',
  },
  navButton: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#e0e7ff',
    padding: '10px 20px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  navButtonHover: {
    background: 'rgba(99, 102, 241, 0.2)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
  },
  wallet: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  connectedWallet: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
  },
  balanceInfo: {
    textAlign: 'right',
  },
  balanceAmount: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#f0f9ff',
  },
  balanceLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '4px',
  },
  address: {
    fontSize: '14px',
    color: '#cbd5e1',
    fontFamily: '"Fira Code", monospace',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '4px 12px',
    borderRadius: '6px',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  connectBtn: {
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(96, 165, 250, 0.4)',
  },
  connectBtnHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(96, 165, 250, 0.5)',
  },
  disconnectBtn: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  hero: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: '900',
    marginBottom: '16px',
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-1px',
  },
  heroSubtitle: {
    fontSize: '20px',
    color: '#cbd5e1',
    marginBottom: '40px',
    fontWeight: '500',
  },
  heroAction: {
    padding: '24px',
    background: 'rgba(99, 102, 241, 0.1)',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    backdropFilter: 'blur(10px)',
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
    marginTop: '50px',
  },
  stat: {
    background: 'rgba(99, 102, 241, 0.08)',
    padding: '28px 20px',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  statHover: {
    transform: 'translateY(-4px)',
    background: 'rgba(99, 102, 241, 0.12)',
    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.15)',
  },
  statLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '600',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '900',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(20, 30, 50, 0.98) 100%)',
    borderRadius: '20px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    maxWidth: '520px',
    width: '90%',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  modalHeader: {
    padding: '24px',
    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(99, 102, 241, 0.05)',
    borderRadius: '20px 20px 0 0',
  },
  modalHeaderTitle: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#f0f9ff',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '24px',
    transition: 'all 0.3s ease',
  },
  closeBtnHover: {
    color: '#e2e8f0',
    transform: 'rotate(90deg)',
  },
  modalContent: {
    padding: '24px',
  },
  inputGroup: {
    marginBottom: '18px',
  },
  label: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    fontSize: '14px',
    color: '#cbd5e1',
    fontWeight: '600',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    background: 'rgba(30, 41, 59, 0.6)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '12px',
    color: '#f0f9ff',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  inputFocus: {
    borderColor: 'rgba(99, 102, 241, 0.5)',
    background: 'rgba(30, 41, 59, 0.8)',
    boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)',
  },
  disabledInput: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  tokenPair: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
    color: '#64748b',
    marginTop: '6px',
    fontWeight: '500',
  },
  tokenIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    background: 'rgba(99, 102, 241, 0.1)',
  },
  swapArrow: {
    textAlign: 'center',
    fontSize: '28px',
    margin: '16px 0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  swapArrowHover: {
    transform: 'rotate(180deg) scale(1.2)',
  },
  plus: {
    textAlign: 'center',
    fontSize: '20px',
    margin: '12px 0',
    color: '#60a5fa',
    fontWeight: '700',
  },
  slippageControl: {
    marginBottom: '18px',
  },
  slippageLabel: {
    fontSize: '14px',
    color: '#cbd5e1',
    fontWeight: '600',
    marginBottom: '10px',
    display: 'block',
  },
  slippageOptions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '10px',
  },
  slippageBtn: {
    padding: '10px 8px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '10px',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  slippageBtnActive: {
    background: 'rgba(99, 102, 241, 0.3)',
    border: '2px solid rgba(99, 102, 241, 0.6)',
    color: '#bfdbfe',
    boxShadow: '0 0 15px rgba(99, 102, 241, 0.2)',
  },
  slippageInput: {
    gridColumn: '4',
    padding: '10px 8px',
    background: 'rgba(99, 102, 241, 0.1)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '10px',
    color: '#f0f9ff',
    fontSize: '13px',
    fontWeight: '600',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
    marginBottom: '16px',
    gap: '4px',
  },
  tab: {
    flex: 1,
    padding: '14px 12px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    borderBottom: '3px solid transparent',
    transition: 'all 0.3s ease',
  },
  tabActive: {
    color: '#60a5fa',
    borderBottomColor: '#60a5fa',
    background: 'rgba(99, 102, 241, 0.08)',
  },
  info: {
    padding: '14px 16px',
    background: 'rgba(99, 102, 241, 0.15)',
    borderRadius: '12px',
    fontSize: '13px',
    color: '#bfdbfe',
    marginBottom: '18px',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    fontWeight: '500',
  },
  txStatus: {
    padding: '14px 16px',
    borderRadius: '12px',
    marginBottom: '18px',
    fontSize: '14px',
    color: 'white',
    fontWeight: '600',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    animation: 'slideIn 0.3s ease',
  },
  primaryBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
    color: 'white',
    padding: '14px 16px',
    marginTop: '12px',
    fontWeight: '700',
    fontSize: '16px',
    boxShadow: '0 4px 15px rgba(96, 165, 250, 0.3)',
    transition: 'all 0.3s ease',
  },
  primaryBtnHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 25px rgba(96, 165, 250, 0.4)',
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
    transform: 'none',
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 20px',
    color: '#94a3b8',
  },
  emptyStateIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  positionCard: {
    background: 'rgba(99, 102, 241, 0.1)',
    padding: '18px 16px',
    borderRadius: '12px',
    marginBottom: '14px',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    transition: 'all 0.3s ease',
  },
  positionCardHover: {
    background: 'rgba(99, 102, 241, 0.15)',
    transform: 'translateX(4px)',
  },
  positionInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  positionName: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#f0f9ff',
  },
  positionDetails: {
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '8px',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#f0f9ff',
    marginTop: '50px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '12px',
    borderBottom: '2px solid rgba(99, 102, 241, 0.2)',
  },
  poolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    marginBottom: '50px',
  },
  poolCard: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.08) 100%)',
    borderRadius: '16px',
    border: '1px solid rgba(99, 102, 241, 0.3)',
    padding: '20px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
  },
  poolCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  poolTokens: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  tokenBadge: {
    background: 'rgba(99, 102, 241, 0.2)',
    color: '#bfdbfe',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    border: '1px solid rgba(99, 102, 241, 0.3)',
  },
  swapIcon: {
    color: '#60a5fa',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  poolBadge: {
    background: 'linear-gradient(135deg, #10b981, #34d399)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },
  poolCardContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
    flex: 1,
  },
  poolStat: {
    display: 'flex',
    flexDirection: 'column',
  },
  poolStatLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
    fontWeight: '600',
  },
  poolStatValue: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#f0f9ff',
  },
  poolActionBtn: {
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '14px',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '50px',
  },
  actionCard: {
    background: 'rgba(99, 102, 241, 0.1)',
    border: '2px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '14px',
    padding: '24px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  actionIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#f0f9ff',
    marginBottom: '6px',
  },
  actionDesc: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '50px',
  },
  statsCard: {
    background: 'linear-gradient(135deg, rgba(10, 14, 39, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.2)',
    borderRadius: '14px',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  statsCardIcon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  statsCardLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    fontWeight: '600',
  },
  statsCardValue: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#f0f9ff',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statsCardChange: {
    fontSize: '12px',
    color: '#10b981',
    fontWeight: '600',
  },
  receiptBox: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '2px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '16px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  receiptTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#10b981',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  receiptRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
  },
  receiptLabel: {
    color: '#cbd5e1',
    fontWeight: '500',
  },
  receiptValue: {
    color: '#f0f9ff',
    fontWeight: '600',
    fontFamily: '"Fira Code", monospace',
    textAlign: 'right',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  receiptDivider: {
    height: '1px',
    background: 'rgba(16, 185, 129, 0.3)',
    margin: '12px 0',
  },
};

export default App;
