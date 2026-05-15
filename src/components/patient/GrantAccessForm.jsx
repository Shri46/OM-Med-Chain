import React, { useEffect, useState } from 'react';
import { useContract } from '../../hooks/useContract';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { UserPlus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../hooks/useWallet';
import { useMedChainApi } from '../../hooks/useMedChainApi';

export const GrantAccessForm = ({ patientProfile, onSuccess }) => {
    const [doctorAddress, setDoctorAddress] = useState('');
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [isFetchingDoctors, setIsFetchingDoctors] = useState(true);

    const { account } = useWallet();
    const { grantAccess, isLoading } = useContract();
    const medApi = useMedChainApi();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchDoctors = async () => {
            const hospitalId = patientProfile?.hospitalId?._id || patientProfile?.hospitalId;
            if (!hospitalId) return;
            setIsFetchingDoctors(true);
            try {
                const doctors = await medApi.getDoctors(hospitalId);
                setAvailableDoctors(doctors);
            } catch (error) {
                console.error("Error fetching available doctors:", error);
            } finally {
                setIsFetchingDoctors(false);
            }
        };

        fetchDoctors();
    }, [patientProfile?.hospitalId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!doctorAddress) {
            showToast('Please select a doctor', 'error');
            return;
        }

        const success = await grantAccess(doctorAddress);
        if (success) {
            const doctor = availableDoctors.find((item) => item.walletAddress === doctorAddress);
            await medApi.createActivity({
                walletAddress: account,
                role: 'patient',
                activityType: 'Access granted',
                relatedUser: doctorAddress,
                relatedName: doctor?.name || '',
            });
            setDoctorAddress('');
            if (onSuccess) onSuccess();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Grant Doctor Access</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="doctor-select" className="block text-sm font-medium text-gray-700">
                            Select Doctor
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <select
                                id="doctor-select"
                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border bg-white"
                                value={doctorAddress}
                                onChange={(e) => setDoctorAddress(e.target.value)}
                                disabled={isLoading || isFetchingDoctors}
                            >
                                <option value="">-- Choose a doctor --</option>
                                {availableDoctors.map((doctor) => {
                                    return (
                                        <option key={doctor.walletAddress} value={doctor.walletAddress}>
                                            {doctor.name} - {doctor.specialization}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        {isFetchingDoctors && (
                            <p className="mt-2 text-xs text-primary-600">Loading available doctors...</p>
                        )}
                        {!isFetchingDoctors && availableDoctors.length === 0 && (
                            <p className="mt-2 text-xs text-red-500">No doctors found for this hospital.</p>
                        )}
                        <p className="mt-2 text-xs text-gray-500">
                            The selected doctor will be granted access to decrypt and view all your stored records.
                        </p>
                    </div>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        disabled={!doctorAddress}
                        className="w-full"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Grant Access
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
