import { RouteHandler } from '@/types/routes.types';
import { UserManager } from '@/module/userManager/userManager';

export class ConfigPageHandler implements RouteHandler {
	async handle(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const pathname = url.pathname;

		console.log(`📄 配置页面请求: ${pathname}`);

		try {
			// 解析路径参数
			const pathParts = pathname.split('/').filter(Boolean);

			// 路由匹配: /config/:userId
			if (pathParts[0] === 'config' && pathParts[1]) {
				const userId = pathParts[1];
				const token = url.searchParams.get('token');

				if (!token) {
					return new Response('Missing access token', { status: 401 });
				}

				// 验证用户权限
				const userManager = new UserManager(env);
				if (!userManager.validateUserPermission(userId, token)) {
					return new Response('Invalid access token', { status: 403 });
				}

				// 获取用户配置
				const configResponse = await userManager.getUserConfig(userId);
				const config = configResponse?.config;

				// 生成HTML页面
				const html = await this.generateConfigPage(userId, config, request);

				return new Response(html, {
					status: 200,
					headers: {
						'Content-Type': 'text/html;charset=utf-8',
						'Cache-Control': 'no-cache',
					},
				});
			}

			return new Response('Not Found', { status: 404 });
		} catch (error) {
			console.error('配置页面处理错误:', error);
			return new Response('Internal Server Error', { status: 500 });
		}
	}

	/**
	 * 生成配置管理页面HTML（从 HTML 模板文件读取并插值）
	 */
	private async generateConfigPage(userId: string, config: any, request: Request): Promise<string> {
		const htmlResp = await fetch(new URL('/user-modify.html', request.url));
		let template = await htmlResp.text();

		const configYaml = config ? this.configToYaml(config) : this.getDefaultConfigYaml();
		const jsCode = this.getJavaScriptCode(userId);

		// 变量插值
		template = template
			.replace(/\$\{userId\}/g, userId)
			.replace(/\$\{configYaml\}/g, configYaml)
			.replace(/\$\{jsCode\}/g, jsCode);
		return template;
	}

