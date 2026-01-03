export default function PaperCard({
  children,
  className = ""
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={["paper shadow-paper border rule rounded-2xl p-6", className].join(" ")}>
      {children}
    </div>
  )
}
