export const metadata = {
  title: "Preview | Myopic Delirium",
  description: "Preview layer for work in progress and internal releases.",
};

export default function PreviewPage() {
  return (
    <main className="w-full">
      <section className="paper border-b rule">
        <div className="mx-auto w-full max-w-6xl px-8 py-14">
          <div className="text-[11px] uppercase tracking-[0.34em] text-brass">Myopic Delirium</div>
          <h1 className="md-display text-5xl tracking-tight mt-3">Preview</h1>
          <p className="mt-4 max-w-3xl text-sm text-[#1b1b1b]/80 leading-relaxed">
            Work in progress modules, internal demos, and draft artifacts intended for collaborators.
          </p>
        </div>
      </section>
    </main>
  );
}
