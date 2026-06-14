/** Row factory + JSON import/export helpers for the calculator state. */

import { DEFAULT_BELT_ID, RESOURCES, getKindDef, getResource } from './data/mining';
import type { RowConfig } from './lib/calc';

let counter = 0;
function nextId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  counter += 1;
  return `row-${Date.now()}-${counter}`;
}

export function createRow(partial: Partial<RowConfig> = {}): RowConfig {
  const resourceId = partial.resourceId ?? RESOURCES[0].id;
  const kind = getKindDef(getResource(resourceId));
  return {
    resourceId,
    purity: 'normal',
    machineId: kind.machines[kind.machines.length - 1].id,
    count: 1,
    overclock: 100,
    beltId: DEFAULT_BELT_ID,
    ...partial,
    // id is always fresh, even when importing/cloning external data.
    id: nextId(),
  };
}

export function duplicateRow(row: RowConfig): RowConfig {
  return { ...row, id: nextId() };
}

const STATE_VERSION = 1;

interface SerializedState {
  version: number;
  rows: RowConfig[];
}

export function exportRows(rows: RowConfig[]): string {
  const payload: SerializedState = { version: STATE_VERSION, rows };
  return JSON.stringify(payload, null, 2);
}

export function importRows(json: string): RowConfig[] {
  const parsed = JSON.parse(json) as Partial<SerializedState> | RowConfig[];
  const rawRows = Array.isArray(parsed) ? parsed : parsed.rows;
  if (!Array.isArray(rawRows)) {
    throw new Error('Invalid file: no "rows" array found.');
  }
  return rawRows.map((r) =>
    createRow({
      resourceId: r.resourceId,
      purity: r.purity,
      machineId: r.machineId,
      count: r.count,
      overclock: r.overclock,
      beltId: r.beltId,
    }),
  );
}
