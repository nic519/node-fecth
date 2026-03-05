
/// 默认订阅标志
/// 由于历史原因，主订阅是没有标识的，所以这里是默认给一个
export const DEFAULT_SUB_FLAG = '🐙';


/// 默认规则URL
const DEV_RULE_URL = 'https://raw.githubusercontent.com/zzy333444/passwall_rule/refs/heads/main/miho-cfg.yaml';

const PROD_RULE_URL = 'https://node.1024.hair/api/subscription/template/3c779cd5-15ea-4241-af90-9e8539f050a4';

export const DEFAULT_RULE_URL = process.env.NODE_ENV === 'development' ? DEV_RULE_URL : PROD_RULE_URL;

/// 推广订阅注册链接
export const PROMO_URL = 'https://i03.1ytaff.com/register?aff=bYJ44TS8';

export const SUPER_TOKEN_QUERY_PARAM = 'superToken';
