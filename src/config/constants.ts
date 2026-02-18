
export const DEFAULT_SUB_FLAG = '🐙';

const DEV_RULE_URL = 'https://raw.githubusercontent.com/zzy333444/passwall_rule/refs/heads/main/miho-cfg.yaml';
const PROD_RULE_URL = 'https://node.1024.hair/api/subscription/template/3c779cd5-15ea-4241-af90-9e8539f050a4';

export const DEFAULT_RULE_URL = process.env.NODE_ENV === 'development' ? DEV_RULE_URL : PROD_RULE_URL;
