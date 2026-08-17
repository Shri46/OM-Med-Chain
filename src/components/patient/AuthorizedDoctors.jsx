import React, { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatAddress } from '../../utils/formatters';
import { Spinner } from '../ui/Spinner';
import { CONTRACT_ADDRESS } from '../../constants/contractAddress';
import { CONTRACT_ABI } from '../../constants/contractABI';
import { ethers } from 'ethers';
import { useMedChainApi } from '../../hooks/useMedChainApi';

export const AuthorizedDoctors = ({ refreshTrigger }) => {
    const { provider, account } = useWallet();
    const medApi = useMedChainApi();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuthorizedDoctors = async () => {
            if (!provider || !account) return;

            setLoading(true);
            try {
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

                // Query AccessGranted events
                // Filter: patient = account
                const grantedFilter = contract.filters.AccessGranted(account, null);
                const grantedEvents = await contract.queryFilter(grantedFilter, -10000);

                // Query AccessRevoked events
                const revokedFilter = contract.filters.AccessRevoked(account, null);
                const revokedEvents = await contract.queryFilter(revokedFilter, -10000);

                // Process events to find currently authorized doctors
                const statusMap = {}; // address -> bool

                // Sort all events by block number/log index to replay history
                const allEvents = [
                    ...grantedEvents.map(e => ({ type: 'grant', doctor: e.args[1], block: e.blockNumber, index: e.index })),
                    ...revokedEvents.map(e => ({ type: 'revoke', doctor: e.args[1], block: e.blockNumber, index: e.index }))
                ].sort((a, b) => {
                    if (a.block !== b.block) return a.block - b.block;
                    return a.index - b.index;
                });

                allEvents.forEach(e => {
                    if (e.type === 'grant') statusMap[e.doctor] = true;
                    else statusMap[e.doctor] = false;
                });

                const activeDoctors = Object.keys(statusMap).filter(addr => statusMap[addr]);
                const profiles = await Promise.all(activeDoctors.map((wallet) => medApi.getDoctor(wallet).catch(() => ({ walletAddress: wallet }))));
                setDoctors(profiles);

            } catch (error) {
                console.error("Error fetching authorized doctors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuthorizedDoctors();
    }, [provider, account, refreshTrigger]);

    if (loading) return <Spinner size="sm" />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Authorized Doctors</CardTitle>
            </CardHeader>
            <CardContent>
                {doctors.length === 0 ? (
                    <p className="text-gray-500 text-sm">No doctors have access specifically granted via the contract.</p>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {doctors.map(doctor => {
                            return (
                                <li key={doctor.walletAddress} className="py-2 flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">
                                        {doctor.name ? `${doctor.name} (${doctor.specialization || 'Doctor'})` : formatAddress(doctor.walletAddress)}
                                    </span>
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Active</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};
