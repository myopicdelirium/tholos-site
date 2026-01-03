export default function Stamp({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border rule px-4 py-2 bg-[rgb(var(--ivory))/0.7] mono text-xs text-brass">
      <span className="inline-flex items-center gap-2">{children}</span>
    </div>
  )
}
