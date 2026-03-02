"use client";

interface TemplateEditorProps {
  templateId?: string;
}

export function TemplateEditor({ templateId }: TemplateEditorProps) {
  return (
    <div>
      {templateId ? `Editing template: ${templateId}` : "New template"}
    </div>
  );
}