'use client';

import Loading from '@/components/Loading';
import { NavigationBar } from '@/components/NavigationBar';
import { AdminSidePanel } from '@/components/admin/AdminSidePanel';
import { AdminTwoColumnLayout } from '@/components/admin/AdminTwoColumnLayout';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { findProxyGroupLineNumber } from './utils/clash-template-utils';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplateList, type TemplateItem } from './components/TemplateList';
import { TemplateModals } from './components/TemplateModals';
import { useTemplateManagement } from './hooks/useTemplateManagement';
import type React from 'react';
import { useState } from 'react';

export function AdminTemplatesClient({
  superToken,
  initialTemplates,
}: {
  superToken: string;
  initialTemplates: TemplateItem[];
}) {
  const [yamlRevealTarget, setYamlRevealTarget] = useState<{ line: number | null; key: number }>({ line: null, key: 0 });
  const {
    templates,
    selectedTemplate,
    currentConfigContent,
    loading,
    saving,
    error,
    isEditing,
    validationErrors,
    isDeleteModalOpen,
    isErrorModalOpen,
    handleSelectTemplate,
    handleStartEdit,
    handleCreateTemplate,
    handleDeleteTemplate,
    confirmDeleteTemplate,
    handleUpdateTemplate,
    handleUpdateConfigContent,
    handleSave,
    handleReset,
    handleDownloadTemplate,
    handleCopyConfigContent,
    handleCopyTemplateUrl,
    closeDeleteModal,
    closeErrorModal,
    setValidationErrors,
  } = useTemplateManagement({ superToken, initialTemplates });

  const handleRevealProxyGroup = (groupName: string) => {
    const line = findProxyGroupLineNumber(currentConfigContent, groupName);
    setYamlRevealTarget((current) => ({ line, key: current.key + 1 }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] dark:[background:radial-gradient(125%_125%_at_50%_10%,#09090b_40%,#1e1b4b_100%)] opacity-20 pointer-events-none" />
      <NavigationBar superToken={superToken} currentPage="templates" />

      <main className={cn("mx-auto py-8 px-4 sm:px-6 lg:px-8", isEditing ? "max-w-[1800px]" : "max-w-7xl")}>
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
            <div className="text-destructive font-medium">{error}</div>
          </div>
        )}

        {loading && !templates.length ? (
          <div className="flex items-center justify-center h-full">
            <Loading message="加载中..." />
          </div>
        ) : (
          isEditing ? (
            <EditorShell>
              <TemplateEditor
                selectedTemplate={selectedTemplate}
                isEditing={isEditing}
                validationErrors={validationErrors}
                currentConfigContent={currentConfigContent}
                yamlRevealLine={yamlRevealTarget.line}
                yamlRevealKey={yamlRevealTarget.key}
                onStartEdit={handleStartEdit}
                onDeleteTemplate={() => selectedTemplate && handleDeleteTemplate(String(selectedTemplate.id))}
                onUpdateTemplate={handleUpdateTemplate}
                onUpdateConfigContent={handleUpdateConfigContent}
                onRevealProxyGroup={handleRevealProxyGroup}
                onValidate={setValidationErrors}
                onDownloadTemplate={handleDownloadTemplate}
                onReset={handleReset}
                onSave={handleSave}
                onCopyConfigContent={handleCopyConfigContent}
                onCopyTemplateUrl={handleCopyTemplateUrl}
                loading={loading}
                saving={saving}
              />
            </EditorShell>
          ) : (
            <AdminTwoColumnLayout
              sidebar={
                <AdminSidePanel
                  title="模板列表"
                  icon={FileText}
                  className="h-fit"
                  action={
                    <Button
                      onClick={handleCreateTemplate}
                      size="sm"
                      className="h-8 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-none rounded-md"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      新建
                    </Button>
                  }
                >
                  <div className="max-h-[70vh] overflow-y-auto pr-2 -mr-2">
                    <TemplateList
                      templates={templates}
                      onSelectTemplate={handleSelectTemplate}
                    />
                  </div>
                </AdminSidePanel>
              }
              content={
                <EditorShell>
                  <TemplateEditor
                    selectedTemplate={selectedTemplate}
                    isEditing={isEditing}
                    validationErrors={validationErrors}
                    currentConfigContent={currentConfigContent}
                    yamlRevealLine={yamlRevealTarget.line}
                    yamlRevealKey={yamlRevealTarget.key}
                    onStartEdit={handleStartEdit}
                    onDeleteTemplate={() => selectedTemplate && handleDeleteTemplate(String(selectedTemplate.id))}
                    onUpdateTemplate={handleUpdateTemplate}
                    onUpdateConfigContent={handleUpdateConfigContent}
                    onRevealProxyGroup={handleRevealProxyGroup}
                    onValidate={setValidationErrors}
                    onDownloadTemplate={handleDownloadTemplate}
                    onReset={handleReset}
                    onSave={handleSave}
                    onCopyConfigContent={handleCopyConfigContent}
                    onCopyTemplateUrl={handleCopyTemplateUrl}
                    loading={loading}
                    saving={saving}
                  />
                </EditorShell>
              }
            />
          )
        )}
      </main>

      <TemplateModals
        isDeleteModalOpen={isDeleteModalOpen}
        closeDeleteModal={closeDeleteModal}
        confirmDeleteTemplate={confirmDeleteTemplate}
        isErrorModalOpen={isErrorModalOpen}
        closeErrorModal={closeErrorModal}
        loading={loading}
      />
    </div>
  );
}

function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-border/60 shadow-sm">
      {children}
    </div>
  );
}
