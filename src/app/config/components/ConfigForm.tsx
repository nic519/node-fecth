import { UserConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PanelDynamicSync } from './PanelDynamicSync';
import { PanelBasicConfig } from './PanelBasicConfig';
import { PanelRuleConfig } from './PanelRuleConfig';

export type ConfigTab = 'basic' | 'rules' | 'dynamic' | 'token' | 'preview';

interface ConfigFormProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    activeTab: ConfigTab;
    uid?: string;
}

export function ConfigForm({ config, onChange, readOnly = false, activeTab, uid }: ConfigFormProps) {
    const handleChange = (key: keyof UserConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-6 p-6">
            {activeTab === 'basic' && (
                <PanelBasicConfig config={config} onChange={onChange} readOnly={readOnly} uid={uid} />
            )}

            {activeTab === 'rules' && (
                <PanelRuleConfig config={config} onChange={onChange} readOnly={readOnly} />
            )}

            {activeTab === 'dynamic' && (
                <PanelDynamicSync config={config} />
            )}

            {activeTab === 'token' && (
                <div className="space-y-2">
                    <Label htmlFor="accessToken">访问令牌</Label>
                    <Input
                        id="accessToken"
                        value={config.accessToken || ''}
                        onChange={(e) => handleChange('accessToken', e.target.value)}
                        placeholder="your-access-token"
                        readOnly={readOnly}
                    />
                    <p className="text-sm text-muted-foreground">必填。用于访问配置的唯一令牌。</p>
                </div>
            )}
        </div>
    );
}
