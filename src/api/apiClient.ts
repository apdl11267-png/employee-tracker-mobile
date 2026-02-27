import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { eventBus } from '../utils/eventBus';


const URL = 'https://employee-tracker-uxeh.onrender.com';
const BASE_URL = Platform.select({
    ios: `${URL}/api/v1`,
    android: `${URL}/api/v1`,
    default: `${URL}/api/v1`,
});

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Inject Tenant ID from storage
        try {
            const storedTenant = await AsyncStorage.getItem('@selected_tenant');
            if (storedTenant) {
                const tenant = JSON.parse(storedTenant);
                if (tenant.id) {
                    config.headers['x-tenant-id'] = tenant.id;
                }
            }
        } catch (error) {
            console.error('Error reading tenant for header:', error);
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Handle refresh token logic
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await SecureStore.getItemAsync('refresh_token');

                if (!refreshToken) {
                    throw new Error('Unauthorized');
                }

                const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } = response.data.data;

                await SecureStore.setItemAsync('auth_token', accessToken);
                await SecureStore.setItemAsync('refresh_token', newRefreshToken);

                // Notify AuthContext about the new token
                eventBus.emit('token_refreshed', { token: accessToken });

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                processQueue(null, accessToken);
                return apiClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                // Trigger logout via event bus if refresh fails
                eventBus.emit('unauthorized');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
