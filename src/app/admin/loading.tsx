export default function AdminLoading() {
  return (
    <div className="flex flex-1 items-center justify-center bg-slate-50/50 text-foreground dark:bg-zinc-950">
      <div role="status" className="text-sm text-muted-foreground">正在加载管理后台...</div>
    </div>
  );
}
