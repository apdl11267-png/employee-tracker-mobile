import apiClient from './apiClient';

export const applyForLeave = async (payload: any) => {
    const response = await apiClient.post('/leaves', payload);
    return response.data;
};

export const getMyLeaves = async () => {
    const response = await apiClient.get('/leaves/mine');
    return response.data;
};
