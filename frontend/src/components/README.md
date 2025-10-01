# 复制按钮组件

## CopyButton

用于复制静态文本的按钮组件。

### 使用示例

```tsx
import { CopyButton } from '@/components/CopyButton';

// 基本使用
<CopyButton text="要复制的文本">
  复制文本
</CopyButton>

// 自定义样式和回调
<CopyButton
  text="https://example.com"
  successText="已复制链接！"
  color="success"
  size="sm"
  onSuccess={() => console.log('复制成功')}
  onError={(error) => console.error('复制失败:', error)}
>
  复制链接
</CopyButton>
```

## AsyncCopyButton

用于复制异步获取的文本的按钮组件。

### 使用示例

```tsx
import { AsyncCopyButton } from '@/components/AsyncCopyButton';

// 异步获取URL并复制
<AsyncCopyButton
	getText={async () => {
		const response = await fetch('/api/get-url');
		const data = await response.json();
		return data.url;
	}}
	startContent={<LinkIcon className="w-4 h-4" />}
>
	复制URL
</AsyncCopyButton>;
```

## 属性说明

### CopyButton 属性

- `text`: 要复制的文本内容
- `children`: 按钮显示的文本（默认：'复制'）
- `successText`: 复制成功时显示的文本（默认：'已复制！'）
- `onError`: 复制失败时的回调
- `onSuccess`: 复制成功时的回调
- `className`: 按钮的样式类名
- `color`: 按钮颜色
- `variant`: 按钮变体
- `size`: 按钮大小
- `disabled`: 是否禁用
- `startContent`: 开始图标
- `endContent`: 结束图标

### AsyncCopyButton 属性

- `getText`: 异步获取要复制的文本内容的函数
- 其他属性与 CopyButton 相同

