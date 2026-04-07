import { members } from "./_data"

export default function RosterPage() {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <div className="smallcaps text-[11px] text-[#6a6258]">People</div>
      <h1 className="mt-2 md-display text-[54px] leading-[1.02] tracking-[-0.02em] text-[#191714]">
        Roster
      </h1>

      {/* column headers */}
      <div className="mt-10 hidden sm:grid sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.5fr_40px] gap-x-4 border-b rule pb-2 text-[10px] smallcaps text-[#6a6258]">
        <span>Name</span>
        <span>Position</span>
        <span>Team</span>
        <span>Joined</span>
        <span>School</span>
        <span className="text-right">Status</span>
      </div>

      <ul className="divide-y rule">
        {members.map((m) => (
          <li
            key={m.name}
            className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_0.8fr_0.7fr_0.5fr_40px] gap-x-4 gap-y-1 py-3 items-baseline"
          >
            <span
              className={`text-[15px] text-[#191714] ${!m.active ? "text-[#191714]/45" : ""}`}
            >
              {m.name}
            </span>

            <span className="text-[13px] text-[#4b443b]">
              {m.positions.join(", ")}
            </span>

            <span className="mono text-[12px] text-[#6a6258]">
              {m.teams.join(", ")}
            </span>

            <span className="mono text-[12px] text-[#6a6258]">
              {m.joined}
            </span>

            <span className="mono text-[12px] text-[#6a6258]">
              {m.school}
            </span>

            <span className="text-right">
              {m.active ? (
                <span className="inline-block h-[7px] w-[7px] rounded-full bg-[rgb(var(--teal))]" />
              ) : (
                <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#6a6258]/30" />
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
