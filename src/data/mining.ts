/**
 * mining.ts — single source of truth for Satisfactory 1.0 extraction data.
 *
 * These numbers are STABLE game-design constants and are intentionally
 * hardcoded here (they are NOT derived from the game's Docs.json — raw-resource
 * extraction recipes are not present in Docs.json).
 *
 * Sources: Satisfactory 1.0 in-game values / official wiki.
 *   - Miner default mining speed: Mk.1 = 60, Mk.2 = 120, Mk.3 = 240 items/min
 *   - Node purity multiplier: Impure = 0.5, Normal = 1, Pure = 2
 *   - Overclock range: 0% .. 250%
 *   - Water Extractor: fixed 120 m³/min (no node purity), overclockable
 *   - Oil Extractor: 120 m³/min on a Normal node (Impure 60 / Pure 240)
 *   - Belt throughput: Mk.1 60, Mk.2 120, Mk.3 270, Mk.4 480, Mk.5 780, Mk.6 1200
 */

export type Purity = 'impure' | 'normal' | 'pure';

/** Extractor families. Each behaves differently w.r.t. purity / unit. */
export type ExtractorKind =
  | 'miner'
  | 'waterExtractor'
  | 'oilExtractor'
  | 'resourceWell';

export const PURITIES: { id: Purity; name: string; multiplier: number }[] = [
  { id: 'impure', name: 'Impure', multiplier: 0.5 },
  { id: 'normal', name: 'Normal', multiplier: 1 },
  { id: 'pure', name: 'Pure', multiplier: 2 },
];

export const PURITY_MULTIPLIER: Record<Purity, number> = {
  impure: 0.5,
  normal: 1,
  pure: 2,
};

/** Overclock bounds (percent). */
export const OVERCLOCK_MIN = 0;
export const OVERCLOCK_MAX = 250;

export interface MachineTier {
  id: string;
  name: string;
  /** Output at Normal purity (multiplier = 1) and 100% overclock. */
  baseRate: number;
}

export interface ExtractorKindDef {
  kind: ExtractorKind;
  label: string;
  /** Whether node purity affects the output rate. */
  usesPurity: boolean;
  unit: 'items/min' | 'm³/min';
  machines: MachineTier[];
  /** Implementation phase. Phase 2 kinds are placeholders only. */
  phase: 1 | 2;
}

export const EXTRACTOR_KINDS: Record<ExtractorKind, ExtractorKindDef> = {
  miner: {
    kind: 'miner',
    label: 'Miner',
    usesPurity: true,
    unit: 'items/min',
    phase: 1,
    machines: [
      { id: 'mk1', name: 'Miner Mk.1', baseRate: 60 },
      { id: 'mk2', name: 'Miner Mk.2', baseRate: 120 },
      { id: 'mk3', name: 'Miner Mk.3', baseRate: 240 },
    ],
  },
  oilExtractor: {
    kind: 'oilExtractor',
    label: 'Oil Extractor',
    usesPurity: true,
    unit: 'm³/min',
    phase: 1,
    machines: [{ id: 'oil', name: 'Oil Extractor', baseRate: 120 }],
  },
  waterExtractor: {
    kind: 'waterExtractor',
    label: 'Water Extractor',
    usesPurity: false,
    unit: 'm³/min',
    phase: 1,
    machines: [{ id: 'water', name: 'Water Extractor', baseRate: 120 }],
  },
  resourceWell: {
    kind: 'resourceWell',
    label: 'Resource Well Pressurizer',
    usesPurity: true,
    unit: 'm³/min',
    phase: 2,
    machines: [{ id: 'pressurizer', name: 'Resource Well Pressurizer', baseRate: 60 }],
  },
};

export interface ResourceDef {
  id: string;
  name: string;
  extractor: ExtractorKind;
}

/**
 * Selectable resources. The dropdown order roughly follows the unlock order in
 * game. Each resource is bound to the extractor family that harvests it.
 */
export const RESOURCES: ResourceDef[] = [
  { id: 'ironOre', name: 'Iron Ore', extractor: 'miner' },
  { id: 'copperOre', name: 'Copper Ore', extractor: 'miner' },
  { id: 'limestone', name: 'Limestone', extractor: 'miner' },
  { id: 'coal', name: 'Coal', extractor: 'miner' },
  { id: 'cateriumOre', name: 'Caterium Ore', extractor: 'miner' },
  { id: 'rawQuartz', name: 'Raw Quartz', extractor: 'miner' },
  { id: 'sulfur', name: 'Sulfur', extractor: 'miner' },
  { id: 'bauxite', name: 'Bauxite', extractor: 'miner' },
  { id: 'uranium', name: 'Uranium', extractor: 'miner' },
  { id: 'sam', name: 'SAM', extractor: 'miner' },
  { id: 'crudeOil', name: 'Crude Oil', extractor: 'oilExtractor' },
  { id: 'water', name: 'Water', extractor: 'waterExtractor' },
  { id: 'nitrogenGas', name: 'Nitrogen Gas', extractor: 'resourceWell' },
];

export interface BeltDef {
  id: string;
  name: string;
  /** Max throughput in items/min (or m³/min for fluids). */
  capacity: number;
}

export const BELTS: BeltDef[] = [
  { id: 'mk1', name: 'Belt Mk.1', capacity: 60 },
  { id: 'mk2', name: 'Belt Mk.2', capacity: 120 },
  { id: 'mk3', name: 'Belt Mk.3', capacity: 270 },
  { id: 'mk4', name: 'Belt Mk.4', capacity: 480 },
  { id: 'mk5', name: 'Belt Mk.5', capacity: 780 },
  { id: 'mk6', name: 'Belt Mk.6', capacity: 1200 },
];

export const DEFAULT_BELT_ID = 'mk5';

// ---- lookup helpers -------------------------------------------------------

export function getResource(id: string): ResourceDef {
  return RESOURCES.find((r) => r.id === id) ?? RESOURCES[0];
}

export function getBelt(id: string): BeltDef {
  return BELTS.find((b) => b.id === id) ?? BELTS.find((b) => b.id === DEFAULT_BELT_ID)!;
}

export function getKindDef(resource: ResourceDef): ExtractorKindDef {
  return EXTRACTOR_KINDS[resource.extractor];
}

export function getMachine(kind: ExtractorKindDef, machineId: string): MachineTier {
  return kind.machines.find((m) => m.id === machineId) ?? kind.machines[0];
}
