import axios from 'axios';

// For local testing on Android Emulator, Use 10.0.2.2 instead of localhost
// For iOS Simulator, localhost is fine. Adjust as needed.
const API_URL = 'http://10.0.2.2:4000/api/v1';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const applyForLeave = async (payload: any) => {
    const response = await apiClient.post('/leaves', payload);
    return response.data;
};
