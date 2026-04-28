import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  setActiveAccount,
  getAccounts,
  addAccount as storeAddAccount,
  updateAccount as storeUpdateAccount,
  deleteAccount as storeDeleteAccount,
  ensureDefaultAccount,
} from '../store';

const STORAGE_KEY = 'follow:active-account';
const AccountContext = createContext(null);

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [activeAccountId, setActiveAccountIdState] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化：保证有一个默认账户，恢复 localStorage 中的选择
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const def = await ensureDefaultAccount();
        const list = await getAccounts();
        if (cancelled) return;
        setAccounts(list);

        const stored = localStorage.getItem(STORAGE_KEY);
        const validStored = stored && list.some(a => a.id === stored) ? stored : null;
        const initialId = validStored || def?.id || (list[0] && list[0].id);

        if (initialId) {
          setActiveAccount(initialId);
          setActiveAccountIdState(initialId);
        }
      } catch (err) {
        console.error('Failed to init accounts:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const switchAccount = useCallback((id) => {
    if (!id) return;
    setActiveAccount(id);
    localStorage.setItem(STORAGE_KEY, id);
    setActiveAccountIdState(id);
  }, []);

  const refresh = useCallback(async () => {
    const list = await getAccounts();
    setAccounts(list);
    return list;
  }, []);

  const createAccount = useCallback(async ({ name, color = '' }) => {
    const acc = await storeAddAccount({ name, color });
    setAccounts(prev => [...prev, acc]);
    return acc;
  }, []);

  const renameAccount = useCallback(async (id, updates) => {
    const acc = await storeUpdateAccount(id, updates);
    setAccounts(prev => prev.map(a => a.id === id ? acc : a));
    return acc;
  }, []);

  const removeAccount = useCallback(async (id) => {
    await storeDeleteAccount(id);
    const next = accounts.filter(a => a.id !== id);
    setAccounts(next);
    if (activeAccountId === id && next.length > 0) {
      switchAccount(next[0].id);
    }
  }, [accounts, activeAccountId, switchAccount]);

  const value = {
    accounts,
    activeAccountId,
    activeAccount: accounts.find(a => a.id === activeAccountId) || null,
    loading,
    switchAccount,
    refresh,
    createAccount,
    renameAccount,
    removeAccount,
  };

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be used within AccountProvider');
  return ctx;
}
