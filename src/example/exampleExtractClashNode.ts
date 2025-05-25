import { ExtractClashNode, OutputFormat } from '../module/extractClashNode';

// 示例Clash配置内容
const sampleClashConfig = `
proxies:
  - name: "🇭🇰 香港01"
    type: ss
    server: iq6dsbz.icfjlk.xyz
    port: 40662
    cipher: aes-128-gcm
    password: 311f049f-3f4f-48af-a0ec-20995588d723

  - name: "🇭🇰 香港02"
    type: ss
    server: 986yn1v.icfjlk.xyz
    port: 40097
    cipher: aes-128-gcm
    password: 311f049f-3f4f-48af-a0ec-20995588d723

  - name: "🇭🇰 香港Trojan"
    type: trojan
    server: 420mco4.icfjlk.xyz
    port: 40269
    password: 311f049f-3f4f-48af-a0ec-20995588d723
    skip-cert-verify: true
    sni: i0.hdslb.com

  - name: "🇸🇬 新加坡01"
    type: ss
    server: goh8x3new.bigmeyear.org
    port: 46151
    cipher: aes-128-gcm
    password: 311f049f-3f4f-48af-a0ec-20995588d723
`;

// 创建ExtractClashNode实例
const extractor = new ExtractClashNode();

console.log('=== 使用示例 ===\n');

// 1. 获取JSON格式（默认）
console.log('1. JSON格式输出:');
console.log(extractor.getNodes(sampleClashConfig, OutputFormat.JSON));
console.log('\n');

// 2. 获取简单格式
console.log('2. 简单格式输出:');
console.log(extractor.getNodes(sampleClashConfig, OutputFormat.SIMPLE));
console.log('\n');

// 3. 获取原始代理链接格式（您要求的格式）
console.log('3. 原始代理链接格式输出:');
console.log(extractor.getNodes(sampleClashConfig, OutputFormat.ORIGINAL_LINKS));
console.log('\n');

// 4. 使用便捷方法获取原始链接
console.log('4. 使用便捷方法获取原始链接:');
console.log(extractor.getOriginalLinks(sampleClashConfig));
console.log('\n');

// 5. 按类型筛选并获取原始链接
console.log('5. 只获取SS类型的原始链接:');
console.log(extractor.getNodesByType(sampleClashConfig, 'ss', OutputFormat.ORIGINAL_LINKS));
console.log('\n');

// 6. 按关键词筛选并获取原始链接
console.log('6. 只获取包含"香港"的节点原始链接:');
console.log(extractor.getNodesByKeyword(sampleClashConfig, '香港', OutputFormat.ORIGINAL_LINKS));
console.log('\n');
