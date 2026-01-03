import Link from 'next/link'

export default function AboutSection() {
  return (
    <section className="relative w-screen left-1/2 -translate-x-1/2 bg-[#07090c] text-[#f2efe9]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.9]">
        <div className="absolute inset-0 bg-[radial-gradient(1100px_800px_at_20%_15%,rgba(0,57,79,0.35),transparent_58%),radial-gradient(900px_700px_at_85%_40%,rgba(133,118,101,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.15),rgba(0,0,0,0.85))]" />
      </div>

      <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="max-w-5xl font-serif italic text-[34px] leading-[1.08] tracking-[-0.02em] sm:text-[58px] md:text-[72px]">
          We study how institutions domesticate reality into legible metrics—then we rebuild the missing parts: irrationality, politics, myth, and the human residue that refuses to be modeled.
        </div>

        <div className="mt-10">
          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(242,239,233,0.22)] bg-[rgba(255,255,255,0.06)] px-6 py-3 text-[11px] font-medium uppercase tracking-[0.30em] text-[#f2efe9] shadow-[0_22px_60px_rgba(0,0,0,0.55)] hover:bg-[rgba(255,255,255,0.10)]"
          >
            Learn more
          </Link>
        </div>

        <div className="mt-14 h-px w-full max-w-5xl bg-[rgba(242,239,233,0.12)]" />
      </div>
    </section>
  )
}
