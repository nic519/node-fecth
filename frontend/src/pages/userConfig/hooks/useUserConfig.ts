import { useEffect, useState } from 'preact/hooks';
import { userConfigApi } from '@/generated/api-adapters';
import type { ConfigResponse } from '@/types/user-config';
import { configToYaml, yamlToConfig, validateConfig } from '../utils/configUtils';

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
	const [configPreview, setConfigPreview] = useState<any>(null);
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [configSource, setConfigSource] = useState<string>('');

	// 加载配置数据
	const loadConfig = async () => {
		try {
			setLoading(true);
			const response = await userConfigApi.getDetail(uid, token);
			
			// 检查响应状态
			if (response.code !== 0) {
				setError(response.msg || '获取配置失败');
				return;
			}
			
			// 从新的响应结构中提取配置数据
			const configData = response.data;
			setConfig(configData);
			setConfigSource((configData.meta as any).source || '环境变量');

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
	};

	// 保存配置
	const saveConfig = async () => {
		if (validationErrors.length > 0) return;

		try {
			setSaving(true);
			setError(null);

			// 解析 YAML 配置
			const newConfig = yamlToConfig(configContent);

			const response = await userConfigApi.update(uid, newConfig, token);
			
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
	}, [uid, token]);

	return {
		// 状态
		config,
		configContent,
		loading,
		saving,
		error,
		saveSuccess,
		validationErrors,
		configPreview,
		connectionStatus,
		lastSaved,
		configSource,

		// 操作
		setConfigContent: handleSetConfigContent,
		saveConfig,
		loadConfig,
	};
} 