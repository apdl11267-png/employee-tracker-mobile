import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface ChatMessage {
    _id: string;
    tenantId: string;
    senderId: {
        _id: string;
        displayName: string;
        email: string;
        role: string;
    };
    message: string;
    createdAt: string;
}

export interface ChatResponse {
    status: string;
    data: ChatMessage[];
}

// --- API Calls ---

export const getChatMessages = async (): Promise<ChatMessage[]> => {
    const response = await apiClient.get<ChatResponse>('/chat');
    return response.data.data;
};

export const sendChatMessage = async (message: string): Promise<ChatMessage> => {
    const response = await apiClient.post<{ status: string; data: ChatMessage }>('/chat', { message });
    return response.data.data;
};

export const getUnreadChatCount = async (): Promise<{ unreadCount: number }> => {
    const response = await apiClient.get<{ status: string; data: { unreadCount: number } }>('/chat/unread');
    return response.data.data;
};

export const markChatAsRead = async (): Promise<void> => {
    await apiClient.post('/chat/read');
};


// --- React Query Hooks ---

export const useChatMessages = () => {
    return useQuery<ChatMessage[]>({
        queryKey: ['chatMessages'],
        queryFn: getChatMessages,
        refetchInterval: 30000, // Reduced polling frequency, socket is primary
    });
};

export const useSendChatMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: sendChatMessage,
        onSuccess: () => {
            // Invalidate to fetch latest messages immediately
            queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        },
    });
};

export const useUnreadChatCount = () => {
    return useQuery({
        queryKey: ['unreadChatCount'],
        queryFn: getUnreadChatCount,
        refetchInterval: 60000, // Reduced polling frequency
    });
};

export const useMarkChatAsRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markChatAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['unreadChatCount'] });
        },
    });
};
