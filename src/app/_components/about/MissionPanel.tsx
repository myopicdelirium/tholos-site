import Image from 'next/image'

const PARAS = [
  "Myopic Delirium is a student-led research group focused on enriching agent architectures for large-scale social simulation. In these environments, agents are fundamentally representative of people, but across the board they are being treated as convenient characters. Despite notions of rigor and unbiased intent, the dominant use of models for social simulations at scale is to support and justify frameworks that institutions need to believe to maximize success. Influential banks create agents with shallow incentives based primarily on monetary goals, while leisure and any inefficiencies serve solely as frictions. Niche religions and spiritual organizations use rewrite assumptions of human nature and capabilities to develop utopic simulations that demonstrate the validity and absolutely true nature of their ideology. In each case the principles of the group are always directly reflected in the predictably supportive results they yield.",
  "As an initiative, we assert ourselves on experimentation devoid of necessary structure and ideology, focused on the development of dynamic, emergent systems rather than fixed incentives. The rigor and ambition of our systems is accompanied by an uncertainty in their outcomes that gave us our name.",
]

export default function MissionPanel() {
  return (
    <section className="bg-[#E8E5E0]">
      <div className="grid min-h-[92vh] grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex min-h-[92vh] items-center px-6 py-20 sm:px-10 sm:py-24 lg:px-14 lg:py-28">
            <div className="mx-auto w-full max-w-[740px]">
              <p className="font-serif text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.95] tracking-[-0.01em] text-black/72">
                {PARAS[0]}
              </p>

              <p className="mt-10 font-serif text-[16px] sm:text-[17px] lg:text-[18px] leading-[1.95] tracking-[-0.01em] text-black/68">
                {PARAS[1]}
              </p>
            </div>
          </div>
        </div>

        <div className="relative lg:col-span-4">
          <div className="absolute inset-y-0 left-0 w-px bg-black/12" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[14px] bg-[linear-gradient(to_right,rgba(0,0,0,0.06),rgba(0,0,0,0.00))]" />

          <Image
            src="/images/cope.png"
            alt="Cope"
            fill
            className="object-cover brightness-[0.98] contrast-[0.98] saturate-[0.90]"
            sizes="(min-width: 1024px) 33vw, 100vw"
            priority={false}
          />

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_520px_at_70%_18%,rgba(255,255,255,0.16),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_left,rgba(232,229,224,0.00),rgba(232,229,224,0.06),rgba(232,229,224,0.16))]" />
        </div>
      </div>
    </section>
  )
}
