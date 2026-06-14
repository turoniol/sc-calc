import type { ResourceDef } from '../data/mining';
import { resourceIconUrl } from '../data/resourceIcons';

/**
 * Resource icon. Renders the real in-game item icon when available, otherwise
 * falls back to a colored monogram badge (keeps the UI resilient for resources
 * that don't yet have an image).
 */
export default function ResourceIcon({
  resource,
  size = 22,
}: {
  resource: ResourceDef;
  size?: number;
}) {
  const url = resourceIconUrl(resource.id);

  if (url) {
    return (
      <img
        src={url}
        alt={resource.name}
        title={resource.name}
        draggable={false}
        loading="lazy"
        className="shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded font-bold leading-none ring-1 ring-black/20"
      style={{
        width: size,
        height: size,
        backgroundColor: resource.color,
        color: resource.textColor,
        fontSize: Math.max(8, Math.round(size * 0.4)),
      }}
      title={resource.name}
    >
      {resource.short}
    </span>
  );
}
