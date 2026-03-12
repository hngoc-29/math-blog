import { useMemo, useRef } from 'react';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  codeMirrorPlugin,
  CreateLink,
  headingsPlugin,
  imagePlugin,
  InsertCodeBlock,
  InsertImage,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  MDXEditorMethods,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo
} from '@mdxeditor/editor';

import { Button } from '@/components/ui/button';

interface EditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  const ref = useRef<MDXEditorMethods>(null);

  const plugins = useMemo(
    () => [
      headingsPlugin(),
      listsPlugin(),
      quotePlugin(),
      thematicBreakPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      imagePlugin(),
      tablePlugin(),
      codeBlockPlugin({ defaultCodeBlockLanguage: 'plaintext' }),
      codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', ts: 'TypeScript', py: 'Python', md: 'Markdown' } }),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <Separator />
            <BoldItalicUnderlineToggles />
            <Separator />
            <BlockTypeSelect />
            <ListsToggle />
            <Separator />
            <CreateLink />
            <InsertImage />
            <InsertCodeBlock />
          </>
        )
      })
    ],
    []
  );

  return (
    <div className="space-y-3">
      <MDXEditor
        ref={ref}
        markdown={value}
        onChange={onChange}
        className="mdxeditor"
        contentEditableClassName="prose max-w-none min-h-[300px] px-4 py-3"
        plugins={plugins}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => ref.current?.insertMarkdown('$$\\n\\frac{a}{b} = c\\n$$\n')}
      >
        Insert Math Formula
      </Button>
    </div>
  );
}
