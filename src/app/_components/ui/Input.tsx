export default function Input({ value }: { value: string }) {
  return (
    <div className="rounded-lg border rule bg-[rgb(var(--ivory))] px-3 py-2 mono text-sm">
      {value}
    </div>
  )
}
