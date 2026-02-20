'use client'

import { useRef, useCallback, useMemo, useEffect } from 'react'
import { ZoomIn, ZoomOut, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/lib/store'
import { VideoClip } from '@/lib/types'

const TRACK_HEIGHT = 52
const RULER_HEIGHT = 24
const TRACK_LABELS_WIDTH = 64

const CLIP_COLORS = ['#1a3a5c', '#2d4a1e', '#4a1e2d', '#1e2d4a', '#3a2d1e', '#2d1e3a']

const TRACKS = [
  { id: 'video-0', label: 'VID 1', trackIndex: 0 },
  { id: 'video-1', label: 'VID 2', trackIndex: 1 },
  { id: 'audio-0', label: 'AUD',   trackIndex: 2 },
  { id: 'overlay-0', label: 'TEXT', trackIndex: 3 },
]

function formatRulerTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`
}

interface DragState {
  clipId: string
  startX: number
  originalStartTime: number
  type: 'move' | 'trim-left' | 'trim-right'
}

// ─────────────────────────────────────────────────────────────────────────────
// Clip component — memoised so it only re-renders when its own data changes
// ─────────────────────────────────────────────────────────────────────────────
const ClipBlock = ({
  clip,
  ci,
  isSelected,
  zoom,
  onSelect,
  onMouseDown,
}: {
  clip: VideoClip
  ci: number
  isSelected: boolean
  zoom: number
  onSelect: (id: string) => void
  onMouseDown: (e: React.MouseEvent, id: string, type: 'move' | 'trim-left' | 'trim-right') => void
}) => {
  const clipDur = clip.duration - clip.trimStart - clip.trimEnd
  const x = clip.startTime * zoom
  const w = Math.max(clipDur * zoom, 8)
  const color = CLIP_COLORS[ci % CLIP_COLORS.length]

  return (
    <div
      className="absolute top-1 bottom-1 flex items-center overflow-hidden timeline-clip"
      style={{
        left: x,
        width: w,
        backgroundColor: isSelected ? '#1e3a6e' : color,
        border: isSelected ? '1px solid #DFE104' : '1px solid rgba(255,255,255,0.1)',
      }}
      onClick={(e) => { e.stopPropagation(); onSelect(clip.id) }}
      onMouseDown={(e) => onMouseDown(e, clip.id, 'move')}
    >
      {/* Left trim handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-[#DFE10450]"
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, clip.id, 'trim-left') }}
      >
        <div className="absolute left-0.5 top-1/4 bottom-1/4 w-px bg-white opacity-40" />
      </div>

      {/* Label */}
      <span
        className="flex-1 px-3 text-[10px] font-bold uppercase tracking-wider truncate pointer-events-none"
        style={{ color: isSelected ? '#DFE104' : 'rgba(255,255,255,0.7)' }}
      >
        {clip.name}
      </span>

      {/* Right trim handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-[#DFE10450]"
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, clip.id, 'trim-right') }}
      >
        <div className="absolute right-0.5 top-1/4 bottom-1/4 w-px bg-white opacity-40" />
      </div>
    </div>
  )
}
const MemoClipBlock = ClipBlock // React.memo not useful without stable props — handled by parent memo

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function Timeline() {
  const rafRef = useRef<number>()
  const dragRef = useRef<DragState | null>(null)

  // Playhead refs — updated directly by rAF, never causing a React re-render
  const rulerPlayheadRef = useRef<HTMLDivElement>(null)
  const trackPlayheadsRef = useRef<(HTMLDivElement | null)[]>([])

  // ── Only subscribe to state that actually changes the DOM layout ────────────
  const clips          = useEditorStore(s => s.clips)
  const textOverlays   = useEditorStore(s => s.textOverlays)
  const zoom           = useEditorStore(s => s.zoom)
  const duration       = useEditorStore(s => s.duration)
  const selectedClipId = useEditorStore(s => s.selectedClipId)

  // Read-only access to actions (stable refs from zustand)
  const setCurrentTime  = useEditorStore(s => s.setCurrentTime)
  const setZoom         = useEditorStore(s => s.setZoom)
  const setSelectedClip = useEditorStore(s => s.setSelectedClip)
  const updateClip      = useEditorStore(s => s.updateClip)
  const removeClip      = useEditorStore(s => s.removeClip)

  const totalWidth = Math.max(duration * zoom + 200, 800)

  // ── Memoised ruler ticks — only recalculate when zoom/duration changes ──────
  const ticks = useMemo(() => {
    const interval = zoom < 40 ? 10 : zoom < 80 ? 5 : zoom < 160 ? 2 : 1
    const count = Math.ceil(totalWidth / zoom / interval) + 1
    return Array.from({ length: count }, (_, i) => i * interval)
  }, [zoom, duration, totalWidth])

  // ── Memoised clips grouped by track ────────────────────────────────────────
  const clipsByTrack = useMemo(() => {
    const map: Record<number, VideoClip[]> = { 0: [], 1: [], 2: [], 3: [] }
    clips.forEach((c) => {
      if (map[c.trackIndex]) map[c.trackIndex].push(c)
    })
    return map
  }, [clips])

  // ── rAF loop: update playhead position directly on DOM (no React re-render) ─
  useEffect(() => {
    let running = true
    const update = () => {
      if (!running) return
      const { currentTime, zoom: z } = useEditorStore.getState()
      const x = currentTime * z

      if (rulerPlayheadRef.current) {
        rulerPlayheadRef.current.style.left = `${x}px`
      }
      trackPlayheadsRef.current.forEach((el) => {
        if (el) el.style.left = `${x}px`
      })

      rafRef.current = requestAnimationFrame(update)
    }
    rafRef.current = requestAnimationFrame(update)
    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, []) // intentionally empty — reads store state directly every frame

  // ── Drag logic ─────────────────────────────────────────────────────────────
  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent, clipId: string, type: 'move' | 'trim-left' | 'trim-right') => {
      e.preventDefault()
      e.stopPropagation()
      const clip = useEditorStore.getState().clips.find((c) => c.id === clipId)
      if (!clip) return
      setSelectedClip(clipId)
      dragRef.current = { clipId, startX: e.clientX, originalStartTime: clip.startTime, type }
    },
    [setSelectedClip]
  )

  useEffect(() => {
    let raf2: number
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      cancelAnimationFrame(raf2)
      raf2 = requestAnimationFrame(() => {
        const drag = dragRef.current
        if (!drag) return
        const { zoom: z, clips: stateClips } = useEditorStore.getState()
        const dt = (e.clientX - drag.startX) / z

        if (drag.type === 'move') {
          updateClip(drag.clipId, { startTime: Math.max(0, drag.originalStartTime + dt) })
        } else {
          const clip = stateClips.find((c) => c.id === drag.clipId)
          if (!clip) return
          if (drag.type === 'trim-left') {
            const trimStart = Math.max(0, Math.min(clip.duration - clip.trimEnd - 0.5, clip.trimStart + dt))
            const startTime = Math.max(0, drag.originalStartTime + dt)
            updateClip(drag.clipId, { trimStart, startTime })
          } else {
            const trimEnd = Math.max(0, Math.min(clip.duration - clip.trimStart - 0.5, clip.trimEnd - dt))
            updateClip(drag.clipId, { trimEnd })
          }
        }
      })
    }
    const handleMouseUp = () => { dragRef.current = null }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      cancelAnimationFrame(raf2)
    }
  }, [updateClip])

  // ── Ruler click to seek ─────────────────────────────────────────────────────
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setCurrentTime(Math.max(0, (e.clientX - rect.left - TRACK_LABELS_WIDTH) / zoom))
    },
    [zoom, setCurrentTime]
  )

  // ── Track click to seek ─────────────────────────────────────────────────────
  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      setCurrentTime(Math.max(0, (e.clientX - rect.left) / zoom))
    },
    [zoom, setCurrentTime]
  )

  return (
    <div className="flex flex-col h-full border-t-2 border-[#3F3F46] bg-[#09090B] select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b-2 border-[#3F3F46] flex-shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">TIMELINE</span>
        <div className="flex-1" />
        <button
          onClick={() => selectedClipId && removeClip(selectedClipId)}
          disabled={!selectedClipId}
          title="Delete clip"
          className="w-7 h-7 flex items-center justify-center text-[#A1A1AA] hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 size={13} />
        </button>
        <div className="w-px h-4 bg-[#3F3F46]" />
        <button onClick={() => setZoom(zoom * 0.7)} className="w-7 h-7 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
          <ZoomOut size={13} />
        </button>
        <input
          type="range" min={20} max={400} value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-20"
        />
        <button onClick={() => setZoom(zoom * 1.4)} className="w-7 h-7 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
          <ZoomIn size={13} />
        </button>
      </div>

      {/* Scroll area */}
      <div className="flex-1 overflow-auto">
        <div style={{ width: totalWidth + TRACK_LABELS_WIDTH, minHeight: '100%', position: 'relative' }}>

          {/* ── Ruler ──────────────────────────────────────────────────────── */}
          <div
            className="sticky top-0 z-20 flex bg-[#09090B] border-b border-[#3F3F46]"
            style={{ height: RULER_HEIGHT }}
          >
            <div style={{ width: TRACK_LABELS_WIDTH, flexShrink: 0 }} className="border-r border-[#3F3F46]" />
            <div className="relative flex-1 cursor-pointer" onClick={handleRulerClick} style={{ width: totalWidth }}>
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 h-full flex flex-col items-center" style={{ left: t * zoom }}>
                  <div className="w-px h-2 bg-[#3F3F46] mt-1" />
                  <span className="text-[10px] font-bold tracking-wider text-[#A1A1AA] mt-0.5">{formatRulerTime(t)}</span>
                </div>
              ))}
              {/* Ruler playhead — updated by rAF, NOT by React state */}
              <div
                ref={rulerPlayheadRef}
                className="absolute top-0 bottom-0 w-px bg-[#DFE104] pointer-events-none z-10"
                style={{ left: 0 }}
              />
            </div>
          </div>

          {/* ── Tracks ─────────────────────────────────────────────────────── */}
          {TRACKS.map((track, ti) => {
            const trackClips = clipsByTrack[track.trackIndex] ?? []
            return (
              <div
                key={track.id}
                className="flex border-b border-[#3F3F46]"
                style={{ height: TRACK_HEIGHT }}
              >
                {/* Label */}
                <div
                  className="flex items-center justify-center border-r border-[#3F3F46] flex-shrink-0"
                  style={{ width: TRACK_LABELS_WIDTH }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">{track.label}</span>
                </div>

                {/* Track content */}
                <div
                  className="relative flex-1"
                  style={{ width: totalWidth }}
                  onClick={handleTrackClick}
                >
                  {/* Grid lines (reuse same ticks, CSS only) */}
                  {ticks.map((t) => (
                    <div
                      key={t}
                      className="absolute top-0 bottom-0 w-px opacity-10"
                      style={{ left: t * zoom, backgroundColor: '#A1A1AA' }}
                    />
                  ))}

                  {/* Video clips */}
                  {trackClips.map((clip, ci) => (
                    <ClipBlock
                      key={clip.id}
                      clip={clip}
                      ci={ci}
                      isSelected={selectedClipId === clip.id}
                      zoom={zoom}
                      onSelect={setSelectedClip}
                      onMouseDown={handleClipMouseDown}
                    />
                  ))}

                  {/* Text overlays on the overlay track */}
                  {track.id === 'overlay-0' && textOverlays.map((overlay) => {
                    const x = overlay.startTime * zoom
                    const w = Math.max((overlay.endTime - overlay.startTime) * zoom, 8)
                    return (
                      <div
                        key={overlay.id}
                        className="absolute top-2 bottom-2 flex items-center overflow-hidden pointer-events-none"
                        style={{ left: x, width: w, backgroundColor: '#2d1a3a', border: '1px solid #DFE104' }}
                      >
                        <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#DFE104] truncate">
                          T: {overlay.text.substring(0, 12)}
                        </span>
                      </div>
                    )
                  })}

                  {/* Track playhead — updated by rAF, NOT by React state */}
                  <div
                    ref={(el) => { trackPlayheadsRef.current[ti] = el }}
                    className="absolute top-0 bottom-0 w-px bg-[#DFE104] pointer-events-none z-20"
                    style={{ left: 0 }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
