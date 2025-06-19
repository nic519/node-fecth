// 用户配置管理器 - 使用 Alpine.js
function configManager() {
	return {
		// 响应式数据
		userId: '',
		configContent: '',
		configPreview: '',
		validationErrors: [],
		saving: false,
		lastSaved: null,
		lastModified: null,
		configSource: '',
		connectionStatus: 'connecting',

		// 初始化
		init() { 
			// 检查YAML库是否正确加载
			console.log('检查YAML库...');
			if (window.jsyaml) {
				console.log('✓ js-yaml库已加载');
			} else {
				console.error('✗ 未找到YAML库');
			}

			// 优先使用服务器端传递的数据
			this.loadServerData();
		},

		// 从服务器端传递的数据中加载配置
		loadServerData() {
			const serverDataElement = document.getElementById('server-data');
			if (serverDataElement) {
				try { 

					const data = JSON.parse(serverDataElement.textContent);
					const meta = data.configRespone.meta;
					this.userId = meta.userId;
					
					// 更新页面标题
					document.title = `配置管理 - ${this.userId}`;
					
					this.lastModified = meta.lastModified;
					this.configSource = meta.source;
					this.connectionStatus = 'connected';

					if (data.configRespone.config) {
						console.log('使用服务器端传递的配置数据');
						const yamlFormat = this.configToYaml(data.configRespone.config)
						this.configContent = yamlFormat;
						this.validateConfig(yamlFormat);
						this.connectionStatus = 'connected';
						this.configSource = '服务器端';
						return true;
					}
				} catch (error) {
					console.error('解析服务器端数据失败:', error);
				}
			}
			return false;
		},



		// 验证配置
		validateConfig(yaml) {
			this.validationErrors = [];
			this.configPreview = yaml;

			try {
				// 基本的YAML语法检查
				const lines = yaml.split('\n');

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i].trim();
					if (!line || line.startsWith('#')) continue;

					// 检查缩进
					const currentIndent = lines[i].length - lines[i].trimStart().length;
					if (currentIndent % 2 !== 0) {
						this.validationErrors.push(`第${i + 1}行: 缩进错误`);
					}
				}

				// 尝试解析YAML并验证字段
				const config = this.yamlToConfig(yaml);

				// 验证必需字段
				if (!config.subscribe) this.validationErrors.push('subscribe 字段是必需的');
				if (!config.accessToken) this.validationErrors.push('accessToken 字段是必需的');

				// 验证URL格式
				if (config.subscribe) {
					try {
						new URL(config.subscribe);
					} catch {
						this.validationErrors.push('subscribe 必须是有效的 URL');
					}
				}

				if (config.ruleUrl) {
					try {
						new URL(config.ruleUrl);
					} catch {
						this.validationErrors.push('ruleUrl 必须是有效的 URL');
					}
				}

				// 验证数组字段
				if (config.multiPortMode && !Array.isArray(config.multiPortMode)) {
					this.validationErrors.push('multiPortMode 必须是数组');
				}

				if (config.appendSubList && !Array.isArray(config.appendSubList)) {
					this.validationErrors.push('appendSubList 必须是数组');
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : '未知错误';
				this.validationErrors.push(`YAML解析错误: ${errorMessage}`);
			}
		},

		// 保存配置
		async saveConfig() {
			if (this.validationErrors.length > 0) {
				alert('配置有错误，请先修复后再保存');
				return;
			}

			this.saving = true;

			try {
				const yaml = this.configContent || '';

				// 验证YAML格式和字段
				try {
					const config = this.yamlToConfig(yaml);
					// 这里可以添加更多验证逻辑
				} catch (error) {
					alert('YAML格式错误，请检查配置');
					return;
				}

				const token = new URLSearchParams(window.location.search).get('token');
				const response = await fetch(`/api/config/users/${this.userId}?token=${token}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ yaml }),
				});

				if (response.ok) {
					this.lastSaved = new Date().toISOString();
					this.configSource = 'kv';
					this.connectionStatus = 'connected';
					alert('配置保存成功！');
				} else {
					// 处理后端返回的详细错误信息
					const errorData = await response.json().catch(() => null);
					if (errorData && errorData.details) {
						alert(`配置验证失败:\n${errorData.details.join('\n')}`);
					} else {
						const error = await response.text();
						alert(`保存失败: ${error}`);
					}
				}
			} catch (error) {
				console.error('保存配置失败:', error);
				alert('保存失败，请检查网络连接');
			} finally {
				this.saving = false;
			}
		},

		// YAML 转换工具
		configToYaml(config) {
			if (!config) return this.getDefaultConfigYaml();

			try {
				if (!window.jsyaml || !window.jsyaml.dump) {
					console.error('YAML库未找到或未正确加载');
					return this.getDefaultConfigYaml();
				}

				return window.jsyaml.dump(config, {
					indent: 2,
				});
			} catch (error) {
				console.error('YAML序列化失败:', error);
				return this.getDefaultConfigYaml();
			}
		},

		yamlToConfig(yaml) {
			try {
				if (!window.jsyaml || !window.jsyaml.load) {
					console.error('YAML库未找到或未正确加载');
					throw new Error('YAML库未正确加载');
				}

				const config = window.jsyaml.load(yaml);
				return config || { subscribe: '', accessToken: '' };
			} catch (error) {
				console.error('YAML解析错误:', error);
				return { subscribe: '', accessToken: '' };
			}
		},

		// 获取默认配置
		getDefaultConfigYaml() {
			return `subscribe: "https://example.com/subscription"
accessToken: "your-access-token"
fileName: "config.yaml"
excludeRegex: "Standard"
multiPortMode:
  - TW
  - SG
  - JP
appendSubList:
  - subscribe: "https://example.com/sub1"
    flag: "sub1"
    includeArea:
      - US
      - HK
  - subscribe: "https://example.com/sub2"
    flag: "sub2"`;
		},

		// 时间格式化
		formatTime(isoString) {
			if (!isoString) return '未知';
			const date = new Date(isoString);
			return date.toLocaleString('zh-CN');
		},
	};
}
