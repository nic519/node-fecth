/**
 * ===================================================================
 * 🛠️ 路径解析器
 * ===================================================================
 */

import * as path from 'path';
import type { ApiGeneratorConfig, IPathResolver } from '../core/types';

/**
 * 路径解析器实现
 * 负责解析和管理所有相关路径
 */
export class PathResolver implements IPathResolver {
	/**
	 * 解析所有相关路径
	 */
	resolvePaths(serverUrl?: string): ApiGeneratorConfig {
		const outputDir = path.join(process.cwd(), 'frontend', 'src', 'generated');
		const clientPath = path.join(outputDir, 'api-client.g.ts');
		const adaptersPath = path.join(outputDir, 'api-adapters.g.ts');
		const tempOpenapiPath = path.join(process.cwd(), '.temp-openapi.g.json');
		const apiBaseUrl = 'http://localhost:3000/api';
		const resolvedServerUrl = serverUrl || 'http://localhost:8787';

		return {
			serverUrl: resolvedServerUrl,
			outputDir,
			apiBaseUrl,
			clientPath,
			adaptersPath,
			tempOpenapiPath,
		};
	}
}
