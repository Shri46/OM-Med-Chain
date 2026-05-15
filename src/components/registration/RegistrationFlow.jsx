import React, { useEffect, useMemo, useState } from 'react';
import { User, Stethoscope, Building2, KeyRound } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useMedChainApi } from '../../hooks/useMedChainApi';
import { generateRSAKeyPair, privateKeyStorageKey } from '../../utils/encryption';
import { useToast } from '../../context/ToastContext';

const emptyPatient = {
  name: '', dob: '', gender: '', bloodGroup: '', phoneNumber: '', email: '',
  guardianName: '', guardianPhone: '', guardianEmail: '',
  allergies: '', chronicConditions: '', emergencyNotes: '',
};

const emptyDoctor = {
  name: '', specialization: '', phoneNumber: '', email: '',
};

export const RegistrationFlow = ({ account, onComplete }) => {
  const api = useMedChainApi();
  const { showToast } = useToast();
  const [role, setRole] = useState('patient');
  const [hospitals, setHospitals] = useState([]);
  const [hospitalId, setHospitalId] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [patient, setPatient] = useState(emptyPatient);
  const [doctor, setDoctor] = useState(emptyDoctor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.getHospitals().then(setHospitals).catch(() => setHospitals([]));
  }, []);

  const selectedForm = role === 'patient' ? patient : doctor;
  const canSubmit = useMemo(() => {
    const required = role === 'patient'
      ? ['name', 'dob', 'gender', 'bloodGroup', 'phoneNumber', 'email', 'guardianName', 'guardianPhone', 'guardianEmail']
      : ['name', 'specialization', 'phoneNumber', 'email'];
    return required.every((field) => selectedForm[field]?.trim()) && (hospitalId || newHospital.trim());
  }, [role, selectedForm, hospitalId, newHospital]);

  const setField = (field, value) => {
    if (role === 'patient') setPatient((prev) => ({ ...prev, [field]: value }));
    else setDoctor((prev) => ({ ...prev, [field]: value }));
  };

  const resolveHospital = async () => {
    if (hospitalId) return hospitalId;
    const created = await api.createHospital(newHospital.trim());
    setHospitals((prev) => [...prev.filter((item) => item._id !== created._id), created]);
    return created._id;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const resolvedHospitalId = await resolveHospital();
      const keys = await generateRSAKeyPair();
      localStorage.setItem(privateKeyStorageKey(account), keys.privateKey);

      const payload = {
        ...(role === 'patient' ? patient : doctor),
        walletAddress: account,
        hospitalId: resolvedHospitalId,
        publicKey: keys.publicKey,
      };

      const registered = role === 'patient'
        ? await api.registerPatient(payload)
        : await api.registerDoctor(payload);

      await onComplete(role, registered);
      await api.createActivity({
        walletAddress: account,
        role,
        activityType: `${role === 'patient' ? 'Patient' : 'Doctor'} registered`,
        relatedName: registered.name,
      });
      showToast('Registration complete. Your private key was stored locally in this browser.', 'success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-200">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold text-slate-950">Complete your Med-Chain profile</h1>
          <p className="mt-2 text-slate-600">Wallet identity connected. Choose a role and register with your hospital.</p>
        </div>

        <Card className="border border-sky-100 shadow-xl shadow-sky-100/60">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setRole('patient')} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${role === 'patient' ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'}`}>
                <User className="h-4 w-4" /> Patient
              </button>
              <button type="button" onClick={() => setRole('doctor')} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${role === 'doctor' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600'}`}>
                <Stethoscope className="h-4 w-4" /> Doctor
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <section>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Building2 className="h-4 w-4 text-sky-600" /> Hospital
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <select value={hospitalId} onChange={(event) => { setHospitalId(event.target.value); setNewHospital(''); }} className="input-field">
                    <option value="">Select hospital</option>
                    {hospitals.map((hospital) => (
                      <option key={hospital._id} value={hospital._id}>{hospital.name}</option>
                    ))}
                  </select>
                  <input value={newHospital} onChange={(event) => { setNewHospital(event.target.value); setHospitalId(''); }} className="input-field" placeholder="Create new hospital" />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                {role === 'doctor' ? (
                  <>
                    <Field label="Full name" value={doctor.name} onChange={(value) => setField('name', value)} />
                    <Field label="Specialization" value={doctor.specialization} onChange={(value) => setField('specialization', value)} />
                    <Field label="Phone number" value={doctor.phoneNumber} onChange={(value) => setField('phoneNumber', value)} />
                    <Field label="Email" type="email" value={doctor.email} onChange={(value) => setField('email', value)} />
                  </>
                ) : (
                  <>
                    <Field label="Full name" value={patient.name} onChange={(value) => setField('name', value)} />
                    <Field label="DOB" type="date" value={patient.dob} onChange={(value) => setField('dob', value)} />
                    <SelectField label="Gender" value={patient.gender} options={['Female', 'Male', 'Other']} onChange={(value) => setField('gender', value)} />
                    <SelectField label="Blood group" value={patient.bloodGroup} options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} onChange={(value) => setField('bloodGroup', value)} />
                    <Field label="Phone number" value={patient.phoneNumber} onChange={(value) => setField('phoneNumber', value)} />
                    <Field label="Email" type="email" value={patient.email} onChange={(value) => setField('email', value)} />
                    <Field label="Guardian name" value={patient.guardianName} onChange={(value) => setField('guardianName', value)} />
                    <Field label="Guardian phone" value={patient.guardianPhone} onChange={(value) => setField('guardianPhone', value)} />
                    <Field label="Guardian email" type="email" value={patient.guardianEmail} onChange={(value) => setField('guardianEmail', value)} />
                    <Field label="Allergies" value={patient.allergies} onChange={(value) => setField('allergies', value)} />
                    <Textarea label="Chronic conditions" value={patient.chronicConditions} onChange={(value) => setField('chronicConditions', value)} />
                    <Textarea label="Emergency notes" value={patient.emergencyNotes} onChange={(value) => setField('emergencyNotes', value)} />
                  </>
                )}
              </section>

              <Button type="submit" className="w-full" isLoading={isSubmitting} disabled={!canSubmit}>
                Register and continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text' }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="input-field" />
  </label>
);

const SelectField = ({ label, value, onChange, options }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="input-field">
      <option value="">Select</option>
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>
);

const Textarea = ({ label, value, onChange }) => (
  <label className="block text-sm font-medium text-slate-700">
    {label}
    <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="input-field" />
  </label>
);
