"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserConfigSchema = exports.SubConfigSchema = exports.AreaCodeSchema = void 0;
exports.validateUserConfig = validateUserConfig;
exports.validateUserConfigStrict = validateUserConfigStrict;
const zod_1 = require("zod");
// 地区代码验证schema
exports.AreaCodeSchema = zod_1.z.enum(['TW', 'SG', 'JP', 'VN', 'HK', 'US']);
// 订阅配置验证schema
exports.SubConfigSchema = zod_1.z.object({
    subscribe: zod_1.z.string().url('订阅链接必须是有效的URL'),
    flag: zod_1.z.string().min(1, '标识不能为空'),
    includeArea: zod_1.z.array(exports.AreaCodeSchema).optional(),
});
// 用户配置验证schema
exports.UserConfigSchema = zod_1.z.object({
    subscribe: zod_1.z.string().url('订阅地址必须是有效的URL'),
    accessToken: zod_1.z.string().min(1, '访问令牌不能为空'),
    ruleUrl: zod_1.z.string().url('规则模板链接必须是有效的URL').optional(),
    fileName: zod_1.z.string().optional(),
    multiPortMode: zod_1.z.array(exports.AreaCodeSchema).optional(),
    appendSubList: zod_1.z.array(exports.SubConfigSchema).optional(),
    excludeRegex: zod_1.z.string().optional(),
});
// 验证函数
function validateUserConfig(data) {
    const result = exports.UserConfigSchema.safeParse(data);
    if (result.success) {
        return { isValid: true, errors: [] };
    }
    else {
        const errors = result.error.errors.map((err) => {
            const path = err.path.length > 0 ? err.path.join('.') : 'root';
            return `${path}: ${err.message}`;
        });
        return { isValid: false, errors };
    }
}
// 严格验证函数（不允许额外字段）
function validateUserConfigStrict(data) {
    const result = exports.UserConfigSchema.strict().safeParse(data);
    if (result.success) {
        return { isValid: true, errors: [] };
    }
    else {
        const errors = result.error.errors.map((err) => {
            const path = err.path.length > 0 ? err.path.join('.') : 'root';
            return `${path}: ${err.message}`;
        });
        return { isValid: false, errors };
    }
}
