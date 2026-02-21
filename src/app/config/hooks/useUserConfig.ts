import { useCallback, useEffect, useState, useMemo } from 'react';
import type { UserConfig } from '@/types/user-config';
import { UserConfigSchema } from '@/types/openapi-schemas';
import { userService } from '@/services/user-api';
import { useRouter } from 'next/navigation';
import { deepEqual } from '@/lib/utils';

export interface UseUserConfigProps {
	uid: string;
	token: string;
}

export interface UseUserConfigReturn {
	// 状态
	config: UserConfig | null;
	loading: boolean;
	saving: boolean;
	error: string | null;
	saveError: string | null;
	saveSuccess: boolean;
	validationErrors: string[];
	connectionStatus: 'connected' | 'disconnected';
	lastSaved: Date | null;
	isDirty: boolean;

	// 操作
	setConfig: (config: UserConfig) => void;
	saveConfig: () => Promise<boolean>;
	loadConfig: () => Promise<void>;
}

export function useUserConfig({ uid, token }: UseUserConfigProps): UseUserConfigReturn {
	const router = useRouter();
	const [config, setConfig] = useState<UserConfig | null>(null);
	const [originalConfig, setOriginalConfig] = useState<UserConfig | null>(null);
	const [loading, setLoading] = useState(true);

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
	const [lastSaved, setLastSaved] = useState<Date | null>(null);

	// 计算是否有未保存的更改
	const isDirty = useMemo(() => {
		if (!config || !originalConfig) return false;
		return !deepEqual(config, originalConfig);
	}, [config, originalConfig]);

	// 加载配置数据
	const loadConfig = useCallback(async () => {
		try {
			setLoading(true);

			const response = await userService.getUserConfig(uid, token);

			// 检查业务响应码
			if (response.code !== 0) {
				setError(response.msg || '获取配置失败');
				return;
			}

			// 从响应结构中提取配置数据
			type ApiUserConfig = UserConfig & { updatedAt?: string | null };
			const configData = response.data as ApiUserConfig;

			// 移除 updatedAt 等非配置字段
			const { updatedAt, ...userConfig } = configData;
			setConfig(userConfig);
			setOriginalConfig(userConfig);
			if (updatedAt) {
				setLastSaved(new Date(updatedAt));
			}

			setError(null);
			setConnectionStatus('connected');
		} catch (err) {
			setError(err instanceof Error ? err.message : '加载配置失败');
			setConnectionStatus('disconnected');
		} finally {
			setLoading(false);
		}
	}, [uid, token]);

	// 保存配置
	const saveConfig = async (): Promise<boolean> => {
		if (!config) return false;

		// 验证配置
		const result = UserConfigSchema.safeParse(config);
		if (!result.success) {
			setValidationErrors(result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`));
			return false;
		}
		setValidationErrors([]);

		try {
			setSaving(true);
			setSaveError(null);

			const response = await userService.updateUserConfig(uid, token, config);

			// 检查响应是否成功
			if (response.code === 0) {
				setSaveSuccess(true);
				setLastSaved(new Date());
				setOriginalConfig(config); // 更新原始配置
				setTimeout(() => setSaveSuccess(false), 3000);

				// 如果修改了访问令牌，则刷新页面地址
				if (config.accessToken && config.accessToken !== token) {
					router.replace(`/config?uid=${uid}&token=${config.accessToken}`);
				}
				return true;
			} else {
				setSaveError(response.msg || '保存配置失败');
				return false;
			}
		} catch (err) {
			setSaveError(err instanceof Error ? err.message : '保存配置失败');
			return false;
		} finally {
			setSaving(false);
		}
	};

	// Set config with validation check if errors exist
	const setConfigWithValidation = useCallback((newConfig: UserConfig) => {
		setConfig(newConfig);
		setValidationErrors((prevErrors) => {
			if (prevErrors.length > 0) {
				const result = UserConfigSchema.safeParse(newConfig);
				if (result.success) {
					return [];
				} else {
					return result.error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
				}
			}
			return prevErrors;
		});
	}, []);

	// 初始化加载
	useEffect(() => {
		if (!token) {
			setError('缺少访问令牌');
			setLoading(false);
			return;
		}

		loadConfig();
	}, [loadConfig, token]);

	return {
		// 状态
		config,
		loading,
		saving,
		error,
		saveError,
		saveSuccess,
		validationErrors,
		connectionStatus,
		lastSaved,
		isDirty,
		// 操作
		setConfig: setConfigWithValidation,
		saveConfig,
		loadConfig,
	};
}
