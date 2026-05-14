import { compileVisualTemplate } from './compiler';
import { normalizeVisualTemplateModel } from './normalizer';
import type { VisualTemplateModel } from './types';

const MODEL_PREFIX = '# visual-v1:model:';
const MODEL_END = '# visual-v1:end';

export function wrapVisualModelContent(model: VisualTemplateModel): string {
	const encoded = encodeBase64(JSON.stringify(model));
	return [`${MODEL_PREFIX}${encoded}`, MODEL_END, compileVisualTemplate(model)].join('\n');
}

export function extractVisualModelFromContent(content: string): VisualTemplateModel | null {
	const lines = content.split('\n');
	const start = lines.findIndex((line) => line.trim().startsWith(MODEL_PREFIX));
	if (start === -1) return null;

	const inlineEncoded = lines[start]?.trim().slice(MODEL_PREFIX.length).trim() ?? '';
	const end = lines.findIndex((line, index) => index > start && line.trim() === MODEL_END);
	const encoded = inlineEncoded || (end === -1 ? '' : lines.slice(start + 1, end).join('').trim());

	if (!encoded) return null;

	try {
		return normalizeVisualTemplateModel(JSON.parse(decodeBase64(encoded)));
	} catch {
		return null;
	}
}

export function normalizeVisualTemplateContent(content: string): string {
	const model = extractVisualModelFromContent(content);
	if (!model) return content;

	const lines = content.split('\n');
	const hasLegacyBodyLine = lines.some((line) => line.trim() === MODEL_PREFIX);
	return hasLegacyBodyLine ? wrapVisualModelContent(model) : content;
}

export function stripVisualModelMetadata(content: string): string {
	const lines = content.split('\n');
	const start = lines.findIndex((line) => line.trim().startsWith(MODEL_PREFIX));
	if (start === -1) return content;

	const end = lines.findIndex((line, index) => index > start && line.trim() === MODEL_END);
	if (end === -1) return content;

	return lines.slice(end + 1).join('\n').replace(/^\n/, '');
}

export function isVisualTemplateContent(content: string): boolean {
	return extractVisualModelFromContent(content) !== null;
}

function encodeBase64(value: string): string {
	if (typeof btoa === 'function') {
		return btoa(encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16))));
	}

	return globalThis.Buffer.from(value, 'utf8').toString('base64');
}

function decodeBase64(value: string): string {
	if (typeof atob === 'function') {
		const binary = atob(value);
		const percentEncoded = Array.from(binary, (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('');
		return decodeURIComponent(percentEncoded);
	}

	return globalThis.Buffer.from(value, 'base64').toString('utf8');
}
