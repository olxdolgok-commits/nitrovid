'use client'

import Marquee from 'react-fast-marquee'

const STATS = [
  { value: '60FPS', label: 'PREVIEW' },
  { value: '4K', label: 'EXPORT' },
  { value: '11', label: 'TRANSITIONS' },
  { value: '12', label: 'FILTER PRESETS' },
  { value: '8', label: 'TEXT ANIMATIONS' },
  { value: '∞', label: 'UNDO LEVELS' },
  { value: '0', label: 'INSTALL REQUIRED' },
  { value: '100%', label: 'BROWSER NATIVE' },
]

export function StatsMarquee() {
  return (
    <section className="bg-[#DFE104] border-b-2 border-[#3F3F46] overflow-hidden py-5">
      <Marquee speed={80} gradient={false} autoFill>
        {STATS.map((s) => (
          <div key={s.value + s.label} className="flex items-center gap-3 mr-16">
            <span className="text-[2.5rem] md:text-[4rem] font-bold leading-none text-black tracking-tighter">
              {s.value}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-black opacity-60 max-w-[64px] leading-tight">
              {s.label}
            </span>
            <span className="text-4xl font-bold text-black opacity-30 mr-4">—</span>
          </div>
        ))}
      </Marquee>
    </section>
  )
}
