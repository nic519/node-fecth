import { useCallback, useEffect, useState } from 'react';
import type { ConfigResponse } from '@/types/user-config';
import { configToYaml, validateConfig, yamlToConfig } from '@/utils/configUtils';

interface ApiResponse<T> {
	code: number;
	msg: string;
	data: T;
}

export interface UseUserConfigProps {
	uid: string;
	token: string;
}

export interface UseUserConfigReturn {
	// 状态
	config: ConfigResponse | null;
	configContent: string;
	loading: boolean;
	saving: boolean;
	error: string | null;
	saveSuccess: boolean;
	validationErrors: string[];
	configPreview: any | null;
	connectionStatus: 'connected' | 'disconnected';
	lastSaved: Date | null;
	configSource: string;

	// 操作
	setConfigContent: (content: string) => void;
	setYamlSyntaxErrors: (errors: string[]) => void;
	saveConfig: () => Promise<void>;
	loadConfig: () => Promise<void>;
}

export function useUserConfig({ uid, token }: UseUserConfigProps): UseUserConfigReturn {
	const [config, setConfig] = useState<ConfigResponse | null>(null);
	const [configContent, setConfigContent] = useState('');
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);
	const [validationErrors, setValidationErrors] = useState<string[]>([]);
	const [yamlSyntaxErrors, setYamlSyntaxErrors] = useState<string[]>([]);
	const [configPreview, setConfigPreview] = useState<unknown>(null);
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [configSource] = useState('cloud'); // 默认为云端

	// 加载配置数据
	const loadConfig = useCallback(async () => {
		try {
			setLoading(true);

			const res = await fetch(`/api/user?uid=${uid}&token=${token}`);
			if (!res.ok) {
				const errorData = await res.json() as ApiResponse<null>;
				throw new Error(errorData.msg || '获取配置失败');
			}

			const response = await res.json() as ApiResponse<ConfigResponse>;

			// 检查业务响应码
			if (response.code !== 0) {
				setError(response.msg || '获取配置失败');
				return;
			}

			// 从响应结构中提取配置数据
			const configData = response.data;
			setConfig({ config: configData.config, assetToken: configData.assetToken, updatedAt: configData.updatedAt });

			// 将配置转换为 YAML 格式显示
			const yamlContent = configToYaml(configData.config);
			setConfigContent(yamlContent);

			// 验证配置
			const validation = validateConfig(yamlContent);
			setValidationErrors(validation.errors);
			setConfigPreview(validation.configPreview);

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
	const saveConfig = async () => {
		// 检查是否有任何验证错误（包括 YAML 语法错误和业务逻辑错误）
		if (validationErrors.length > 0 || yamlSyntaxErrors.length > 0) return;

		try {
			setSaving(true);
			setError(null);

			// 解析 YAML 配置
			const newConfig = yamlToConfig(configContent);

			const res = await fetch(`/api/user?uid=${uid}&token=${token}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ config: newConfig }),
			});

			if (!res.ok) {
				const errorData = await res.json() as any;
				throw new Error(errorData.msg || '保存配置失败');
			}

			const response = await res.json() as any;

			// 检查响应是否成功
			if (response.code === 0) {
				setSaveSuccess(true);
				setLastSaved(new Date());
				setTimeout(() => setSaveSuccess(false), 3000);
			} else {
				setError(response.msg || '保存配置失败');
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : '保存配置失败');
		} finally {
			setSaving(false);
		}
	};

	// 更新配置内容并验证
	const handleSetConfigContent = (content: string) => {
		setConfigContent(content);
		const validation = validateConfig(content);
		setValidationErrors(validation.errors);
		setConfigPreview(validation.configPreview);
	};

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
		configContent,
		loading,
		saving,
		error,
		saveSuccess,
		validationErrors: [...validationErrors, ...yamlSyntaxErrors], // 合并所有验证错误
		configPreview,
		connectionStatus,
		lastSaved,
		configSource,

		// 操作
		setConfigContent: handleSetConfigContent,
		setYamlSyntaxErrors, // 导出用于接收 YamlEditor 的验证错误
		saveConfig,
		loadConfig,
	};
}
