import { useMemo } from 'react';
import { getResource } from '../data/mining';
import { aggregateTotals, fmt, type RowConfig } from '../lib/calc';
import ResourceIcon from './ResourceIcon';

export default function Summary({ rows }: { rows: RowConfig[] }) {
  const totals = useMemo(() => aggregateTotals(rows), [rows]);

  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
        Resource totals
      </h2>
      {totals.length === 0 ? (
        <p className="text-sm text-slate-500">Add a row to see aggregated output.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="pb-2 font-medium">Resource</th>
              <th className="pb-2 text-right font-medium">Theoretical</th>
              <th className="pb-2 text-right font-medium">Effective</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t) => {
              const limited = t.effectiveTotal < t.totalRate - 1e-9;
              return (
                <tr key={t.resourceId} className="border-t border-slate-700/60">
                  <td className="py-1.5 text-slate-200">
                    <span className="flex items-center gap-2">
                      <ResourceIcon resource={getResource(t.resourceId)} size={18} />
                      {t.resourceName}
                    </span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-300">
                    {fmt(t.totalRate)} <span className="text-slate-500">{t.unit}</span>
                  </td>
                  <td
                    className={
                      'py-1.5 text-right tabular-nums ' +
                      (limited ? 'text-red-300' : 'text-orange-300')
                    }
                  >
                    {fmt(t.effectiveTotal)} <span className="text-slate-500">{t.unit}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        <span className="text-orange-300">Effective</span> accounts for belt throughput limits.
        Phase-2 extractors (Resource Wells) are excluded.
      </p>
    </aside>
  );
}
