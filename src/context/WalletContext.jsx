import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useToast } from './ToastContext';
import { api } from '../services/api';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [network, setNetwork] = useState(null); // { name, chainId }
    const [provider, setProvider] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const { showToast } = useToast();

    const persistLoginActivity = useCallback(async (walletAddress) => {
        try {
            const roleResponse = await api.get(`/patients/${walletAddress}`);
            await api.post('/activity', {
                walletAddress,
                role: 'patient',
                activityType: 'MetaMask login',
                relatedName: roleResponse.data.name,
            });
        } catch {
            try {
                const roleResponse = await api.get(`/doctors/${walletAddress}`);
                await api.post('/activity', {
                    walletAddress,
                    role: 'doctor',
                    activityType: 'MetaMask login',
                    relatedName: roleResponse.data.name,
                });
            } catch {
                // New users do not have a Mongo profile yet.
            }
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            if (!window.ethereum) {
                setIsInitializing(false);
                return undefined;
            }

                try {
                    const browserProvider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(browserProvider);

                    // Check if already connected
                    const accounts = await browserProvider.listAccounts();
                    if (accounts.length > 0) {
                        const address = await accounts[0].getAddress();
                        setAccount(address);
                        const net = await browserProvider.getNetwork();
                        setNetwork({ name: net.name, chainId: net.chainId });
                        persistLoginActivity(address);
                    }
                } catch (error) {
                    console.error("Wallet initialization error:", error);
                } finally {
                    setIsInitializing(false);
                }

                const handleAccountsChanged = async (accounts) => {
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                        persistLoginActivity(accounts[0]);
                        showToast('Account changed', 'info');
                    } else {
                        setAccount(null);
                        showToast('Disconnected', 'info');
                    }
                };

                // Listen for chain changes
                const handleChainChanged = async (chainId) => {
                    const newProvider = new ethers.BrowserProvider(window.ethereum);
                    const net = await newProvider.getNetwork();
                    setNetwork({ name: net.name, chainId: net.chainId });
                    showToast(`Network changed to ${net.name}`, 'info');
                };

                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', handleChainChanged);

                return () => {
                    if (window.ethereum.removeListener) {
                        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                        window.ethereum.removeListener('chainChanged', handleChainChanged);
                    }
                };
        };
        const cleanupPromise = init();
        return () => {
            cleanupPromise?.then?.((cleanup) => cleanup?.());
        };
    }, [persistLoginActivity, showToast]);

    const connectWallet = async () => {
        if (!window.ethereum) {
            showToast('Please install MetaMask', 'error');
            return;
        }

        setIsConnecting(true);
        try {
            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await browserProvider.send("eth_requestAccounts", []);
            setAccount(accounts[0]);

            const net = await browserProvider.getNetwork();
            setNetwork({ name: net.name, chainId: net.chainId });
            persistLoginActivity(accounts[0]);

            showToast('Wallet connected successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast(error.message || 'Failed to connect wallet', 'error');
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnectWallet = () => {
        // Note: MetaMask doesn't support programmatic disconnect. 
        // We can only clear local state.
        setAccount(null);
        setNetwork(null);
        showToast('Wallet disconnected', 'info');
    };

    return (
        <WalletContext.Provider value={{ account, network, provider, isConnecting, isInitializing, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
