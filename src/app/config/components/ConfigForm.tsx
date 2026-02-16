
import { UserConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DynamicSyncPanel } from './DynamicSyncPanel';
import { BasicConfig } from './BasicConfig';
import { RuleConfig } from './RuleConfig';

export type ConfigTab = 'basic' | 'rules' | 'dynamic' | 'token' | 'preview';

interface ConfigFormProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    activeTab: ConfigTab;
}

export function ConfigForm({ config, onChange, readOnly = false, activeTab }: ConfigFormProps) {
    const handleChange = (key: keyof UserConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-6 p-6">
            {activeTab === 'basic' && (
                <BasicConfig config={config} onChange={onChange} readOnly={readOnly} />
            )}

            {activeTab === 'rules' && (
                <RuleConfig config={config} onChange={onChange} readOnly={readOnly} />
            )}

            {activeTab === 'dynamic' && (
                <DynamicSyncPanel config={config} />
            )}

            {activeTab === 'token' && (
                <div className="space-y-2">
                    <Label htmlFor="accessToken">访问令牌 (Access Token)</Label>
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
