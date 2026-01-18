"use client"

import { useMemo, useState } from "react"

export default function RequestAccessForm(props: { title: string; to: string }) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [affiliation, setAffiliation] = useState("")
  const [message, setMessage] = useState("")

  const mailto = useMemo(() => {
    const subject = `Access request — ${props.title}`
    const body = [
      `Paper: ${props.title}`,
      name ? `Name: ${name}` : null,
      affiliation ? `Affiliation: ${affiliation}` : null,
      email ? `Email: ${email}` : null,
      "",
      message ? `Message:` : null,
      message || null,
      "",
      "Requested access: full PDF",
    ].filter(Boolean).join("\n")
    const href = `mailto:${props.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    return href
  }, [props.title, props.to, email, name, affiliation, message])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        window.location.href = mailto
      }}
      className="space-y-4"
    >
      <div className="grid gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-black/40 focus:border-black/20"
        />
        <input
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          placeholder="Affiliation"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-black/40 focus:border-black/20"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-black/40 focus:border-black/20"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What are you asking for, and why?"
          rows={4}
          className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none placeholder:text-black/40 focus:border-black/20"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-black/50">
          Typical response window: ~48 hours.
        </div>
        <button
          type="submit"
          className="rounded-xl border border-black/15 bg-black px-4 py-2.5 text-xs uppercase tracking-[0.28em] text-white hover:bg-black/90"
        >
          Request Access
        </button>
      </div>
    </form>
  )
}
