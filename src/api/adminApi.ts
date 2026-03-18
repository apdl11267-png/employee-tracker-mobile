import apiClient from './apiClient';

export interface AdminStats {
    totalEmployees: number;
    leavesToday: any[];
    wfhToday: any[];
    wdhToday: any[];
    statsMonth: {
        pending: number;
        approved: number;
        rejected: number;
    };
}

export const getAdminStats = async (): Promise<{ success: boolean; data: AdminStats }> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
};

export const downloadAdminReport = async (): Promise<string> => {
    const response = await apiClient.get('/admin/report/download', {
        responseType: 'text'
    });
    return response.data;
};
