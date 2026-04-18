'use client';

import { usePageTitle } from '@/hooks/usePageTitle';
import { useToastContext } from '@/providers/toast-provider';
import { useUserFilters } from './hooks/useUserFilters';
import { useUserManagement } from './hooks/useUserManagement';
import { NavigationBar } from '@/components/NavigationBar';
import { AdminTwoColumnLayout } from '@/components/admin/AdminTwoColumnLayout';
import { UserFilters } from './components/UserFilters';
import { UserMasonry } from './components/UserMasonry';
import { ImportUserModal } from './components/ImportUserModal';
import { RegisterUserDialog } from '@/components/RegisterUserDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from 'lucide-react';
import type { UserAdminConfig } from '@/modules/user/admin.schema';

export function AdminUsersClient({
  superToken,
  initialUsers,
}: {
  superToken: string;
  initialUsers: UserAdminConfig[];
}) {
  usePageTitle('用户管理');

  const { showToast } = useToastContext();

  const {
    users,
    loading,
    error,
    fetchUsers,
    handleUserAction,
    handleExport,
    deleteModal,
    addUserModal,
    importModal
  } = useUserManagement({
    superToken,
    initialUsers,
    showToast,
  });

  const { filteredUsers, searchTerm, setSearchTerm } = useUserFilters({
    users,
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#09090b_40%,#1e1b4b_100%)] opacity-20 pointer-events-none" />

      <NavigationBar superToken={superToken} currentPage="users" />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <AdminTwoColumnLayout
          sidebar={
            <UserFilters
              searchTerm={searchTerm}
              loading={loading}
              totalUsers={users.length}
              filteredCount={filteredUsers.length}
              onSearchTermChange={setSearchTerm}
              onRefresh={fetchUsers}
              onAddUser={addUserModal.open}
              onExport={handleExport}
              onImport={importModal.open}
            />
          }
          content={
            <div className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                  <div className="text-destructive font-medium">{error}</div>
                </div>
              )}

              <UserMasonry users={filteredUsers} loading={loading} error={error} onUserAction={handleUserAction} />

              <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/80 px-4 py-3 border border-border/60 rounded-xl shadow-sm backdrop-blur-sm">
                <div className="flex items-center text-xs font-medium text-muted-foreground">
                  <span>共 {filteredUsers.length} 条记录</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="bg-background text-muted-foreground border-border/60 hover:bg-muted" disabled>
                    上一页
                  </Button>
                  <Button size="sm" variant="default" className="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90">
                    1
                  </Button>
                  <Button size="sm" variant="outline" className="bg-background text-muted-foreground border-border/60 hover:bg-muted" disabled>
                    下一页
                  </Button>
                </div>
              </div>
            </div>
          }
        />
      </main>

      <Dialog open={deleteModal.isOpen} onOpenChange={(open) => !open && deleteModal.close()}>
        <DialogContent className="border-border/60 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">确认删除用户</DialogTitle>
            <DialogDescription>
              确定要删除用户 <span className="font-mono font-medium text-foreground">{deleteModal.userToDelete}</span> 吗？此操作不可撤销！
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={deleteModal.close}>
              取消
            </Button>
            <Button variant="destructive" onClick={deleteModal.confirm} disabled={loading} className="bg-destructive hover:bg-destructive/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RegisterUserDialog
        isOpen={addUserModal.isOpen}
        onOpenChange={(open) => !open && addUserModal.close()}
        superToken={superToken}
        onSuccess={fetchUsers}
      />

      <ImportUserModal
        isOpen={importModal.isOpen}
        onClose={importModal.close}
        onImport={importModal.handleImport}
        jsonContent={importModal.jsonContent}
        onJsonContentChange={importModal.setJsonContent}
        isImporting={importModal.isImporting}
        importProgress={importModal.importProgress}
        importErrors={importModal.importErrors}
      />
    </div>
  );
}
