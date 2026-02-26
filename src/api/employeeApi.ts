import apiClient from './apiClient';

export interface EmployeeData {
    _id: string;
    displayName: string;
    email: string;
    role: string;
    department: string;
    remainingLeave: number;
    totalLeave: number;
    totalWfhTaken: number;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateEmployeePayload {
    displayName?: string;
    email?: string;
    password?: string;
    role?: string;
    department?: string;
    remainingLeave?: number;
    totalLeave?: number;
}

export const employeeApi = {
    getAllEmployees: async (): Promise<EmployeeData[]> => {
        const response = await apiClient.get('/auth/employees');
        return response.data.data;
    },

    updateEmployee: async (id: string, data: UpdateEmployeePayload): Promise<EmployeeData> => {
        const response = await apiClient.patch(`/auth/update-employee/${id}`, data);
        return response.data.data;
    },

    getEmployeeLeaves: async (id: string): Promise<any> => {
        const response = await apiClient.get(`/leaves/employee/${id}`);
        return response.data;
    },
};
