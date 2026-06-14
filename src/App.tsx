import { useRef, useState } from 'react';
import MiningRow from './components/MiningRow';
import Summary from './components/Summary';
import type { RowConfig } from './lib/calc';
import { createRow, duplicateRow, exportRows, importRows } from './state';
import { DownloadIcon, PlusIcon, UploadIcon } from './components/icons';

export default function App() {
  const [rows, setRows] = useState<RowConfig[]>(() => [createRow()]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function patchRow(id: string, patch: Partial<RowConfig>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, createRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function duplicate(id: string) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx === -1) return prev;
      const copy = duplicateRow(prev[idx]);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function handleExport() {
    const blob = new Blob([exportRows(rows)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sc-calc-extraction.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importRows(String(reader.result));
        setRows(imported.length > 0 ? imported : [createRow()]);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Failed to import file.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <h1 className="text-xl font-bold text-slate-100">
            Satisfactory Resource Calculator
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Mining &amp; extraction output for Satisfactory 1.0 — change any parameter and the
            numbers update instantly.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-orange-400"
              >
                <PlusIcon className="h-4 w-4" />
                Add row
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              >
                <DownloadIcon className="h-4 w-4" />
                Export JSON
              </button>
              <button
                type="button"
                onClick={handleImportClick}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
              >
                <UploadIcon className="h-4 w-4" />
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>

            {importError && (
              <p className="rounded-md border border-red-700/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                {importError}
              </p>
            )}

            {rows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-slate-500">
                No extraction rows. Click “Add row” to begin.
              </p>
            ) : (
              rows.map((row, i) => (
                <MiningRow
                  key={row.id}
                  row={row}
                  index={i}
                  onChange={(patch) => patchRow(row.id, patch)}
                  onDuplicate={() => duplicate(row.id)}
                  onRemove={() => removeRow(row.id)}
                />
              ))
            )}
          </section>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <Summary rows={rows} />
          </div>
        </div>

        <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
          Formula: <code className="text-slate-400">rate = purity × (overclock / 100) × baseRate</code>.
          Static client-side app — no backend, no tracking. State lives in memory; use Export/Import
          to save a setup.
        </footer>
      </main>
    </div>
  );
}
