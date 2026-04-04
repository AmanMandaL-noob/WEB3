import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check if wallet was previously connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) {
        setError('MetaMask not installed');
        return;
      }

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });

        if (accounts.length > 0) {
          connectWallet();
        }
      } catch (err) {
        console.error('Error checking connection:', err);
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const chainId = (await provider.getNetwork()).chainId;
      
      const userAccount = accounts[0];
      const balance = await provider.getBalance(userAccount);

      setProvider(provider);
      setSigner(signer);
      setAccount(userAccount);
      setChainId(chainId);
      setBalance(ethers.utils.formatEther(balance));
      setIsConnected(true);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = (newChainId) => {
    setChainId(parseInt(newChainId, 16));
    window.location.reload();
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setBalance('0');
    setIsConnected(false);
    setError(null);
  };

  const getBalance = async () => {
    if (!provider || !account) return;
    try {
      const bal = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(bal));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  return (
    <WalletContext.Provider value={{
      account,
      provider,
      signer,
      chainId,
      balance,
      isConnected,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      getBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
