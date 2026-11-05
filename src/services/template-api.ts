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
     * GET /api/admin/templates
     */
    getTemplates: () => {
        return apiClient.get<TemplateListResponse>('/admin/templates');
    },

    /**
     * 创建模板
     * POST /api/admin/templates
     */
    createTemplate: (data: CreateConfigTemplateRequest) => {
        return apiClient.post<TemplateResponse>('/admin/templates', data);
    },

    /**
     * 更新模板
     * PUT /api/admin/templates/:id
     */
    updateTemplate: (id: string, data: Partial<CreateConfigTemplateRequest>) => {
        return apiClient.put<Partial<TemplateResponse>>(`/admin/templates/${id}`, data);
    },

    /**
     * 删除模板
     * DELETE /api/admin/templates/:id
     */
    deleteTemplate: (id: string) => {
        return apiClient.delete<null>(`/admin/templates/${id}`);
    },
};
