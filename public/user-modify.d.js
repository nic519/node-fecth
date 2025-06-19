"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        userId: '',
        init() {
            this.userId = window.location.pathname.split('/')[2] || '';
            console.log('userId', this.userId);
            this.initSimpleEditor();
            this.loadConfig();
        },
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
                getModel: () => ({
                    getLineCount: () => editorElement.value.split('\n').length,
                }),
            };
            editorElement.value = this.getDefaultConfigYaml();
            editorElement.addEventListener('input', () => {
                this.updatePreview();
            });
            this.updatePreview();
        },
        async loadConfig() {
            try {
                const token = new URLSearchParams(window.location.search).get('token');
                const response = await fetch(`/api/config/users/${this.userId}?token=${token}`);
                if (response.ok) {
                    const data = await response.json();
                    this.lastModified = data.meta.lastModified;
                    this.configSource = data.meta.source;
                    this.connectionStatus = 'connected';
                    if (this.editor) {
                        const yaml = this.configToYaml(data.config);
                        this.editor.setValue(yaml);
                    }
                }
                else {
                    this.connectionStatus = 'error';
                }
            }
            catch (error) {
                console.error('加载配置失败:', error);
                this.connectionStatus = 'error';
            }
        },
        updatePreview() {
            if (!this.editor)
                return;
            const yaml = this.editor.getValue();
            this.configPreview = yaml;
            this.validateConfig(yaml);
        },
        validateConfig(yaml) {
            this.validationErrors = [];
            try {
                // 基本的YAML语法检查
                const lines = yaml.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line || line.startsWith('#'))
                        continue;
                    // 检查缩进
                    const currentIndent = lines[i].length - lines[i].trimStart().length;
                    if (currentIndent % 2 !== 0) {
                        this.validationErrors.push(`第${i + 1}行: 缩进错误`);
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
                    }
                    catch {
                        this.validationErrors.push('subscribe 字段不是有效的URL');
                    }
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : '未知错误';
                this.validationErrors.push(`YAML解析错误: ${errorMessage}`);
            }
        },
        async saveConfig() {
            if (this.validationErrors.length > 0) {
                alert('配置有错误，请先修复后再保存');
                return;
            }
            this.saving = true;
            try {
                const yaml = this.editor?.getValue() || '';
                const config = this.yamlToConfig(yaml);
                const token = new URLSearchParams(window.location.search).get('token');
                const response = await fetch(`/api/config/users/${this.userId}?token=${token}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ config }),
                });
                if (response.ok) {
                    this.lastSaved = new Date().toISOString();
                    this.configSource = 'kv';
                    this.connectionStatus = 'connected';
                    alert('配置保存成功！');
                }
                else {
                    const error = await response.text();
                    alert(`保存失败: ${error}`);
                }
            }
            catch (error) {
                console.error('保存配置失败:', error);
                alert('保存失败，请检查网络连接');
            }
            finally {
                this.saving = false;
            }
        },
        resetConfig() {
            if (confirm('确定要重置配置吗？这将丢失所有未保存的更改。')) {
                this.editor?.setValue(this.getDefaultConfigYaml());
            }
        },
        configToYaml(config) {
            if (!config)
                return this.getDefaultConfigYaml();
            const lines = [];
            lines.push('# 用户配置');
            lines.push('# 请根据您的需求修改以下配置');
            lines.push('');
            if (config.subscribe)
                lines.push(`subscribe: "${config.subscribe}"`);
            if (config.accessToken)
                lines.push(`accessToken: "${config.accessToken}"`);
            if (config.ruleUrl)
                lines.push(`ruleUrl: "${config.ruleUrl}"`);
            if (config.fileName)
                lines.push(`fileName: "${config.fileName}"`);
            if (config.multiPortMode && config.multiPortMode.length > 0) {
                lines.push(`multiPortMode:${config.multiPortMode.map((code) => `\n  - ${code}`).join('')}`);
            }
            if (config.appendSubList && config.appendSubList.length > 0) {
                lines.push('appendSubList:');
                config.appendSubList.forEach((sub) => {
                    lines.push(`  - subscribe: "${sub.subscribe}"`);
                    lines.push(`    flag: "${sub.flag}"`);
                    if (sub.includeArea && sub.includeArea.length > 0) {
                        lines.push(`    includeArea:${sub.includeArea.map((code) => `\n      - ${code}`).join('')}`);
                    }
                });
            }
            if (config.excludeRegex)
                lines.push(`excludeRegex: "${config.excludeRegex}"`);
            return lines.join('\n');
        },
        yamlToConfig(yaml) {
            const lines = yaml.split('\n');
            const config = { subscribe: '', accessToken: '' };
            let currentKey = null;
            let currentArray = null;
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#'))
                    continue;
                if (trimmed.includes(':')) {
                    const [key, ...valueParts] = trimmed.split(':');
                    const value = valueParts.join(':').trim();
                    if (value === '') {
                        // 数组开始
                        currentKey = key.trim();
                        currentArray = [];
                        config[currentKey] = currentArray;
                    }
                    else {
                        // 普通键值对
                        currentKey = key.trim();
                        config[currentKey] = value.replace(/^["']|["']$/g, '');
                        currentArray = null;
                    }
                }
                else if (trimmed.startsWith('-') && currentArray) {
                    // 数组项
                    const value = trimmed.substring(1).trim();
                    if (value.includes(':')) {
                        // 对象数组项
                        const [objKey, objValue] = value.split(':').map((s) => s.trim());
                        if (!currentArray[currentArray.length - 1]) {
                            currentArray[currentArray.length - 1] = {};
                        }
                        currentArray[currentArray.length - 1][objKey] = objValue.replace(/^["']|["']$/g, '');
                    }
                    else {
                        // 简单数组项
                        currentArray.push(value.replace(/^["']|["']$/g, ''));
                    }
                }
            }
            return config;
        },
        getDefaultConfigYaml() {
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
        },
        formatTime(isoString) {
            if (!isoString)
                return '未知';
            const date = new Date(isoString);
            return date.toLocaleString('zh-CN');
        },
    };
}
// 导出函数供全局使用
window.configManager = configManager;
