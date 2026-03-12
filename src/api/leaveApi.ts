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

export type Status = 'pending' | 'approved' | 'rejected';
export type RequestType = 'leave' | 'wfh';
export type DayType = 'full' | 'half';

export interface Employee {
    _id: string;
    displayName: string;
    email: string;
    department: string;
}

export interface LeaveDetails {
    category: string; // e.g., "Leave"
    totalDaysRequested: number;
    paidDaysCount: number;
    unpaidDaysCount: number;
}

export interface ApprovalHistory {
    approverId: string;
    approverRole: string;
    status: Status;
    message: string;
    timestamp: string; // ISO Date String
}

export interface ApprovalWorkflow {
    currentPendingApproverRole: string;
    history: ApprovalHistory[];
    notifiedRoles: string[];
}

export interface TimelineEntry {
    _id: string;
    employee: string; // Employee ID
    leaveApplication: string; // Parent Application ID
    requestType: RequestType;
    dateIso: string; // e.g., "2026-03-07"
    dayType: DayType;
    isPaid: boolean;
    status: Status;
    deductionValue: number;
    tenantId: string;
    __v: number;
    createdAt: string;
    updatedAt: string;
}

export interface LeaveApplication {
    _id: string;
    applicationId: string;
    status: Status;
    requestType: RequestType;
    employee: Employee;
    leaveDetails: LeaveDetails;
    approvalWorkflow: ApprovalWorkflow;
    createdAt: string;
    updatedAt: string;
    timeline: TimelineEntry[];
}

export interface LeaveResponse {
    success: boolean;
    data: LeaveApplication[];
}


export const applyForLeave = async (payload: LeaveRequestPayload) => {
    const response = await apiClient.post('/leaves', payload);
    return response.data;
};

export const getMyLeaves = async (startDate?: string, endDate?: string) => {
    const params = { startDate, endDate };
    const response = await apiClient.get<LeaveResponse>('/leaves/mine', { params });
    return response.data;
};

export const getPeersLeaves = async (startDate: string, endDate: string) => {
    const params = { startDate, endDate };
    const response = await apiClient.get<LeaveResponse>('/leaves/peers', { params });
    return response.data;
};

export const getMySummary = async (startDate?: string, endDate?: string) => {
    const params = { startDate, endDate };
    const response = await apiClient.get<{ success: boolean; data: { summary: LeaveSummary } }>('/leaves/my/summary', { params });
    return response.data;
};

export const getAllLeavesForAdmin = async (filters?: { status?: string; requestType?: string }) => {
    const response = await apiClient.get<LeaveResponse>('/leaves/all', { params: filters });
    return response.data;
};

export const updateLeaveStatus = async (id: string, payload: { status: string; message?: string; approverId: string; approverRole: string }) => {
    const response = await apiClient.patch(`/leaves/${id}/status`, payload);
    return response.data;
};

export const getLeaveById = async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: LeaveApplication }>(`/leaves/${id}`);
    return response.data;
};

export const cancelLeave = async (id: string) => {
    const response = await apiClient.post(`/leaves/${id}/cancel`);
    return response.data;
};
