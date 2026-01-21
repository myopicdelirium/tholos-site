import LogbookClient from './_components/LogbookClient'
import { LOGBOOK_ENTRIES } from './_data/entries'

export default function LogbookPage() {
  return (
    <main className="min-h-screen">
      <section className="relative">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/sand.png')" }}
        />
        <div className="absolute inset-0 bg-white/60" />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-28">
          <div className="max-w-3xl">
            <div className="text-[12px] tracking-[0.32em] uppercase text-black/55">
              Logbook
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-black/85 md:text-6xl">
              A living record of what we build
            </h1>
            <p className="mt-5 text-[16px] leading-8 text-black/65">
              Releases, patch notes, working papers, and field updates—written to keep the project
              legible as it evolves.
            </p>
          </div>
        </div>
      </section>

      <div className="bg-transparent">
        <LogbookClient entries={LOGBOOK_ENTRIES} />
      </div>
    </main>
  )
}
