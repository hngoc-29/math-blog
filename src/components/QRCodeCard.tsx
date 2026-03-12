import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRCodeCardProps {
  url: string;
}

export function QRCodeCard({ url }: QRCodeCardProps) {
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Link</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="break-all rounded-md border bg-slate-50 p-3 text-sm text-slate-700">{url}</p>
        <div className="flex justify-center rounded-md border bg-white p-4">
          <QRCodeSVG value={url} size={180} includeMargin />
        </div>
        <Button onClick={copyToClipboard} className="w-full">
          Copy Link
        </Button>
      </CardContent>
    </Card>
  );
}
