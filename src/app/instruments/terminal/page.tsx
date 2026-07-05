import type { Metadata } from "next";
import Link from "next/link";
import Terminal from "./_components/Terminal";

export const metadata: Metadata = {
  title: "The Terminal — run the engine on your own holding · Myopic Delirium",
  description:
    "Enter a company, build its cap table (watching your payoff answer back live), paste your comparables, and get an independent mark with its credible band and forward range — computed by the real engine.",
};

export default function TerminalPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-24">
      <div className="space-y-4">
        <div className="smallcaps text-[11px] text-[#6a6258]">
          <Link href="/instruments" className="hover:text-[#191714]">Instruments · No. 1</Link> · the terminal
        </div>
        <h1 className="md-display text-[44px] leading-[1.05] tracking-[-0.02em] text-[#191714]">
          Run it on your own holding
        </h1>
        <p className="max-w-[70ch] text-[14px] leading-relaxed text-[#4b443b]">
          This is the live engine — the same one behind the demonstration. Describe a company, build
          its cap table (the payoff curve answers back as you type), describe your stake, and give it
          a market reference you own. It returns a mark <em>with its credible band</em>, the chain of
          reasoning behind it, and the forward distribution — never a lone number.
        </p>
        <p className="max-w-[70ch] text-[12.5px] leading-relaxed text-[#6a6258]">
          The public terminal runs on comparables you paste (your data, your mark) or a loudly-labeled
          synthetic reference for exploring mechanics. Live market comparables and real-book
          configurations run on the private tier. Nothing you enter is stored beyond the computation
          cache; the browser computes nothing — every number comes from the engine.
        </p>
      </div>
      <div className="mt-10">
        <Terminal />
      </div>
    </section>
  );
}
