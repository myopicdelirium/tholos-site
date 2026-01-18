"use client"

import { useMemo, useState } from "react"

type Props = {
  title: string
  slug: string
  contactEmail?: string
}

export default function AccessRequestForm({ title, slug, contactEmail }: Props) {
  const [name, setName] = useState("")
  const [affiliation, setAffiliation] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const to = contactEmail && contactEmail.includes("@") ? contactEmail : "myopicdelirium@gmail.com"

  const mailto = useMemo(() => {
    const subject = `Artifact access request: ${title}`
    const body = [
      `Artifact: ${title}`,
      `Slug: ${slug}`,
      ``,
      `Name: ${name}`,
      `Affiliation: ${affiliation}`,
      `Email: ${email}`,
      ``,
      message ? `Request:\n${message}` : `Request:\nFull-text access for research purposes.`,
      ``,
    ].join("\n")
    return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }, [to, title, slug, name, affiliation, email, message])

  return (
    <div className="mt-6 space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none" placeholder="Name" />
      <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none" placeholder="Affiliation" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none" placeholder="Email" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="min-h-[120px] w-full rounded-2xl border border-[rgba(133,118,101,0.18)] bg-white/70 px-4 py-3 text-[14px] outline-none" placeholder="What are you asking for, and why?" />

      <a href={mailto} className="inline-flex w-full items-center justify-center rounded-2xl bg-[#00394F] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[#E8E5E0] shadow-[0_18px_55px_rgba(0,0,0,0.16)] transition hover:translate-y-[-1px]">
        Request full text
      </a>
    </div>
  )
}
