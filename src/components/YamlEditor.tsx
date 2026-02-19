/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import yaml from 'js-yaml';
import { useTheme } from 'next-themes';

interface YamlEditorProps {
	value: string;
	onChange: (value: string) => void;
	height?: string | number;
	theme?: 'light' | 'dark' | 'vs-dark';
	readOnly?: boolean;
	onValidate?: (errors: string[]) => void;
}

export function YamlEditor({ value, onChange, height = '500px', theme, readOnly = false, onValidate }: YamlEditorProps) {
	const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const { resolvedTheme } = useTheme();

	const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: any) => {
		editorRef.current = editor;

		// 添加自动补全
		monaco.languages.registerCompletionItemProvider('yaml', {
			provideCompletionItems: () => {
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

		// 验证 YAML 语法
		if (onValidate) {
			const validateYaml = () => {
				const content = editor.getValue();
				const errors: string[] = [];

				try {
					yaml.load(content);
					onValidate([]);

					// 清除之前的错误标记
					monaco.editor.setModelMarkers(editor.getModel()!, 'yaml', []);
				} catch (e: any) {
					if (e.message) {
						errors.push(e.message);

						// 在编辑器中标记错误位置
						const lineMatch = e.message.match(/line (\d+)/i);
						if (lineMatch) {
							const line = parseInt(lineMatch[1]);
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

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen);
	};

	// 监听 ESC 键退出全屏，并阻止 body 滚动
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isFullscreen) {
				setIsFullscreen(false);
			}
		};

		if (isFullscreen) {
			window.addEventListener('keydown', handleEscape);
			// 禁止背景滚动
			document.body.style.overflow = 'hidden';
			return () => {
				window.removeEventListener('keydown', handleEscape);
				document.body.style.overflow = '';
			};
		}
	}, [isFullscreen]);

	const isDarkMode = (theme && (theme === 'dark' || theme === 'vs-dark')) || (!theme && resolvedTheme === 'dark');
	const monacoTheme = isDarkMode ? 'vs-dark' : 'vs';

	// 渲染编辑器内容
	const renderEditor = (isFullscreenMode: boolean) => (
		<>
			<Editor
				height={isFullscreenMode ? '100vh' : height}
				language="yaml"
				value={value}
				onChange={(value) => onChange(value || '')}
				theme={monacoTheme}
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

			<div className={`absolute flex gap-2 z-[100] ${isFullscreenMode ? 'top-4 right-4' : 'top-2 right-6'}`}>
				<button
					onClick={toggleFullscreen}
					className={`flex items-center justify-center backdrop-blur-sm border rounded transition-all ${isFullscreenMode
							? 'w-10 h-10 bg-background/95 border-border/70 shadow-lg hover:bg-accent hover:shadow-xl text-foreground'
							: 'px-3 py-1 text-xs bg-background/90 border-border/60 shadow-sm hover:bg-accent text-foreground'
						}`}
					title={isFullscreenMode ? '退出全屏 (Esc)' : '全屏编辑'}
				>
					{isFullscreenMode ? (
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					) : (
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
							/>
						</svg>
					)}
				</button>
			</div>
		</>
	);

	return (
		<>
			{!isFullscreen && (
				<div className="relative border border-border/60 rounded-lg overflow-hidden h-full bg-background">
					{renderEditor(false)}
				</div>
			)}

			{isFullscreen &&
				createPortal(
					<div
						className="fixed inset-0 w-screen h-screen bg-background overflow-hidden"
						style={{ zIndex: 9999, margin: 0, padding: 0 }}
					>
						{renderEditor(true)}
					</div>,
					document.body,
				)}
		</>
	);
}
