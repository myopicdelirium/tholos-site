import RosterGate from "./_components/RosterGate";

export default function RosterLayout({ children }: { children: React.ReactNode }) {
  return <RosterGate>{children}</RosterGate>;
}
