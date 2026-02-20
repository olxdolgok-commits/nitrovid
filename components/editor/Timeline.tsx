'use client'

import { useRef, useCallback, useState, useEffect } from 'react'
import { Scissors, ZoomIn, ZoomOut, Trash2, SplitSquareHorizontal } from 'lucide-react'
import { useEditorStore } from '@/lib/store'
import { VideoClip } from '@/lib/types'

const TRACK_HEIGHT = 52
const RULER_HEIGHT = 24
const TRACK_LABELS_WIDTH = 64

function formatRulerTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`
}

const CLIP_COLORS = [
  '#1a3a5c',
  '#2d4a1e',
  '#4a1e2d',
  '#1e2d4a',
  '#3a2d1e',
  '#2d1e3a',
]

interface DragState {
  clipId: string
  startX: number
  originalStartTime: number
  type: 'move' | 'trim-left' | 'trim-right'
}

export function Timeline() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const rafRef = useRef<number>()

  const {
    clips,
    audioTracks,
    textOverlays,
    currentTime,
    duration,
    zoom,
    selectedClipId,
    setCurrentTime,
    setZoom,
    setSelectedClip,
    updateClip,
    removeClip,
  } = useEditorStore()

  const totalWidth = Math.max(duration * zoom + 200, 800)
  const playheadX = currentTime * zoom + TRACK_LABELS_WIDTH

  // Click on ruler to seek
  const handleRulerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left - TRACK_LABELS_WIDTH
      const t = Math.max(0, x / zoom)
      setCurrentTime(t)
    },
    [zoom, setCurrentTime]
  )

  // Drag logic
  const handleClipMouseDown = useCallback(
    (e: React.MouseEvent, clipId: string, type: 'move' | 'trim-left' | 'trim-right') => {
      e.preventDefault()
      e.stopPropagation()
      const clip = clips.find((c) => c.id === clipId)
      if (!clip) return
      setSelectedClip(clipId)
      setDrag({ clipId, startX: e.clientX, originalStartTime: clip.startTime, type })
    },
    [clips, setSelectedClip]
  )

  useEffect(() => {
    if (!drag) return

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const dx = e.clientX - drag.startX
        const dt = dx / zoom

        if (drag.type === 'move') {
          const newStart = Math.max(0, drag.originalStartTime + dt)
          updateClip(drag.clipId, { startTime: newStart })
        } else if (drag.type === 'trim-left') {
          const clip = useEditorStore.getState().clips.find((c) => c.id === drag.clipId)
          if (!clip) return
          const newTrimStart = Math.max(
            0,
            Math.min(clip.duration - clip.trimEnd - 0.5, clip.trimStart + dt)
          )
          const newStartTime = Math.max(0, drag.originalStartTime + dt)
          updateClip(drag.clipId, { trimStart: newTrimStart, startTime: newStartTime })
        } else if (drag.type === 'trim-right') {
          const clip = useEditorStore.getState().clips.find((c) => c.id === drag.clipId)
          if (!clip) return
          const newTrimEnd = Math.max(0, Math.min(clip.duration - clip.trimStart - 0.5, clip.trimEnd - dt))
          updateClip(drag.clipId, { trimEnd: newTrimEnd })
        }
      })
    }

    const handleMouseUp = () => {
      setDrag(null)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [drag, zoom, updateClip])

  // Generate ruler ticks
  const tickInterval = zoom < 40 ? 10 : zoom < 80 ? 5 : zoom < 160 ? 2 : 1
  const tickCount = Math.ceil(totalWidth / zoom / tickInterval) + 1
  const ticks = Array.from({ length: tickCount }, (_, i) => i * tickInterval)

  const tracks = [
    { id: 'video-0', label: 'VID 1' },
    { id: 'video-1', label: 'VID 2' },
    { id: 'audio-0', label: 'AUD' },
    { id: 'overlay-0', label: 'TEXT' },
  ]

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
        <button
          onClick={() => setZoom(zoom * 0.7)}
          title="Zoom out"
          className="w-7 h-7 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ZoomOut size={13} />
        </button>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold tabular-nums text-[#A1A1AA] w-10 text-center">
            {Math.round(zoom)}px/s
          </span>
          <input
            type="range"
            min={20}
            max={400}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-20 h-1"
          />
        </div>
        <button
          onClick={() => setZoom(zoom * 1.4)}
          title="Zoom in"
          className="w-7 h-7 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <ZoomIn size={13} />
        </button>
      </div>

      {/* Timeline scroll area */}
      <div className="flex-1 overflow-auto relative" ref={scrollRef}>
        <div style={{ width: totalWidth + TRACK_LABELS_WIDTH, minHeight: '100%', position: 'relative' }}>
          {/* Ruler */}
          <div
            className="sticky top-0 z-20 flex bg-[#09090B] border-b border-[#3F3F46]"
            style={{ height: RULER_HEIGHT }}
          >
            {/* Label spacer */}
            <div
              style={{ width: TRACK_LABELS_WIDTH, flexShrink: 0 }}
              className="border-r border-[#3F3F46]"
            />
            {/* Ticks */}
            <div
              className="relative flex-1 cursor-pointer"
              onClick={handleRulerClick}
              style={{ width: totalWidth }}
            >
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full flex flex-col items-center"
                  style={{ left: t * zoom }}
                >
                  <div className="w-px h-2 bg-[#3F3F46] mt-1" />
                  <span className="text-[10px] font-bold tracking-wider text-[#A1A1AA] mt-0.5">
                    {formatRulerTime(t)}
                  </span>
                </div>
              ))}
              {/* Playhead on ruler */}
              <div
                className="absolute top-0 bottom-0 w-px bg-[#DFE104] pointer-events-none z-10"
                style={{ left: currentTime * zoom }}
              />
            </div>
          </div>

          {/* Tracks */}
          {tracks.map((track, trackIdx) => {
            const trackClips = clips.filter((c) => c.trackIndex === trackIdx)
            const textOnTrack = track.id === 'overlay-0' ? textOverlays : []

            return (
              <div
                key={track.id}
                className="flex border-b border-[#3F3F46]"
                style={{ height: TRACK_HEIGHT }}
              >
                {/* Track label */}
                <div
                  className="flex items-center justify-center border-r border-[#3F3F46] flex-shrink-0"
                  style={{ width: TRACK_LABELS_WIDTH }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                    {track.label}
                  </span>
                </div>

                {/* Track content */}
                <div
                  className="relative flex-1"
                  style={{ width: totalWidth }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    setCurrentTime(x / zoom)
                  }}
                >
                  {/* Track bg grid */}
                  <div className="absolute inset-0 opacity-20">
                    {ticks.map((t) => (
                      <div
                        key={t}
                        className="absolute top-0 bottom-0 w-px bg-[#3F3F46]"
                        style={{ left: t * zoom }}
                      />
                    ))}
                  </div>

                  {/* Video clips */}
                  {trackClips.map((clip, ci) => {
                    const clipDur = clip.duration - clip.trimStart - clip.trimEnd
                    const x = clip.startTime * zoom
                    const w = clipDur * zoom
                    const isSelected = selectedClipId === clip.id
                    const color = CLIP_COLORS[ci % CLIP_COLORS.length]

                    return (
                      <div
                        key={clip.id}
                        className="absolute top-1 bottom-1 flex items-center overflow-hidden timeline-clip"
                        style={{
                          left: x,
                          width: Math.max(w, 8),
                          backgroundColor: isSelected ? '#1e3a6e' : color,
                          border: isSelected ? '1px solid #DFE104' : '1px solid rgba(255,255,255,0.1)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedClip(clip.id)
                        }}
                        onMouseDown={(e) => handleClipMouseDown(e, clip.id, 'move')}
                      >
                        {/* Left trim handle */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center z-10 hover:bg-[#DFE104] hover:opacity-80"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            handleClipMouseDown(e, clip.id, 'trim-left')
                          }}
                        >
                          <div className="w-px h-3/4 bg-white opacity-50" />
                        </div>

                        {/* Clip label */}
                        <span
                          className="flex-1 px-3 text-[10px] font-bold uppercase tracking-wider truncate pointer-events-none"
                          style={{ color: isSelected ? '#DFE104' : 'rgba(255,255,255,0.7)' }}
                        >
                          {clip.name}
                        </span>

                        {/* Waveform placeholder */}
                        <div className="absolute inset-x-2 bottom-1 h-1 opacity-20">
                          {Array.from({ length: Math.max(1, Math.floor(w / 4)) }, (_, i) => (
                            <div
                              key={i}
                              className="inline-block w-px bg-white mr-px"
                              style={{ height: `${20 + Math.sin(i * 2.5) * 16 + Math.random() * 8}%` }}
                            />
                          ))}
                        </div>

                        {/* Right trim handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center z-10 hover:bg-[#DFE104] hover:opacity-80"
                          onMouseDown={(e) => {
                            e.stopPropagation()
                            handleClipMouseDown(e, clip.id, 'trim-right')
                          }}
                        >
                          <div className="w-px h-3/4 bg-white opacity-50" />
                        </div>
                      </div>
                    )
                  })}

                  {/* Text overlays on overlay track */}
                  {track.id === 'overlay-0' &&
                    textOverlays.map((overlay) => {
                      const x = overlay.startTime * zoom
                      const w = (overlay.endTime - overlay.startTime) * zoom
                      return (
                        <div
                          key={overlay.id}
                          className="absolute top-2 bottom-2 flex items-center overflow-hidden"
                          style={{
                            left: x,
                            width: Math.max(w, 8),
                            backgroundColor: '#2d1a3a',
                            border: '1px solid #DFE104',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#DFE104] truncate">
                            T: {overlay.text.substring(0, 12)}
                          </span>
                        </div>
                      )
                    })}

                  {/* Playhead */}
                  <div
                    className="absolute top-0 bottom-0 w-px bg-[#DFE104] pointer-events-none z-20"
                    style={{ left: currentTime * zoom }}
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
