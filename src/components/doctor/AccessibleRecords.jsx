import React, { useState, useEffect } from 'react';
import { useContract } from '../../hooks/useContract';
import { RecordCard } from '../patient/RecordCard';
import { FileViewer } from './FileViewer';
import { Spinner } from '../ui/Spinner';
import { Lock } from 'lucide-react';

export const AccessibleRecords = ({ patientAddress }) => {
    const { getPatientRecords } = useContract();
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        const fetchRecords = async () => {
            if (!patientAddress) return;

            setIsLoading(true);
            const data = await getPatientRecords(patientAddress);
            setRecords([...data].reverse());
            setIsLoading(false);
        };

        fetchRecords();
    }, [patientAddress, getPatientRecords]);

    if (!patientAddress) return null;

    if (isLoading) {
        return <div className="flex justify-center p-8"><Spinner size="lg" /></div>;
    }

    if (records.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                <Lock className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                <p className="text-gray-500">Either the patient has no records or you don't have access.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4 mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Records</h3>
                {records.map((record, index) => (
                    <RecordCard
                        key={`${record.cid}-${index}`}
                        record={record}
                        onView={(rec) => setSelectedRecord(rec)}
                    />
                ))}
            </div>

            <FileViewer
                record={selectedRecord}
                isOpen={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                viewerRole="doctor"
                patientWallet={patientAddress}
            />
        </>
    );
};
