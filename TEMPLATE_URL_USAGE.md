# 模板URL使用说明

## 功能介绍

现在每个配置模板都有一个专属的URL，可以直接用于访问或分享模板配置。

## 如何获取URL

### 方法一：在模板列表中
1. 打开模板管理页面：`http://localhost:3000/admin/templates?superToken=123`
2. 在左侧模板列表中，每个模板右侧都有一个链接图标（🔗）
3. 点击链接图标即可复制该模板的URL到剪贴板
4. 复制成功后，图标会短暂变成绿色对勾（✓）

### 方法二：在编辑器中
1. 选择任意模板进行查看或编辑
2. 在编辑器下方的操作按钮区域，点击"复制URL"按钮
3. URL会自动复制到剪贴板

## URL格式

模板的URL格式为：
```
http://localhost:8787/api/subscription/template/{templateId}
```

这个URL会直接返回模板的YAML配置内容。

## 使用场景

1. **直接访问**：在浏览器中打开URL查看配置内容
2. **下载配置**：添加参数 `?download=true` 直接下载文件
3. **自定义文件名**：使用 `?filename=my-config.yaml` 指定文件名
4. **分享给他人**：将URL分享给需要使用该配置的人

## 示例

```bash
# 在浏览器中查看
curl "http://localhost:8787/api/subscription/template/1759231338395"

# 下载配置文件
curl -O "http://localhost:8787/api/subscription/template/1759231338395?download=true"

# 指定文件名下载
curl -o "clash-config.yaml" "http://localhost:8787/api/subscription/template/1759231338395?download=true&filename=clash-config.yaml"
```

## 注意事项

- URL不需要认证，任何人都可以访问
- URL返回的是模板的静态内容，不包含动态代理节点
- 管理员Token仅在复制URL时需要，实际使用URL时不需要