
'use client';

import Loading from '@/components/Loading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense, useSyncExternalStore } from 'react';
import { ConfigEditor } from './components/ConfigEditor';
import { Header } from './components/Header';
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
		<div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950">
			<div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#09090b_40%,#1e1b4b_100%)] opacity-20 pointer-events-none" />

			<Header />

			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
				{userConfigState.loading ? (
					<div className="flex items-center justify-center py-20">
						<Loading message="加载配置中..." />
					</div>
				) : userConfigState.error && !userConfigState.config ? (
					<div className="flex items-center justify-center py-20">
						<Card className="max-w-md w-full">
							<CardContent className="p-6">
								<h1 className="text-2xl font-bold text-destructive mb-4">错误</h1>
								<p className="text-muted-foreground mb-4">{userConfigState.error}</p>
								<Button onClick={() => window.location.reload()} variant="default" className="w-full">
									重试
								</Button>
							</CardContent>
						</Card>
					</div>
				) : (
					<div className="flex flex-col gap-6 min-h-[500px]">
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
						/>
					</div>
				)}
			</main>
		</div>
	);
}

function UserConfigContent() {

	const searchParams = useSearchParams();
	const token = searchParams.get('token') || '';
	const uid = searchParams.get('uid') || '';

	usePageTitle(`${uid} - 配置订阅`, '');

	if (!uid) {
		return (
			<div className="min-h-screen flex items-center justify-center">
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
