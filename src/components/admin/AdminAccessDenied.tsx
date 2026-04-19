import { AccessDeniedState } from '@/components/AccessDeniedState';

interface AdminAccessDeniedProps {
  title?: string;
  message?: string;
}

export function AdminAccessDenied({
  title = '管理员令牌无效',
  message = '当前链接无法进入管理后台，请确认 superToken 是否正确。',
}: AdminAccessDeniedProps) {
  return (
    <AccessDeniedState
      eyebrow="管理后台访问校验"
      title={title}
      message={message}
      secondaryHref="/admin"
      secondaryLabel="重新输入令牌"
    />
  );
}
