import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useTenant } from "./TenantContext";
import { Platform } from "react-native";

interface SocketContextData {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextData>({} as SocketContextData);

// Match the logic in apiClient.ts
const URL = "https://employee-tracker-uxeh.onrender.com";
// const URL = 'http://192.168.1.78:4001';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, user } = useAuth();
  const { currentTenant } = useTenant();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (token && currentTenant?.id) {
      const newSocket = io(URL, {
        auth: {
          token,
        },
        query: {
          tenantId: currentTenant.id,
        },
        transports: ["websocket"], // Use websockets for better performance
      });

      newSocket.on("connect", () => {
        setConnected(true);
        console.log("Socket connected");
      });

      newSocket.on("disconnect", () => {
        setConnected(false);
        console.log("Socket disconnected");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [token, currentTenant?.id]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
