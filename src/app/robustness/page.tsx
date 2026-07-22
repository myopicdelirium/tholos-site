import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Robustness · Tholos",
  description:
    "How to not trust us, and what survives it. The determinism, falsifiability, causal isolation, and provenance that make the model's numbers defensible — with the exhibits, and an honest account of what is not yet proven.",
};

/* Every number on this page is pulled from the repository, not asserted.
   Discipline is published; the cognitive substance is not. No claim here
   depends on a validation we have not yet run. */

const PINS: [string, string][] = [
  ["a2.yaml : seed 7", "35ca5b57dab5d776c8251153406d44b672df9ae24e940b8ad6f50cfc9845493b"],
  ["a3.yaml : seed 3", "8f243fb14c3184cdb5491f0902c0e5c245508e11a816a6202540dd7fe95942a5"],
  ["a4.yaml : seed 5", "fa4c3af8a18d117680241f4640488c12f465d4ada31f6cfd7973f0b2722c52b0"],
];

export default function RobustnessPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <main className="mx-auto max-w-3xl px-6 pt-14 pb-28">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">Method · Robustness</div>
        <h1 className="md-display mt-4 text-[clamp(38px,7vw,60px)] leading-[1.02] tracking-[-0.02em] text-[var(--site-ink)]">
          How to not trust us
        </h1>
        <p className="mt-6 max-w-[60ch] text-[17px] leading-[1.6] text-[var(--site-body)]">
          A policymaker is not paying for a prediction. They can get predictions for free, and they
          are right not to trust them. They are paying for a prediction they can{" "}
          <em>defend in a hostile room</em> — when the opposing analyst says <span className="italic">you
          made that up</span>, the value of the instrument is entirely whether an answer exists. This
          page is written for that analyst first. It is the case against trusting us, and what
          survives it.
        </p>
        <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.6] text-[var(--site-body)]/85">
          Four properties make a number defensible. Each is enforced in the code, not promised in a
          deck; the exhibits below are pulled from the repository. Where we have not yet proven
          something, it is named as a dated gap, not omitted — because a page with no gaps is the
          thing a fitted model produces.
        </p>

        {/* I — DETERMINISM */}
        <Pillar
          numeral="I"
          title="Auditable determinism"
          lede="Same seed, byte-identical stream. Any output rewindable to the causes that produced it."
        >
          <p>
            There is exactly one master seed per run. From it we spawn four{" "}
            <em>independent, separable</em> streams — environment, spawn, agent, mutation — and the
            global RNG is never touched. Hold the world fixed and vary only spawning, or the reverse;
            the boundary is clean by construction. Every run is reproducible on demand, and no result
            can be an artifact of a lucky draw.
          </p>
          <p className="mt-3">
            The guarantee is nailed down by a test that is really a legal exhibit: three Batch-A
            reference streams, hashed, that a year of added machinery must not move by one bit. If a
            later mechanism leaks into the baseline, the hash changes and the build goes red. It has
            not.
          </p>
          <Exhibit label="tests/pinned_a_hashes.json — SHA-256 of the reference streams">
            <div className="space-y-2">
              {PINS.map(([k, h]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:items-baseline">
                  <span className="mono text-[11px] text-[var(--site-field-ink)]/60">{k}</span>
                  <span className="mono block overflow-x-auto whitespace-nowrap text-[11px] text-[var(--site-field-ink)]">
                    {h}
                  </span>
                </div>
              ))}
            </div>
            <div className="mono mt-3 border-t border-[var(--site-field-bd)] pt-3 text-[11px] text-[var(--site-field-ink)]/60">
              56 tests green · byte-identity holds across every flag added since
            </div>
          </Exhibit>
        </Pillar>

        {/* II — FALSIFIABILITY */}
        <Pillar
          numeral="II"
          title="Falsifiability, with a paper trail"
          lede="The claims were written before the runs. The failures are on the record."
        >
          <p>
            Three cases were preregistered — their mechanisms, measurements, and the conditions under
            which each would be judged wrong — <em>before</em> the runs that decided them. When a
            mechanism failed, the null was logged next to the prediction, not quietly dropped. A model
            that has publicly failed is the only kind whose successes are worth anything, because it
            demonstrates the machinery can say no.
          </p>
          <div className="mt-5 space-y-3">
            <Null
              tag="reported null"
              head="A derived crowd-sense turned out inert."
              body="We tried to let agents infer competition from their own foraging efficiency, with no crowd-perception. The signal was ≈ 0.009 — effectively zero — and forcing the disposition high changed nothing. Recorded as a null and retired, not tuned into life."
            />
            <Null
              tag="reported null"
              head="The invisible hand did not evolve."
              body="Given senses and an evolvable policy with nothing about crowds written in, selfish selection never discovered crowd-avoidance across scarcity, abundance, a frozen control, and an avoidance-favorable regime, both seeds. The coordinated genome is representable — hand-set, it reaches r ≈ 0.89 — but selection walks the other way, into herding. Published as the finding, caveat and all."
            />
          </div>
        </Pillar>

        {/* III — CAUSAL ISOLATION */}
        <Pillar
          numeral="III"
          title="Causal attribution, by construction"
          lede="Every mechanism ships behind a flag with the base pinned. Turn it off; watch the result vanish."
        >
          <p>
            &ldquo;The model shows X&rdquo; is a correlation. &ldquo;X is caused by mechanism Y and
            nothing else&rdquo; is a finding, and it is the difference between a chart and something you
            can defend. Because each mechanism is isolable against a byte-identical baseline, every
            causal claim is checkable by disabling exactly one thing.
          </p>
          <Exhibit label="ablation — coordination is caused by one line of the movement rule">
            <div className="grid grid-cols-2 gap-4">
              <Stat big="0.47" small="greedy foragers · matching r̄" />
              <Stat big="0.90" small="one line changed · matching r̄" tint />
            </div>
            <div className="mono mt-3 border-t border-[var(--site-field-bd)] pt-3 text-[11px] leading-[1.5] text-[var(--site-field-ink)]/60">
              Same seed, same world, same founders. The only difference is a crowd discount in the
              forage rule. Reaches r ≈ 1.0 on four of six seeds; the seed-dependence is reported, not
              hidden.
            </div>
          </Exhibit>
        </Pillar>

        {/* IV — PROVENANCE */}
        <Pillar
          numeral="IV"
          title="Provenance"
          lede="Every claim traces to a commit and a preregistration. The chain is inspectable by someone who does not trust us."
        >
          <p>
            The record is not a summary written after the fact. It is{" "}
            <span className="mono text-[13px]">293</span> commits of hypothesis → mechanism → result,
            each finding tied to the spec that predicted it and the run that tested it. The person whose
            trust is worth having is the one who can walk that chain backwards, and here they can.
          </p>
        </Pillar>

        {/* WHAT IS NOT YET PROVEN */}
        <section className="mt-16">
          <div className="smallcaps text-[11px] text-[var(--site-accent)]">What we have not yet proven</div>
          <p className="mt-4 max-w-[60ch] text-[15px] leading-[1.6] text-[var(--site-body)]/90">
            The properties above make the model <em>honest and auditable</em>. They do not yet make it{" "}
            <em>validated against the world</em>. The distinction is the whole roadmap, and stating it
            plainly is part of the case.
          </p>
          <div className="mt-6 space-y-3">
            <Gap
              when="next"
              head="One held-out quantitative point of contact."
              body="The model reproduces regularities it was never shown — undermatching, and crowd-following (local enhancement) — but those are structural matches, the phenomenon in kind, not a fitted curve. The sentence that converts a skeptic is a pre-registered prediction of a held-out published dataset, stated before the numbers are touched and reported hit or miss. Until it is run, we claim reproduction, not validation."
            />
            <Gap
              when="infrastructure"
              head="Scale."
              body="These runs are hundreds of agents. The aggregate is only statistically honest — and the distribution only grows a real tail — at hundreds of thousands, which is an HPC problem we have scoped but not yet built. We do not imply a population we do not have."
            />
            <Gap
              when="external"
              head="Independent audit."
              body="The strongest version of this page is one where a hostile third party re-runs the determinism and the ablations and cannot break them. That audit has not happened. The door is open to it."
            />
          </div>
        </section>

        {/* BOUNDARY */}
        <section className="mt-16 rounded-[6px] border border-[var(--site-field-bd)] bg-[var(--site-field-bg)] p-6">
          <div className="smallcaps text-[11px] text-[var(--site-field-ink)]/55">The boundary</div>
          <p className="mt-3 text-[15px] leading-[1.6] text-[var(--site-field-ink)]/90">
            This page publishes the <em>proof of discipline</em> — the determinism, the nulls, the
            ablations, the provenance — because a robustness case a skeptic can find and try to break is
            worth more than one in a private file. It does not publish the cognitive architecture, the
            mechanism internals, the thing the instrument is. We show the reason to trust the model; we
            keep the model. That line is deliberate, and it is where the discipline stops being a slogan.
          </p>
        </section>

        <p className="mt-12 max-w-[60ch] text-[15px] leading-[1.6] text-[var(--site-body)]/80">
          None of this is a founder&rsquo;s promise. It is enforced in the test suite: the refusal to be
          tuned toward a flattering conclusion is a red build, not a virtue. That is the one thing a
          fitted model cannot offer, and the reason the not-fitted-to-a-target construction is the
          product and not the disclaimer.
        </p>
      </main>
    </div>
  );
}

