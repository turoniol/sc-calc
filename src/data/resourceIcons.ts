/**
 * Resource icons — real in-game item icons (64px) sourced from the open-source
 * SatisfactoryTools project (github.com/greeny/SatisfactoryTools), themselves
 * extracted from Satisfactory by Coffee Stain Studios. Bundled locally so the
 * app has no runtime dependency on third-party hosts.
 *
 * Files live in ../assets/icons/<resourceId>.png and are imported as hashed
 * URLs at build time.
 */
const modules = import.meta.glob('../assets/icons/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const RESOURCE_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const id = path.split('/').pop()!.replace(/\.png$/, '');
    return [id, url];
  }),
);

export function resourceIconUrl(id: string): string | undefined {
  return RESOURCE_ICONS[id];
}
