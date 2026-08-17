import axios from 'axios';
const pinataJwt = import.meta.env.VITE_PINATA_JWT;
const gatewayUrl = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

export const useIPFS = () => {

    const uploadToIPFS = async (fileData) => {
        try {
            const formData = new FormData();
            // Create a Blob from the Uint8Array/Buffer to append to FormData
            const blob = new Blob([fileData]);
            formData.append('file', blob, 'record.bin');

            const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
                headers: {
                    'Authorization': `Bearer ${pinataJwt}`
                }
            });

            return res.data.IpfsHash;
        } catch (error) {
            console.error('Error uploading file to Pinata:', error);
            throw new Error('Failed to upload file to IPFS');
        }
    };

    const fetchFromIPFS = async (cid) => {
        try {
            const res = await axios.get(`${gatewayUrl}${cid}`, {
                responseType: 'arraybuffer'
            });
            return new Uint8Array(res.data);
        } catch (error) {
            console.error('Error fetching file from IPFS:', error);
            throw new Error('Failed to fetch file from IPFS');
        }
    };

    return { uploadToIPFS, fetchFromIPFS };
};
