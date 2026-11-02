import { useState, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS } from '../constants/contractAddress';
import { CONTRACT_ABI } from '../constants/contractABI';
import { useWallet } from './useWallet';
import { useToast } from '../context/ToastContext';

export const useContract = () => {
    const { provider, account } = useWallet();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const getContract = useCallback(async (withSigner = false) => {
        if (!provider) return null;

        if (withSigner) {
            const signer = await provider.getSigner();
            return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        }
        return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    }, [provider]);

    // Read functions
    const getRole = useCallback(async (address) => {
        try {
            const contract = await getContract();
            if (!contract) return null;
            return await contract.getRole(address);
        } catch (error) {
            console.error("Error getting role:", error);
            return null;
        }
    }, [getContract]);

    const getRecords = useCallback(async () => {
        try {
            const contract = await getContract(true);
            if (!contract) return [];
            return await contract.getRecords();
        } catch (error) {
            console.error("Error getting records:", error);
            return [];
        }
    }, [getContract]);

    const getPatientRecords = useCallback(async (patientAddress) => {
        try {
            const contract = await getContract(true);
            if (!contract) return [];
            return await contract.getPatientRecords(patientAddress);
        } catch (error) {
            console.error("Error getting patient records:", error);
            showToast("Failed to fetch patient records. You might not have access.", "error");
            return [];
        }
    }, [getContract, showToast]);

    const isAuthorized = useCallback(async (patientAddress, doctorAddress) => {
        try {
            const contract = await getContract();
            if (!contract) return false;
            return await contract.isAuthorized(patientAddress, doctorAddress);
        } catch (error) {
            console.error("Error checking authorization:", error);
            return false;
        }
    }, [getContract]);

    // Write functions
    const registerRole = async (role) => {
        setIsLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.registerRole(role);
            showToast('Transaction sent...', 'loading');
            await tx.wait();
            showToast(`Registered as ${role} successfully`, 'success');
            return true;
        } catch (error) {
            console.error(error);
            showToast(error.reason || error.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const storeCID = async (cid, fileName, fileType) => {
        setIsLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.storeCID(cid, fileName, fileType);
            showToast('Storing record...', 'loading');
            await tx.wait();
            showToast('Record stored successfully', 'success');
            return true;
        } catch (error) {
            console.error(error);
            showToast(error.reason || error.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const grantAccess = async (doctorAddress) => {
        setIsLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.grantAccess(doctorAddress);
            showToast('Granting access...', 'loading');
            await tx.wait();
            showToast('Access granted successfully', 'success');
            return true;
        } catch (error) {
            console.error(error);
            showToast(error.reason || error.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const revokeAccess = async (doctorAddress) => {
        setIsLoading(true);
        try {
            const contract = await getContract(true);
            const tx = await contract.revokeAccess(doctorAddress);
            showToast('Revoking access...', 'loading');
            await tx.wait();
            showToast('Access revoked successfully', 'success');
            return true;
        } catch (error) {
            console.error(error);
            showToast(error.reason || error.message, 'error');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        getRole,
        getRecords,
        getPatientRecords,
        isAuthorized,
        registerRole,
        storeCID,
        grantAccess,
        revokeAccess,
        isLoading
    };
};
