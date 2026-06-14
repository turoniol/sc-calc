import type { ResourceDef } from '../data/mining';

/** Colored monogram badge used as a lightweight resource icon. */
export default function ResourceIcon({
  resource,
  size = 22,
}: {
  resource: ResourceDef;
  size?: number;
}) {
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
