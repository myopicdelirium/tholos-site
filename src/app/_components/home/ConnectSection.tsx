export default function ConnectSection() {
  return (
    <section id="connect" className="border-t border-black/10 bg-[#0b1220] text-[#f4f1ea]">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/70">Connect</div>
          <h2 className="mt-4 text-5xl leading-[1.05] tracking-tight font-semibold">Contact</h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/70">
            Research correspondence and sponsorship inquiries. Expect replies within ~48 hours for general queries.
          </p>
        </div>

        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <div className="space-y-0 border-y border-white/10">
              <div className="grid gap-3 py-6 md:grid-cols-12 md:items-baseline">
                <div className="md:col-span-4 text-[11px] uppercase tracking-[0.28em] text-white/60">General</div>
                <div className="md:col-span-8">
                  <a className="text-xl tracking-tight text-white hover:text-white/90" href="mailto:myopicdelirium@gmail.com">
                    myopicdelirium@gmail.com
                  </a>
                  <div className="mt-2 text-sm text-white/60">Research, collaboration, press. Response window: ~48 hours.</div>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="grid gap-3 py-6 md:grid-cols-12 md:items-baseline">
                <div className="md:col-span-4 text-[11px] uppercase tracking-[0.28em] text-white/60">Sponsorship</div>
                <div className="md:col-span-8">
                  <a className="text-xl tracking-tight text-white hover:text-white/90" href="mailto:felixtinio@gmail.com">
                    felixtinio@gmail.com
                  </a>
                  <div className="mt-2 text-sm text-white/60">Financing, sponsorship, or sensitive matters.</div>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="grid gap-3 py-6 md:grid-cols-12 md:items-baseline">
                <div className="md:col-span-4 text-[11px] uppercase tracking-[0.28em] text-white/60">Phone</div>
                <div className="md:col-span-8">
                  <a className="text-xl tracking-tight text-white hover:text-white/90" href="tel:+15512278031">
                    +1 (551) 227-8031
                  </a>
                  <div className="mt-2 text-sm text-white/60">For time-sensitive coordination only.</div>
                </div>
              </div>

              <div className="h-px bg-white/10" />

              <div className="grid gap-3 py-6 md:grid-cols-12 md:items-baseline">
                <div className="md:col-span-4 text-[11px] uppercase tracking-[0.28em] text-white/60">GitHub</div>
                <div className="md:col-span-8">
                  <a className="text-xl tracking-tight text-white hover:text-white/90" href="https://github.com/myopicdelirium" target="_blank" rel="noreferrer">
                    github.com/myopicdelirium
                  </a>
                  <div className="mt-2 text-sm text-white/60">Public artifacts and selected releases.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/60">How to write</div>
              <div className="mt-4 text-lg leading-7 text-white/80">
                Include a short abstract and what you’re asking for. If it’s technical, include a link to the relevant page or document.
              </div>
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6 text-xs uppercase tracking-[0.28em] text-white/45">
                <span>Myopic Delirium</span>
                <span>Correspondence</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 text-xs text-white/40">
          © {new Date().getFullYear()} Myopic Delirium
        </div>
      </div>
    </section>
  )
}
