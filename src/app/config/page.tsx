
'use client';

import Loading from '@/components/Loading';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ConfigEditor } from './components/ConfigEditor';
import { Header } from './components/Header';
import { useUserConfig } from './hooks/useUserConfig';
import { ConfigTab } from './components/ConfigForm';

function UserConfigContent() {
	usePageTitle('配置订阅');

	const searchParams = useSearchParams();
	const token = searchParams.get('token') || '';
	const uid = searchParams.get('uid') || '';

	const userConfigState = useUserConfig({ uid, token });
	const [activeTab, setActiveTab] = useState<ConfigTab>('basic');

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

	return (
		<div className="min-h-screen">
			<Header
				validationErrors={userConfigState.validationErrors}
			/>

			<main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
							onTabChange={setActiveTab}
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

export default function UserConfigPage() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
			<UserConfigContent />
		</Suspense>
	);
}
