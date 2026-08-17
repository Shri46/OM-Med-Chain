import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { UploadRecord } from '../components/patient/UploadRecord';
import { RecordList } from '../components/patient/RecordList';
import { GrantAccessForm } from '../components/patient/GrantAccessForm';
import { RevokeAccessForm } from '../components/patient/RevokeAccessForm';
import { AuthorizedDoctors } from '../components/patient/AuthorizedDoctors';
import { AuditLog } from '../components/audit/AuditLog';
import { ProfileSettings } from '../components/audit/ProfileSettings';
import { FolderPlus, Users, Activity, FileText, UserCircle } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export const PatientDashboard = ({ profile, onProfileChange }) => {
    const { account } = useWallet();
    const [activeTab, setActiveTab] = useState('records');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

    const tabs = [
        { id: 'records', label: 'My Records', icon: FileText },
        { id: 'upload', label: 'Upload Record', icon: FolderPlus },
        { id: 'access', label: 'Access Control', icon: Users },
        { id: 'audit', label: 'Activity Log', icon: Activity },
        { id: 'profile', label: 'Profile', icon: UserCircle },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 p-6 text-white shadow-lg shadow-sky-100">
                    <p className="text-sm font-medium uppercase tracking-wide text-sky-100">Patient workspace</p>
                    <h1 className="mt-2 text-3xl font-bold">{profile?.name || 'My Health Vault'}</h1>
                    <p className="mt-2 text-sky-50">{profile?.hospitalId?.name || 'Hospital profile'} | {profile?.bloodGroup || 'Blood group'} | Wallet-secured records</p>
                </div>
                <div className="md:grid md:grid-cols-12 md:gap-6">
                    {/* Sidebar Navigation */}
                    <aside className="md:col-span-3 mb-6 md:mb-0">
                        <nav className="space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`
                                            w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                                            ${activeTab === tab.id
                                                ? 'bg-blue-50 text-primary-700 border-l-4 border-primary-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                        `}
                                    >
                                        <Icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'}`} />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    {/* Main Content Area */}
                    <div className="md:col-span-9">
                        {activeTab === 'records' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">My Medical Records</h2>
                                <RecordList refreshTrigger={refreshTrigger} patientProfile={profile} />
                            </div>
                        )}

                        {activeTab === 'upload' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Upload New Record</h2>
                                <UploadRecord patientProfile={profile} onUploadSuccess={() => {
                                    handleRefresh();
                                    setActiveTab('records');
                                }} />
                            </div>
                        )}

                        {activeTab === 'access' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Access Control</h2>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-6">
                                        <GrantAccessForm patientProfile={profile} onSuccess={handleRefresh} />
                                        <RevokeAccessForm patientProfile={profile} onSuccess={handleRefresh} />
                                    </div>
                                    <div>
                                        <AuthorizedDoctors refreshTrigger={refreshTrigger} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
                                <AuditLog role="patient" account={account} />
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                                <ProfileSettings role="patient" profile={profile} onProfileChange={onProfileChange} />
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};
