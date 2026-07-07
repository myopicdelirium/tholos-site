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

  const inputCls =
    "w-full rounded-md border border-[var(--site-field-bd)] bg-[var(--site-field-bg)] px-4 py-3 text-[14px] text-[var(--site-field-ink)] outline-none placeholder:text-[#6f685b] focus:border-[rgba(20,16,10,0.35)]"

  return (
    <div className="mt-6 space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Name" />
      <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className={inputCls} placeholder="Affiliation" />
      <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="Email" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} className={inputCls + " min-h-[120px]"} placeholder="What are you asking for, and why?" />

      <a
        href={mailto}
        className="inline-flex w-full items-center justify-center rounded-md bg-[var(--site-accent)] px-5 py-3 text-[12px] uppercase tracking-[0.22em] text-[var(--site-on-accent)] transition hover:translate-y-[-1px]"
      >
        Request full text
      </a>
    </div>
  )
}
