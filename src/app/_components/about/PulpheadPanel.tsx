"use client"

import { motion } from "framer-motion"

export default function PulpheadPanel(props: { imageSrc: string; title: string }) {
  return (
    <section className="relative w-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${props.imageSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_50%_45%,rgba(0,0,0,0.18),transparent_62%),linear-gradient(to_bottom,rgba(0,0,0,0.38),rgba(0,0,0,0.62))]" />

      <div className="relative mx-auto flex min-h-[78vh] max-w-[1480px] items-center justify-center px-8 py-16">
        <motion.h2
          className="text-center font-serif text-[#F6F1E7] text-[56px] sm:text-[88px] md:text-[116px] leading-[0.92] tracking-[-0.03em] drop-shadow-[0_22px_70px_rgba(0,0,0,0.55)]"
          initial={{ opacity: 0, y: 18, scale: 0.94, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.9, ease: [0.2, 0.9, 0.2, 1] }}
          viewport={{ once: true, amount: 0.55 }}
        >
          {props.title}
        </motion.h2>
      </div>
    </section>
  )
}
