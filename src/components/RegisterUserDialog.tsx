'use client';

import { useState, useEffect } from 'react';
import { UserConfig } from '@/types/user-config';
import { adminService } from '@/services/admin-api';
import { useToastContext } from '@/providers/toast-provider';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Key, Link as LinkIcon, Dices, Loader2, CheckCircle2, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { DEFAULT_SUB_FLAG, PROMO_URL } from '@/config/constants';

interface RegisterUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  superToken?: string;
  onSuccess?: () => void;
}

export function RegisterUserDialog({
  isOpen,
  onOpenChange,
  superToken,
  onSuccess
}: RegisterUserDialogProps) {
  const { showToast } = useToastContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');
  const [subscribe, setSubscribe] = useState('');

  // Validation state
  const [touched, setTouched] = useState({ uid: false, token: false, subscribe: false });
  const [errors, setErrors] = useState({ uid: '', token: '', subscribe: '' });

  // Success state for non-admin users
  const [showSuccess, setShowSuccess] = useState(false);

  // Generate token when dialog opens
  useEffect(() => {
    if (isOpen && !token) {
      generateRandomToken();
    }
    if (!isOpen) {
      // Reset form on close if needed
      setUid('');
      setToken('');
      setSubscribe('');
      setTouched({ uid: false, token: false, subscribe: false });
      setErrors({ uid: '', token: '', subscribe: '' });
    }
  }, [isOpen]);

  // Validation Logic
  useEffect(() => {
    const newErrors = { uid: '', token: '', subscribe: '' };

    // UID Validation
    if (touched.uid) {
      if (!uid) {
        newErrors.uid = '请输入用户ID';
      } else if (uid.length < 4) {
        newErrors.uid = '用户ID至少需要4个字符';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(uid)) {
        newErrors.uid = '用户ID只能包含字母、数字、下划线和连字符';
      }
    }

    // Token Validation
    if (touched.token) {
      if (!token) {
        newErrors.token = '请输入访问令牌';
      } else if (token.length < 8) {
        newErrors.token = '访问令牌至少需要8个字符';
      }
    }

    // Subscribe Validation
    if (touched.subscribe) {
      if (!subscribe) {
        newErrors.subscribe = '请输入订阅链接';
      } else {
        try {
          new URL(subscribe);
        } catch {
          newErrors.subscribe = '请输入有效的URL链接 (例如 https://example.com/...)';
        }
      }
    }

    setErrors(newErrors);
  }, [uid, token, subscribe, touched]);

  const isValid = () => {
    return (
      uid.length >= 4 && /^[a-zA-Z0-9_-]+$/.test(uid) &&
      token.length >= 8 &&
      subscribe && (() => { try { new URL(subscribe); return true; } catch { return false; } })()
    );
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!_-(*)';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setToken(result);
    // Auto-validate token after generation if it was touched, or just clear error
    if (touched.token) {
      // logic handled by effect
    }
  };

  const handleRegister = async () => {
    // Mark all as touched to show errors
    setTouched({ uid: true, token: true, subscribe: true });

    if (!isValid()) {
      showToast('请修正表单中的错误', 'error');
      return;
    }

    setLoading(true);
    try {
      const userConfig: UserConfig = {
        subscribe: subscribe.trim(),
        accessToken: token.trim(),
        appendSubList: [{
          subscribe: subscribe.trim(),
          flag: DEFAULT_SUB_FLAG,
        }],
      };

      let response: { code: number; msg?: string; data?: unknown };
      if (superToken) {
        response = await adminService.addUser(superToken, {
          uid: uid.trim(),
          config: userConfig
        });
      } else {
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: uid.trim(),
            config: userConfig
          })
        });
        response = await res.json();
      }

      if (response.code === 0) {
        showToast(`用户 ${uid} 创建成功`, 'success');

        if (superToken) {
          // Admin flow: just close and refresh
          onOpenChange(false);
          onSuccess?.();
          setUid('');
          setToken('');
          setSubscribe('');
        } else {
          // Public flow: direct redirect to config page with success flag
          const configUrl = `/config?uid=${uid.trim()}&token=${token.trim()}&new=true`;
          router.push(configUrl);
          onOpenChange(false);

          // Reset form
          setUid('');
          setToken('');
          setSubscribe('');
        }
      } else {
        showToast('创建用户失败: ' + (response.msg || '未知错误'), 'error');
      }
    } catch (error) {
      console.error('创建用户失败:', error);
      showToast('创建用户失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Register Form Dialog
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-border/60 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-violet-600">
            立即创建配置
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="uid" className="text-sm font-medium">
              用户ID <span className="text-destructive">*</span>
            </Label>
            <div className="relative group">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="uid"
                className={`pl-9 border-border/60 focus-visible:ring-primary/20 transition-all ${errors.uid ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                placeholder="至少4位字符 (字母/数字/下划线)"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value);
                  if (!touched.uid) setTouched(prev => ({ ...prev, uid: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, uid: true }))}
              />
            </div>
            {errors.uid && <p className="text-xs text-destructive animate-in fade-in-50">{errors.uid}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="token" className="text-sm font-medium">
              访问令牌 <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="token"
                  className={`pl-9 border-border/60 focus-visible:ring-primary/20 transition-all ${errors.token ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                  placeholder="至少8位字符"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (!touched.token) setTouched(prev => ({ ...prev, token: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, token: true }))}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomToken}
                title="生成随机令牌"
                className="shrink-0 border-border/60 hover:bg-muted/50 hover:text-primary transition-colors"
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
            {errors.token && <p className="text-xs text-destructive animate-in fade-in-50">{errors.token}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscribe" className="text-sm font-medium">
              订阅链接 <span className="text-destructive">*</span>
            </Label>
            <div className="relative group">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                id="subscribe"
                className={`pl-9 border-border/60 focus-visible:ring-primary/20 transition-all ${errors.subscribe ? 'border-destructive focus-visible:ring-destructive/20' : ''}`}
                placeholder="https://example.com/subscribe..."
                value={subscribe}
                onChange={(e) => {
                  setSubscribe(e.target.value);
                  if (!touched.subscribe) setTouched(prev => ({ ...prev, subscribe: true }));
                }}
                onBlur={() => setTouched(prev => ({ ...prev, subscribe: true }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              - 填写自己正在使用的订阅链接
            </p>
            <p className="text-xs text-muted-foreground">
              - 没有订阅链接？
              <a
                href={PROMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium transition-colors hover:text-primary/80"
              >
                点击这里获取专属链接
              </a>（无合作关系，纯粹性价比和延迟低）
            </p>
            {errors.subscribe && <p className="text-xs text-destructive animate-in fade-in-50">{errors.subscribe}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleRegister}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white shadow-lg shadow-primary/20"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认创建
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