	/**
	 * 获取JavaScript代码
	 */
	private getJavaScriptCode(userId: string): string {
		return `
        function configManager() {
            return {
                editor: null,
                configPreview: '',
                validationErrors: [],
                saving: false,
                lastSaved: null,
                lastModified: null,
                configSource: '',
                connectionStatus: 'connecting',

                init() {
                    // this.initMonacoEditor();
                    // this.loadConfig();
                },

                async initMonacoEditor() {
                    require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
                    require(['vs/editor/editor.main'], () => {
                        this.editor = monaco.editor.create(document.getElementById('editor'), {
                            value: \`${this.getDefaultConfigYaml()}\`,
                            language: 'yaml',
                            theme: 'vs',
                            automaticLayout: true,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 14,
                            lineNumbers: 'on',
                            roundedSelection: false,
                            scrollbar: {
                                vertical: 'visible',
                                horizontal: 'visible'
                            }
                        });

                        this.editor.onDidChangeModelContent(() => {
                            this.updatePreview();
                        });

                        this.updatePreview();
                    });
                },

                async loadConfig() {
                    try {
                        const response = await fetch(\`/api/config/users/${userId}?token=\${new URLSearchParams(window.location.search).get('token')}\`);
                        if (response.ok) {
                            const data = await response.json();
                            this.lastModified = data.meta.lastModified;
                            this.configSource = data.meta.source;
                            this.connectionStatus = 'connected';
                            
                            if (this.editor) {
                                const yaml = this.configToYaml(data.config);
                                this.editor.setValue(yaml);
                            }
                        } else {
                            this.connectionStatus = 'error';
                        }
                    } catch (error) {
                        console.error('加载配置失败:', error);
                        this.connectionStatus = 'error';
                    }
                },

                updatePreview() {
                    if (!this.editor) return;
                    
                    const yaml = this.editor.getValue();
                    this.configPreview = yaml;
                    this.validateConfig(yaml);
                },

                validateConfig(yaml) {
                    this.validationErrors = [];
                    
                    try {
                        // 基本的YAML语法检查
                        const lines = yaml.split('\\n');
                        let indentLevel = 0;
                        
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            if (!line || line.startsWith('#')) continue;
                            
                            // 检查缩进
                            const currentIndent = lines[i].length - lines[i].trimStart().length;
                            if (currentIndent % 2 !== 0) {
                                this.validationErrors.push(\`第\${i + 1}行: 缩进错误\`);
                            }
                        }
                        
                        // 尝试解析YAML
                        const config = this.yamlToConfig(yaml);
                        if (!config.subscribe) {
                            this.validationErrors.push('缺少必需的 subscribe 字段');
                        }
                        if (!config.accessToken) {
                            this.validationErrors.push('缺少必需的 accessToken 字段');
                        }
                        
                        // URL格式验证
                        if (config.subscribe) {
                            try {
                                new URL(config.subscribe);
                            } catch {
                                this.validationErrors.push('subscribe 字段不是有效的URL');
                            }
                        }
                        
                    } catch (error) {
                        this.validationErrors.push(\`YAML解析错误: \${error.message}\`);
                    }
                },

                async saveConfig() {
                    if (this.validationErrors.length > 0) {
                        alert('配置有错误，请先修复后再保存');
                        return;
                    }

                    this.saving = true;
                    
                    try {
                        const yaml = this.editor.getValue();
                        const config = this.yamlToConfig(yaml);
                        
                        const response = await fetch(\`/api/config/users/${userId}?token=\${new URLSearchParams(window.location.search).get('token')}\`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ config })
                        });

                        if (response.ok) {
                            this.lastSaved = new Date().toISOString();
                            this.configSource = 'kv';
                            this.connectionStatus = 'connected';
                            alert('配置保存成功！');
                        } else {
                            const error = await response.text();
                            alert(\`保存失败: \${error}\`);
                        }
                    } catch (error) {
                        console.error('保存配置失败:', error);
                        alert('保存失败，请检查网络连接');
                    } finally {
                        this.saving = false;
                    }
                },

                resetConfig() {
                    if (confirm('确定要重置配置吗？这将丢失所有未保存的更改。')) {
                        this.editor.setValue(\`${this.getDefaultConfigYaml()}\`);
                    }
                },

                configToYaml(config) {
                    if (!config) return this.getDefaultConfigYaml();
                    
                    const lines = [];
                    lines.push('# 用户配置');
                    lines.push('# 请根据您的需求修改以下配置');
                    lines.push('');
                    
                    if (config.subscribe) lines.push(\`subscribe: "\${config.subscribe}"\`);
                    if (config.accessToken) lines.push(\`accessToken: "\${config.accessToken}"\`);
                    if (config.ruleUrl) lines.push(\`ruleUrl: "\${config.ruleUrl}"\`);
                    if (config.fileName) lines.push(\`fileName: "\${config.fileName}"\`);
                    
                    if (config.multiPortMode && config.multiPortMode.length > 0) {
                        lines.push(\`multiPortMode:\${config.multiPortMode.map(code => \`\n  - \${code}\`).join('')}\`);
                    }
                    
                    if (config.appendSubList && config.appendSubList.length > 0) {
                        lines.push('appendSubList:');
                        config.appendSubList.forEach((sub, index) => {
                            lines.push(\`  - subscribe: "\${sub.subscribe}"\`);
                            lines.push(\`    flag: "\${sub.flag}"\`);
                            if (sub.includeArea && sub.includeArea.length > 0) {
                                lines.push(\`    includeArea:\${sub.includeArea.map(code => \`\n      - \${code}\`).join('')}\`);
                            }
                        });
                    }
                    
                    if (config.excludeRegex) lines.push(\`excludeRegex: "\${config.excludeRegex}"\`);
                    
                    return lines.join('\\n');
                },

                yamlToConfig(yaml) {
                    const lines = yaml.split('\\n');
                    const config = {};
                    let currentKey = null;
                    let currentArray = null;
                    
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) continue;
                        
                        if (trimmed.includes(':')) {
                            const [key, ...valueParts] = trimmed.split(':');
                            const value = valueParts.join(':').trim();
                            
                            if (value === '') {
                                // 数组开始
                                currentKey = key.trim();
                                currentArray = [];
                                config[currentKey] = currentArray;
                            } else {
                                // 普通键值对
                                currentKey = key.trim();
                                config[currentKey] = value.replace(/^["']|["']$/g, '');
                                currentArray = null;
                            }
                        } else if (trimmed.startsWith('-') && currentArray) {
                            // 数组项
                            const value = trimmed.substring(1).trim();
                            if (value.includes(':')) {
                                // 对象数组项
                                const [objKey, objValue] = value.split(':').map(s => s.trim());
                                if (!currentArray[currentArray.length - 1]) {
                                    currentArray[currentArray.length - 1] = {};
                                }
                                currentArray[currentArray.length - 1][objKey] = objValue.replace(/^["']|["']$/g, '');
                            } else {
                                // 简单数组项
                                currentArray.push(value.replace(/^["']|["']$/g, ''));
                            }
                        }
                    }
                    
                    return config;
                },

                getDefaultConfigYaml() {
                    return \`${this.getDefaultConfigYaml()}\`;
                },

                formatTime(isoString) {
                    if (!isoString) return '未知';
                    const date = new Date(isoString);
                    return date.toLocaleString('zh-CN');
                }
            }
        }
        `;
	}

