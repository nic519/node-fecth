// 本地测试 fetchRawContent 方法的简化版本
// 模拟 Cloudflare Workers 环境的 fetch 行为

/// 读取远程内容（本地版本，带重试机制）
async function fetchRawContentLocal(url: string, maxRetries: number = 3): Promise<string> {
	console.log(`🌐 开始获取远程内容: ${url} (最大重试次数: ${maxRetries})`);

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		console.log(`🔄 第 ${attempt} 次尝试获取: ${url}`);

		try {
			// 本地环境的 fetch 配置
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

			const response = await fetch(url, {
				headers: {
					'User-Agent': 'clash.meta',
					Accept: 'text/plain, text/yaml, application/x-yaml, */*',
					'Accept-Encoding': 'gzip, deflate, br',
					Connection: 'keep-alive',
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			console.log(`📊 fetchRawContent响应状态: ${response.status} ${response.statusText}`);

			// 记录重要的响应头信息
			const importantHeaders = {
				'content-type': response.headers.get('content-type'),
				'content-length': response.headers.get('content-length'),
				'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
				'cache-control': response.headers.get('cache-control'),
				'last-modified': response.headers.get('last-modified'),
				'cf-ray': response.headers.get('cf-ray'),
				server: response.headers.get('server'),
			};
			console.log(`📊 重要响应头:`, importantHeaders);

			if (!response.ok) {
				const errorText = await response.text().catch(() => '无法读取错误响应');
				console.error(`❌ fetchRawContent失败: ${response.status} ${response.statusText}, 响应内容: ${errorText}`);

				// 对于特定错误码进行重试
				if (shouldRetry(response.status) && attempt < maxRetries) {
					const waitTime = attempt * 2000; // 递增等待时间：2s, 4s, 6s
					console.log(`⏳ 将在 ${waitTime}ms 后重试... (状态码: ${response.status})`);
					await sleep(waitTime);
					continue;
				}

				throw new Error(`Failed to fetch rule content ${url}, status: ${response.status}, text: ${errorText}`);
			}

			const content = await response.text();
			console.log(`✅ 成功获取远程内容，长度: ${content.length}, URL: ${url}, 尝试次数: ${attempt}`);

			return content;
		} catch (error) {
			console.error(`❌ fetchRawContent第 ${attempt} 次尝试发生错误:`, error);
			console.error(`❌ 错误详情: ${error instanceof Error ? error.message : String(error)}`);

			// 如果是网络错误且还有重试机会
			if (attempt < maxRetries && shouldRetryError(error)) {
				const waitTime = attempt * 3000; // 递增等待时间：3s, 6s, 9s
				console.log(`⏳ 网络错误，将在 ${waitTime}ms 后重试...`);
				await sleep(waitTime);
				continue;
			}

			// 最后一次尝试失败，抛出错误
			console.error(`❌ 所有重试尝试均失败，URL: ${url}`);
			throw new Error(
				`Failed to fetch rule content ${url} after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	throw new Error(`Failed to fetch rule content ${url} after ${maxRetries} attempts`);
}

// 判断是否应该重试（基于HTTP状态码）
function shouldRetry(statusCode: number): boolean {
	// 522: Cloudflare connection timeout
	// 524: Cloudflare timeout
	// 502: Bad gateway
	// 503: Service unavailable
	// 504: Gateway timeout
	// 429: Too many requests
	return [522, 524, 502, 503, 504, 429].includes(statusCode);
}

// 判断是否应该重试（基于错误类型）
function shouldRetryError(error: any): boolean {
	if (error instanceof Error) {
		const errorMessage = error.message.toLowerCase();
		return (
			errorMessage.includes('fetch failed') ||
			errorMessage.includes('timeout') ||
			errorMessage.includes('network') ||
			errorMessage.includes('connection') ||
			errorMessage.includes('abort') ||
			errorMessage.includes('aborterror')
		);
	}
	return false;
}

// 睡眠函数
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// 测试函数
async function testFetchRawContent() {
	console.log('🧪 开始本地测试 fetchRawContent 方法\n');

	// 测试URL列表
	const testUrls = [
		// 这个URL会导致522错误，因为与Cloudflare Workers产生循环访问
		'https://node.1024.hair/api/subscription/template/1759313797591',
		// 正常的测试URL
		'https://httpbin.org/delay/2', // 测试超时处理
		'https://example.com' // 简单测试
	];

	for (let i = 0; i < testUrls.length; i++) {
		const url = testUrls[i];
		console.log(`\n--- 测试 ${i + 1}/${testUrls.length}: ${url} ---`);

		try {
			const startTime = Date.now();
			const content = await fetchRawContentLocal(url, 2); // 最多重试2次
			const endTime = Date.now();

			console.log(`✅ 成功获取内容!`);
			console.log(`📏 内容长度: ${content.length} 字符`);
			console.log(`⏱️  耗时: ${endTime - startTime}ms`);

			// 显示内容的前100个字符
			console.log(`📄 内容预览: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
		} catch (error) {
			console.error(`❌ 测试失败:`, error instanceof Error ? error.message : String(error));
		}

		console.log('---\n');
	}
}

// 运行测试
testFetchRawContent().catch(console.error);
