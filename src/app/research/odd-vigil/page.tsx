import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ODD specification — the vigil (engine vigil-1.0) · Myopic Delirium",
  description:
    "Model description following the ODD protocol (Overview, Design concepts, Details) for the terminal-commitment agent-based model behind the vigil instrument and working paper MD-WP-2026-007.",
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="md-display mt-12 text-[22px] text-[var(--site-ink)]">{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-6 text-[14px] font-semibold text-[var(--site-ink)]">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 max-w-[74ch] text-[13px] leading-relaxed text-[var(--site-body)]">{children}</p>;
}
function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[var(--site-hover)] px-1 py-0.5 text-[12px]">{children}</code>;
}

const params: [string, string, string][] = [
  ["world", "900 × 560 continuous plane; 6 water pools (r = 42), 8 forage patches (r = 16), 3 predators", "fixed"],
  ["population", "46 adults at initialization; floor of 36 adults maintained by immigration; hard cap 140 entities", "fixed"],
  ["baseThirst", "0.0014 hydration per tick (scaled per agent by thirstMul)", "fixed"],
  ["baseHunger", "0.0018 energy per tick", "fixed"],
  ["drinkRate / eatRate", "0.035 / 0.045 per tick, within 40 px of a pool / 16 px of a patch", "fixed"],
  ["speed / predSpeed", "1.7 / 1.85 px per tick", "fixed"],
  ["fleeRange", "64 px — predator distance triggering the safety band (unlatched agents only)", "fixed"],
  ["thirstThreshold", "0.5 — alarm scale: thirst = clamp((0.5 − H)/0.5, 0, 1)", "fixed"],
  ["missionWeight (w)", "2.5 — attention claim of the latched band, scaled by M", "fixed"],
  ["shielding (σ)", "0.30–0.98, user-controlled (default 0.85); per-agent effective shield min(0.995, σ·devotion)", "swept"],
  ["affectDecay (λ)", "0.0015–0.0075, user-controlled (default 0.003); per-agent decay λ/devotion", "swept"],
  ["closeThreshold (θ)", "0.25 — the latch releases when M < θ", "fixed"],
  ["devotion", "per-agent trait: 0.7 + 1.05 · u^1.4, u ~ U(0,1)", "sampled"],
  ["thirstMul", "per-agent metabolic scale: 0.8 + 0.45 · u", "sampled"],
  ["optimizerFrac", "0.25 — fraction of adults that are matched-baseline optimizers (cannot latch)", "fixed"],
  ["lockRange", "120–350 px, user-controlled (default ≈ 247) — predator child-detection radius", "swept"],
  ["matureAge", "520 ticks — children mature into adults", "fixed"],
  ["birthRate", "0.012 per tick, gated on H > 0.8, E > 0.6, no current child, not latched", "fixed"],
];

