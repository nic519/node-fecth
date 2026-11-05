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
  initialTemplates,
}: {
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
    isDiscardModalOpen,
    handleSelectTemplate,
    handleStartEdit,
    handleCreateTemplate,
    handleCreateVisualTemplate,
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
    closeDiscardModal,
    confirmDiscard,
    setValidationErrors,
  } = useTemplateManagement({ initialTemplates });

  const handleRevealProxyGroup = (groupName: string) => {
    const line = findProxyGroupLineNumber(currentConfigContent, groupName);
    setYamlRevealTarget((current) => ({ line, key: current.key + 1 }));
  };

  return (
    <div className="min-h-100dvh bg-background">
      <NavigationBar currentPage="templates" />

      <main className={cn("content-container py-7 sm:py-9", isEditing && "max-w-none")}>
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
                    <div className="grid w-full grid-cols-2 gap-2">
                      <Button onClick={handleCreateTemplate} size="sm" className="px-3">
                        <Plus className="h-4 w-4" />
                        YAML
                      </Button>
                      <Button onClick={handleCreateVisualTemplate} size="sm" variant="secondary" className="px-3">
                        可视化
                      </Button>
                    </div>
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
        isDiscardModalOpen={isDiscardModalOpen}
        closeDiscardModal={closeDiscardModal}
        confirmDiscard={confirmDiscard}
        loading={loading}
      />
    </div>
  );
}

function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface flex h-[calc(100dvh-9rem)] min-h-[560px] flex-col overflow-hidden">
      {children}
    </div>
  );
}