	/**
	 * 配置对象转YAML字符串
	 */
	private configToYaml(config: any): string {
		if (!config) return this.getDefaultConfigYaml();

		const lines = [];
		lines.push('# 用户配置');
		lines.push('# 请根据您的需求修改以下配置');
		lines.push('');

		if (config.subscribe) lines.push(`subscribe: "${config.subscribe}"`);
		if (config.accessToken) lines.push(`accessToken: "${config.accessToken}"`);
		if (config.ruleUrl) lines.push(`ruleUrl: "${config.ruleUrl}"`);
		if (config.fileName) lines.push(`fileName: "${config.fileName}"`);

		if (config.multiPortMode && config.multiPortMode.length > 0) {
			lines.push(`multiPortMode:${config.multiPortMode.map((code: string) => `\n  - ${code}`).join('')}`);
		}

		if (config.appendSubList && config.appendSubList.length > 0) {
			lines.push('appendSubList:');
			config.appendSubList.forEach((sub: any) => {
				lines.push(`  - subscribe: "${sub.subscribe}"`);
				lines.push(`    flag: "${sub.flag}"`);
				if (sub.includeArea && sub.includeArea.length > 0) {
					lines.push(`    includeArea:${sub.includeArea.map((code: string) => `\n      - ${code}`).join('')}`);
				}
			});
		}

		if (config.excludeRegex) lines.push(`excludeRegex: "${config.excludeRegex}"`);

		return lines.join('\n');
	}

	/**
	 * 获取默认配置YAML模板
	 */
	private getDefaultConfigYaml(): string {
		return `# 用户配置模板
# 请根据您的需求修改以下配置

# 必需的订阅地址
subscribe: "https://example.com/subscription"

# 必需的访问令牌
accessToken: "your-access-token"

# 可选的规则模板链接
# ruleUrl: "https://example.com/rules"

# 可选的文件名
# fileName: "config.yaml"

# 可选的多端口模式（地区代码）
# multiPortMode:
#   - TW
#   - SG
#   - JP

# 可选的追加订阅列表
# appendSubList:
#   - subscribe: "https://example.com/sub1"
#     flag: "sub1"
#     includeArea:
#       - US
#       - HK
#   - subscribe: "https://example.com/sub2"
#     flag: "sub2"

# 可选的排除正则表达式
# excludeRegex: ".*test.*"`;
	}
}
