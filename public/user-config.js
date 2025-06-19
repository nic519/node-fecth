// 用户配置管理器 - 使用 Alpine.js
function configManager() {
	return {
		// 响应式数据
		userId: '',
		editor: null,
		configPreview: '',
		validationErrors: [],
		saving: false,
		lastSaved: null,
		lastModified: null,
		configSource: '',
		connectionStatus: 'connecting',

		// 初始化
		init() {
			this.userId = window.location.pathname.split('/')[2] || '';
			console.log('userId', this.userId);

			// 检查YAML库是否正确加载
			console.log('检查YAML库...');
			if (window.jsyaml) {
				console.log('✓ js-yaml库已加载');
			} else {
				console.error('✗ 未找到YAML库');
			}

			this.initSimpleEditor();
			this.loadConfig();
		},

		// 初始化编辑器
		initSimpleEditor() {
			const editorElement = document.getElementById('editor');
			if (!editorElement) {
				throw new Error('Editor element not found');
			}

			this.editor = {
				getValue: () => editorElement.value,
				setValue: (value) => {
					editorElement.value = value;
				},
				onDidChangeModelContent: (callback) => {
					editorElement.addEventListener('input', callback);
				},
			};

			editorElement.value = this.getDefaultConfigYaml();
			editorElement.addEventListener('input', () => {
				this.updatePreview();
			});

			this.updatePreview();
		},

		// 加载配置
		async loadConfig() {
			try {
				console.log('开始加载配置...');
				const token = new URLSearchParams(window.location.search).get('token');
				console.log('Token:', token ? '存在' : '不存在');

				const response = await fetch(`/api/config/users/${this.userId}?token=${token}&format=yaml`);
				console.log('API响应状态:', response.status);

				if (response.ok) {
					const data = await response.json();
					console.log('配置数据:', data);

					this.lastModified = data.meta.lastModified;
					this.configSource = data.meta.source;
					this.connectionStatus = 'connected';

					if (this.editor) {
						console.log('直接设置YAML内容...');
						this.editor.setValue(data.yaml);
						this.updatePreview();
					}
				} else {
					console.error('API响应错误:', response.status, response.statusText);
					this.connectionStatus = 'error';
				}
			} catch (error) {
				console.error('加载配置失败:', error);
				this.connectionStatus = 'error';
			}
		},

		// 更新预览
		updatePreview() {
			if (!this.editor) return;

			const yaml = this.editor.getValue();
			this.configPreview = yaml;
			this.validateConfig(yaml);
		},

		// 验证配置
		validateConfig(yaml) {
			this.validationErrors = [];

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
				const yaml = this.editor?.getValue() || '';

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

		// 重置配置
		resetConfig() {
			if (confirm('确定要重置配置吗？这将丢失所有未保存的更改。')) {
				this.editor?.setValue(this.getDefaultConfigYaml());
				this.updatePreview();
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
