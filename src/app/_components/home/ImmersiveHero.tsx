'use client'

export default function ImmersiveHero() {
  return (
    <section className="relative h-[100svh] w-screen left-1/2 -translate-x-1/2 overflow-hidden">
      <div
        className="absolute inset-0 bg-[#0b0b0b]"
        style={{
          backgroundImage: "url('/hero.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_800px_at_25%_20%,rgba(0,0,0,0.18),transparent_62%),radial-gradient(900px_700px_at_75%_30%,rgba(0,57,79,0.14),transparent_58%),linear-gradient(to_bottom,rgba(0,0,0,0.30),rgba(0,0,0,0.62))]" />

      <div className="relative mx-auto flex h-full max-w-6xl items-center px-6">
        <div className="max-w-4xl">
          <h1 className="md-display md-hero-title text-[#F6F1E7] drop-shadow-[0_18px_60px_rgba(0,0,0,0.55)]">
            Myopic Delirium
          </h1>

          <div className="md-hero-caption text-[rgba(246,241,231,0.90)] drop-shadow-[0_14px_50px_rgba(0,0,0,0.45)]">
            A modeling laboratory for human irrationality
          </div>
        </div>
      </div>
    </section>
  )
}
