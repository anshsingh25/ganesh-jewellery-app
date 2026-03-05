/**
 * When Server URL is set and owner is logged in: all data is from/to database (MySQL) only.
 * - getSchemes / getAllSchemes: fetch from database
 * - addScheme / updateScheme / deleteScheme: insert/update in database
 * - getMinimumAmount / setMinimumAmount: from database
 */

import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import * as storage from '../services/storage';
import * as api from '../services/api';
import type { Scheme } from '../types';

export function useSyncedStorage() {
  const { useApiMode, apiBaseUrl, ownerToken, customerToken } = useApp();

  const getSchemes = useCallback(async () => {
    if (useApiMode && apiBaseUrl && ownerToken) {
      return api.getSchemes(apiBaseUrl, ownerToken);
    }
    return storage.getSchemes();
  }, [useApiMode, apiBaseUrl, ownerToken]);

  const getAllSchemes = useCallback(async () => {
    if (useApiMode && apiBaseUrl && ownerToken) {
      return api.getAllSchemes(apiBaseUrl, ownerToken);
    }
    return storage.getAllSchemes();
  }, [useApiMode, apiBaseUrl, ownerToken]);

  const getMinimumAmount = useCallback(async () => {
    if (useApiMode && apiBaseUrl) {
      const token = ownerToken || customerToken;
      if (token) return api.getMinimumAmount(apiBaseUrl, token);
      return 0; // database mode but no token: don't use device value
    }
    return storage.getMinimumAmount();
  }, [useApiMode, apiBaseUrl, ownerToken, customerToken]);

  const setMinimumAmount = useCallback(
    async (amount: number) => {
      if (useApiMode && apiBaseUrl && ownerToken) {
        await api.setMinimumAmount(apiBaseUrl, ownerToken, amount);
      } else {
        await storage.setMinimumAmount(amount);
      }
    },
    [useApiMode, apiBaseUrl, ownerToken]
  );

  const addScheme = useCallback(
    async (scheme: Scheme) => {
      if (useApiMode && apiBaseUrl && ownerToken) {
        await api.addScheme(apiBaseUrl, ownerToken, scheme);
      } else {
        await storage.addScheme(scheme);
      }
    },
    [useApiMode, apiBaseUrl, ownerToken]
  );

  const updateScheme = useCallback(
    async (scheme: Scheme) => {
      if (useApiMode && apiBaseUrl && ownerToken) {
        await api.updateScheme(apiBaseUrl, ownerToken, scheme);
      } else {
        await storage.updateScheme(scheme);
      }
    },
    [useApiMode, apiBaseUrl, ownerToken]
  );

  const deleteScheme = useCallback(
    async (id: string) => {
      if (useApiMode && apiBaseUrl && ownerToken) {
        await api.deleteScheme(apiBaseUrl, ownerToken, id);
      } else {
        await storage.deleteScheme(id);
      }
    },
    [useApiMode, apiBaseUrl, ownerToken]
  );

  return {
    getSchemes,
    getAllSchemes,
    getMinimumAmount,
    setMinimumAmount,
    addScheme,
    updateScheme,
    deleteScheme,
  };
}
