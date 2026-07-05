import EventsGate from "./_components/EventsGate";

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return <EventsGate>{children}</EventsGate>;
}
