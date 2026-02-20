'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'

export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 1.15])
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0])

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden border-b-2 border-[#3F3F46]"
    >
      {/* NAV */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b-2 border-[#3F3F46]">
        <span className="text-xl font-bold uppercase tracking-tighter text-[#FAFAFA]">
          NITRO<span className="text-[#DFE104]">VID</span>
        </span>
        <div className="flex items-center gap-4 md:gap-8">
          <span className="hidden md:block text-sm uppercase tracking-widest text-[#A1A1AA]">Features</span>
          <span className="hidden md:block text-sm uppercase tracking-widest text-[#A1A1AA]">Pricing</span>
          <Link
            href="/editor"
            className="h-10 px-6 bg-[#DFE104] text-black text-sm font-bold uppercase tracking-tighter flex items-center hover:scale-105 active:scale-95 transition-transform"
          >
            OPEN EDITOR
          </Link>
        </div>
      </nav>

      {/* HERO CONTENT */}
      <motion.div
        style={{ scale, opacity }}
        className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 py-20"
      >
        {/* Label */}
        <p className="text-xs md:text-sm font-bold uppercase tracking-widest text-[#A1A1AA] mb-6">
          Browser-native video editor
        </p>

        {/* Giant headline */}
        <h1
          className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA] mb-4"
          style={{ fontSize: 'clamp(3.5rem, 14vw, 14rem)' }}
        >
          EDIT
          <br />
          <span className="text-[#DFE104]">FASTER.</span>
          <br />
          SHIP
          <br />
          BOLDER.
        </h1>

        {/* Subhead + CTA row */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-8 mt-8">
          <p className="text-lg md:text-xl lg:text-2xl text-[#A1A1AA] max-w-sm leading-tight">
            Cut. Grade. Title. Export. Everything you need to make your footage hit — inside one brutally fast editor.
          </p>
          <div className="flex gap-4">
            <Link
              href="/editor"
              className="h-14 px-10 bg-[#DFE104] text-black text-sm font-bold uppercase tracking-tighter flex items-center hover:scale-105 active:scale-95 transition-transform"
            >
              START EDITING FREE
            </Link>
            <a
              href="#features"
              className="h-14 px-8 border-2 border-[#3F3F46] text-[#FAFAFA] text-sm font-bold uppercase tracking-tighter flex items-center hover:bg-[#FAFAFA] hover:text-black transition-colors duration-300"
            >
              SEE FEATURES
            </a>
          </div>
        </div>

        {/* Decorative background number */}
        <div
          className="absolute right-0 bottom-0 font-bold text-[#27272A] leading-none select-none pointer-events-none"
          aria-hidden="true"
          style={{ fontSize: 'clamp(8rem, 25vw, 30rem)', lineHeight: '0.8' }}
        >
          01
        </div>
      </motion.div>

      {/* Bottom bar */}
      <div className="relative z-10 flex items-center gap-8 px-6 md:px-12 py-5 border-t-2 border-[#3F3F46]">
        {['4K EXPORT', 'REAL-TIME PREVIEW', 'CANVAS OVERLAYS', 'ZERO INSTALL'].map((tag) => (
          <span key={tag} className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">
            {tag}
          </span>
        ))}
      </div>
    </section>
  )
}
