import Link from "next/link";

/** Batch selector shown at the top of every batch page. Server component. */
const BATCHES = [
  { id: "A", href: "/batch-a", label: "Batch A" },
  { id: "B", href: "/batch-b", label: "Batch B" },
];

export default function BatchSwitcher({ current }: { current: "A" | "B" }) {
  return (
    <nav aria-label="Batches" className="flex flex-wrap items-center gap-2">
      {BATCHES.map((b) => {
        const active = b.id === current;
        return (
          <Link
            key={b.id}
            href={b.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-ink)] px-4 py-1.5 text-[12px] tracking-[0.06em] text-[var(--site-bg)]"
                : "rounded-full border border-[var(--site-pill-bd)] bg-[var(--site-pill-bg)] px-4 py-1.5 text-[12px] tracking-[0.06em] text-[var(--site-ink)] hover:bg-[var(--site-hover)]"
            }
          >
            {b.label}
          </Link>
        );
      })}
    </nav>
  );
}
