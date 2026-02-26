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
    requestType: string;
    dateIso: string;
    dayType: string;
    isPaid: boolean;
    status: 'pending' | 'approved' | 'rejected';
    deductionValue: number;
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
    console.log(response.data);
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
