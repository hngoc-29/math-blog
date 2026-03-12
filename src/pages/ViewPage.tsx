import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Card, CardContent } from '@/components/ui/card';

interface ViewPageProps {
  title: string;
  content: string;
}

export function ViewPage({ title, content }: ViewPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center p-4 md:p-8">
      <Card className="w-full">
        <CardContent className="space-y-6 p-6 md:p-10">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">{title}</h1>
          <MarkdownRenderer content={content} />
        </CardContent>
      </Card>
    </main>
  );
}
