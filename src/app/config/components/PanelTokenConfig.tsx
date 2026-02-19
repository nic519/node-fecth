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
        <div className="space-y-6">
            <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center gap-2 text-primary/80">
                    <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <Key className="w-5 h-5" />
                    </div>
                    访问令牌
                </h3>
                <p className="text-sm text-muted-foreground ml-9">
                    配置用于访问管理面板的安全令牌，且<span className="font-bold text-destructive">订阅地址链接也会变</span>
                </p>
            </div>

            <div className="space-y-2 group">
                <Label htmlFor="accessToken" className="text-base flex items-center gap-2 group-focus-within:text-primary transition-colors">
                    <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                        <Key className="w-3.5 h-3.5" />
                    </div>
                    Access Token
                </Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="accessToken"
                            value={config.accessToken || ''}
                            onChange={(e) => handleChange('accessToken', e.target.value)}
                            placeholder="your-access-token"
                            readOnly={readOnly}
                            className="font-mono pr-10 transition-all border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 hover:border-primary/30"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
