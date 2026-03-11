'use client'

import { Ibarra_Real_Nova } from 'next/font/google'

const heroDisplay = Ibarra_Real_Nova({
  subsets: ['latin'],
  style: ['normal'],
  weight: ['500', '600', '700'],
})

export default function ImmersiveHero() {
  return (
    <section className="relative left-1/2 h-[100svh] w-screen -translate-x-1/2 overflow-hidden">
      <div
        className="absolute inset-0 bg-[#0b0b0b]"
        style={{
          backgroundImage: "url('/hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_25%_20%,rgba(0,0,0,0.18),transparent_62%),radial-gradient(900px_700px_at_75%_30%,rgba(0,57,79,0.14),transparent_58%),linear-gradient(to_bottom,rgba(0,0,0,0.30),rgba(0,0,0,0.62))]" />

      <div className="absolute top-0 left-0 right-0 z-10 bg-black/40 px-4 py-2">
        <p className="text-[10px] leading-relaxed tracking-[0.04em] text-orange-400/70 max-w-xl">
          This site is under construction. If you find an error or bug, please
          talk to Charlotte in person or email{" "}
          <a href="mailto:sleeplesssometimes@gmail.com" className="underline hover:text-orange-300">
            sleeplesssometimes@gmail.com
          </a>
          . Please do not use the channels on our contact page.
        </p>
      </div>

      <div className="relative mx-auto flex h-full max-w-6xl items-center px-6">
        <div className="max-w-5xl translate-y-4 sm:translate-y-6">
          <h1
            className={
              heroDisplay.className +
              ' text-[#F6F1E7] text-[56px] sm:text-[96px] leading-[0.90] tracking-[-0.02em] drop-shadow-[0_18px_60px_rgba(0,0,0,0.55)]'
            }
          >
            Myopic Delirium
          </h1>
        </div>
      </div>
    </section>
  )
}
