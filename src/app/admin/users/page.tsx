'use client';

// 导入自定义hooks
import { usePageTitle } from '@/hooks/usePageTitle';
import { useToastContext } from '@/providers/toast-provider';
import { useUserFilters } from './hooks/useUserFilters';
import { useUserManagement } from './hooks/useUserManagement';

// 导入组件
import { NavigationBar } from '@/components/NavigationBar';
import { UserFilters } from './components/UserFilters';
import { UserMasonry } from './components/UserMasonry';
import { ImportUserModal } from './components/ImportUserModal';

// 导入UI组件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, User, Key, Link as LinkIcon, Dices } from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function AdminUsersContent() {
	// 设置页面标题
	usePageTitle('用户管理');

	// 获取超级管理员令牌
	const searchParams = useSearchParams();
	const superToken = searchParams.get('superToken') || '';

	// 获取 Toast 上下文
	const { showToast } = useToastContext();

	// 使用用户管理Hook
	const { 
        users, 
        loading, 
        error, 
        fetchUsers, 
        handleUserAction, 
        handleExport,
        deleteModal, 
        addUserModal,
        importModal 
    } = useUserManagement({
		superToken,
		showToast,
	});

	// 使用用户过滤Hook
	const { filteredUsers, searchTerm, setSearchTerm } = useUserFilters({
		users,
	});

	return (
		<div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
			{/* Decorative background gradient */}
			<div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-slate-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-20 pointer-events-none" />

			{/* 导航栏 */}
			<NavigationBar superToken={superToken} currentPage="users" />

			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
					{/* 左侧：筛选和操作 */}
					<div className="lg:col-span-1 sticky top-24 z-10">
						<UserFilters
							searchTerm={searchTerm}
							loading={loading}
							onSearchTermChange={setSearchTerm}
							onRefresh={fetchUsers}
							onAddUser={addUserModal.open}
                            onExport={handleExport}
                            onImport={importModal.open}
						/>
					</div>

					{/* 右侧：列表和数据 */}
					<div className="lg:col-span-3 space-y-6">
						{/* 错误信息 */}
						{error && (
							<div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
								<div className="text-destructive font-medium">{error}</div>
							</div>
						)}

						{/* 用户列表 - 瀑布流展示 */}
						<UserMasonry users={filteredUsers} loading={loading} error={error} onUserAction={handleUserAction} />

						{/* 分页信息 */}
						<div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 px-4 py-3 border border-border/60 rounded-xl shadow-sm backdrop-blur-sm">
							<div className="flex items-center text-xs font-medium text-muted-foreground">
								<span>共 {filteredUsers.length} 条记录</span>
							</div>
							<div className="flex gap-2">
								<Button size="sm" variant="outline" className="bg-background text-muted-foreground border-border/60 hover:bg-muted" disabled>
									上一页
								</Button>
								<Button size="sm" variant="default" className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
									1
								</Button>
								<Button size="sm" variant="outline" className="bg-background text-muted-foreground border-border/60 hover:bg-muted" disabled>
									下一页
								</Button>
							</div>
						</div>
					</div>
				</div>
			</main>

			{/* 删除用户确认模态框 */}
			<Dialog open={deleteModal.isOpen} onOpenChange={(open) => !open && deleteModal.close()}>
				<DialogContent className="border-border/60 shadow-xl">
					<DialogHeader>
						<DialogTitle className="text-xl">确认删除用户</DialogTitle>
						<DialogDescription>
							确定要删除用户 <span className="font-mono font-medium text-foreground">{deleteModal.userToDelete}</span> 吗？此操作不可撤销！
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="ghost" onClick={deleteModal.close}>
							取消
						</Button>
						<Button variant="destructive" onClick={deleteModal.confirm} disabled={loading} className="bg-destructive hover:bg-destructive/90">
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							删除
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* 添加用户模态框 */}
			<Dialog open={addUserModal.isOpen} onOpenChange={(open) => !open && addUserModal.close()}>
				<DialogContent className="sm:max-w-[500px] border-border/60 shadow-xl">
					<DialogHeader>
						<DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">添加新用户</DialogTitle>
						<DialogDescription className="text-center">
							请输入新用户的详细信息以创建账号
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-6 py-4">
						<div className="space-y-2">
							<Label htmlFor="uid" className="text-sm font-medium">用户ID</Label>
							<div className="relative group">
								<User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
								<Input
									id="uid"
									className="pl-9 border-border/60 focus-visible:ring-primary/20 transition-all"
									placeholder="请输入用户ID"
									value={addUserModal.form.uid}
									onChange={(e) => addUserModal.setUid(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="token" className="text-sm font-medium">访问令牌</Label>
							<div className="flex gap-2">
								<div className="relative flex-1 group">
									<Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
									<Input
										id="token"
										className="pl-9 border-border/60 focus-visible:ring-primary/20 transition-all"
										placeholder="请输入用户访问令牌"
										value={addUserModal.form.token}
										onChange={(e) => addUserModal.setToken(e.target.value)}
									/>
								</div>
								<Button
									variant="outline"
									size="icon"
									onClick={() => {
										const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
										let result = '';
										for (let i = 0; i < 16; i++) {
											result += chars.charAt(Math.floor(Math.random() * chars.length));
										}
										addUserModal.setToken(result);
									}}
									title="生成随机令牌"
									className="shrink-0 border-border/60 hover:bg-muted/50 hover:text-primary transition-colors"
								>
									<Dices className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="subscribe" className="text-sm font-medium">订阅链接</Label>
							<div className="relative group">
								<LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
								<Input
									id="subscribe"
									className="pl-9 border-border/60 focus-visible:ring-primary/20 transition-all"
									placeholder="请输入订阅链接"
									value={addUserModal.form.subscribe}
									onChange={(e) => addUserModal.setSubscribe(e.target.value)}
								/>
							</div>
						</div>
					</div>
					<DialogFooter className="sm:justify-between gap-2">
						<Button variant="ghost" onClick={addUserModal.close} className="hover:bg-muted/50">
							取消
						</Button>
						<Button
							onClick={addUserModal.confirm}
							disabled={loading}
							className="bg-gradient-to-r from-primary to-violet-600 hover:to-violet-700 text-white min-w-[120px] shadow-lg shadow-primary/20 transition-all"
						>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							添加用户
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

            {/* 导入用户模态框 */}
            <ImportUserModal 
                isOpen={importModal.isOpen}
                onClose={importModal.close}
                onImport={importModal.handleImport}
                jsonContent={importModal.jsonContent}
                onJsonContentChange={importModal.setJsonContent}
                isImporting={importModal.isImporting}
                importProgress={importModal.importProgress}
                importErrors={importModal.importErrors}
            />
		</div>
	);
}

export default function AdminUsers() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
			<AdminUsersContent />
		</Suspense>
	);
}
