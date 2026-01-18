"use client"

import { useMemo, useState } from "react"

export default function AccessRequestForm({
  artifactTitle,
  artifactSlug,
}: {
  artifactTitle: string
  artifactSlug: string
}) {
  const [name, setName] = useState("")
  const [affiliation, setAffiliation] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const mailto = useMemo(() => {
    const to = "myopicdelirium@gmail.com"
    const subject = `Full-text request: ${artifactTitle}`
    const body = [
      `Artifact: ${artifactTitle}`,
      `Slug: ${artifactSlug}`,
      "",
      `Name: ${name || "-"}`,
      `Affiliation: ${affiliation || "-"}`,
      `Email: ${email || "-"}`,
      "",
      message || "Requesting access to the full text.",
    ].join("\n")
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [artifactTitle, artifactSlug, name, affiliation, email, message])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        window.location.href = mailto
      }}
      className="grid gap-3"
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/55 px-4 py-3 text-[14px] outline-none"
        placeholder="Name"
      />
      <input
        value={affiliation}
        onChange={(e) => setAffiliation(e.target.value)}
        className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/55 px-4 py-3 text-[14px] outline-none"
        placeholder="Affiliation"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/55 px-4 py-3 text-[14px] outline-none"
        placeholder="Email"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-[120px] w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/55 px-4 py-3 text-[14px] outline-none"
        placeholder="What are you asking for, and why?"
      />
      <button
        type="submit"
        className="mt-1 inline-flex items-center justify-center rounded-2xl bg-[#00394F] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#E8E5E0] shadow-[0_18px_55px_rgba(0,0,0,0.16)] hover:translate-y-[-1px] transition"
      >
        Request full text
      </button>
    </form>
  )
}
