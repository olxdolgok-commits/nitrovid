'use client'

import Marquee from 'react-fast-marquee'

const TESTIMONIALS = [
  {
    quote: "The fastest browser editor I have ever used. Color grading is insane.",
    name: 'ALEX K.',
    role: 'CINEMATOGRAPHER',
  },
  {
    quote: "The kinetic text animations are chef's kiss. My clients cannot stop asking how.",
    name: 'PRIYA S.',
    role: 'CONTENT CREATOR',
  },
  {
    quote: "Finally an editor that does not slow down my workflow. No install needed.",
    name: 'MARCO D.',
    role: 'MOTION DESIGNER',
  },
  {
    quote: 'Transitions are buttery smooth and the UI is absolutely brutal in the best way.',
    name: 'SASHA W.',
    role: 'YOUTUBER',
  },
  {
    quote: 'The timeline feels like a real NLE. I shipped 3 videos in one afternoon.',
    name: 'JAMES T.',
    role: 'VIDEO EDITOR',
  },
  {
    quote: 'Speed control is surgical. Slow-mo on my drone footage looks incredible.',
    name: 'NINA V.',
    role: 'FILMMAKER',
  },
]

function TestCard({ t }: { t: (typeof TESTIMONIALS)[0] }) {
  return (
    <div className="w-[340px] md:w-[420px] border-2 border-[#3F3F46] p-8 bg-[#09090B] mr-6 flex-shrink-0">
      <p className="text-base md:text-lg text-[#FAFAFA] leading-tight mb-6">"{t.quote}"</p>
      <div>
        <div className="text-sm font-bold uppercase tracking-widest text-[#DFE104]">{t.name}</div>
        <div className="text-xs uppercase tracking-widest text-[#A1A1AA]">{t.role}</div>
      </div>
    </div>
  )
}

export function TestimonialsMarquee() {
  return (
    <section className="py-24 border-b-2 border-[#3F3F46] overflow-hidden">
      <div className="px-6 md:px-12 mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] mb-3">
          WHAT CREATORS SAY
        </p>
        <h2
          className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA]"
          style={{ fontSize: 'clamp(2rem, 6vw, 5rem)' }}
        >
          EDITORS LOVE IT
        </h2>
      </div>
      <Marquee speed={40} gradient={false} autoFill>
        {TESTIMONIALS.map((t) => (
          <TestCard key={t.name} t={t} />
        ))}
      </Marquee>
    </section>
  )
}
