import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NITROVID — Kinetic Video Editor',
  description: 'Professional browser-based video editor with kinetic typography, smart color grading, and cinematic effects.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
