"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_config_types_1 = require("../src/types/user-config.types");
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
            // 检查YAML库是否正确加载
            console.log('检查YAML库...');
            if (window.jsyaml) {
                console.log('✓ js-yaml库已加载');
            }
            else if (window.YAML) {
                console.log('✓ YAML库已加载');
            }
            else if (window.yaml) {
                console.log('✓ yaml库已加载');
            }
            else {
                console.error('✗ 未找到YAML库');
            }
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
                    }
                }
                else {
                    console.error('API响应错误:', response.status, response.statusText);
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
                // 尝试解析YAML并使用Zod验证函数
                const config = this.yamlToConfig(yaml);
                const validation = (0, user_config_types_1.validateUserConfig)(config);
                if (!validation.isValid) {
                    this.validationErrors.push(...validation.errors);
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
                // 验证YAML格式和字段
                try {
                    const config = this.yamlToConfig(yaml);
                    const validation = (0, user_config_types_1.validateUserConfig)(config);
                    if (!validation.isValid) {
                        alert(`配置验证失败:\n${validation.errors.join('\n')}`);
                        return;
                    }
                }
                catch (error) {
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
            try {
                // 尝试多种方式访问YAML库
                let yamlLib = null;
                // 方式1: js-yaml库
                if (window.jsyaml) {
                    yamlLib = window.jsyaml;
                }
                // 方式2: 全局YAML对象
                else if (window.YAML) {
                    yamlLib = window.YAML;
                }
                // 方式3: 全局yaml对象
                else if (window.yaml) {
                    yamlLib = window.yaml;
                }
                if (!yamlLib || !yamlLib.dump) {
                    console.error('YAML库未找到或未正确加载');
                    return this.getDefaultConfigYaml();
                }
                // js-yaml使用dump方法而不是stringify
                return yamlLib.dump(config, {
                    indent: 2,
                });
            }
            catch (error) {
                console.error('YAML序列化失败:', error);
                return this.getDefaultConfigYaml();
            }
        },
        yamlToConfig(yaml) {
            try {
                // 尝试多种方式访问YAML库
                let yamlLib = null;
                // 方式1: js-yaml库
                if (window.jsyaml) {
                    yamlLib = window.jsyaml;
                }
                // 方式2: 全局YAML对象
                else if (window.YAML) {
                    yamlLib = window.YAML;
                }
                // 方式3: 全局yaml对象
                else if (window.yaml) {
                    yamlLib = window.yaml;
                }
                if (!yamlLib || !yamlLib.load) {
                    console.error('YAML库未找到或未正确加载');
                    throw new Error('YAML库未正确加载');
                }
                // js-yaml使用load方法而不是parse
                const config = yamlLib.load(yaml);
                return config || { subscribe: '', accessToken: '' };
            }
            catch (error) {
                console.error('YAML解析错误:', error);
                return { subscribe: '', accessToken: '' };
            }
        },
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
