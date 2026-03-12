import { useMemo } from 'react';
import { CreatePage } from '@/pages/CreatePage';
import { ViewPage } from '@/pages/ViewPage';
import { decodePayload } from '@/utils/decode';

function App() {
  const data = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('data');
  }, []);

  if (!data) {
    return <CreatePage />;
  }

  try {
    const payload = decodePayload(data);
    return <ViewPage title={payload.title} content={payload.content} />;
  } catch {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center p-6">
        <div className="w-full rounded-lg border bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold">Invalid message link</h1>
          <p className="text-slate-600">
            The <code>data</code> parameter is missing, malformed, or unsupported.
          </p>
        </div>
      </main>
    );
  }
}

export default App;
