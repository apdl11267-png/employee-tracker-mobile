import apiClient from './apiClient';

export interface LeaveTimelineEntry {
    dateIso: string;
    dayType: 'full' | 'half_morning' | 'half_afternoon';
    deductionValue: number;
    isPaid: boolean;
    reasonCode?: string;
    comment?: string;
}

export interface LeaveRequestPayload {
    employeeId?: string;
    leaveDetails: {
        category: string;
        totalDaysRequested: number;
        paidDaysCount: number;
        unpaidDaysCount: number;
        requestedTimeline: LeaveTimelineEntry[];
    };
}

export interface LeaveSummary {
    totalRemainingLeaves: number;
    totalLeaveRequested: number;
    totalLeavesTaken: number;
    totalUnpaidLeavesTaken: number;
    hasPendingLeaves: boolean;
}

export interface LeaveDetail {
    _id: string;
    applicationId: string;
    requestType: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    leaveDetails: {
        category: string;
        totalDaysRequested: number;
        paidDaysCount: number;
        unpaidDaysCount: number;
    };
    approvalWorkflow: {
        currentPendingApproverRole: string;
        history: {
            approverId: string;
            approverRole: string;
            status: string;
            message: string;
            timestamp: string;
        }[];
    };
    timeline: LeaveTimelineEntry[];
    createdAt: string;
    updatedAt: string;
}

export interface LeaveResponse {
    success: boolean;
    data: {
        summary: LeaveSummary;
        leaveDetails: LeaveDetail[];
        workFromHomeDetails: any[];
    };
}

export const applyForLeave = async (payload: LeaveRequestPayload) => {
    const response = await apiClient.post('/leaves', payload);
    return response.data;
};

export const getMyLeaves = async (startDate?: string, endDate?: string) => {
    const params = { startDate, endDate };
    const response = await apiClient.get<LeaveResponse>('/leaves/mine', { params });
    // console.log(response.data);
    return response.data;
};

export const getAllLeavesForAdmin = async (filters?: { status?: string; requestType?: string }) => {
    const response = await apiClient.get('/leaves/all', { params: filters });
    return response.data;
};

export const updateLeaveStatus = async (id: string, payload: { status: string; message?: string; approverId: string; approverRole: string }) => {
    const response = await apiClient.patch(`/leaves/${id}/status`, payload);
    return response.data;
};

export const getLeaveById = async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: LeaveDetail }>(`/leaves/${id}`);
    return response.data;
};

export const cancelLeave = async (id: string) => {
    const response = await apiClient.post(`/leaves/${id}/cancel`);
    return response.data;
};
