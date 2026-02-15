'use client';

import { Button, Chip, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/react';

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
	// 判断消息类型
	const getMessageType = (message: string) => {
		if (message.includes('成功') || message.includes('保存成功') || message.includes('创建成功') || message.includes('删除成功')) {
			return { color: 'success', icon: '✓' };
		} else if (message.includes('失败') || message.includes('错误')) {
			return { color: 'danger', icon: '✕' };
		} else if (message.includes('不支持') || message.includes('请填写') || message.includes('至少需要')) {
			return { color: 'warning', icon: '⚠' };
		}
		return { color: 'primary', icon: 'ℹ' };
	};

	return (
		<>
			{/* 删除确认模态框 */}
			<Modal isOpen={isDeleteModalOpen} onOpenChange={closeDeleteModal}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className="flex flex-col gap-1">确认删除</ModalHeader>
							<ModalBody>
								<p>确定要删除这个模板吗？此操作无法撤销。</p>
							</ModalBody>
							<ModalFooter>
								<Button color="default" variant="solid" onPress={onClose}>
									取消
								</Button>
								<Button color="danger" variant="solid" onPress={confirmDeleteTemplate} isLoading={loading}>
									删除
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>

			{/* 错误/成功消息模态框 */}
			<Modal isOpen={isErrorModalOpen} onOpenChange={closeErrorModal} size="sm">
				<ModalContent>
					{(onClose) => {
						const messageType = getMessageType("操作失败");
						return (
							<>
								<ModalHeader className="flex flex-col gap-1 items-center">
									<Chip color={messageType.color as any} variant="solid" size="lg" className="mb-2">
										<span className="text-lg mr-2">{messageType.icon}</span>
										{messageType.color === 'success'
											? '成功'
											: messageType.color === 'danger'
												? '错误'
												: messageType.color === 'warning'
													? '警告'
													: '提示'}
									</Chip>
								</ModalHeader>
								<ModalBody className="text-center">
									<p className="text-gray-700">操作失败</p>
								</ModalBody>
								<ModalFooter className="justify-center">
									<Button color={messageType.color as any} variant="solid" onPress={onClose} autoFocus>
										确定
									</Button>
								</ModalFooter>
							</>
						);
					}}
				</ModalContent>
			</Modal>
		</>
	);
}
