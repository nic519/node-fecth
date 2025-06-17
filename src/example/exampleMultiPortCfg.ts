import { StrategyMultiPort } from '@/module/yamlMerge/strategyMultiPort';

// 测试代码
const ruleContent = `
proxy-providers:
  Airport1:
    type: http
    url: "https://example.com/sub"
    interval: 3600
    path: ./proxies/airport1.yaml
    health-check:
      enable: true
      interval: 300
      url: http://www.gstatic.com/generate_204
`;

const clashContent = `
proxies:
  -
    name: Premium|台湾|IEPL|01
    type: ss
    server: pr3.jym45zffbquawl.com
    port: 3026
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef5630452860.microsoft.com
  -
    name: Premium|台湾|IEPL|02
    type: ss
    server: pr3.jymzffbquawl.com
    port: 3036
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef56302860.m43icrosoft.com
  -
    name: Premium|台湾|IEPL|03
    type: ss
    server: pr3.jymzffbq5uawl.com
    port: 3046
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef563402860.micr4osoft.com
  -
    name: Premium|台湾|IEPL|04
    type: ss
    server: pr53.j4ymzffbquawl.com
    port: 3056
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef546302860.microsoft.com
  -
    name: Premium|新加坡|IEPL|01
    type: ss
    server: pr3.jym5zffbquawl.com
    port: 6606
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef546302860.microsoft.com
  -
    name: Premium|新加坡|IEPL|02
    type: ss
    server: pr3.jymzffbquawl.com
    port: 6607
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef563025860.microsoft.com
  -
    name: Premium|新加坡|IEPL|03
    type: ss
    server: pr3.jymzffbquawl.com
    port: 6608
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef5630245860.microsoft.com
  -
    name: Premium|新加坡|IEPL|04
    type: ss
    server: pr3.jymzffb54quawl.com
    port: 6609
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef54630245860.microsoft.com
  -
    name: Premium|日本|IEPL|01
    type: ss
    server: pr3.jymzffbquawl.com
    port: 4600
    cipher: rc4-md5
    password: RenzheCloudSS
    udp: true
    plugin: obfs
    plugin-opts:
      mode: http
      host: eef5630245860.microsoft.com
`;

// 测试 YamlMultiPortStrategy
const yamlMultiPortStrategy = new StrategyMultiPort(ruleContent, clashContent);
console.log('\nYamlMultiPortStrategy 测试结果:');
console.log(yamlMultiPortStrategy.generate());
