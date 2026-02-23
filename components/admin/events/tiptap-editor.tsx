'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = 'Add Description',
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const toolbarButtons = [
    {
      icon: Bold,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
    },
    {
      icon: Italic,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
    },
    {
      icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
    },
    {
      icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
    },
    {
      icon: LinkIcon,
      action: () => {
        if (editor.isActive('link')) {
          editor.chain().focus().unsetLink().run();
        } else {
          const url = window.prompt('Enter URL');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }
      },
      isActive: editor.isActive('link'),
    },
  ];

  return (
    <div className="rounded-lg border border-input focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-colors">
      <div className="flex gap-1 p-2 border-b border-input">
        {toolbarButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.action}
            className={cn(
              'h-8 w-8 flex items-center justify-center rounded-md transition-colors',
              button.isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          'p-3 h-[200px] overflow-y-auto',
          '[&_.tiptap]:outline-none [&_.tiptap]:min-h-full',
          '[&_.tiptap_p]:mb-2',
          '[&_.tiptap_ul]:list-disc [&_.tiptap_ul]:pl-4 [&_.tiptap_ul]:mb-2',
          '[&_.tiptap_ol]:list-decimal [&_.tiptap_ol]:pl-4 [&_.tiptap_ol]:mb-2',
          '[&_.tiptap_a]:text-primary [&_.tiptap_a]:underline',
          '[&_.tiptap_.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.tiptap_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.tiptap_.is-editor-empty:first-child::before]:float-left',
          '[&_.tiptap_.is-editor-empty:first-child::before]:h-0',
          '[&_.tiptap_.is-editor-empty:first-child::before]:pointer-events-none'
        )}
      />
    </div>
  );
}
