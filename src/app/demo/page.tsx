export default function Demo() {
  return (
    <section className="space-y-6">
      <h1 className="text-4xl tracking-tight font-semibold">TTTTT</h1>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="paper shadow-paper border rule rounded-2xl p-6 lg:col-span-4">
          <div className="smallcaps text-[11px] text-brass">TTTTT</div>
          <div className="mt-4 text-[rgb(var(--ink))/0.78]">WWWWW</div>

          <div className="mt-6 grid gap-3">
            <div className="rounded-xl border rule p-4 bg-[rgb(var(--ivory))/0.55] mono text-sm">WWWWW</div>
            <div className="rounded-xl border rule p-4 bg-[rgb(var(--ivory))/0.55] mono text-sm">WWWWW</div>
            <div className="rounded-xl border rule p-4 bg-[rgb(var(--ivory))/0.55] mono text-sm">WWWWW</div>
          </div>

          <div className="mt-6 flex gap-3">
            <button className="rounded-xl px-4 py-2 bg-[rgb(var(--teal))] text-[rgb(var(--mist))] border border-[rgb(var(--brass))/0.35]">
              TTTTT
            </button>
            <button className="rounded-xl px-4 py-2 bg-transparent border rule text-[rgb(var(--ink))/0.8]">
              TTTTT
            </button>
          </div>
        </div>

        <div className="paper shadow-paper border rule rounded-2xl p-6 lg:col-span-8">
          <div className="flex items-baseline justify-between gap-6">
            <div className="smallcaps text-[11px] text-brass">TTTTT</div>
            <div className="mono text-[11px] text-brass">TTTTT</div>
          </div>

          <div className="mt-4 rounded-2xl border rule bg-[rgb(var(--teal))/0.06] p-6">
            <div className="text-[rgb(var(--ink))/0.85]">WWWWW</div>
            <div className="mt-2 text-sm text-[rgb(var(--ink))/0.6]">WWWWW</div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border rule bg-[rgb(var(--ivory))/0.55] p-4">
              <div className="smallcaps text-[11px] text-brass">TTTTT</div>
              <div className="mt-2 mono text-sm">WWWWW</div>
            </div>
            <div className="rounded-2xl border rule bg-[rgb(var(--ivory))/0.55] p-4">
              <div className="smallcaps text-[11px] text-brass">TTTTT</div>
              <div className="mt-2 mono text-sm">WWWWW</div>
            </div>
            <div className="rounded-2xl border rule bg-[rgb(var(--ivory))/0.55] p-4">
              <div className="smallcaps text-[11px] text-brass">TTTTT</div>
              <div className="mt-2 mono text-sm">WWWWW</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
