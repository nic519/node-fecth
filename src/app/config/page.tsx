'use client';

import { usePageTitle } from '@/hooks/usePageTitle';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense, useSyncExternalStore } from 'react';
import { ConfigEditor } from './components/ConfigEditor';
import { useUserConfig } from './hooks/useUserConfig';
import { ConfigTab } from './components/ConfigForm';

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

	return (
		<ConfigEditor
			uid={uid}
			token={token}
			config={userConfigState.config}
			validationErrors={userConfigState.validationErrors}
			onConfigChange={userConfigState.setConfig}
			lastSaved={userConfigState.lastSaved}
			activeTab={activeTab}
			onTabChange={(tab) => setStoredTab(storageKey, tab)}
			onSave={userConfigState.saveConfig}
			saving={userConfigState.saving}
			saveSuccess={userConfigState.saveSuccess}
			loading={userConfigState.loading}
			error={userConfigState.error}
		/>
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
