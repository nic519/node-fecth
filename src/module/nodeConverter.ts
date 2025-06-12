// 节点转换器类
import { parse as yamlParse } from 'yaml';
import { Base64Utils } from '@/utils/base64Utils';
import { RoutesPathConfig } from '@/config/routesPathConfig';
import { getDevConfig } from '@/config/dev-config';
import { CommonUtils } from '@/utils/commonUtils';

/// 把真实的节点列表，替换成假的节点列表，并且生成URL
export class NodeConverter {
	// 把真实的节点列表，通过转换，生成假节点
	private generateFakeNodes(realNodes: string[]): string[] {
		// 生成一个随机域名
		const randomString = Math.random().toString(36).substring(2, 7);
		const randomUrl = `${randomString}.io`;

		return realNodes.map((node) => {
			const subDomain = Math.random().toString(36).substring(2, 7);
			// 使用正则提取域名和端口
			const realDomain = this.extractDomain(node);
			if (!realDomain) return node; // 如果没有匹配到域名，返回原始节点
			const fakeDomain = `${subDomain}.${randomUrl}`;
			// console.log(`fakeNode: ${node.replace(realDomain, fakeDomain)}`);
			return node.replace(realDomain, fakeDomain);
		});
	}

	// 在节点信息中提取域名
	private extractDomain(node: string): string {
		// 从原始节点信息中，提取域名
		const domain = node.match(/(?<=@).*?(?=:)/)?.[0];
		if (!domain) return node; // 如果没有匹配到域名，返回原始节点
		return domain;
	}

	// 把订阅地址的响应结果，用base64的方式转成可读的文本
	private getProxiesByRaw(base64Text: string): string[] {
		const text = Base64Utils.base64ToUtf8(base64Text);
		// 处理不同操作系统的换行符，并过滤空行
		const proxies = text.split(/\r?\n/).filter((line) => line.trim() !== '');
		return proxies;
	}

	// 从订阅地址，获取真实的节点列表
	private async getRealNodes(subUrl: string): Promise<{ nodes: string[]; subInfo: string }> {
		// 并发执行两个fetch请求
		const [responseRaw, responseClash] = await Promise.all([
			fetch(subUrl),
			fetch(subUrl, {
				headers: {
					'User-Agent': 'clash 1.10.0',
				},
			}),
		]);

		const subInfo = responseClash.headers.get('subscription-userinfo') || '';
		const textRaw = await responseRaw.text();
		const proxies = this.getProxiesByRaw(textRaw);

		return {
			nodes: proxies,
			subInfo: subInfo,
		};
	}

	// 替换回真实节点
	private replaceWithRealNodes(convertedConfig: string, fakeNodes: string[], realNodes: string[]): string {
		let result = convertedConfig;
		fakeNodes.forEach((fakeNode, index) => {
			if (realNodes[index]) {
				const realDomain = this.extractDomain(realNodes[index]);
				const fakeDomain = this.extractDomain(fakeNode);
				if (result.includes(fakeDomain)) {
					result = result.replace(fakeDomain, realDomain);
				}
			}
		});
		return result;
	}

	/// 把假节点，“塞”入一个可供其他网站访问的链接
	private buildFakeSubUrl(fakeNodes: string[]): string {
		const fakeContent = Base64Utils.utf8ToBase64(fakeNodes.join('\n'));
		var fakeURL = new URL(RoutesPathConfig.storage, CommonUtils.getProdURI());
		fakeURL.searchParams.set('v', fakeContent);
		// console.log(`fakeSubUrl: ${fakeSubUrl}`);
		return fakeURL.toString();
	}

	// 获取订阅信息
	public async convert(
		request: Request,
		subUrl: string,
		convertUrl: string,
		userAgent: string
	): Promise<{
		text: string;
		headers: { [key: string]: string };
	}> {
		try {
			const { nodes: realNodes, subInfo: realSubInfo } = await this.getRealNodes(subUrl);
			const fakeNodes = this.generateFakeNodes(realNodes);
			const fakeSubUrl = this.buildFakeSubUrl(fakeNodes);

			const convertUrlObj = new URL(convertUrl);
			const params = new URLSearchParams(convertUrlObj.search);
			params.set('url', fakeSubUrl);
			convertUrlObj.search = params.toString();

			// console.log(`Convert URL: ${convertUrlObj.toString()}`);
			const response = await fetch(convertUrlObj.toString(), {
				headers: {
					'User-Agent': userAgent,
					Accept: '*/*',
				},
			});

			let text = await response.text();
			text = this.replaceWithRealNodes(text, fakeNodes, realNodes);
			//console.log(`realHeaders: ${JSON.stringify(realHeaders)}`);
			return { text, headers: { 'subscription-userinfo': realSubInfo } };
		} catch (error) {
			console.error('Node conversion error:', error);
			throw error;
		}
	}
}
