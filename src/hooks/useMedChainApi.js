import { useCallback, useState } from 'react';
import { api, getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

export const useMedChainApi = () => {
  const [isApiLoading, setIsApiLoading] = useState(false);
  const { showToast } = useToast();

  const request = useCallback(async (fn, fallback) => {
    setIsApiLoading(true);
    try {
      const response = await fn();
      return response.data;
    } catch (error) {
      const message = getErrorMessage(error, fallback);
      showToast(message, 'error');
      throw error;
    } finally {
      setIsApiLoading(false);
    }
  }, [showToast]);

  return {
    isApiLoading,
    getHospitals: () => request(() => api.get('/hospitals'), 'Unable to load hospitals'),
    createHospital: (name) => request(() => api.post('/hospitals', { name }), 'Unable to create hospital'),
    registerPatient: (payload) => request(() => api.post('/patients/register', payload), 'Unable to register patient'),
    getPatient: (wallet) => request(() => api.get(`/patients/${wallet}`), 'Unable to load patient'),
    updatePatient: (wallet, payload) => request(() => api.put(`/patients/update/${wallet}`, payload), 'Unable to update patient'),
    registerDoctor: (payload) => request(() => api.post('/doctors/register', payload), 'Unable to register doctor'),
    getDoctors: (hospitalId) => request(() => api.get('/doctors', { params: hospitalId ? { hospitalId } : {} }), 'Unable to load doctors'),
    getDoctor: (wallet) => request(() => api.get(`/doctors/${wallet}`), 'Unable to load doctor'),
    createActivity: (payload) => request(() => api.post('/activity', payload), 'Unable to save activity'),
    getActivity: (wallet) => request(() => api.get(`/activity/${wallet}`), 'Unable to load activity'),
    storeEncryptedKey: (payload) => request(() => api.post('/keys/store', payload), 'Unable to store encrypted key'),
    getKeysByCid: (cid) => request(() => api.get(`/keys/${cid}`), 'Unable to load encrypted keys'),
  };
};
