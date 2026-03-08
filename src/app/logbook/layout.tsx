import LogbookGate from "./_components/LogbookGate";

export default function LogbookLayout({ children }: { children: React.ReactNode }) {
  return <LogbookGate>{children}</LogbookGate>;
}
