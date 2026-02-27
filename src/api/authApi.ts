import apiClient from './apiClient';

export interface CreateEmployeePayload {
    displayName: string;
    email: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'HR_ADMIN';
    department: string;
    totalLeave: number;
    remainingLeave: number;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
    tenantId: string;
}

export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
}

export const login = async (payload: LoginPayload) => {
    try {
        const response = await apiClient.post('/auth/login', {
            email: payload.email,
            password: payload.password,
            tenantId: payload.tenantId
        });
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        const response = await apiClient.post('/auth/logout');
        return response.data;
    } catch (error) {
        console.error("Logout error:", error);
        throw error;
    }
};

export const forgotPassword = async (email: string) => {
    try {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        console.error("Forgot password error:", error);
        throw error;
    }
};

export const changePassword = async (payload: ChangePasswordPayload) => {
    try {
        const response = await apiClient.post('/auth/change-password', payload);
        return response.data;
    } catch (error) {
        console.error("Change password error:", error);
        throw error;
    }
};

export const createEmployee = async (payload: CreateEmployeePayload) => {
    try {
        const response = await apiClient.post('/auth/create-employee', payload);
        return response.data;
    } catch (error) {
        console.error("Create employee error:", error);
        throw error;
    }
};

export const checkTenantAdmin = async (tenantId: string) => {
    try {
        const response = await apiClient.get(`/auth/tenant/${tenantId}/has-admin`);
        return response.data.data;
    } catch (error) {
        console.error("Check tenant admin error:", error);
        throw error;
    }
};

export const registerFirstAdmin = async (payload: any) => {
    try {
        const response = await apiClient.post('/auth/tenant/register-admin', payload);
        return response.data;
    } catch (error) {
        console.error("Register first admin error:", error);
        throw error;
    }
};
