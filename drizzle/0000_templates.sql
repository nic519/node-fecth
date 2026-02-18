-- 模板表：存储可复用的文本模板
CREATE TABLE IF NOT EXISTS `templates` (
	`id` text PRIMARY KEY NOT NULL, -- 模板唯一ID
	`name` text NOT NULL, -- 模板名称
	`description` text NOT NULL, -- 模板用途或描述
	`content` text NOT NULL, -- 模板具体内容
	`created_at` text DEFAULT (datetime('now')) NOT NULL, -- 创建时间
	`updated_at` text DEFAULT (datetime('now')) NOT NULL -- 最近更新时间
);
