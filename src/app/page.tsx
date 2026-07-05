import ImmersiveHero from "./_components/home/ImmersiveHero"
import HomeAboutPanels from "./_components/home/HomeAboutPanels"
import AgentEcology from "./_components/AgentEcology"

export default function Home() {
  return (
    <main>
      <ImmersiveHero />

      {/* notice */}
      <section className="border-y rule bg-[rgb(var(--ivory))]">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-[12px] leading-relaxed text-[#6a6258]">
            The public interface has been delayed due to unforeseen circumstances.
            Appropriate adjustments have been made and we expect release prior to
            relocation in June 2026. We reserve all intellectual property rights.
            The Tholos set has not been and will not be submitted for publication
            to any journal. Previews of shortened articles will be released in
            our artifacts section beginning April 20, 2026 and June 1, 2026.
          </p>
        </div>
      </section>

      {/* simulation band */}
      <section className="relative bg-[#070d16]">
        <div className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
          <div className="relative w-full overflow-hidden border border-white/[0.06]" style={{ aspectRatio: "16 / 9" }}>
            <AgentEcology className="h-full w-full" />
          </div>
          <p className="mt-4 text-[11px] tracking-[0.18em] text-[#f4f1ea]/25">
            Simplified visualization &mdash; February 27, 2026
          </p>
        </div>
      </section>

      <HomeAboutPanels />
    </main>
  )
}
