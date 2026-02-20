import Link from 'next/link'
import { Hero } from '@/components/landing/Hero'
import { StatsMarquee } from '@/components/landing/StatsMarquee'
import { Features } from '@/components/landing/Features'
import { TestimonialsMarquee } from '@/components/landing/TestimonialsMarquee'

export default function LandingPage() {
  return (
    <main className="bg-[#09090B] min-h-screen">
      <Hero />
      <StatsMarquee />
      <Features />
      <TestimonialsMarquee />

      {/* CTA Section */}
      <section className="py-32 px-6 md:px-12 border-b-2 border-[#3F3F46] relative overflow-hidden">
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 font-bold text-[#27272A] leading-none select-none pointer-events-none"
          aria-hidden="true"
          style={{ fontSize: 'clamp(8rem, 28vw, 32rem)', lineHeight: '0.8' }}
        >
          GO
        </div>
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] mb-6">
            READY TO CUT?
          </p>
          <h2
            className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA] mb-12"
            style={{ fontSize: 'clamp(3rem, 12vw, 12rem)' }}
          >
            START<br />
            <span className="text-[#DFE104]">TODAY.</span>
          </h2>
          <Link
            href="/editor"
            className="inline-flex h-20 px-16 bg-[#DFE104] text-black text-lg font-bold uppercase tracking-tighter items-center hover:scale-105 active:scale-95 transition-transform"
          >
            OPEN EDITOR — FREE
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#DFE104] px-6 md:px-12 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <span className="text-2xl font-bold uppercase tracking-tighter text-black">
            NITROVID
          </span>
          <div className="flex flex-wrap gap-6">
            {['FEATURES', 'EDITOR', 'KEYBOARD SHORTCUTS', 'ABOUT'].map((l) => (
              <span
                key={l}
                className="text-xs font-bold uppercase tracking-widest text-black opacity-60 hover:opacity-100 cursor-pointer transition-opacity"
              >
                {l}
              </span>
            ))}
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-black opacity-40">
            © 2025 NITROVID
          </p>
        </div>
      </footer>
    </main>
  )
}
