import { useState } from 'react';
import { adminService } from '@/services/admin-api';
import { UserAdminConfig } from '@/modules/user/admin.schema';
import { UserConfigSchema } from '@/modules/user/user.schema';
import { UserConfig } from '@/types/user-config';

interface UseImportUserModalProps {
    existingUsers: UserAdminConfig[];
    onSuccess: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export interface ImportResult {
    imported: string[];
    skipped: string[];
    errors: string[];
}

const UID_PATTERN = /^[A-Za-z0-9_-]{4,}$/;

export const useImportUserModal = ({
    existingUsers,
    onSuccess,
    showToast,
}: UseImportUserModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [jsonContent, setJsonContent] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const open = () => {
        setJsonContent('');
        setImportResult(null);
        setImportProgress({ current: 0, total: 0 });
        setIsOpen(true);
    };

    const close = () => {
        if (!isImporting) {
            setIsOpen(false);
        }
    };

    const handleImport = async () => {
        try {
            if (!jsonContent.trim()) {
                showToast('请输入JSON内容', 'error');
                return;
            }

            const parsedData = JSON.parse(jsonContent) as unknown;
            if (!Array.isArray(parsedData)) {
                showToast('无效的JSON格式：必须是数组', 'error');
                return;
            }

            setIsImporting(true);
            setImportResult(null);

            // 逐项预校验：形状 → UID 格式 → 重复跳过 → 配置 Schema
            const existingUids = new Set(existingUsers.map(u => u.uid));
            const usersToImport: { uid: string; config: UserConfig }[] = [];
            const skipped: string[] = [];
            const errors: string[] = [];

            parsedData.forEach((item, index) => {
                const label = (uid?: unknown) => (typeof uid === 'string' && uid ? uid : `第 ${index + 1} 项`);
                if (!item || typeof item !== 'object') {
                    errors.push(`${label()}：不是有效的对象`);
                    return;
                }
                const record = item as Record<string, unknown>;
                if (typeof record.uid !== 'string' || !record.uid.trim()) {
                    errors.push(`${label(record.uid)}：缺少有效的 uid`);
                    return;
                }
                const uid = record.uid.trim();
                if (!UID_PATTERN.test(uid)) {
                    errors.push(`${uid}：用户 ID 至少 4 位，只能包含字母、数字、下划线和短横线`);
                    return;
                }
                if (existingUids.has(uid)) {
                    skipped.push(uid);
                    return;
                }
                if (!record.config || typeof record.config !== 'object') {
                    errors.push(`${uid}：缺少 config 对象`);
                    return;
                }
                const validation = UserConfigSchema.safeParse(record.config);
                if (!validation.success) {
                    const issue = validation.error.issues[0];
                    errors.push(`${uid}：${issue?.message ?? '配置不符合要求'}`);
                    return;
                }
                usersToImport.push({ uid, config: validation.data });
            });

            setImportProgress({ current: 0, total: usersToImport.length });

            const imported: string[] = [];
            for (let i = 0; i < usersToImport.length; i++) {
                const user = usersToImport[i];
                try {
                    const response = await adminService.addUser({
                        uid: user.uid,
                        config: user.config,
                    });
                    if (response.code === 0) {
                        imported.push(user.uid);
                    } else {
                        errors.push(`${user.uid}：${response.msg || '导入失败'}`);
                    }
                } catch (error) {
                    errors.push(`${user.uid}：${error instanceof Error ? error.message : '未知错误'}`);
                }
                setImportProgress(prev => ({ ...prev, current: i + 1 }));
            }

            const result: ImportResult = { imported, skipped, errors };
            setImportResult(result);

            if (imported.length > 0) {
                showToast(`导入完成: 新增 ${imported.length}，跳过 ${skipped.length}，失败 ${errors.length}`, errors.length > 0 ? 'info' : 'success');
                onSuccess();
            } else if (skipped.length > 0 && errors.length === 0) {
                showToast(`所有用户 (${skipped.length} 个) 已存在，无需导入`, 'info');
            } else if (errors.length > 0) {
                showToast(`导入失败: ${errors.length} 个问题`, 'error');
            }
        } catch (error) {
            console.error('导入过程出错:', error);
            showToast('导入过程发生未知错误', 'error');
        } finally {
            setIsImporting(false);
        }
    };

    return {
        isOpen,
        jsonContent,
        setJsonContent,
        isImporting,
        importProgress,
        importResult,
        open,
        close,
        handleImport,
    };
};
