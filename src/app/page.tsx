import PlateCanvas from "./_components/home/gallery/PlateCanvas"

export default function Home() {
  return (
    <main className="bg-[var(--site-bg)]">
      {/* Panel I — the exhibition */}
      <section className="relative flex min-h-screen flex-col p-8 pb-6 sm:p-12 sm:pb-8">
        <h1 className="md-display max-w-[9ch] text-[clamp(44px,8vw,92px)] leading-[.94] tracking-[-0.02em] text-[var(--site-ink)]">
          Myopic Delirium
        </h1>
        <div className="mt-6 flex flex-1 flex-col border border-[var(--nav-bg)] p-4 sm:p-6">
          <div className="relative flex-1 bg-[rgb(var(--plate-bg))]">
            <PlateCanvas kind="consensus" className="absolute inset-0" />
          </div>
        </div>
        <div className="mt-[18px] h-[2px] w-full bg-[var(--site-accent)]" />
      </section>

      {/* Panel II — the mission (text left, framed piece right) */}
      <section className="grid min-h-screen grid-cols-1 md:grid-cols-[0.94fr_1.06fr]">
        <div className="flex flex-col justify-center px-8 py-16 sm:px-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-[var(--site-muted)]">
            <span className="text-[var(--site-accent)]">Nº II</span>&nbsp;&nbsp;/&nbsp;&nbsp;Our Mission
          </div>
          <p className="mt-6 max-w-[46ch] text-[clamp(15px,1.5vw,17px)] leading-[1.7] text-[var(--site-body)]">
            Myopic Delirium is a student-led research group enriching agent architectures for large-scale social
            simulation. Agents stand in for people — yet across the field they are treated as convenient characters,
            tuned until the results flatter whoever paid for them.
          </p>
          <p className="mt-4 max-w-[48ch] text-[13px] leading-[1.75] text-[var(--site-muted)]">
            We assert ourselves on experimentation devoid of imposed structure and ideology, building dynamic, emergent
            systems rather than fixed incentives. The rigor of those systems, and the uncertainty of their outcomes,
            gave us our name.
          </p>
        </div>
        <div className="flex items-center justify-center px-8 pb-10 pt-2 sm:p-12 md:p-14">
          <div className="flex aspect-[4/5] w-full max-w-[520px] flex-col border border-[var(--nav-bg)] p-4 sm:p-5">
            <div className="relative flex-1 bg-[rgb(var(--plate-bg))]">
              <PlateCanvas kind="consensus" seed={3} className="absolute inset-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Panel III — the technical (framed piece left, text right) */}
      <section className="grid min-h-screen grid-cols-1 md:grid-cols-[1.06fr_0.94fr]">
        <div className="flex items-center justify-center px-8 pb-10 pt-2 sm:p-12 md:order-1 md:p-14">
          <div className="flex aspect-[4/5] w-full max-w-[520px] flex-col border border-[var(--nav-bg)] p-4 sm:p-5">
            <div className="relative flex-1 bg-[rgb(var(--plate-bg))]">
              <PlateCanvas kind="consensus" seed={7} className="absolute inset-0" />
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center px-8 py-16 sm:px-14 md:order-2">
          <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-[var(--site-muted)]">
            <span className="text-[var(--site-accent)]">Nº III</span>&nbsp;&nbsp;/&nbsp;&nbsp;The Technical
          </div>
          <p className="mt-6 max-w-[52ch] text-[13px] leading-[1.75] text-[var(--site-body)]">
            Our initiative developed with a small core team, most of whom had worked in the development of limited
            models — RBC / New Keynesian DSGE models, CGE and IAM policy workhorses, macroprudential scenario models,
            and shallow, goal-seeking ABMs. Our core model is a hybrid cognitive-institutional ABM, treating bounded
            cognition as the state space and using ensemble runs with sensitivity and ablation to map regime structures
            of social emergence.
          </p>
          <p className="mt-4 max-w-[54ch] text-[12.5px] leading-[1.75] text-[var(--site-muted)]">
            Experiments are designed for reproducible batch execution across multi-core CPU infrastructure. We are
            grateful to the Stevens Institute of Technology&rsquo;s Research Computing Services for access to the JARVIS
            cluster, and the Hanlon Financial Systems Center for compute that supported this work.
          </p>
          <p className="mt-4 max-w-[54ch] text-[12.5px] leading-[1.75] text-[var(--site-muted)]">
            We currently maintain 21 core members across four teams: Agent Cognition and Behavioral Mechanics (ABBY),
            Research Software and Reproducibility (RODY), Empirical Methods, Metrics and Validation (EMMY), and
            High-Performance Simulation Systems (HOBY).
          </p>
        </div>
      </section>
    </main>
  )
}