/* ─────────────────────────── components ─────────────────────────── */

function Pillar({
  numeral,
  title,
  lede,
  children,
}: {
  numeral: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 border-t border-[var(--site-line)] pt-8">
      <div className="flex items-baseline gap-4">
        <span className="md-display text-[22px] leading-none text-[var(--site-accent)]">{numeral}</span>
        <h2 className="md-display text-[clamp(24px,4vw,32px)] leading-[1.1] tracking-[-0.01em] text-[var(--site-ink)]">
          {title}
        </h2>
      </div>
      <p className="mt-3 max-w-[58ch] text-[15px] font-medium leading-[1.5] text-[var(--site-body)]">
        {lede}
      </p>
      <div className="mt-5 max-w-[60ch] text-[15px] leading-[1.65] text-[var(--site-body)]/85">
        {children}
      </div>
    </section>
  );
}

function Exhibit({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="mt-6 m-0 rounded-[6px] border border-[var(--site-field-bd)] bg-[var(--site-field-bg)] p-5">
      <figcaption className="smallcaps mb-4 text-[10px] text-[var(--site-field-ink)]/55">
        {label}
      </figcaption>
      {children}
    </figure>
  );
}

function Stat({ big, small, tint }: { big: string; small: string; tint?: boolean }) {
  return (
    <div>
      <div
        className="md-display text-[40px] leading-none tracking-[-0.01em]"
        style={{ color: tint ? "rgb(var(--teal))" : "var(--site-field-ink)" }}
      >
        {big}
      </div>
      <div className="mt-2 text-[12px] leading-[1.4] text-[var(--site-field-ink)]/65">{small}</div>
    </div>
  );
}

function Null({ tag, head, body }: { tag: string; head: string; body: string }) {
  return (
    <div className="rounded-[6px] border border-[var(--site-line)] p-4">
      <div className="smallcaps text-[10px] text-[var(--site-accent)]">{tag}</div>
      <div className="mt-2 text-[15px] font-medium text-[var(--site-ink)]">{head}</div>
      <p className="mt-1.5 text-[14px] leading-[1.55] text-[var(--site-body)]/80">{body}</p>
    </div>
  );
}

function Gap({ when, head, body }: { when: string; head: string; body: string }) {
  return (
    <div className="grid gap-2 rounded-[6px] border border-[var(--site-line)] p-4 sm:grid-cols-[7rem_1fr]">
      <div className="mono pt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--site-accent)]">
        {when}
      </div>
      <div>
        <div className="text-[15px] font-medium text-[var(--site-ink)]">{head}</div>
        <p className="mt-1.5 text-[14px] leading-[1.55] text-[var(--site-body)]/80">{body}</p>
      </div>
    </div>
  );
}
