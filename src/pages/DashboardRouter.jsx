import React, { useEffect, useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { PatientDashboard } from './PatientDashboard';
import { DoctorDashboard } from './DoctorDashboard';
import { LandingPage } from './LandingPage';
import { Spinner } from '../components/ui/Spinner';
import { RegistrationFlow } from '../components/registration/RegistrationFlow';
import { useMedChainApi } from '../hooks/useMedChainApi';

export const DashboardRouter = () => {
    const { account, isConnecting, isInitializing } = useWallet();
    const { getRole, registerRole } = useContract();
    const medApi = useMedChainApi();
    const [role, setRole] = useState(null); // 'patient', 'doctor', or ''
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(null);
    const [profileChecked, setProfileChecked] = useState(false);

    useEffect(() => {
        const checkRole = async () => {
            if (account) {
                setLoading(true);
                setProfileChecked(false);
                const userRole = await getRole(account);
                console.log("Checked Role for", account, ":", userRole);
                setRole(userRole);
                if (userRole === 'patient') {
                    medApi.getPatient(account).then(setProfile).catch(() => setProfile(null)).finally(() => setProfileChecked(true));
                } else if (userRole === 'doctor') {
                    medApi.getDoctor(account).then(setProfile).catch(() => setProfile(null)).finally(() => setProfileChecked(true));
                } else {
                    setProfile(null);
                    setProfileChecked(true);
                }
                setLoading(false);
            } else {
                setRole(null);
                setProfile(null);
                setProfileChecked(false);
            }
        };
        checkRole();
    }, [account, getRole]);

    const handleRegistrationComplete = async (selectedRole, registeredProfile) => {
        const success = role === selectedRole || await registerRole(selectedRole);
        if (success) {
            setRole(selectedRole);
            setProfile(registeredProfile);
        }
    };

    if (isConnecting || loading || isInitializing || (role && !profileChecked)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!account) {
        return <LandingPage />;
    }

    if ((role === 'patient' || role === 'doctor') && !profile) {
        return <RegistrationFlow account={account} onComplete={handleRegistrationComplete} />;
    }

    if (role === 'patient') {
        return <PatientDashboard profile={profile} onProfileChange={setProfile} />;
    }

    if (role === 'doctor') {
        return <DoctorDashboard profile={profile} />;
    }

    return <RegistrationFlow account={account} onComplete={handleRegistrationComplete} />;
};
