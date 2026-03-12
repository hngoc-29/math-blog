import { useEditor, EditorContent } from '@tiptap/react'
import { useState } from 'react'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import CodeBlock from '@tiptap/extension-code-block'
import Heading from '@tiptap/extension-heading'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'
import Blockquote from '@tiptap/extension-blockquote'
import HardBreak from '@tiptap/extension-hard-break'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import History from '@tiptap/extension-history'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Dropcursor from '@tiptap/extension-dropcursor'
import Gapcursor from '@tiptap/extension-gapcursor'
import Typography from '@tiptap/extension-typography'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { Toolbar } from './Toolbar'
import { MediaInsertModal } from './MediaInsertModal'
import { AudioBlock, VideoBlock, FileBlock } from './MediaNodes'

interface RichEditorProps {
  content: string
  onChange: (html: string) => void
}

export function RichEditor({ content, onChange }: RichEditorProps) {
  const [showMediaModal, setShowMediaModal] = useState(false)

  const editor = useEditor({
    extensions: [
      Document, Paragraph, Text,
      Bold, Italic, Underline, Strike,
      Code, CodeBlock,
      Heading.configure({ levels: [1, 2, 3] }),
      BulletList, OrderedList, ListItem,
      TaskList, TaskItem.configure({ nested: true }),
      Blockquote, HardBreak, HorizontalRule,
      History, Dropcursor, Gapcursor, Typography,
      Subscript, Superscript,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Image.configure({ HTMLAttributes: { class: 'editor-img' } }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      // Custom media nodes
      AudioBlock,
      VideoBlock,
      FileBlock,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        'data-placeholder': 'Write your message here… Use the 📎 toolbar button to insert audio, video, images, or files at cursor position.',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  return (
    <>
      <div
        className="rounded-xl border overflow-hidden shadow-sm transition-all duration-200"
        style={{ borderColor: 'var(--t-border)', background: 'var(--t-editor-bg)' }}
      >
        {editor && (
          <Toolbar
            editor={editor}
            onInsertMedia={() => setShowMediaModal(true)}
          />
        )}
        <EditorContent editor={editor} />
      </div>

      {editor && showMediaModal && (
        <MediaInsertModal
          editor={editor}
          onClose={() => setShowMediaModal(false)}
        />
      )}
    </>
  )
}
