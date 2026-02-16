'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';

interface TemplateModalsProps {
	isDeleteModalOpen: boolean;
	closeDeleteModal: () => void;
	confirmDeleteTemplate: () => void;
	isErrorModalOpen: boolean;
	closeErrorModal: () => void;
	loading: boolean;
}

export function TemplateModals({
	isDeleteModalOpen,
	closeDeleteModal,
	confirmDeleteTemplate,
	isErrorModalOpen,
	closeErrorModal,
	loading,
}: TemplateModalsProps) {
	return (
		<>
			{/* 删除确认模态框 */}
			<Dialog open={isDeleteModalOpen} onOpenChange={(open) => !open && closeDeleteModal()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>确认删除模板</DialogTitle>
                        <DialogDescription>
                            确定要删除此模板吗？此操作不可撤销！
                        </DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="secondary" onClick={closeDeleteModal}>
							取消
						</Button>
						<Button variant="destructive" onClick={confirmDeleteTemplate} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 错误提示模态框 */}
			<Dialog open={isErrorModalOpen} onOpenChange={(open) => !open && closeErrorModal()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="text-red-600">错误</DialogTitle>
                        <DialogDescription>
                            操作失败，请重试。
                        </DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button onClick={closeErrorModal}>
							确定
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
