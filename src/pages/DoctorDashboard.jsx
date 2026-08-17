import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { AccessibleRecords } from '../components/doctor/AccessibleRecords';
import { AuditLog } from '../components/audit/AuditLog';
import { ProfileSettings } from '../components/audit/ProfileSettings';
import { Activity, UserCircle, Users } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { CONTRACT_ABI } from '../constants/contractABI';
import { CONTRACT_ADDRESS } from '../constants/contractAddress';
import { useMedChainApi } from '../hooks/useMedChainApi';
import { Card, CardContent } from '../components/ui/Card';
import { Spinner } from '../components/ui/Spinner';

export const DoctorDashboard = ({ profile }) => {
  const { account, provider } = useWallet();
  const medApi = useMedChainApi();
  const [activeTab, setActiveTab] = useState('patients');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    const loadAuthorizedPatients = async () => {
      if (!provider || !account) return;
      setLoadingPatients(true);
      try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const granted = await contract.queryFilter('AccessGranted', -10000);
        const revoked = await contract.queryFilter('AccessRevoked', -10000);
        const accessEvents = [...granted, ...revoked]
          .filter((event) => event.args[1].toLowerCase() === account.toLowerCase())
          .sort((a, b) => a.blockNumber - b.blockNumber || (a.index || 0) - (b.index || 0));

        const accessMap = {};
        accessEvents.forEach((event) => {
          const patientWallet = event.args[0].toLowerCase();
          const name = event.eventName || event.fragment?.name;
          accessMap[patientWallet] = name === 'AccessGranted';
        });

        const activeWallets = Object.entries(accessMap).filter(([, active]) => active).map(([wallet]) => wallet);
        const profiles = await Promise.all(activeWallets.map((wallet) => medApi.getPatient(wallet).catch(() => null)));
        setPatients(profiles.filter(Boolean));
      } finally {
        setLoadingPatients(false);
      }
    };
    loadAuthorizedPatients();
  }, [provider, account]);

  const tabs = [
    { id: 'patients', label: 'Granted Patients', icon: Users },
    { id: 'audit', label: 'My Activity', icon: Activity },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-500 p-6 text-white shadow-lg shadow-sky-100">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-100">Doctor workspace</p>
          <h1 className="mt-2 text-3xl font-bold">Dr. {profile?.name || 'Med-Chain Clinician'}</h1>
          <p className="mt-2 text-sky-50">{profile?.specialization || 'Authorized medical record access'} at {profile?.hospitalId?.name || 'your hospital'}</p>
        </div>

        <div className="md:grid md:grid-cols-12 md:gap-6">
          <aside className="mb-6 md:col-span-3 md:mb-0">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-l-4 border-sky-600 bg-sky-50 text-sky-700' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}>
                    <Icon className={`mr-3 h-5 w-5 ${activeTab === tab.id ? 'text-sky-600' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div className="md:col-span-9">
            {activeTab === 'patients' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-950">Patients who granted access</h2>
                {loadingPatients ? <Spinner /> : (
                  <div className="grid gap-4">
                    {patients.map((patient) => (
                      <PatientCard key={patient.walletAddress} patient={patient} active={selectedPatient?.walletAddress === patient.walletAddress} onClick={() => setSelectedPatient(patient)} />
                    ))}
                    {patients.length === 0 && <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">No patients have granted access yet.</div>}
                  </div>
                )}
                {selectedPatient && (
                  <div className="space-y-4">
                    <PatientProfile patient={selectedPatient} />
                    <AccessibleRecords patientAddress={selectedPatient.walletAddress} />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'audit' && <AuditLog role="doctor" account={account} />}
            {activeTab === 'profile' && <ProfileSettings role="doctor" profile={profile} />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const PatientCard = ({ patient, active, onClick }) => (
  <button onClick={onClick} className={`w-full rounded-lg border bg-white p-4 text-left shadow-sm transition ${active ? 'border-sky-500 ring-2 ring-sky-100' : 'border-slate-200 hover:border-sky-200'}`}>
    <div className="flex flex-col justify-between gap-2 sm:flex-row">
      <div>
        <h3 className="font-semibold text-slate-950">{patient.name}</h3>
        <p className="text-sm text-slate-500">{patient.gender} | {patient.bloodGroup} | {patient.phoneNumber}</p>
      </div>
      <span className="text-xs font-medium text-sky-700">{patient.hospitalId?.name}</span>
    </div>
  </button>
);

const PatientProfile = ({ patient }) => (
  <Card className="border border-sky-100">
    <CardContent className="grid gap-4 md:grid-cols-3">
      <Info label="Name" value={patient.name} />
      <Info label="Age" value={patient.dob ? getAge(patient.dob) : 'Not set'} />
      <Info label="DOB" value={patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not set'} />
      <Info label="Gender" value={patient.gender} />
      <Info label="Blood group" value={patient.bloodGroup} />
      <Info label="Contact" value={`${patient.phoneNumber} | ${patient.email}`} />
      <Info label="Guardian" value={`${patient.guardianName} | ${patient.guardianPhone}`} />
      <Info label="Allergies" value={patient.allergies || 'None listed'} />
      <Info label="Chronic conditions" value={patient.chronicConditions || 'None listed'} />
      <Info label="Emergency notes" value={patient.emergencyNotes || 'None listed'} />
    </CardContent>
  </Card>
);

const Info = ({ label, value }) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
  </div>
);

const getAge = (dob) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
};
