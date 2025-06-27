const { subscribe } = require("diagnostics_channel");

// 用户配置管理器 - 使用 Alpine.js
function configManager() {
	return {
		// 响应式数据
		userId: '',
		configContent: '',
		configPreview: '',
		subscribeURL: '',
		validationErrors: [],
		saving: false,
		saveSuccess: false,
		lastSaved: null,
		lastModified: null,
		configSource: '',
		connectionStatus: 'connecting',
		copySuccess: false,
		showHelp: false, // 控制字段说明的显示隐藏
		hasUserInteracted: false, // 追踪用户是否手动操作过帮助说明

		// 初始化
		init() {
			// 检查YAML库是否正确加载
			console.log('检查YAML库...');
			if (window.jsyaml) {
				console.log('✓ js-yaml库已加载');
			} else {
				console.error('✗ 未找到YAML库');
			}

			// 响应式显示侧边栏：大屏幕默认显示，小屏幕默认隐藏
			this.updateHelpVisibility();
			window.addEventListener('resize', () => this.updateHelpVisibility());

			// 优先使用服务器端传递的数据
			this.loadServerData();
			this.subscribeURL = window.location.href.replace('/config', '');
		},
		
		async copySubscribeURL() {
			try {
				await navigator.clipboard.writeText(this.subscribeURL);
				this.copySuccess = true;
				// 2秒后恢复原始图标
				setTimeout(() => {
					this.copySuccess = false;
				}, 2000);
			} catch (error) {
				console.error('复制失败:', error);
				// 如果剪贴板API不可用，可以使用降级方案
				this.fallbackCopyToClipboard(this.subscribeURL);
			}
		},

		// 降级复制方案
		fallbackCopyToClipboard(text) {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			try {
				document.execCommand('copy');
				this.copySuccess = true;
				setTimeout(() => {
					this.copySuccess = false;
				}, 2000);
			} catch (error) {
				console.error('降级复制也失败了:', error);
			}
			document.body.removeChild(textArea);
		},

		// 从服务器端传递的数据中加载配置
		loadServerData() {
			const serverDataElement = document.getElementById('server-data');
			if (serverDataElement) {
				try {
					const data = JSON.parse(serverDataElement.textContent);
					const meta = data.configResponse.meta;
					this.userId = meta.userId;

					// 更新页面标题
					document.title = `配置管理 - ${this.userId}`;

					this.lastModified = meta.lastModified;
					this.configSource = meta.source;
					this.connectionStatus = 'connected';

					if (data.configResponse.config) {
						console.log('使用服务器端传递的配置数据');
						const yamlFormat = this.configToYaml(data.configResponse.config);
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
				// 将错误提示放到验证错误区域，不使用alert
				return;
			}

			this.saving = true;
			this.saveSuccess = false;

			try {
				const yaml = this.configContent || '';

				// 验证YAML格式和字段
				try {
					const config = this.yamlToConfig(yaml);
					// 这里可以添加更多验证逻辑
				} catch (error) {
					this.validationErrors = ['YAML格式错误，请检查配置'];
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
					this.saveSuccess = true;
					
					// 3秒后恢复原始状态
					setTimeout(() => {
						this.saveSuccess = false;
					}, 3000);
				} else {
					// 处理后端返回的详细错误信息
					const errorData = await response.json().catch(() => null);
					if (errorData && errorData.message) {
						this.validationErrors = [errorData.message];
					} else {
						const error = await response.text();
						this.validationErrors = [`保存失败: ${error}`];
					}
				}
			} catch (error) {
				console.error('保存配置失败:', error);
				this.validationErrors = ['保存失败，请检查网络连接'];
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

		// 根据屏幕大小更新帮助说明的显示状态
		updateHelpVisibility() {
			const isLargeScreen = window.innerWidth >= 1024; // lg 断点
			if (isLargeScreen) {
				this.showHelp = true;
			} else {
				// 小屏幕保持用户的选择状态，不自动更改
				// 只在首次初始化时设为 false
				if (!this.hasUserInteracted) {
					this.showHelp = false;
				}
			}
		},
	};
}
