-- 用户表：存储用户配置和访问令牌
CREATE TABLE `dynamic` (
	`id` text PRIMARY KEY NOT NULL, -- 动态信息唯一ID（是url的md5值）
	`url` text NOT NULL, -- 订阅地址
	`content` text NOT NULL, -- 订阅内容
	`traffic` text, -- 流量剩余情况；格式: upload=123456; download=789012; total=21474836480; expire=1640995200；clash格式会有此值
	`status` text NOT NULL, -- 更新状态，SUCCESS 或 ERROR
	`msg` text, -- 补充信息，如status=ERROR 的时候，错误的原因
	`created_at` text DEFAULT (datetime('now')) NOT NULL, -- 创建时间
	`updated_at` text DEFAULT (datetime('now')) NOT NULL -- 最近更新时间
);
