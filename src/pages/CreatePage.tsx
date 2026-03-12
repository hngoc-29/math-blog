import { useMemo, useState } from 'react';
import { Editor } from '@/components/Editor';
import { QRCodeCard } from '@/components/QRCodeCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { encodePayload } from '@/utils/encode';

const starterContent = `# Welcome 👋

Write your message with **Markdown**, _math_, and code.

Inline math: $E = mc^2$

Block math:

$$
\\int_0^1 x^2 dx = \\frac{1}{3}
$$

\`\`\`ts
const hello = 'world';
\`\`\`
`;

export function CreatePage() {
  const [title, setTitle] = useState('My shareable message');
  const [content, setContent] = useState(starterContent);
  const [generatedUrl, setGeneratedUrl] = useState('');

  const urlLength = useMemo(() => generatedUrl.length, [generatedUrl]);

  const generateLink = () => {
    const data = encodePayload({ title: title.trim() || 'Untitled Message', content });
    const url = `${window.location.origin}${window.location.pathname}?data=${data}`;
    setGeneratedUrl(url);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Shareable Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Message title" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Content</label>
            <Editor value={content} onChange={setContent} />
          </div>
          <Button onClick={generateLink}>Generate Link</Button>
          {generatedUrl && (
            <p className="text-sm text-slate-500">
              URL length: <span className="font-semibold">{urlLength}</span> characters
            </p>
          )}
        </CardContent>
      </Card>

      {generatedUrl && <QRCodeCard url={generatedUrl} />}
    </main>
  );
}
