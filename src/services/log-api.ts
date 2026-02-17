import { apiClient } from './api-client';
import type { LogEvent } from '@/types/log';

export interface LogListResult {
    data: LogEvent[];
    total: number;
    page: number;
    pageSize: number;
}

export const logApi = {
    getLogs: (params: {
        superToken: string;
        page?: number;
        pageSize?: number;
        level?: string;
        type?: string;
        userId?: string;
        startTime?: string;
        endTime?: string;
    }) => {
        return apiClient.get<LogListResult>('/admin/logs', params);
    },
};

