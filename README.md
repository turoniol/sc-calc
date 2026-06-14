# Satisfactory Resource Calculator

A static, client-side SPA that calculates **mining & extraction output** for
[Satisfactory](https://www.satisfactorygame.com/) 1.0. Change a node's purity,
extractor tier, count, overclock or belt and the items/min update instantly —
with belt-bottleneck warnings.

No backend, no API keys, no tracking. Everything is computed synchronously in
the browser, so it deploys for free to any static host (GitHub Pages /
Cloudflare Pages / Vercel).

## Features (Phase 1)

- **Extraction rows** — each row is a group of extractors on one node type:
  resource, purity, extractor tier, count, overclock and belt tier.
- **Live math** — every change recalculates immediately; no "Calculate" button.
- **Overclock control** — slider (0–250%, step 0.1) paired with a precise
  numeric field.
- **Belt bottleneck detection** — highlights when a single extractor out-produces
  its belt, shows the *effective* (transportable) rate, and the maximum useful
  overclock for that belt (e.g. a Pure node Miner Mk.3 has no benefit past
  162.5% on a Belt Mk.5, which caps at 780/min).
- **Resource totals** — aggregated theoretical and effective output per resource.
- **Add / duplicate / remove rows.**
- **Export / Import JSON** — state lives in React memory (no localStorage); use
  these buttons to save and restore a setup.

### Calculation model

```
rate (items/min) = purityMultiplier × (overclock / 100) × baseRate
```

| Quantity            | Values                                               |
| ------------------- | ---------------------------------------------------- |
| Purity multiplier   | Impure 0.5 · Normal 1 · Pure 2                        |
| Miner base rate     | Mk.1 60 · Mk.2 120 · Mk.3 240                         |
| Overclock           | 0% – 250%                                             |
| Water Extractor     | 120 m³/min, purity not applicable, overclockable     |
| Oil Extractor       | Impure 60 · Normal 120 · Pure 240 (m³/min), overclocks |
| Belt capacity       | Mk.1 60 · Mk.2 120 · Mk.3 270 · Mk.4 480 · Mk.5 780 · Mk.6 1200 |

All of these live in [`src/data/mining.ts`](src/data/mining.ts) as typed
constants — the single source of truth, with sources noted in comments. These
are stable game-design values and are intentionally **not** parsed from the
game's `Docs.json`.

## Tech stack

React + TypeScript + Vite, styled with Tailwind CSS v4. The build emits static
files to `dist/`.

## Local development

```bash
npm install     # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + produce static build in dist/
npm run preview  # serve the production build locally
```

## Deployment

### GitHub Pages (automated)

A workflow at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds and publishes `dist/` on every push to `main`. One-time setup:

1. In the GitHub repo, go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.
3. Merge this branch into `main` (or push to `main`). The workflow runs and the
   site goes live at `https://<user>.github.io/sc-calc/`.

The Vite `base` is set to `./` (relative paths), so the same build works on a
Pages project subpath as well as Cloudflare Pages / Vercel.

### Cloudflare Pages / Vercel (alternative)

1. Connect the repository.
2. Build command: `npm run build`, output directory: `dist`.
3. Every push then redeploys automatically.

## Roadmap (Phase 2)

The data model is built to extend into a full production planner without a
rewrite:

- **Resource Wells** (Nitrogen Gas etc.) — the `resourceWell` extractor family
  is stubbed and flagged in the UI; it needs the multi-satellite-node pressurizer
  model.
- **Recipe tree** — parse the game's `Docs.json` (note: raw-resource extraction
  recipes are *not* in it — those stay in `mining.ts`).
- **Dependency-graph engine** — topologically expand recipe dependencies,
  scaling rates up/down.
- **Alternate recipes & by-products** — the graph becomes a DAG; let the user
  choose recipes at branch points.
- **World-max %** — optional, needs a per-resource node-count table for the map.
