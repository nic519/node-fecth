import { UserConfig } from '@/types/openapi-schemas';
import * as fs from 'fs';
import * as path from 'path';
import { parse as yamlParse } from 'yaml';

// 读取 .dev.user.vars 文件
const userVarsPath: string = path.join(__dirname, '..', '.dev.users.yaml');
const devVarsPath: string = path.join(__dirname, '..', '.dev.vars');

// 输出所有用户的订阅链接
function printLink(yamlContent: string) {
	const yamlObj = yamlParse(yamlContent) as Record<string, UserConfig>;
	for (const userId in yamlObj) {
		console.log(`http://localhost:8787/${userId}?token=${yamlObj[userId].accessToken}&download=false`);
	}
}

try {
	if (fs.existsSync(userVarsPath) == false) {
		// 在mac才需要执行这个脚本
		process.exit(1);
	}

	// 读取 .dev.user.vars 文件内容
	const userVarsContent: string = fs.readFileSync(userVarsPath, 'utf8');
	printLink(userVarsContent);

	// 将 YAML 内容转换为字符串格式，只处理换行符
	const stringifiedContent: string = userVarsContent
		.replace(/"/g, '\\"') // 转义双引号
		.replace(/\n/g, '\\n'); // 转义换行符

	// 创建新的 .dev.vars 内容
	const devVarsContent: string = `DB_USER: "${stringifiedContent}"`;

	// 写入 .dev.vars 文件
	fs.writeFileSync(devVarsPath, devVarsContent);

	console.log('Successfully converted .dev.user.vars to .dev.vars');
} catch (error) {
	console.error('Error during conversion:', error);
	process.exit(1);
}
