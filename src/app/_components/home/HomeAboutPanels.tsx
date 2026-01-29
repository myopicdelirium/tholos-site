"use client"

import Image from "next/image"
import PulpheadPanel from "../about/PulpheadPanel"

const OUR_MISSION_TITLE = "OUR MISSION"
const OUR_MISSION_TEXT = [
  "Myopic Delirium is a student-led research group focused on enriching agent architectures for large-scale social simulation. In these environments, agents are fundamentally representative of people, but across the board they are being treated as convenient characters. Despite notions of rigor and unbiased intent, the dominant use of models for social simulations at scale is to support and justify frameworks that institutions need to believe to maximize success. Influential banks create agents with shallow incentives based primarily on monetary goals, while leisure and any inefficiencies serve solely as frictions. Niche religions and spiritual organizations use rewrite assumptions of human nature and capabilities to develop utopic simulations that demonstrate the validity and absolutely true nature of their ideology. In each case the principles of the group are always directly reflected in the predictably supportive results they yield.",
  "As an initiative, we assert ourselves on experimentation devoid of necessary structure and ideology, focused on the development of dynamic, emergent systems rather than fixed incentives. The rigor and ambition of our systems is accompanied by an uncertainty in their outcomes that gave us our name.",
]

const TECH_TITLE = "THE TECHNICAL"
const TECH_TEXT = [
  "Our initiative developed with a small core team, most of which had worked in the development of limited models. That includes RBC / New Keynesian DSGE Models, CGE and IAM policy workhorses, macroprudential scenario model, and shallow, goal-seeking ABM models. Our best definition of our core model is a hybrid cognitive-institutional ABM, treating bounded cognition as the state space and using ensemble runs with sensitivity and ablation to map regime structures of social emergence.",
  "Our experiments are designed for reproducible batch execution: we run ensembles on multi-core CPU infrastructure (workstations and HPC-style environments), with storage and logging optimized for large parameter sweeps. We are extremely grateful to the Stevens Institute of Technology’s Research Computing Services for access to the JARVIS cluster, and the Hanlon Financial Systems Center for providing compute resources that supported this work. We would also like to thank KTH Royal Institute of Technology and the PDC Center for High Performance Computing (NAISS) for providing initial access and support that enabled us to begin this work on high-performance computing infrastructure.",
  "We have been grateful to receive input from some of the foremost experts across critical domains, but currently maintain 21 core members and have formed four teams: Agent Cognition & Behavioral Mechanics (ABBY); Research Software & Reproducibility (RODY); Empirical Methods, Metrics & Validation (EMMY); High-Performance Simulation Systems (HOBY). Our collective experience is extensive, including members and former members of the MEB Biostatics group at the Karolinska Institutet, Vienna Center for Experimental Economics at Universität Wien, along with participants at Treehacks 2026 and Hack the North in Waterloo.",
]

const PREVIEW_TITLE = "PREVIEW"
const PREVIEW_TEXT = ["Work in progress modules, internal demos, and draft artifacts intended for collaborators."]

const IMAGE_MISSION = "/images/cope.png"
const IMAGE_TECH = "/images/stock.png"

const PULPHEAD_IMAGE = "/images/sred.png"
const PULPHEAD_TITLE = "The Pulphead Initiative"

function StickyPlate(props: { title: string; text: string[]; imageSrc: string; flip?: boolean }) {
  const flip = Boolean(props.flip)

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1480px] px-8 py-12 sm:py-14">
        <div className="text-center">
          <div className="text-[14px] sm:text-[15px] font-semibold tracking-[0.34em] text-black/80">
            {props.title}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 gap-12 lg:gap-16">
          {!flip ? (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[380px_1fr] lg:gap-16">
              <aside className="space-y-10">
                {props.text.map((p, i) => (
                  <p
                    key={i}
                    className="font-serif text-[18px] sm:text-[19px] leading-[1.95] tracking-[-0.01em] text-black/62"
                  >
                    {p}
                  </p>
                ))}
                <div className="h-[8vh] lg:h-[10vh]" />
              </aside>

              <div className="relative">
                <div className="lg:sticky lg:top-24">
                  <div className="relative w-full overflow-hidden bg-transparent">
                    <div className="relative h-[32vh] w-full sm:h-[36vh] lg:h-[46vh]">
                      <Image
                        src={props.imageSrc}
                        alt={props.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 75vw, 100vw"
                        priority={false}
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02),rgba(0,0,0,0.00),rgba(0,0,0,0.02))]" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
              <div className="relative">
                <div className="lg:sticky lg:top-24">
                  <div className="relative w-full overflow-hidden bg-transparent">
                    <div className="relative h-[32vh] w-full sm:h-[36vh] lg:h-[46vh]">
                      <Image
                        src={props.imageSrc}
                        alt={props.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 75vw, 100vw"
                        priority={false}
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.02),rgba(0,0,0,0.00),rgba(0,0,0,0.02))]" />
                  </div>
                </div>
              </div>

              <aside className="space-y-10 lg:pl-2">
                {props.text.map((p, i) => (
                  <p
                    key={i}
                    className="font-serif text-[18px] sm:text-[19px] leading-[1.95] tracking-[-0.01em] text-black/62"
                  >
                    {p}
                  </p>
                ))}
                <div className="h-[8vh] lg:h-[10vh]" />
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default function HomeAboutPanels() {
  return (
    <section className="relative text-[#1b1b1b]">
      <StickyPlate title={OUR_MISSION_TITLE} text={OUR_MISSION_TEXT} imageSrc={IMAGE_MISSION} />
      <StickyPlate title={TECH_TITLE} text={TECH_TEXT} imageSrc={IMAGE_TECH} flip />
      <StickyPlate title={PREVIEW_TITLE} text={PREVIEW_TEXT} imageSrc={IMAGE_MISSION} />
      <PulpheadPanel imageSrc={PULPHEAD_IMAGE} title={PULPHEAD_TITLE} />
    </section>
  )
}
