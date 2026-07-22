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
      <section className="grid min-h-screen grid-cols-1 md:grid-cols-[1fr_1fr]">
        <div className="flex flex-col justify-center px-8 py-20 sm:px-14">
          <div aria-hidden className="h-[2px] w-14 bg-[var(--site-accent)]" />
          <p className="md-display mt-8 max-w-[45rem] text-balance text-[clamp(22px,2.5vw,34px)] leading-[1.22] tracking-[-0.01em] text-[var(--site-ink)]">
            We are a research group studying the distance between what people intend and what people, together,
            produce.
          </p>
          <p className="mt-8 max-w-[45rem] hyphens-auto text-justify text-[clamp(14.5px,1.1vw,16px)] leading-[1.85] text-[var(--site-body)]">
            Using agent-based modeling, we specify how one individual behaves, what it needs, what it can perceive,
            what it does about it, and then run many of them at once and observe the society that results. The durable
            finding of the field, going back to Thomas Schelling, is that the society is usually not a scaled-up
            version of anyone&rsquo;s intention. Mild individual preferences produce extreme collective outcomes. Nobody
            chooses the result, and everybody builds it.
          </p>
          <p className="mt-5 max-w-[45rem] hyphens-auto text-justify text-[clamp(14.5px,1.1vw,16px)] leading-[1.85] text-[var(--site-body)]">
            The work here starts from ordinary survival with agents in a landscape with water, food, heat, and
            predators and builds toward agents with the constraints that actually characterize human beings: memory
            that distorts what it stores, attention too narrow to hold everything that matters, needs that only become
            prioritized once more basic ones satisfied. The aim is not to show that some phenomenon can emerge, but to
            model that phenomenon carefully enough that its accompaniments become visible. That includes the costs,
            dependencies, and side effects that travel with it and that we routinely fail to notice in ourselves. This
            site holds the work we can safely make public.
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

      {/* Panel III — the argument (framed piece left, text right) */}
      <section className="grid min-h-screen grid-cols-1 md:grid-cols-[0.8fr_1.2fr]">
        <div className="flex items-center justify-center px-8 pb-10 pt-2 sm:p-12 md:order-1 md:p-14">
          <div className="flex aspect-[4/5] w-full max-w-[420px] flex-col border border-[var(--nav-bg)] p-4 sm:p-5">
            <div className="relative flex-1 bg-[rgb(var(--plate-bg))]">
              <PlateCanvas kind="consensus" seed={7} className="absolute inset-0" />
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center px-8 py-20 sm:px-14 md:order-2">
          <div aria-hidden className="h-[2px] w-14 bg-[var(--site-accent)]" />
          <p className="md-display mt-8 max-w-[45rem] text-balance text-[clamp(22px,2.5vw,34px)] leading-[1.22] tracking-[-0.01em] text-[var(--site-ink)]">
            Every law is a hypothesis about human behaviour, executed at full scale, on a live population, with no
            control group and no clean way back.
          </p>
          <p className="mt-8 max-w-[45rem] hyphens-auto text-justify text-[clamp(14.5px,1.1vw,16px)] leading-[1.85] text-[var(--site-body)]">
            The effects of an intervention on a generation emerge over a decade, by which point the decision, the
            government that made it and the conditions it addressed have all changed. Every institution is steering on
            evidence produced by a world that no longer exists. Our work begins below the level of the trend, at the
            point where a person decides what to attend to and what to disregard. Populations built this way can be run
            forward under conditions that have not yet arrived, and run again with the assumptions changed.
          </p>
          <p className="mt-5 max-w-[45rem] hyphens-auto text-justify text-[clamp(14.5px,1.1vw,16px)] leading-[1.85] text-[var(--site-body)]">
            We began this work in 2024. The starting point was an observation that standardised metrics had stopped
            serving as proxies for how a society might improve and had begun to function as statements of what a person
            is worth. The early models were deliberately crude with agents with little more than the drive to persist.
            We added capacity gradually, not to reproduce human experience but to find out what would emerge once
            agency amounted to more than optimisation, whether agents would come to care, to be irrational, to confuse
            themselves, and whether any of it would produce commitments that outranked their most base interests.
            Institutions rarely fail because they misread how a population leans but because its priorities moved
            beneath the instruments used to measure them. Populations of several thousand agents, and tens of thousands
            on high-performance infrastructure, let us examine not what a policy does to an aggregate, but how it
            rearranges the pressures, options and priorities facing each person inside it.
          </p>
        </div>
      </section>
    </main>
  )
}
