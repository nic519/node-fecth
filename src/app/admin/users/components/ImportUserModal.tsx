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
import { AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react';
import type { ImportResult } from '../hooks/useImportUserModal';

interface ImportUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: () => void;
    jsonContent: string;
    onJsonContentChange: (content: string) => void;
    isImporting: boolean;
    importProgress: { current: number; total: number };
    importResult: ImportResult | null;
}

function ResultGroup({ icon, title, items, className }: {
    icon: React.ReactNode;
    title: string;
    items: string[];
    className: string;
}) {
    if (!items.length) return null;
    return (
        <div className="space-y-2">
            <div className={`flex items-center gap-2 font-medium ${className}`}>
                {icon}
                <span>{title} ({items.length})</span>
            </div>
            <div className="max-h-[140px] overflow-y-auto rounded-md bg-secondary/50 p-3 text-sm">
                <ul className="list-disc list-inside space-y-1">
                    {items.map((item, index) => (
                        <li key={index} className="break-all">{item}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export function ImportUserModal({
    isOpen,
    onClose,
    onImport,
    jsonContent,
    onJsonContentChange,
    isImporting,
    importProgress,
    importResult,
}: ImportUserModalProps) {
    const progressPercentage = importProgress.total > 0
        ? Math.round((importProgress.current / importProgress.total) * 100)
        : 0;
    const showingResult = isImporting || importResult !== null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isImporting && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>导入用户配置</DialogTitle>
                    <DialogDescription>
                        请粘贴 JSON 数组格式的用户配置。导入前会逐项校验；用户 ID 已存在的将自动跳过。
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 py-4 overflow-y-auto min-h-[300px]">
                    {!showingResult ? (
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
                        <div className="space-y-5">
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

                            {importResult && (
                                <>
                                    <ResultGroup
                                        icon={<CheckCircle2 className="h-4 w-4" />}
                                        title="已导入"
                                        items={importResult.imported}
                                        className="text-green-600"
                                    />
                                    <ResultGroup
                                        icon={<MinusCircle className="h-4 w-4" />}
                                        title="已跳过（用户已存在）"
                                        items={importResult.skipped}
                                        className="text-muted-foreground"
                                    />
                                    <ResultGroup
                                        icon={<AlertCircle className="h-4 w-4" />}
                                        title="问题项"
                                        items={importResult.errors}
                                        className="text-red-600"
                                    />
                                    {importResult.imported.length === 0 && importResult.skipped.length === 0 && importResult.errors.length === 0 && (
                                        <div className="py-10 text-center text-sm text-muted-foreground">没有可导入的用户</div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {importResult ? (
                        <Button onClick={onClose}>
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
