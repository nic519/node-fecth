import { useState } from 'react';
import { adminService } from '@/services/admin-api';
import { UserAdminConfig } from '@/modules/user/admin.schema';
import { UserConfig } from '@/types/user-config';

interface UseImportUserModalProps {
    superToken: string;
    existingUsers: UserAdminConfig[];
    onSuccess: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useImportUserModal = ({
    superToken,
    existingUsers,
    onSuccess,
    showToast,
}: UseImportUserModalProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [jsonContent, setJsonContent] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [importErrors, setImportErrors] = useState<string[]>([]);

    const open = () => {
        setJsonContent('');
        setImportErrors([]);
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

            let parsedData: any[];
            try {
                parsedData = JSON.parse(jsonContent);
                if (!Array.isArray(parsedData)) {
                    throw new Error('JSON必须是数组格式');
                }
            } catch (e) {
                showToast('无效的JSON格式', 'error');
                return;
            }

            setIsImporting(true);
            setImportErrors([]);
            
            // 过滤掉已存在的用户
            const existingUids = new Set(existingUsers.map(u => u.uid));
            const usersToImport = parsedData.filter(user => {
                if (!user.uid || !user.config) return false;
                return !existingUids.has(user.uid);
            });

            const skippedCount = parsedData.length - usersToImport.length;
            setImportProgress({ current: 0, total: usersToImport.length });

            const errors: string[] = [];
            let successCount = 0;

            for (let i = 0; i < usersToImport.length; i++) {
                const user = usersToImport[i];
                try {
                    // 确保 config 符合 UserConfig 类型
                    // 这里假设导入的数据结构是正确的，或者是之前导出的数据
                    // 实际应用中可能需要更严格的验证
                    await adminService.addUser(superToken, {
                        uid: user.uid,
                        config: user.config as UserConfig
                    });
                    successCount++;
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : '未知错误';
                    errors.push(`用户 ${user.uid} 导入失败: ${errorMsg}`);
                }
                setImportProgress(prev => ({ ...prev, current: i + 1 }));
            }

            setImportErrors(errors);
            
            if (successCount > 0) {
                showToast(`导入完成: 成功 ${successCount} 个, 跳过 ${skippedCount} 个, 失败 ${errors.length} 个`, errors.length > 0 ? 'info' : 'success');
                onSuccess();
                if (errors.length === 0) {
                    close();
                }
            } else if (skippedCount > 0 && errors.length === 0) {
                 showToast(`导入完成: 所有用户 (${skippedCount} 个) 已存在，无需导入`, 'info');
                 close();
            } else {
                showToast(`导入失败: ${errors.length} 个错误`, 'error');
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
        importErrors,
        open,
        close,
        handleImport,
    };
};
