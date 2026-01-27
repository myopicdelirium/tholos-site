export const metadata = {
  title: "Events | Myopic Delirium",
  description: "Talks, workshops, and upcoming lab moments.",
};

export default function EventsPage() {
  return (
    <main className="w-full">
      <section className="paper border-b rule">
        <div className="mx-auto w-full max-w-6xl px-8 py-14">
          <div className="text-[11px] uppercase tracking-[0.34em] text-brass">Myopic Delirium</div>
          <h1 className="md-display text-5xl tracking-tight mt-3">Events</h1>
          <p className="mt-4 max-w-3xl text-sm text-[#1b1b1b]/80 leading-relaxed">
            Scheduled presentations, reviews, collaborator calls, and public-facing releases.
          </p>
        </div>
      </section>
    </main>
  );
}
