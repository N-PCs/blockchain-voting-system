import { useMemo } from 'react';
import api from '@/services/api';

/**
 * Hook to access the API service
 */
export const useApi = () => {
  return useMemo(() => api, []);
};