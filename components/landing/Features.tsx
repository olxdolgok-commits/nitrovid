'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const FEATURES = [
  {
    num: '01',
    title: 'MULTI-TRACK TIMELINE',
    desc: 'Drag, trim, and reposition clips across multiple video and audio tracks. Zoom in for frame-precise edits.',
    tags: ['TRIM', 'SPLIT', 'REORDER', 'SNAP'],
  },
  {
    num: '02',
    title: 'COLOR GRADING',
    desc: 'Shadows, midtones, highlights, vibrance, temperature — full creative control over every frame.',
    tags: ['EXPOSURE', 'HIGHLIGHTS', 'SHADOWS', 'VIBRANCE'],
  },
  {
    num: '03',
    title: 'FILTER PRESETS',
    desc: '12 hand-crafted cinematic presets. Vintage. Noir. Dreamy. Hard Light. Apply in one click, tweak to taste.',
    tags: ['CINEMATIC', 'VINTAGE', 'NOIR', 'WARM/COOL'],
  },
  {
    num: '04',
    title: 'KINETIC TEXT',
    desc: 'Add animated text overlays with 8 motion styles. Typewriter. Glitch. Bounce. Perfectly timed to your cuts.',
    tags: ['TYPEWRITER', 'GLITCH', 'SLIDE', 'FADE'],
  },
  {
    num: '05',
    title: 'TRANSITIONS',
    desc: '11 transitions between every cut. Fade, dissolve, zoom, wipe — customizable duration for each.',
    tags: ['FADE', 'WIPE', 'ZOOM', 'FLASH'],
  },
  {
    num: '06',
    title: 'SPEED CONTROL',
    desc: 'Slow motion at 0.25×. Time-lapse at 4×. Or anywhere in between. Speed ramping built-in.',
    tags: ['0.25×', '0.5×', '2×', '4×'],
  },
]

function FeatureCard({ f, i }: { f: (typeof FEATURES)[0]; i: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: i * 0.07 }}
      className="group border-2 border-[#3F3F46] p-8 bg-[#09090B] hover:bg-[#DFE104] hover:border-[#DFE104] transition-colors duration-300 cursor-default"
    >
      <div className="flex items-start justify-between mb-6">
        <span
          className="font-bold text-[#27272A] group-hover:text-black leading-none transition-colors duration-300"
          style={{ fontSize: 'clamp(3rem, 6vw, 5rem)' }}
          aria-hidden="true"
        >
          {f.num}
        </span>
        <div className="flex flex-wrap gap-1 justify-end max-w-[160px]">
          {f.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-bold uppercase tracking-widest border border-[#3F3F46] group-hover:border-black px-2 py-0.5 text-[#A1A1AA] group-hover:text-black transition-colors duration-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tighter text-[#FAFAFA] group-hover:text-black mb-4 transition-colors duration-300">
        {f.title}
      </h3>
      <p className="text-base md:text-lg text-[#A1A1AA] group-hover:text-black leading-tight transition-colors duration-300">
        {f.desc}
      </p>
    </motion.div>
  )
}

export function Features() {
  return (
    <section id="features" className="py-32 px-6 md:px-12 border-b-2 border-[#3F3F46]">
      {/* Section header */}
      <div className="flex items-end justify-between mb-16 border-b-2 border-[#3F3F46] pb-8">
        <h2
          className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA]"
          style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}
        >
          EVERY<br />TOOL<br />YOU NEED
        </h2>
        <p className="text-lg md:text-xl text-[#A1A1AA] max-w-xs leading-tight text-right">
          Professional-grade editing right in your browser. No installs. No subscriptions.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#3F3F46]">
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.num} f={f} i={i} />
        ))}
      </div>
    </section>
  )
}
