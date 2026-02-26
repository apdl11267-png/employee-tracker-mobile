import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import { eventBus } from "../utils/eventBus";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  signIn: (token: string, refreshToken: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storedToken = await SecureStore.getItemAsync("auth_token");
      const storedUser = await SecureStore.getItemAsync("auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      signOut();
    };

    const handleTokenRefreshed = (data: { token: string }) => {
      setToken(data.token);
    };

    eventBus.on("unauthorized", handleUnauthorized);
    eventBus.on("token_refreshed", handleTokenRefreshed);

    return () => {
      eventBus.off("unauthorized", handleUnauthorized);
      eventBus.off("token_refreshed", handleTokenRefreshed);
    };
  }, []);

  const signIn = async (
    newToken: string,
    refreshToken: string,
    newUser: User,
  ) => {
    await SecureStore.setItemAsync("auth_token", newToken);
    await SecureStore.setItemAsync("refresh_token", refreshToken);
    await SecureStore.setItemAsync("auth_user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
  };

  const signOut = async () => {
    try {
      const { logout } = await import("../api/authApi");
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("refresh_token");
      await SecureStore.deleteItemAsync("auth_user");

      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
