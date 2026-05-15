import React, { useEffect, useState } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { User } from 'lucide-react';
import { useMedChainApi } from '../../hooks/useMedChainApi';

export const ProfileSettings = ({ role, profile, onProfileChange }) => {
  const { account } = useWallet();
  const medApi = useMedChainApi();
  const [form, setForm] = useState(profile || {});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(profile || {});
  }, [profile]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (event) => {
    event.preventDefault();
    if (role !== 'patient') return;

    setIsSaving(true);
    try {
      const updated = await medApi.updatePatient(account, form);
      onProfileChange?.(updated);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl border border-sky-100">
      <CardHeader className="flex flex-row items-center space-x-2">
        <div className="rounded-lg bg-sky-50 p-2">
          <User className="h-6 w-6 text-sky-600" />
        </div>
        <div>
          <CardTitle>Profile Settings</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Wallet identity: {account}</p>
        </div>
      </CardHeader>
      <CardContent>
        {role === 'doctor' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Info label="Name" value={profile?.name} />
            <Info label="Specialization" value={profile?.specialization} />
            <Info label="Hospital" value={profile?.hospitalId?.name} />
            <Info label="Phone" value={profile?.phoneNumber} />
            <Info label="Email" value={profile?.email} />
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            {['name', 'phoneNumber', 'email', 'guardianName', 'guardianPhone', 'guardianEmail', 'allergies', 'chronicConditions', 'emergencyNotes'].map((field) => (
              <label key={field} className="block text-sm font-medium text-slate-700">
                {labels[field]}
                <input value={form[field] || ''} onChange={(event) => setField(field, event.target.value)} className="input-field" />
              </label>
            ))}
            <div className="md:col-span-2">
              <Button type="submit" isLoading={isSaving}>Save profile</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

const labels = {
  name: 'Name',
  phoneNumber: 'Phone number',
  email: 'Email',
  guardianName: 'Guardian name',
  guardianPhone: 'Guardian phone',
  guardianEmail: 'Guardian email',
  allergies: 'Allergies',
  chronicConditions: 'Chronic conditions',
  emergencyNotes: 'Emergency notes',
};

const Info = ({ label, value }) => (
  <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
    <div className="mt-1 text-sm font-medium text-slate-900">{value || 'Not set'}</div>
  </div>
);
