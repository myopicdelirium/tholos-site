export default function ConnectSection() {
  return (
    <section
      id="connect"
      className="relative w-screen left-1/2 -translate-x-1/2 bg-[#0b0f14] text-[#f2efe9]"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.75]">
        <div className="absolute inset-0 bg-[radial-gradient(900px_650px_at_20%_20%,rgba(0,57,79,0.35),transparent_60%),radial-gradient(900px_650px_at_85%_35%,rgba(133,118,101,0.25),transparent_55%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="text-[11px] uppercase tracking-[0.28em] text-[rgba(242,239,233,0.70)]">
          Connect
        </div>

        <div className="mt-6 text-[36px] leading-[1.02] tracking-tight sm:text-[54px]">
          Contact & correspondence
        </div>

        <div className="mt-6 max-w-2xl text-[14px] leading-relaxed text-[rgba(242,239,233,0.78)] sm:text-[15px]">
          Placeholders for now. Later, this becomes the canonical contact surface: email, affiliation, and a public key if you want one.
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[rgba(242,239,233,0.14)] bg-[rgba(255,255,255,0.04)] p-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[rgba(242,239,233,0.60)]">
              Email
            </div>
            <div className="mt-3 text-[15px] text-[#f2efe9]">hello@myopicdelirium.org</div>
            <div className="mt-2 text-[13px] leading-relaxed text-[rgba(242,239,233,0.70)]">
              General inquiries, collaborators, press.
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(242,239,233,0.14)] bg-[rgba(255,255,255,0.04)] p-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[rgba(242,239,233,0.60)]">
              Phone
            </div>
            <div className="mt-3 text-[15px] text-[#f2efe9]">+1 (000) 000-0000</div>
            <div className="mt-2 text-[13px] leading-relaxed text-[rgba(242,239,233,0.70)]">
              Optional. You can remove this entirely.
            </div>
          </div>

          <div className="rounded-2xl border border-[rgba(242,239,233,0.14)] bg-[rgba(255,255,255,0.04)] p-5">
            <div className="text-[11px] uppercase tracking-[0.24em] text-[rgba(242,239,233,0.60)]">
              Notes
            </div>
            <div className="mt-3 text-[15px] text-[#f2efe9]">Response window: 48–72h</div>
            <div className="mt-2 text-[13px] leading-relaxed text-[rgba(242,239,233,0.70)]">
              Include a short abstract + what you’re asking for.
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[rgba(242,239,233,0.12)] pt-8">
          <div className="text-[12px] uppercase tracking-[0.22em] text-[rgba(242,239,233,0.60)]">
            Myopic Delirium
          </div>
          <div className="text-[12px] font-mono text-[rgba(242,239,233,0.55)]">
            correspondence surface · placeholder
          </div>
        </div>
      </div>
    </section>
  )
}
