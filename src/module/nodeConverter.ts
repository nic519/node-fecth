// 节点转换器类
import { InnerUser } from '@/module/userManager/innerUserConfig';
import { ROUTE_PATHS } from '@/routes/openapi-routes';
import { CommonUtils } from '@/utils/commonUtils';

export class NodeConverter {
	private innerUser: InnerUser;

	constructor(innerUser: InnerUser) {
		this.innerUser = innerUser;
	}

	convertBySub() {
		// 直接访问innerUser的属性，而不是通过config
		console.log(
			`💾 转换订阅节点: ${JSON.stringify({
				subscribe: this.innerUser.subscribe,
				accessToken: this.innerUser.accessToken,
				ruleUrl: this.innerUser.ruleUrl,
				fileName: this.innerUser.fileName,
			})}`
		);

		try {
			// 优先使用配置中的 subscribe
			if (this.innerUser.subscribe && this.innerUser.subscribe.trim() !== '') {
				return this.convertNodes(this.innerUser.subscribe);
			}

			throw new Error('订阅链接为空');
		} catch (error) {
			console.error('❌ 转换订阅节点失败:', error);
			throw error;
		}
	}

	private convertNodes(nodes: string): any[] {
		const lines = nodes.split('\n').filter((line) => line.trim());
		const convertedNodes: any[] = [];

		for (const line of lines) {
			try {
				if (line.startsWith('vmess://')) {
					const vmessNode = this.parseVmess(line);
					if (vmessNode) {
						convertedNodes.push(vmessNode);
					}
				} else if (line.startsWith('ss://')) {
					const ssNode = this.parseShadowsocks(line);
					if (ssNode) {
						convertedNodes.push(ssNode);
					}
				} else if (line.startsWith('trojan://')) {
					const trojanNode = this.parseTrojan(line);
					if (trojanNode) {
						convertedNodes.push(trojanNode);
					}
				} else {
					console.warn(`⚠️ 不支持的节点协议: ${line.substring(0, 20)}...`);
				}
			} catch (error) {
				console.error(`❌ 解析节点失败 ${line.substring(0, 20)}...:`, error);
			}
		}

		return convertedNodes;
	}

	private parseVmess(vmessUrl: string): any | null {
		try {
			const vmessData = vmessUrl.replace('vmess://', '');
			const decoded = atob(vmessData);
			const config = JSON.parse(decoded);

			return {
				name: config.ps || 'VMess节点',
				type: 'vmess',
				server: config.add,
				port: parseInt(config.port),
				uuid: config.id,
				alterId: parseInt(config.aid) || 0,
				cipher: 'auto',
				network: config.net || 'tcp',
				tls: config.tls === 'tls' || config.tls === true,
				'skip-cert-verify': true,
			};
		} catch (error) {
			console.error('❌ 解析VMess节点失败:', error);
			return null;
		}
	}

	private parseShadowsocks(ssUrl: string): any | null {
		try {
			// 移除 ss:// 前缀
			var fakeURL = new URL(ROUTE_PATHS.storage, CommonUtils.getProdURI());
			const url = new URL(ssUrl.replace('ss://', 'http://'));

			// 解析用户信息部分
			const userInfo = atob(url.username);
			const [cipher, password] = userInfo.split(':');

			return {
				name: decodeURIComponent(url.hash.slice(1)) || 'SS节点',
				type: 'ss',
				server: url.hostname,
				port: parseInt(url.port),
				cipher: cipher,
				password: password,
				'skip-cert-verify': true,
			};
		} catch (error) {
			console.error('❌ 解析Shadowsocks节点失败:', error);
			return null;
		}
	}

	private parseTrojan(trojanUrl: string): any | null {
		try {
			const url = new URL(trojanUrl);

			return {
				name: decodeURIComponent(url.hash.slice(1)) || 'Trojan节点',
				type: 'trojan',
				server: url.hostname,
				port: parseInt(url.port),
				password: url.username,
				'skip-cert-verify': true,
			};
		} catch (error) {
			console.error('❌ 解析Trojan节点失败:', error);
			return null;
		}
	}
}
