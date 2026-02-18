import { UserConfig } from '@/types/openapi-schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key } from 'lucide-react';

interface PanelTokenConfigProps {
    config: UserConfig;
    onChange: (newConfig: UserConfig) => void;
    readOnly?: boolean;
}

export function PanelTokenConfig({ config, onChange, readOnly }: PanelTokenConfigProps) {

    const handleChange = <K extends keyof UserConfig>(key: K, value: UserConfig[K]) => {
        onChange({ ...config, [key]: value });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    访问令牌
                </h3>
                <p className="text-sm text-muted-foreground">- 配置用于访问管理面板的安全令牌，且**订阅地址链接也会变**</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="accessToken"
                            value={config.accessToken || ''}
                            onChange={(e) => handleChange('accessToken', e.target.value)}
                            placeholder="your-access-token"
                            readOnly={readOnly}
                            className="font-mono pr-10"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
