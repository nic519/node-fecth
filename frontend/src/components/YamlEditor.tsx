import Editor from '@monaco-editor/react';
import * as yaml from 'js-yaml';
import * as monaco from 'monaco-editor';
import { useRef } from 'react';
import { parse } from 'yaml';

interface YamlEditorProps {
	value: string;
	onChange: (value: string) => void;
	height?: string | number;
	theme?: 'light' | 'dark' | 'vs-dark';
	readOnly?: boolean;
	onValidate?: (errors: string[]) => void;
}

export function YamlEditor({ value, onChange, height = '500px', theme = 'light', readOnly = false, onValidate }: YamlEditorProps) {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

	const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
		editorRef.current = editor;

		// 设置自定义 YAML 语法高亮
		monaco.languages.registerDocumentFormattingEditProvider('yaml', {
			provideDocumentFormattingEdits: (model: any) => {
				try {
					const parsed = parse(model.getValue());
					const formatted = yaml.dump(parsed, {
						indent: 2,
						noRefs: true,
						sortKeys: false,
						lineWidth: 120,
					});
					return [
						{
							range: model.getFullModelRange(),
							text: formatted,
						},
					];
				} catch (e) {
					return [];
				}
			},
		});

		// 添加自动补全
		monaco.languages.registerCompletionItemProvider('yaml', {
			provideCompletionItems: (model: any, position: any) => {
				const suggestions = [
					{
						label: 'port',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: 'port: ${1:7890}',
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: 'HTTP 代理端口',
					},
					{
						label: 'socks-port',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: 'socks-port: ${1:7891}',
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: 'SOCKS 代理端口',
					},
					{
						label: 'mode',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: 'mode: ${1:rule}',
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: '运行模式：rule/global/direct/script',
					},
					{
						label: 'log-level',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: 'log-level: ${1:info}',
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: '日志级别：silent/error/warning/info/debug',
					},
					{
						label: 'allow-lan',
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: 'allow-lan: ${1:false}',
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: '是否允许局域网连接',
					},
					{
						label: 'proxy-groups',
						kind: monaco.languages.CompletionItemKind.Snippet,
						insertText: [
							'proxy-groups:',
							'  - name: "${1:🚀 节点选择}"',
							'    type: ${2:select}',
							'    proxies:',
							'      - ${3:DIRECT}',
						].join('\n'),
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: '代理组配置',
					},
					{
						label: 'rules',
						kind: monaco.languages.CompletionItemKind.Snippet,
						insertText: ['rules:', '  - ${1:DOMAIN-SUFFIX},${2:example.com},${3:DIRECT}', '  - MATCH,${4:🚀 节点选择}'].join('\n'),
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: '规则配置',
					},
					{
						label: 'dns',
						kind: monaco.languages.CompletionItemKind.Snippet,
						insertText: [
							'dns:',
							'  enable: ${1:true}',
							'  ipv6: ${2:false}',
							'  listen: 0.0.0.0:53',
							'  enhanced-mode: ${3:fake-ip}',
							'  nameserver:',
							'    - ${4:114.114.114.114}',
							'    - ${5:8.8.8.8}',
						].join('\n'),
						insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
						documentation: 'DNS 配置',
					},
				];
				return { suggestions };
			},
		});

		// 添加快捷键
		editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
			// Ctrl/Cmd + S 保存
			editor.trigger('save', 'editor.action.formatDocument', {});
		});

		// 验证 YAML 语法
		if (onValidate) {
			const validateYaml = () => {
				const content = editor.getValue();
				const errors: string[] = [];

				try {
					parse(content);
					onValidate([]);

					// 清除之前的错误标记
					monaco.editor.setModelMarkers(editor.getModel()!, 'yaml', []);
				} catch (e: any) {
					if (e.message) {
						errors.push(e.message);

						// 在编辑器中标记错误位置
						const lineMatch = e.message.match(/line (\d+)/i);
						if (lineMatch) {
							const line = parseInt(lineMatch[1]) - 1;
							monaco.editor.setModelMarkers(editor.getModel()!, 'yaml', [
								{
									severity: monaco.MarkerSeverity.Error,
									message: e.message,
									startLineNumber: line,
									startColumn: 1,
									endLineNumber: line,
									endColumn: 1000,
								},
							]);
						}
					}
					onValidate(errors);
				}
			};

			// 初始验证
			validateYaml();

			// 内容变化时验证
			editor.onDidChangeModelContent(validateYaml);
		}
	};

	const formatYaml = () => {
		if (editorRef.current) {
			editorRef.current.getAction('editor.action.formatDocument')?.run();
		}
	};

	return (
		<div className="relative border border-gray-300 rounded-lg overflow-hidden">
			<Editor
				height={height}
				language="yaml"
				value={value}
				onChange={(value) => onChange(value || '')}
				theme={theme === 'dark' ? 'vs-dark' : 'vs'}
				options={{
					readOnly,
					minimap: { enabled: false },
					scrollBeyondLastLine: false,
					fontSize: 14,
					fontFamily: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
					lineNumbers: 'on',
					renderLineHighlight: 'line',
					selectOnLineNumbers: true,
					automaticLayout: true,
					wordWrap: 'on',
					wordWrapColumn: 120,
					folding: true,
					foldingStrategy: 'indentation',
					showFoldingControls: 'always',
					bracketPairColorization: { enabled: true },
					guides: {
						bracketPairs: true,
						indentation: true,
					},
					suggest: {
						showKeywords: true,
						showSnippets: true,
					},
					quickSuggestions: true,
					suggestOnTriggerCharacters: true,
					acceptSuggestionOnEnter: 'on',
					tabSize: 2,
					detectIndentation: false,
				}}
				onMount={handleEditorDidMount}
			/>

			{/* 工具栏 */}
			<div className="absolute top-2 right-2 flex gap-2">
				<button
					onClick={formatYaml}
					className="px-3 py-1 text-xs bg-white/90 backdrop-blur-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-sm"
					title="格式化文档 (Ctrl/Cmd + S)"
				>
					格式化
				</button>
			</div>
		</div>
	);
}
