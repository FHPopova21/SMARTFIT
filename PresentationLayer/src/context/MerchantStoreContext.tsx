import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storeService, MerchantStore } from '@/services/storeService';
import { useAuthStore } from '@/store/authStore';

const ACTIVE_STORE_STORAGE_KEY = 'fitvision_active_store_id';

interface MerchantStoreContextType {
  stores: MerchantStore[];
  activeStore: MerchantStore | null;
  isLoading: boolean;
  apiError: string | null;
  isSessionExpired: boolean;
  setActiveStore: (store: MerchantStore) => void;
  refreshStores: () => Promise<void>;
  isCreateStoreOpen: boolean;
  openCreateStore: () => void;
  closeCreateStore: () => void;
  handleStoreCreated: (newStore: MerchantStore) => void;
}

const MerchantStoreContext = createContext<MerchantStoreContextType | undefined>(undefined);

export const MerchantStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  const [stores, setStores] = useState<MerchantStore[]>([]);
  const [activeStore, setActiveStoreState] = useState<MerchantStore | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [isCreateStoreOpen, setIsCreateStoreOpen] = useState<boolean>(false);

  const setActiveStore = useCallback((store: MerchantStore) => {
    setActiveStoreState(store);
    try {
      localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, String(store.id));
    } catch {
      // Storage access blocked or quota exceeded
    }
  }, []);

  const refreshStores = useCallback(async () => {
    // If not authenticated, do not query merchant stores
    if (!isAuthenticated) {
      setStores([]);
      setActiveStoreState(null);
      setApiError(null);
      setIsSessionExpired(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);
      setIsSessionExpired(false);

      const storeList = await storeService.listStores();
      setStores(storeList);

      if (storeList.length > 0) {
        // Try to restore saved store selection from localStorage
        let savedId: number | null = null;
        try {
          const raw = localStorage.getItem(ACTIVE_STORE_STORAGE_KEY);
          if (raw) savedId = parseInt(raw, 10);
        } catch {
          // Ignore localStorage errors
        }

        const matchedStore = savedId ? storeList.find((s) => s.id === savedId) : null;
        if (matchedStore) {
          setActiveStoreState(matchedStore);
        } else {
          setActiveStoreState(storeList[0]);
          try {
            localStorage.setItem(ACTIVE_STORE_STORAGE_KEY, String(storeList[0].id));
          } catch {
            // Ignore storage errors
          }
        }
      } else {
        setActiveStoreState(null);
        try {
          localStorage.removeItem(ACTIVE_STORE_STORAGE_KEY);
        } catch {
          // Ignore
        }
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to communicate with merchant service';
      console.warn('Merchant stores fetch error:', msg);
      
      if (msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('login required')) {
        setIsSessionExpired(true);
      }
      setApiError(msg);
      // NOTE: We do NOT reset stores to [] on transient error if they were previously loaded,
      // avoiding false zero-store screen flashes during network flickers.
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshStores();
  }, [refreshStores, user?.id]);

  const handleStoreCreated = (newStore: MerchantStore) => {
    setStores((prev) => [newStore, ...prev.filter((s) => s.id !== newStore.id)]);
    setActiveStore(newStore);
    setApiError(null);
  };

  const openCreateStore = () => setIsCreateStoreOpen(true);
  const closeCreateStore = () => setIsCreateStoreOpen(false);

  return (
    <MerchantStoreContext.Provider
      value={{
        stores,
        activeStore,
        isLoading,
        apiError,
        isSessionExpired,
        setActiveStore,
        refreshStores,
        isCreateStoreOpen,
        openCreateStore,
        closeCreateStore,
        handleStoreCreated,
      }}
    >
      {children}
    </MerchantStoreContext.Provider>
  );
};

export const useMerchantStore = () => {
  const context = useContext(MerchantStoreContext);
  if (!context) {
    throw new Error('useMerchantStore must be used within a MerchantStoreProvider');
  }
  return context;
};

export default MerchantStoreContext;
