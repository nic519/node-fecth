## 安全解析订阅

背景：
clash/sing-box等工具，优势就是他们的分组策略，可以做得很灵活，所以我使用他们的方式是：
- 仅使用机场的节点，而不使用他们的分组策略
- 自己写分组策略，使用类似 https://sub.dler.io 的订阅转换器合成自己的规则与节点

❌ 以上方式，缺点是：
1. 节点可能泄露
2. 这种方式更新回来的内容，有时会因为某环节网络问题，导致回来的配置有问题而影响上网

✔ 本项目解决的问题：
1. 当把节点给 sub.dler.io 这类转换器的时候，会生成随机的、无效的节点去转换，等转换回来后，再用真实的节点去替换
2. 当把最终结果返回给客户端的时候，会对结果进行校验，通过才会下发，否则status code 返回 500，避免在自动更新订阅的场景，无效节点下发到客户端而影响上网的问题

## 本地调试
```bash
yarn start

```

## 部署
```bash
yarn run deploy
```

在worker里面需要设置json环境变量：

key为`DB_USER`，value为json，格式如下：
```yaml
519
	accessToken: "d2fs1s12f3"
	fileName: "配置名称"
	subscribe: "https://xxx.xxx/xxx"
```
在前端的访问地址是：https://worker域名/519?token=d2fs1s12f3

每个key，代表一个配置，其中配置可以填这些值：
- accessToken: 访问token，用于验证请求，自己随机生成就好
- fileName: 配置名称，用于在客户端显示
- subscribe: 机场订阅链接
- ruleUrl（可选）: 分流规则 