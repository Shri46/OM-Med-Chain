import React, { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Lock, Stethoscope } from 'lucide-react';
import { useIPFS } from '../../hooks/useIPFS';
import { useContract } from '../../hooks/useContract';
import { encryptAESKeyForPublicKey, encryptFile, exportKey, generateEncryptionKey } from '../../utils/encryption';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useToast } from '../../context/ToastContext';
import { useMedChainApi } from '../../hooks/useMedChainApi';
import { useWallet } from '../../hooks/useWallet';

export const UploadRecord = ({ patientProfile, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [doctors, setDoctors] = useState([]);
    const [doctorWallet, setDoctorWallet] = useState('');
    const { uploadToIPFS } = useIPFS();
    const { storeCID } = useContract();
    const medApi = useMedChainApi();
    const { account } = useWallet();
    const { showToast } = useToast();

    useEffect(() => {
        if (patientProfile?.hospitalId?._id || patientProfile?.hospitalId) {
            const hospitalId = patientProfile.hospitalId?._id || patientProfile.hospitalId;
            medApi.getDoctors(hospitalId).then(setDoctors).catch(() => setDoctors([]));
        }
    }, [patientProfile?.hospitalId]);

    const onDrop = useCallback((acceptedFiles) => {
        setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxFiles: 1,
    });

    const handleUpload = async () => {
        if (!file || !doctorWallet) return;

        setIsUploading(true);
        try {
            const doctor = doctors.find((item) => item.walletAddress === doctorWallet);
            if (!doctor) throw new Error('Select a doctor before uploading');
            if (!patientProfile?.publicKey) throw new Error('Patient public key is missing');

            // 1. Read file
            const arrayBuffer = await file.arrayBuffer();

            // 2. Generate Key
            const key = await generateEncryptionKey();

            // 3. Encrypt File
            const { encryptedData, iv } = await encryptFile(arrayBuffer, key);

            // Combine IV and Encrypted Data for storage (usually IV is prepended)
            // Here, for simplicity, we'll just upload the encrypted blob.
            // In a real app, we need to store the IV alongside the data or encryption key.
            // OPTIMIZATION: We will prepend the 12-byte IV to the encrypted data
            const combinedData = new Uint8Array(iv.length + encryptedData.length);
            combinedData.set(iv);
            combinedData.set(encryptedData, iv.length);

            // 4. Upload to IPFS
            showToast('Uploading to IPFS...', 'loading');
            const cid = await uploadToIPFS(combinedData);

            // 5. Encrypt AES key for both patient and selected doctor
            const exportedKey = await exportKey(key);
            const encryptedAESKeyForPatient = await encryptAESKeyForPublicKey(exportedKey, patientProfile.publicKey);
            const encryptedAESKeyForDoctor = await encryptAESKeyForPublicKey(exportedKey, doctor.publicKey);

            // 6. Smart Contract Transaction
            showToast('Confirm transaction in MetaMask...', 'loading');
            const success = await storeCID(cid, file.name, file.type);

            if (success) {
                await medApi.storeEncryptedKey({
                    patientWallet: account,
                    doctorWallet,
                    cid,
                    encryptedAESKeyForPatient,
                    encryptedAESKeyForDoctor,
                });
                await medApi.createActivity({
                    walletAddress: account,
                    role: 'patient',
                    activityType: 'File uploaded',
                    relatedUser: doctorWallet,
                    relatedName: doctor.name,
                });
                setFile(null);
                setDoctorWallet('');
                if (onUploadSuccess) onUploadSuccess();
            }

        } catch (error) {
            console.error(error);
            showToast('Upload failed: ' + error.message, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="mb-6 border border-sky-100 shadow-sm">
            <CardHeader>
                <CardTitle>Upload Medical Record</CardTitle>
            </CardHeader>
            <CardContent>
                <label className="mb-4 block text-sm font-medium text-slate-700">
                    Assign doctor for encrypted key sharing
                    <div className="mt-1 flex items-center gap-2">
                        <Stethoscope className="h-5 w-5 text-sky-600" />
                        <select value={doctorWallet} onChange={(event) => setDoctorWallet(event.target.value)} className="input-field mt-0">
                            <option value="">Select doctor</option>
                            {doctors.map((doctor) => (
                                <option key={doctor.walletAddress} value={doctor.walletAddress}>
                                    {doctor.name} - {doctor.specialization}
                                </option>
                            ))}
                        </select>
                    </div>
                </label>
                {!file ? (
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-600 font-medium">Click or drag file to upload</p>
                        <p className="text-xs text-gray-400 mt-2">PDF, PNG, JPG up to 10MB</p>
                        <div className="flex items-center justify-center mt-4 text-xs text-blue-600 bg-blue-50 py-1 px-2 rounded-full inline-flex">
                            <Lock className="w-3 h-3 mr-1" />
                            Client-side Encrypted
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <File className="h-8 w-8 text-primary-500" />
                                <div>
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <Button
                            onClick={handleUpload}
                            isLoading={isUploading}
                            disabled={!doctorWallet}
                            className="w-full"
                        >
                            {isUploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload Record'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
