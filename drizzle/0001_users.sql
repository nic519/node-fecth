-- 用户表：存储用户配置和访问令牌
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL, -- 用户唯一ID
	`config` text NOT NULL, -- 用户配置JSON或序列化内容
	`access_token` text NOT NULL, -- 访问外部服务所需令牌
	`created_at` text DEFAULT (datetime('now')) NOT NULL, -- 创建时间
	`updated_at` text DEFAULT (datetime('now')) NOT NULL -- 最近更新时间
);
