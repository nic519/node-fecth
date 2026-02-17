import { UserConfig } from '@/types/openapi-schemas';
import { PanelDynamicSync } from './PanelDynamicSync';
import { PanelBasicConfig } from './PanelBasicConfig';
import { PanelRuleConfig } from './PanelRuleConfig';
import { PanelTokenConfig } from './PanelTokenConfig';

export type ConfigTab = 'basic' | 'rules' | 'dynamic' | 'token' | 'preview';

interface ConfigFormProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
    activeTab: ConfigTab;
    uid?: string;
}

export function ConfigForm({ config, onChange, readOnly = false, activeTab, uid }: ConfigFormProps) {
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
                <PanelTokenConfig config={config} onChange={onChange} readOnly={readOnly} />
            )}
        </div>
    );
}
