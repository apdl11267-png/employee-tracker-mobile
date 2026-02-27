import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  themeConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
}

interface TenantContextData {
  currentTenant: Tenant | null;
  isLoadingTenant: boolean;
  setTenant: (tenant: Tenant) => Promise<void>;
  clearTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextData>({} as TenantContextData);

const TENANT_STORAGE_KEY = "@selected_tenant";

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(true);

  useEffect(() => {
    async function loadStoredTenant() {
      try {
        const storedTenant = await AsyncStorage.getItem(TENANT_STORAGE_KEY);
        console.log({
          storedTenant,
        });
        if (storedTenant) {
          setCurrentTenant(JSON.parse(storedTenant));
        }
      } catch (error) {
        console.error("Error loading stored tenant:", error);
      } finally {
        setIsLoadingTenant(false);
      }
    }

    loadStoredTenant();
  }, []);

  const setTenant = async (tenant: Tenant) => {
    try {
      await AsyncStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
      setCurrentTenant(tenant);
    } catch (error) {
      console.error("Error storing tenant:", error);
    }
  };

  const clearTenant = async () => {
    try {
      await AsyncStorage.removeItem(TENANT_STORAGE_KEY);
      setCurrentTenant(null);
    } catch (error) {
      console.error("Error clearing tenant:", error);
    }
  };

  return (
    <TenantContext.Provider
      value={{ currentTenant, isLoadingTenant, setTenant, clearTenant }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
