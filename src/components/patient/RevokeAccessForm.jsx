import React, { useEffect, useState } from 'react';
import { useContract } from '../../hooks/useContract';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { UserMinus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useWallet } from '../../hooks/useWallet';
import { useMedChainApi } from '../../hooks/useMedChainApi';

export const RevokeAccessForm = ({ patientProfile, onSuccess }) => {
    const [doctorAddress, setDoctorAddress] = useState('');
    const [doctors, setDoctors] = useState([]);
    const { revokeAccess, isLoading } = useContract();
    const { account } = useWallet();
    const medApi = useMedChainApi();
    const { showToast } = useToast();

    useEffect(() => {
        const hospitalId = patientProfile?.hospitalId?._id || patientProfile?.hospitalId;
        if (hospitalId) medApi.getDoctors(hospitalId).then(setDoctors).catch(() => setDoctors([]));
    }, [patientProfile?.hospitalId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!doctorAddress) {
            showToast('Select a doctor', 'error');
            return;
        }

        const success = await revokeAccess(doctorAddress);
        if (success) {
            const doctor = doctors.find((item) => item.walletAddress === doctorAddress);
            await medApi.createActivity({
                walletAddress: account,
                role: 'patient',
                activityType: 'Access revoked',
                relatedUser: doctorAddress,
                relatedName: doctor?.name || '',
            });
            setDoctorAddress('');
            if (onSuccess) onSuccess();
        }
    };

    return (
        <Card className="border-red-100">
            <CardHeader>
                <CardTitle className="text-red-700">Revoke Access</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="revoke-address" className="block text-sm font-medium text-gray-700">
                            Select Doctor
                        </label>
                        <div className="mt-1">
                            <select
                                id="revoke-address"
                                className="input-field block w-full"
                                value={doctorAddress}
                                onChange={(e) => setDoctorAddress(e.target.value)}
                                disabled={isLoading}
                            >
                                <option value="">Choose a doctor</option>
                                {doctors.map((doctor) => (
                                    <option key={doctor.walletAddress} value={doctor.walletAddress}>
                                        {doctor.name} - {doctor.specialization}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Button
                        variant="danger"
                        type="submit"
                        isLoading={isLoading}
                        disabled={!doctorAddress}
                        className="w-full"
                    >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Revoke Access
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