export default function OddPage() {
  return (
    <div className="min-h-screen bg-[var(--site-bg)]">
      <section className="mx-auto max-w-4xl px-6 pt-12 pb-24">
        <div className="smallcaps text-[11px] text-[var(--site-muted)]">
          <Link href="/research" className="hover:text-[var(--site-ink)]">Research</Link> · model specification
        </div>
        <h1 className="md-display mt-3 text-[38px] leading-[1.08] tracking-[-0.02em] text-[var(--site-ink)]">
          ODD specification: the terminal-commitment model
        </h1>
        <p className="mt-3 max-w-[74ch] text-[12.5px] leading-relaxed text-[var(--site-muted)]">
          Engine <Code>vigil-1.0</Code> · describes the exact update law running in{" "}
          <Link href="/instruments/vigil" className="underline decoration-[var(--site-line)] underline-offset-4">the vigil</Link>{" "}
          and generating the datasets of MD-WP-2026-007. Format follows the ODD protocol (Grimm et al. 2006; 2020
          update) so the model can be audited without reading source. Where this document and the implementation
          disagree, that is a bug in one of them and we want to hear about it.
        </p>

        <H2 id="purpose">1 · Purpose and patterns</H2>
        <P>
          The model asks whether self-destruction can emerge in agents for whom death is never valued, never
          rewarded, and never scripted — as a side effect of the same mechanisms that make long-horizon commitment
          possible. The patterns used for evaluation: (i) a bimodal fate among bereaved agents (death by neglect
          while searching vs. release and survival), (ii) a sharp boundary in the shielding × forgetting plane
          rather than a smooth gradient, (iii) protective forgetting — martyrdom monotonically decreasing in affect
          decay, (iv) matched optimizers never producing the phenomenon at any parameter setting, and (v) regime
          extinction under single-mechanism ablations.
        </P>

        <H2 id="entities">2 · Entities, state variables, and scales</H2>
        <P>
          <b>Adults</b> carry position and velocity; hydration H ∈ [0,1]; energy E ∈ [0,1]; traits devotion and
          thirstMul (sampled at creation, fixed for life); a latch state (latched, grief charge M ∈ [0,1], lossAge,
          remembered loss location memX/memY); an optimizer flag; and a current band label. <b>Children</b> carry
          position, hydration, age, and a parent reference; they follow the parent and mature at 520 ticks.
          <b> Predators</b> carry position, a waypoint, and a capture cooldown (90 ticks). <b>Water pools</b> and
          <b> forage patches</b> are static discs. One tick is the atomic time step; a characteristic run is
          10,000–20,000 ticks. Space is continuous, non-toroidal, 900 × 560.
        </P>

        <H2 id="process">3 · Process overview and scheduling</H2>
        <P>
          Each tick, in fixed order: (1) predators acquire the nearest child within lockRange, move toward it, and
          capture within 24 px if off cooldown — capture removes the child and, if the parent is a non-optimizer
          and the inertial gate is intact, latches the parent&rsquo;s search band at M = 1 with the capture site as
          memory; (2) every agent metabolizes (H falls; adults&rsquo; E falls); (3) latched agents decay M
          exponentially and release when M &lt; θ (a grief-survival if alive); (4) each adult selects exactly one
          band for the tick — search if the latched band holds attention (submodel 7.2), else flee if a predator is
          within 64 px, else drink if H &lt; 0.9, else forage if E &lt; 0.5, else rest near a child or wander; (5)
          movement, drinking, eating, and reproduction execute for the selected band; (6) death occurs at H ≤ 0 —
          recorded as martyrdom iff the agent dies latched; (7) dead entities are removed and the adult floor is
          restored by immigration. State updates are applied immediately (asynchronous within the loop, fixed
          agent order per tick).
        </P>

        <H2 id="design">4 · Design concepts</H2>
        <H3>Basic principles</H3>
        <P>
          Motivation is persistence-gated (an inertial band that latches and releases on its own schedule) rather
          than continuously re-optimized; attention is a single budget for which physiological alarms compete
          without a private channel; memory of the loss is an affect-charged quantity whose decay is slowed by the
          devotion trait. Death is an absorbing state with no value term anywhere in the model.
        </P>
        <H3>Emergence</H3>
        <P>
          The distribution of fates among the bereaved — and the phase boundary between the self-preserving and
          martyrdom regions — emerge from the race between two clocks: exponential release of the latch versus
          linear depletion of hydration under shielding. Neither clock is scripted against the other.
        </P>
        <H3>Adaptation, objectives, learning, prediction</H3>
        <P>
          Band selection is rule-based (no utility function for non-optimizers, no learning, no anticipation).
          Optimizer agents implement the matched baseline: identical body, metabolism, and ecology, but the latch
          never engages — operationally, loss produces no state change beyond losing the child.
        </P>
        <H3>Sensing and interaction</H3>
        <P>
          Agents sense the nearest pool, patch, and predator exactly (no noise); latched agents sense only the
          remembered capture site while the band holds attention. Interaction is indirect (shared resources) plus
          predation.
        </P>
        <H3>Stochasticity</H3>
        <P>
          All randomness flows from a single mulberry32 stream per run, seeded visibly; movement carries small
          random jitter; traits are sampled per agent; predator waypoints and reproduction are stochastic. Runs are
          bit-reproducible given a seed.
        </P>
        <H3>Observation</H3>
        <P>
          Recorded per run: martyr count (died latched), grief-survivals (released alive), children taken,
          plain-thirst deaths (died unlatched — excluded from the martyr-rate denominator by symmetry with the
          cohort protocol), search-tick totals, and per-band population counts. The instrument additionally reports
          a live prediction–observation comparison between the cohort phase map and the field.
        </P>

        <H2 id="init">5 · Initialization</H2>
        <P>
          46 adults placed uniformly; H ~ U(0.55, 1.0), E ~ U(0.5, 1.0), age ~ U(0, 300); six of them receive a
          child. Pools, patches, and predators placed uniformly at the margins given in the parameter table.
          Initial latches: none. Seed printed in the instrument header and recorded in every dataset row.
        </P>

        <H2 id="input">6 · Input data</H2>
        <P>The model uses no external input data. All dynamics are endogenous.</P>

        <H2 id="submodels">7 · Submodels</H2>
        <H3>7.1 · Latch and release</H3>
        <P>
          On capture of its child, a non-optimizer parent (gate intact) sets latched = true, M = 1, lossAge = 0.
          Each tick, lossAge increments and M = exp(−(λ / devotion) · lossAge). Release at M &lt; θ = 0.25. Higher
          devotion therefore slows forgetting and widens the effective shield simultaneously — one trait, two
          couplings, which is the point.
        </P>
        <H3>7.2 · Attention contest (the core equation)</H3>
        <P>
          thirst = clamp((0.5 − H)/0.5, 0, 1); effShield = min(0.995, σ · devotion); effThirst = thirst · (1 −
          effShield · M); maintenance share = effThirst / (effThirst + w·M + 10⁻⁶). The search band holds attention
          iff the maintenance share &lt; 0.5. Under the <i>private alarm channel</i> ablation, the search band
          additionally never holds attention while thirst &gt; 0.12. Under the <i>gate</i> ablation, the latch never
          engages at all.
        </P>
        <H3>7.3 · Cohort Monte Carlo (the phase map)</H3>
        <P>
          Each cell of the 14 × 14 map fixes (λ, σ) on the ranges in the table and simulates bereavements directly
          under submodels 7.1–7.2 in one dimension: initial H ~ U(0.78, 0.98), pool distance D ~ U(50, 230),
          devotion and thirstMul sampled as in the field; the agent stands at the loss site and commutes along the
          agent–pool axis as the attention contest dictates, drinking within 40 px. Outcomes: died latched
          (martyrdom, 1), released and recovered to H ≥ 0.6 (survival, 0), died unlatched (excluded). 60 counted
          trials per cell in the instrument; 120 in the published dataset.
        </P>

        <H2 id="params">Parameter table</H2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-[var(--site-line)] text-left">
                <th className="py-2 pr-4 font-semibold text-[var(--site-ink)]">Parameter</th>
                <th className="py-2 pr-4 font-semibold text-[var(--site-ink)]">Value / rule</th>
                <th className="py-2 font-semibold text-[var(--site-ink)]">Role</th>
              </tr>
            </thead>
            <tbody>
              {params.map(([k, v, r]) => (
                <tr key={k} className="border-b border-[var(--site-line)] align-top">
                  <td className="py-2 pr-4 text-[var(--site-ink)]">{k}</td>
                  <td className="py-2 pr-4 text-[var(--site-body)]">{v}</td>
                  <td className="py-2 text-[var(--site-muted)]">{r}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <P>
          Reference: Grimm, V. et al. (2020). The ODD protocol for describing agent-based and other simulation
          models: a second update to improve clarity, replication, and structural realism. <i>JASSS</i> 23(2), 7.
        </P>
      </section>
    </div>
  );
}
