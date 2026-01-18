"use client"

import { useMemo, useState } from "react"

export default function AccessRequestForm(props: { title: string; slug: string; to?: string }) {
  const to = props.to ?? "myopicdelirium@gmail.com"
  const [name, setName] = useState("")
  const [affiliation, setAffiliation] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const mailto = useMemo(() => {
    const subject = `Artifact access request: ${props.title}`
    const bodyLines = [
      `Artifact: ${props.title}`,
      `Slug: ${props.slug}`,
      ``,
      `Name: ${name}`,
      `Affiliation: ${affiliation}`,
      `Email: ${email}`,
      ``,
      `Request:`,
      message || "(no message)",
      ``,
    ]
    const body = bodyLines.join("\n")
    const q = new URLSearchParams({ subject, body }).toString()
    return `mailto:${encodeURIComponent(to)}?${q}`
  }, [to, props.title, props.slug, name, affiliation, email, message])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        window.location.href = mailto
      }}
      className="paper shadow-paper border rule rounded-2xl p-6"
    >
      <div className="smallcaps text-[10px] text-[#6d6356]">Request full access</div>

      <div className="mt-4 grid gap-3">
        <input
          className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none"
          placeholder="Affiliation"
          value={affiliation}
          onChange={(e) => setAffiliation(e.target.value)}
          required
        />
        <input
          className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none"
          placeholder="What are you asking for, and why?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="mt-4 w-full rounded-2xl border border-[rgba(133,118,101,0.22)] bg-[#171513] px-4 py-3 text-[13px] font-medium text-white hover:opacity-95"
      >
        Request the paper
      </button>

      <div className="mt-3 text-[12px] leading-relaxed text-[#3a352f]/75">
        Full text is restricted during active development and submission cycles. Requests open a prefilled email.
      </div>
    </form>
  )
}
