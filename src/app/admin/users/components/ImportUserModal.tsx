import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ImportUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: () => void;
    jsonContent: string;
    onJsonContentChange: (content: string) => void;
    isImporting: boolean;
    importProgress: { current: number; total: number };
    importErrors: string[];
}

export function ImportUserModal({
    isOpen,
    onClose,
    onImport,
    jsonContent,
    onJsonContentChange,
    isImporting,
    importProgress,
    importErrors,
}: ImportUserModalProps) {
    const progressPercentage = importProgress.total > 0
        ? Math.round((importProgress.current / importProgress.total) * 100)
        : 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isImporting && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>导入用户配置</DialogTitle>
                    <DialogDescription>
                        请粘贴 JSON 数组格式的用户配置。如果用户 ID (uid) 已存在，将自动跳过。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 py-4 overflow-y-auto min-h-[300px]">
                    {!isImporting && importErrors.length === 0 ? (
                        <div className="space-y-2 h-full">
                            <Label htmlFor="json-content">JSON 配置内容</Label>
                            <Textarea
                                id="json-content"
                                placeholder='[{"uid": "user1", "config": {...}}, ...]'
                                className="h-full min-h-[300px] font-mono text-xs"
                                value={jsonContent}
                                onChange={(e) => onJsonContentChange(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {isImporting && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>正在导入...</span>
                                        <span>{importProgress.current} / {importProgress.total}</span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary overflow-hidden rounded-full">
                                        <div
                                            className="h-full bg-primary transition-all duration-300 ease-in-out"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {importErrors.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-red-600 font-medium">
                                        <AlertCircle className="h-4 w-4" />
                                        <span>导入错误 ({importErrors.length})</span>
                                    </div>
                                    <div className="bg-red-50 p-3 rounded-md text-sm text-red-800 max-h-[200px] overflow-y-auto">
                                        <ul className="list-disc list-inside space-y-1">
                                            {importErrors.map((error, index) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {!isImporting && importErrors.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-green-600 space-y-2">
                                    <CheckCircle2 className="h-12 w-12" />
                                    <span className="text-lg font-medium">导入完成</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {importErrors.length > 0 ? (
                        <Button onClick={() => {
                            // Reset state to allow re-import or close
                            onClose();
                        }}>
                            关闭
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose} disabled={isImporting}>
                                取消
                            </Button>
                            {!isImporting && (
                                <Button onClick={onImport} disabled={!jsonContent.trim()}>
                                    开始导入
                                </Button>
                            )}
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
