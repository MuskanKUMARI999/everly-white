export function CollectionStatsStrip({ stats }: { stats: { value: string; label: string }[] }) {
  // No stats is the normal case for a collection nobody has filled them in for, and the wrapper
  // carries its own top/bottom rules and padding — so returning it empty drew a bare bordered band
  // across the page. Admin → Collections promises "leave empty to hide the strip"; this is what
  // makes that true.
  if (stats.length === 0) return null;

  return (
    <div className="mx-auto mt-14 flex max-w-105 items-center justify-center divide-x divide-neutral-100 border-y border-neutral-100 py-8">
      {stats.map((stat) => (
        <div key={stat.label} className="flex-1 px-6 text-center">
          <p className="font-heading text-3xl text-brown">{stat.value}</p>
          <p className="mt-2 font-body text-[13px] uppercase tracking-[0.06em] text-neutral-300">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
