/**
 * calc.ts — pure, synchronous extraction math. No React, no side effects.
 *
 * Core formula (Satisfactory 1.0, solid Miner):
 *   rate(items/min) = purityMultiplier * (overclock / 100) * baseRate
 *
 * Fluid extractors reuse the same shape; `usesPurity` decides whether the
 * purity multiplier is applied (Water Extractor ignores purity).
 */

import {
  BELTS,
  PURITY_MULTIPLIER,
  getBelt,
  getKindDef,
  getMachine,
  getResource,
  type ExtractorKindDef,
  type MachineTier,
  type Purity,
  type ResourceDef,
} from '../data/mining';

export interface RowConfig {
  id: string;
  resourceId: string;
  purity: Purity;
  machineId: string;
  count: number;
  /** Overclock percent, 0..250. */
  overclock: number;
  beltId: string;
}

export interface RowResult {
  resource: ResourceDef;
  kind: ExtractorKindDef;
  machine: MachineTier;
  unit: string;
  /** Output of a single extractor, ignoring belt limits. */
  perMachineRate: number;
  /** perMachineRate * count, ignoring belt limits. */
  totalRate: number;
  beltCapacity: number;
  /** True when a single extractor out-produces its belt. */
  bottleneck: boolean;
  /** Per-extractor rate actually transportable on the chosen belt. */
  effectivePerMachine: number;
  /** Group rate actually transportable. */
  effectiveTotal: number;
  /**
   * Overclock % at which a single extractor exactly saturates the belt.
   * null when the belt can never be saturated within 0..250%.
   */
  maxUsefulOverclock: number | null;
  /** Phase-2 extractor families (e.g. Resource Well) are not yet modelled. */
  phase2: boolean;
}

const round = (n: number) => Math.round(n * 1000) / 1000;

export function computeRow(cfg: RowConfig): RowResult {
  const resource = getResource(cfg.resourceId);
  const kind = getKindDef(resource);
  const machine = getMachine(kind, cfg.machineId);
  const belt = getBelt(cfg.beltId);

  const purityMult = kind.usesPurity ? PURITY_MULTIPLIER[cfg.purity] : 1;
  const rateFactor = purityMult * machine.baseRate; // output per 100% overclock

  const perMachineRate = round(rateFactor * (cfg.overclock / 100));
  const count = Math.max(0, Math.floor(cfg.count));
  const totalRate = round(perMachineRate * count);

  const beltCapacity = belt.capacity;
  const bottleneck = perMachineRate > beltCapacity + 1e-9;
  const effectivePerMachine = round(Math.min(perMachineRate, beltCapacity));
  const effectiveTotal = round(effectivePerMachine * count);

  // Overclock that exactly fills the belt: belt = rateFactor * oc/100.
  let maxUsefulOverclock: number | null = null;
  if (rateFactor > 0) {
    const oc = (beltCapacity / rateFactor) * 100;
    if (oc <= 250 + 1e-9) maxUsefulOverclock = round(Math.min(oc, 250));
  }

  return {
    resource,
    kind,
    machine,
    unit: kind.unit,
    perMachineRate,
    totalRate,
    beltCapacity,
    bottleneck,
    effectivePerMachine,
    effectiveTotal,
    maxUsefulOverclock,
    phase2: kind.phase === 2,
  };
}

export interface ResourceTotal {
  resourceId: string;
  resourceName: string;
  unit: string;
  /** Sum of theoretical output across rows (ignoring belt limits). */
  totalRate: number;
  /** Sum of belt-limited output across rows. */
  effectiveTotal: number;
}

/** Aggregate per-resource totals across all rows (phase-2 rows excluded). */
export function aggregateTotals(rows: RowConfig[]): ResourceTotal[] {
  const map = new Map<string, ResourceTotal>();
  for (const cfg of rows) {
    const r = computeRow(cfg);
    if (r.phase2) continue;
    const existing = map.get(r.resource.id);
    if (existing) {
      existing.totalRate = round(existing.totalRate + r.totalRate);
      existing.effectiveTotal = round(existing.effectiveTotal + r.effectiveTotal);
    } else {
      map.set(r.resource.id, {
        resourceId: r.resource.id,
        resourceName: r.resource.name,
        unit: r.unit,
        totalRate: r.totalRate,
        effectiveTotal: r.effectiveTotal,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.resourceName.localeCompare(b.resourceName));
}

/** Format a rate for display, trimming trailing zeros. */
export function fmt(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');
}

/** Smallest belt that can carry a per-extractor rate, or null if none can. */
export function smallestBeltFor(rate: number): string | null {
  const belt = BELTS.find((b) => b.capacity >= rate - 1e-9);
  return belt ? belt.name : null;
}
