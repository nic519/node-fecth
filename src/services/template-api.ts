import { apiClient } from './api-client';
import type {
    ConfigTemplate,
    CreateConfigTemplateRequest
} from '@/types/user-config';

// 响应结构定义
export interface TemplateListResponse {
    templates: ConfigTemplate[];
}

export interface TemplateResponse {
    message?: string;
    template: ConfigTemplate;
}

export const templateService = {
    /**
     * 获取模板列表
     * GET /api/admin/templates?superToken=xxx
     */
    getTemplates: (superToken: string) => {
        return apiClient.get<TemplateListResponse>('/admin/templates', { superToken });
    },

    /**
     * 创建模板
     * POST /api/admin/templates?superToken=xxx
     */
    createTemplate: (superToken: string, data: CreateConfigTemplateRequest) => {
        return apiClient.post<TemplateResponse>('/admin/templates', data, { superToken });
    },

    /**
     * 更新模板
     * PUT /api/admin/templates/:id?superToken=xxx
     */
    updateTemplate: (superToken: string, id: string, data: Partial<CreateConfigTemplateRequest>) => {
        return apiClient.put<Partial<TemplateResponse>>(`/admin/templates/${id}`, data, { superToken });
    },

    /**
     * 删除模板
     * DELETE /api/admin/templates/:id?superToken=xxx
     */
    deleteTemplate: (superToken: string, id: string) => {
        return apiClient.delete<null>(`/admin/templates/${id}`, { superToken });
    },
};
