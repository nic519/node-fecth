'use client';

import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense, useSyncExternalStore, useState } from 'react';
import { ConfigEditor } from './components/ConfigEditor';
import { useUserConfig } from './hooks/useUserConfig';
import { ConfigTab } from './components/ConfigForm';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

function parseStoredTab(tab: string | null): ConfigTab {
	if (tab === 'basic' || tab === 'rules' || tab === 'dynamic' || tab === 'token' || tab === 'preview') {
		return tab;
	}
	return 'basic';
}

function subscribeToStorageChanges(callback: () => void) {
	window.addEventListener('storage', callback);
	window.addEventListener('config:activeTab', callback);
	return () => {
		window.removeEventListener('storage', callback);
		window.removeEventListener('config:activeTab', callback);
	};
}

function setStoredTab(storageKey: string, tab: ConfigTab) {
	window.localStorage.setItem(storageKey, tab);
	window.dispatchEvent(new Event('config:activeTab'));
}

function UserConfigInner({ uid, token }: { uid: string; token: string }) {
	const userConfigState = useUserConfig({ uid, token });
	const storageKey = `config.activeTab:${uid}`;
	const activeTab = useSyncExternalStore<ConfigTab>(
		subscribeToStorageChanges,
		() => parseStoredTab(window.localStorage.getItem(storageKey)),
		() => 'basic'
	);

	const [showConfirmDialog, setShowConfirmDialog] = useState(false);
	const [pendingTab, setPendingTab] = useState<ConfigTab | null>(null);

	const handleTabChange = (newTab: ConfigTab) => {
		// 如果切换到预览页且有未保存的更改
		if (newTab === 'preview' && userConfigState.isDirty) {
			setPendingTab(newTab);
			setShowConfirmDialog(true);
		} else {
			setStoredTab(storageKey, newTab);
		}
	};

	const handleConfirmSave = async () => {
		const success = await userConfigState.saveConfig();
		if (success) {
			if (pendingTab) {
				setStoredTab(storageKey, pendingTab);
			}
			setShowConfirmDialog(false);
			setPendingTab(null);
		}
	};

	return (
		<>
			<ConfigEditor
				uid={uid}
				token={token}
				config={userConfigState.config}
				validationErrors={userConfigState.validationErrors}
				onConfigChange={userConfigState.setConfig}
				lastSaved={userConfigState.lastSaved}
				activeTab={activeTab}
				onTabChange={handleTabChange}
				onSave={userConfigState.saveConfig}
				saving={userConfigState.saving}
				saveSuccess={userConfigState.saveSuccess}
				saveError={userConfigState.saveError}
				loading={userConfigState.loading}
				error={userConfigState.error}
			/>

			<Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>保存未提交的更改？</DialogTitle>
						<DialogDescription>
							您有未保存的配置更改。预览结果需要使用最新的配置，是否立即保存？
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="sm:justify-between">
						{userConfigState.saveError ? (
							<div className="flex items-center text-sm text-destructive mr-auto">
								<AlertCircle className="mr-2 h-4 w-4" />
								{userConfigState.saveError}
							</div>
						) : (
							<div />
						)}
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
								取消
							</Button>
							<Button onClick={handleConfirmSave} disabled={userConfigState.saving}>
								{userConfigState.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								保存并切换
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function UserConfigContent() {

	const searchParams = useSearchParams();
	const token = searchParams.get('token') || '';
	const uid = searchParams.get('uid') || '';

	usePageTitle(`${uid} - 配置订阅`, '');

	if (!uid) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
				<Card className="max-w-md w-full">
					<CardContent className="p-6">
						<h1 className="text-2xl font-bold text-destructive mb-4">错误</h1>
						<p className="text-muted-foreground mb-4">缺少用户ID参数</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	return <UserConfigInner key={uid} uid={uid} token={token} />;
}

export default function UserConfigPage() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
			<UserConfigContent />
		</Suspense>
	);
}
