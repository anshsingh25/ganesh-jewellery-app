import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Customer, User } from '../types';
import * as storage from '../services/storage';
import * as api from '../services/api';
import { updateOverdueStatus } from '../utils/emiLogic';

interface AppContextValue {
  user: User | null;
  loggedInCustomer: Customer | null;
  customers: Customer[];
  useApiMode: boolean;
  apiBaseUrl: string;
  ownerToken: string | null;
  customerToken: string | null;
  setUser: (u: User | null, token?: string | null) => void;
  setLoggedInCustomer: (c: Customer | null, token?: string | null) => Promise<void>;
  refreshCustomers: () => Promise<Customer[]>;
  addCustomer: (c: Customer) => Promise<void>;
  updateCustomer: (c: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loggedInCustomer, setLoggedInCustomerState] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [useApiMode, setUseApiMode] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [ownerToken, setOwnerTokenState] = useState<string | null>(null);
  const [customerToken, setCustomerTokenState] = useState<string | null>(null);

  const refreshCustomers = useCallback(async () => {
    // When server is set: fetch from database (MySQL) only
    if (useApiMode && apiBaseUrl && ownerToken) {
      const list = await api.getCustomers(apiBaseUrl, ownerToken);
      const withOverdue = list.map((c) => ({
        ...c,
        installments: updateOverdueStatus(c.installments),
      }));
      setCustomers(withOverdue);
      return withOverdue;
    }
    const list = await storage.getCustomers();
    const withOverdue = list.map((c) => ({
      ...c,
      installments: updateOverdueStatus(c.installments),
    }));
    setCustomers(withOverdue);
    return withOverdue;
  }, [useApiMode, apiBaseUrl, ownerToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const baseUrl = (await storage.getPaymentApiUrl())?.trim() || '';
      const hasApi = baseUrl.length > 0;
      setApiBaseUrl(baseUrl);
      setUseApiMode(hasApi);

      // When Server URL is set: all data is from/to database (MySQL) only. Owner must log in with PIN.
      if (hasApi) {
        const [oTok, cTok] = await Promise.all([
          api.getOwnerToken(),
          api.getCustomerToken(),
        ]);
        if (cancelled) return;
        setOwnerTokenState(oTok);
        setCustomerTokenState(cTok);

        if (oTok) {
          setUserState({ id: 'owner-1', name: 'Owner', role: 'owner' });
          const list = await api.getCustomers(baseUrl, oTok);
          setCustomers(list.map((c) => ({ ...c, installments: updateOverdueStatus(c.installments) })));
        } else if (cTok) {
          try {
            const customer = await api.getMe(baseUrl, cTok);
            if (customer) setLoggedInCustomerState({ ...customer, installments: updateOverdueStatus(customer.installments) });
          } catch {
            await api.setCustomerToken(null);
            setCustomerTokenState(null);
          }
        }
      } else {
        const [savedUser, savedCustomerId] = await Promise.all([
          storage.getUser(),
          storage.getLoggedInCustomerId(),
        ]);
        if (cancelled) return;
        setUserState(savedUser);
        const list = await storage.getCustomers();
        const withOverdue = list.map((c) => ({ ...c, installments: updateOverdueStatus(c.installments) }));
        setCustomers(withOverdue);
        if (savedCustomerId && withOverdue.length > 0) {
          const customer = withOverdue.find((c) => c.id === savedCustomerId) ?? null;
          if (customer) setLoggedInCustomerState(customer);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setLoggedInCustomer = useCallback(async (c: Customer | null, token?: string | null) => {
    setLoggedInCustomerState(c);
    if (useApiMode) {
      const t = c ? (token ?? (await api.getCustomerToken())) : null;
      await api.setCustomerToken(t);
      setCustomerTokenState(t);
    } else {
      await storage.saveLoggedInCustomerId(c?.id ?? null);
    }
  }, [useApiMode]);

  // When server is set, owner must have token; otherwise force re-login so all data stays from database
  useEffect(() => {
    if (useApiMode && apiBaseUrl && user && !ownerToken) {
      setUserState(null);
    }
  }, [useApiMode, apiBaseUrl, user, ownerToken]);

  useEffect(() => {
    if (!loggedInCustomer || customers.length === 0) return;
    const updated = customers.find((c) => c.id === loggedInCustomer.id);
    if (updated) setLoggedInCustomerState(updated);
  }, [customers]);

  const setUser = useCallback(
    (u: User | null, token?: string | null) => {
      setUserState(u);
      if (useApiMode) {
        const t = u ? (token ?? null) : null;
        api.setOwnerToken(t);
        setOwnerTokenState(t);
      } else {
        storage.saveUser(u);
      }
    },
    [useApiMode]
  );

  const addCustomer = useCallback(
    async (c: Customer) => {
      // When server is set: always insert into database (MySQL) only
      if (useApiMode && apiBaseUrl && ownerToken) {
        await api.addCustomer(apiBaseUrl, ownerToken, c);
      } else {
        await storage.addCustomer(c);
      }
      await refreshCustomers();
    },
    [useApiMode, apiBaseUrl, ownerToken, refreshCustomers]
  );

  const updateCustomer = useCallback(
    async (c: Customer) => {
      if (useApiMode && apiBaseUrl) {
        if (customerToken && loggedInCustomer && c.id === loggedInCustomer.id) {
          await api.updateMe(apiBaseUrl, customerToken, c);
        } else if (ownerToken) {
          await api.updateCustomer(apiBaseUrl, ownerToken, c);
        }
      } else {
        await storage.updateCustomer(c);
      }
      await refreshCustomers();
    },
    [useApiMode, apiBaseUrl, ownerToken, customerToken, loggedInCustomer, refreshCustomers]
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      if (useApiMode && apiBaseUrl && ownerToken) {
        await api.deleteCustomer(apiBaseUrl, ownerToken, id);
      } else {
        await storage.deleteCustomer(id);
      }
      await refreshCustomers();
    },
    [useApiMode, apiBaseUrl, ownerToken, refreshCustomers]
  );

  return (
    <AppContext.Provider
      value={{
        user,
        loggedInCustomer,
        customers,
        useApiMode,
        apiBaseUrl,
        ownerToken,
        customerToken,
        setUser,
        setLoggedInCustomer,
        refreshCustomers,
        addCustomer,
        updateCustomer,
        deleteCustomer,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
