import { useMemo } from 'react';
import {
  BELTS,
  OVERCLOCK_MAX,
  OVERCLOCK_MIN,
  PURITIES,
  getKindDef,
  getResource,
} from '../data/mining';
import { computeRow, fmt, smallestBeltFor, type RowConfig } from '../lib/calc';
import ResourceSelect from './ResourceSelect';
import { CopyIcon, TrashIcon } from './icons';

interface Props {
  row: RowConfig;
  index: number;
  onChange: (patch: Partial<RowConfig>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

const labelCls = 'block text-xs font-medium text-slate-400 mb-1';
const inputCls =
  'w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-sm ' +
  'text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500';

export default function MiningRow({ row, index, onChange, onDuplicate, onRemove }: Props) {
  const result = useMemo(() => computeRow(row), [row]);
  const { kind, machine } = result;

  const resource = getResource(row.resourceId);

  // Switching resource may change the extractor family; pick a valid machine.
  function handleResourceChange(resourceId: string) {
    const newKind = getKindDef(getResource(resourceId));
    const machineId = newKind.machines.some((m) => m.id === row.machineId)
      ? row.machineId
      : newKind.machines[newKind.machines.length - 1].id;
    onChange({ resourceId, machineId });
  }

  function clampOverclock(value: number): number {
    if (Number.isNaN(value)) return OVERCLOCK_MIN;
    return Math.min(OVERCLOCK_MAX, Math.max(OVERCLOCK_MIN, value));
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Row {index + 1}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDuplicate}
            className="inline-flex items-center gap-1 rounded-md border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-md border border-red-800 px-2 py-1 text-xs text-red-300 hover:bg-red-900/40"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            Remove
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Resource — searchable combobox with icons */}
        <div>
          <label className={labelCls}>Resource</label>
          <ResourceSelect value={row.resourceId} onChange={handleResourceChange} />
        </div>

        {/* Purity */}
        <div>
          <label className={labelCls}>Purity</label>
          <select
            className={inputCls}
            value={row.purity}
            disabled={!kind.usesPurity}
            onChange={(e) => onChange({ purity: e.target.value as RowConfig['purity'] })}
          >
            {PURITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Extractor / tier */}
        <div>
          <label className={labelCls}>{kind.label}</label>
          <select
            className={inputCls}
            value={row.machineId}
            disabled={kind.machines.length <= 1}
            onChange={(e) => onChange({ machineId: e.target.value })}
          >
            {kind.machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Count */}
        <div>
          <label className={labelCls}># Extractors</label>
          <input
            type="number"
            min={0}
            step={1}
            className={inputCls}
            value={row.count}
            onChange={(e) => onChange({ count: Math.max(0, Math.floor(Number(e.target.value))) })}
          />
        </div>

        {/* Belt */}
        <div>
          <label className={labelCls}>Belt tier</label>
          <select
            className={inputCls}
            value={row.beltId}
            onChange={(e) => onChange({ beltId: e.target.value })}
          >
            {BELTS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Overclock numeric */}
        <div>
          <label className={labelCls}>Overclock %</label>
          <input
            type="number"
            min={OVERCLOCK_MIN}
            max={OVERCLOCK_MAX}
            step={0.1}
            className={inputCls}
            value={row.overclock}
            onChange={(e) => onChange({ overclock: clampOverclock(Number(e.target.value)) })}
          />
        </div>
      </div>

      {/* Overclock slider spans full width */}
      <div className="mt-3">
        <input
          type="range"
          min={OVERCLOCK_MIN}
          max={OVERCLOCK_MAX}
          step={0.1}
          value={row.overclock}
          onChange={(e) => onChange({ overclock: clampOverclock(Number(e.target.value)) })}
          className="w-full accent-orange-500"
          aria-label="Overclock percentage"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>{OVERCLOCK_MIN}%</span>
          <span>{OVERCLOCK_MAX}%</span>
        </div>
      </div>

      {/* Live output */}
      {result.phase2 ? (
        <div className="mt-3 rounded-lg border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
          <strong>{kind.label}</strong> modelling lands in Phase&nbsp;2 ({resource.name} uses
          satellite nodes). This row is excluded from totals for now.
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Per extractor" value={`${fmt(result.perMachineRate)} ${result.unit}`} />
          <Stat
            label={`Group (×${Math.max(0, Math.floor(row.count))})`}
            value={`${fmt(result.totalRate)} ${result.unit}`}
            emphasis
          />
          <Stat
            label="Effective per extractor"
            value={`${fmt(result.effectivePerMachine)} ${result.unit}`}
          />
          <Stat
            label="Effective group"
            value={`${fmt(result.effectiveTotal)} ${result.unit}`}
          />
        </div>
      )}

      {!result.phase2 && result.bottleneck && (
        <div className="mt-3 rounded-lg border border-red-700/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          ⚠ Bottleneck: each {machine.name} makes {fmt(result.perMachineRate)} {result.unit}, but{' '}
          {BELTS.find((b) => b.id === row.beltId)?.name} caps at {result.beltCapacity}. Effective
          output is limited to {fmt(result.effectivePerMachine)} {result.unit} per extractor.
          {result.maxUsefulOverclock !== null && (
            <>
              {' '}No point overclocking past <strong>{fmt(result.maxUsefulOverclock)}%</strong> on
              this belt
              {smallestBeltFor(result.perMachineRate)
                ? ` — use ${smallestBeltFor(result.perMachineRate)} to carry the full rate.`
                : '.'}
            </>
          )}
        </div>
      )}

      {!result.phase2 &&
        !result.bottleneck &&
        result.maxUsefulOverclock !== null &&
        result.maxUsefulOverclock < OVERCLOCK_MAX && (
          <p className="mt-2 text-xs text-slate-500">
            Tip: on this node + belt, overclocking past{' '}
            <strong className="text-slate-400">{fmt(result.maxUsefulOverclock)}%</strong> would
            exceed the {BELTS.find((b) => b.id === row.beltId)?.name} limit ({result.beltCapacity}{' '}
            {result.unit}).
          </p>
        )}
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="rounded-lg bg-slate-900/70 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={emphasis ? 'text-base font-semibold text-orange-300' : 'text-slate-200'}>
        {value}
      </div>
    </div>
  );
}
