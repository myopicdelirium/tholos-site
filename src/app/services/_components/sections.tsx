export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--site-line)] py-10 md:grid md:grid-cols-[220px_1fr] md:gap-x-12">
      <h2 className="smallcaps text-[11px] leading-[2] text-[var(--site-accent)]">{label}</h2>
      <div className="mt-4 md:mt-0">{children}</div>
    </div>
  );
}

export function Rows({
  rows,
  labelWidth = "170px",
}: {
  rows: ReadonlyArray<readonly [string, string]>;
  labelWidth?: string;
}) {
  return (
    <div>
      {rows.map(([name, body], i) => (
        <div
          key={name}
          className={`grid gap-x-8 py-4 sm:grid-cols-[var(--rowlabel)_1fr] ${i > 0 ? "border-t border-[var(--site-line)]" : "pt-0"}`}
          style={{ ["--rowlabel" as string]: labelWidth }}
        >
          <div className="text-[13.5px] leading-relaxed text-[var(--site-ink)]">{name}</div>
          <p className="text-[13.5px] leading-relaxed text-[var(--site-body)]">{body}</p>
        </div>
      ))}
    </div>
  );
}
