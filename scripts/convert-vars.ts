import * as fs from 'fs';
import * as path from 'path';

// 读取 .dev.user.vars 文件
const userVarsPath: string = path.join(__dirname, '..', '.dev.user.vars');
const devVarsPath: string = path.join(__dirname, '..', '.dev.vars');

try {
	// 读取 .dev.user.vars 文件内容
	const userVarsContent: string = fs.readFileSync(userVarsPath, 'utf8');

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
