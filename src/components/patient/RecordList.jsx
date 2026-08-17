import React, { useEffect, useState } from 'react';
import { useContract } from '../../hooks/useContract';
import { RecordCard } from './RecordCard';
import { Spinner } from '../ui/Spinner';
import { FileText } from 'lucide-react';
import { FileViewer } from '../doctor/FileViewer';
import { useWallet } from '../../hooks/useWallet';

export const RecordList = ({ refreshTrigger, patientProfile }) => {
    const { getRecords } = useContract();
    const { account } = useWallet();
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        const fetchRecords = async () => {
            setIsLoading(true);
            const data = await getRecords();
            // Reverse to show newest first
            setRecords([...data].reverse());
            setIsLoading(false);
        };
        fetchRecords();
    }, [getRecords, refreshTrigger]);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner size="lg" />
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No records found</h3>
                <p className="text-gray-500">Upload your first medical record to get started.</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {records.map((record, index) => (
                    <RecordCard key={`${record.cid}-${index}`} record={record} onView={setSelectedRecord} />
                ))}
            </div>
            <FileViewer
                record={selectedRecord}
                isOpen={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                viewerRole="patient"
                patientWallet={account}
                viewerPublicKey={patientProfile?.publicKey}
            />
        </>
    );
};
