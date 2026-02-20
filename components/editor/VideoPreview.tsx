'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { useEditorStore, buildCSSFilter } from '@/lib/store'
import { TextOverlay } from '@/lib/types'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 100)
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  w: number,
  h: number,
  t: number
) {
  const dur = overlay.endTime - overlay.startTime
  if (dur <= 0) return
  const progress = (t - overlay.startTime) / dur
  let alpha = 1, offsetY = 0, offsetX = 0, scl = 1

  if (overlay.animation === 'fade') {
    if (progress < 0.15) alpha = progress / 0.15
    else if (progress > 0.85) alpha = (1 - progress) / 0.15
  } else if (overlay.animation === 'slide-up') {
    if (progress < 0.25) { const p = progress / 0.25; offsetY = (1 - p) * 50; alpha = p }
  } else if (overlay.animation === 'slide-left') {
    if (progress < 0.25) { const p = progress / 0.25; offsetX = (1 - p) * 80; alpha = p }
  } else if (overlay.animation === 'scale') {
    if (progress < 0.25) { const p = progress / 0.25; scl = 0.5 + p * 0.5; alpha = p }
  } else if (overlay.animation === 'kinetic-bounce') {
    const decay = Math.max(0, 1 - progress * 1.5)
    offsetY = Math.sin(t * 10) * decay * 12
  } else if (overlay.animation === 'glitch') {
    if (Math.random() > 0.88) offsetX = (Math.random() - 0.5) * 14
    if (Math.random() > 0.95) alpha = Math.random() * 0.5 + 0.5
  } else if (overlay.animation === 'typewriter') {
    const visible = Math.floor(progress * overlay.text.length * 2.5)
    const display = (overlay.uppercase ? overlay.text.toUpperCase() : overlay.text)
      .substring(0, Math.min(visible, overlay.text.length))
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`
    ctx.fillStyle = overlay.color
    ctx.textAlign = overlay.alignment as CanvasTextAlign
    ctx.textBaseline = 'middle'
    ctx.fillText(display, overlay.x * w, overlay.y * h)
    ctx.restore()
    return
  }

  const x = overlay.x * w + offsetX
  const y = overlay.y * h + offsetY
  const text = overlay.uppercase ? overlay.text.toUpperCase() : overlay.text
  const lines = text.split('\n')
  const lh = overlay.fontSize * (overlay.lineHeight ?? 1.1)

  ctx.save()
  ctx.globalAlpha = alpha
  if (scl !== 1) { ctx.translate(x, y); ctx.scale(scl, scl); ctx.translate(-x, -y) }
  ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`
  ctx.textAlign = overlay.alignment as CanvasTextAlign
  ctx.textBaseline = 'middle'

  if (overlay.background !== 'none' && overlay.backgroundOpacity > 0) {
    ctx.globalAlpha = alpha * overlay.backgroundOpacity
    ctx.fillStyle = overlay.background
    lines.forEach((line, i) => {
      const m = ctx.measureText(line)
      const bx = overlay.alignment === 'center' ? x - m.width / 2 - 8
               : overlay.alignment === 'right'  ? x - m.width - 8 : x - 8
      ctx.fillRect(bx, y + i * lh - overlay.fontSize * 0.75, m.width + 16, overlay.fontSize * 1.1)
    })
    ctx.globalAlpha = alpha
  }
  if (overlay.outline) {
    ctx.strokeStyle = overlay.outlineColor
    ctx.lineWidth = Math.max(1, overlay.fontSize * 0.04)
    lines.forEach((line, i) => ctx.strokeText(line, x, y + i * lh))
  }
  if (overlay.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.85)'
    ctx.shadowBlur = overlay.fontSize * 0.12
    ctx.shadowOffsetX = overlay.fontSize * 0.04
    ctx.shadowOffsetY = overlay.fontSize * 0.04
  }
  ctx.fillStyle = overlay.color
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lh))
  ctx.restore()
}

export function VideoPreview() {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>()
  const lastSrcRef = useRef<string>('')
  const [muted, setMuted] = useState(false)

  // DOM refs for progress bar, thumb, and time display — updated directly by rAF
  const progressFillRef = useRef<HTMLDivElement>(null)
  const progressThumbRef = useRef<HTMLDivElement>(null)
  const timeDisplayRef  = useRef<HTMLSpanElement>(null)

  // ── Only subscribe to things that change the button/icon rendering ──────────
  // currentTime is intentionally NOT here — it updates via DOM refs instead
  const isPlaying        = useEditorStore(s => s.isPlaying)
  const isExporting      = useEditorStore(s => s.isExporting)
  const setCurrentTime   = useEditorStore(s => s.setCurrentTime)
  const setIsPlaying     = useEditorStore(s => s.setIsPlaying)
  const setIsExporting   = useEditorStore(s => s.setIsExporting)
  const setExportProgress= useEditorStore(s => s.setExportProgress)
  const setExportDownloadUrl = useEditorStore(s => s.setExportDownloadUrl)

  // ── Canvas render + DOM updates — one loop, zero React re-renders for time ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let running = true

    const render = () => {
      if (!running) return

      const { clips, textOverlays, currentTime: t, duration } = useEditorStore.getState()

      const activeClip = clips.find((c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return t >= c.startTime && t < end
      }) ?? null

      // ── Canvas draw ───────────────────────────────────────────────────────
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#09090B'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const video = videoRef.current
      if (video && video.readyState >= 2 && activeClip) {
        try {
          ctx.save()
          ctx.filter = buildCSSFilter(activeClip.filters, activeClip.colorGrade) || 'none'
          if (activeClip.flipH || activeClip.flipV || activeClip.rotation !== 0) {
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate((activeClip.rotation * Math.PI) / 180)
            ctx.scale(activeClip.flipH ? -1 : 1, activeClip.flipV ? -1 : 1)
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
          }
          ctx.globalAlpha = activeClip.opacity
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          ctx.restore()
        } catch (_) {}
      } else if (clips.length === 0) {
        ctx.fillStyle = '#A1A1AA'
        ctx.font = 'bold 14px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('IMPORT MEDIA TO BEGIN', canvas.width / 2, canvas.height / 2)
      }

      textOverlays.forEach((overlay) => {
        if (t >= overlay.startTime && t <= overlay.endTime) {
          drawTextOverlay(ctx, overlay, canvas.width, canvas.height, t)
        }
      })

      // ── DOM updates: progress bar & time display — no React re-render ─────
      const pct = duration > 0 ? Math.min(100, (t / duration) * 100) : 0
      if (progressFillRef.current)  progressFillRef.current.style.width = `${pct}%`
      if (progressThumbRef.current) progressThumbRef.current.style.left  = `${pct}%`
      if (timeDisplayRef.current)
        timeDisplayRef.current.textContent = `${formatTime(t)} / ${formatTime(duration)}`

      animRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { running = false; if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, []) // intentionally empty

  // ── Sync video src when active clip changes ────────────────────────────────
  useEffect(() => {
    return useEditorStore.subscribe((state) => {
      const { clips, currentTime: t } = state
      const active = clips.find((c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return t >= c.startTime && t < end
      })
      const video = videoRef.current
      if (!video || !active || lastSrcRef.current === active.src) return
      lastSrcRef.current = active.src
      video.src = active.src
      video.load()
    })
  }, [])

  // ── Seek video when scrubbing ──────────────────────────────────────────────
  useEffect(() => {
    return useEditorStore.subscribe((state) => {
      if (state.isPlaying) return
      const { clips, currentTime: t } = state
      const active = clips.find((c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return t >= c.startTime && t < end
      })
      const video = videoRef.current
      if (!video || !active) return
      const local = t - active.startTime + active.trimStart
      if (Math.abs(video.currentTime - local) > 0.25) video.currentTime = local
    })
  }, [])

  // ── Play / pause ───────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) video.play().catch(() => {})
    else           video.pause()
  }, [isPlaying])

  // ── Forward video timeupdate → store currentTime ───────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const { clips, currentTime: t } = useEditorStore.getState()
      const active = clips.find((c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return t >= c.startTime && t < end
      })
      if (active) setCurrentTime(active.startTime + video.currentTime - active.trimStart)
    }

    const handleEnded = () => setIsPlaying(false)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [setCurrentTime, setIsPlaying])

  // ── MediaRecorder export ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isExporting) return

    const canvas = canvasRef.current
    const video  = videoRef.current
    const { exportSettings, clips, duration: totalDur } = useEditorStore.getState()

    if (!canvas || !video || clips.length === 0 || totalDur === 0) {
      setIsExporting(false); return
    }
    if (typeof MediaRecorder === 'undefined') {
      alert('MediaRecorder API not supported in this browser. Use Chrome or Firefox.')
      setIsExporting(false); return
    }

    const candidates = [
      'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp8', 'video/webm',
    ]
    const mimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
    const stream   = canvas.captureStream(exportSettings.fps)
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      setExportDownloadUrl(URL.createObjectURL(blob))
      setExportProgress(100)
      setIsExporting(false)
    }

    setCurrentTime(0)
    const first = [...clips].sort((a, b) => a.startTime - b.startTime)[0]
    video.src = first.src
    lastSrcRef.current = first.src
    video.currentTime = first.trimStart
    video.muted = true
    video.play().catch(() => {})
    setIsPlaying(true)
    recorder.start(100)

    const wallStart = Date.now()
    const progressTimer = setInterval(() => {
      setExportProgress(Math.min(92, ((Date.now() - wallStart) / 1000 / totalDur) * 100))
    }, 300)
    const stopTimer = setTimeout(() => {
      clearInterval(progressTimer)
      recorder.stop()
      video.pause()
      setIsPlaying(false)
    }, totalDur * 1000 + 500)

    return () => {
      clearInterval(progressTimer)
      clearTimeout(stopTimer)
      if (recorder.state !== 'inactive') recorder.stop()
      video.pause()
    }
  }, [isExporting]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Scrubber click ─────────────────────────────────────────────────────────
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { duration } = useEditorStore.getState()
    if (duration === 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    setCurrentTime(((e.clientX - rect.left) / rect.width) * duration)
  }, [setCurrentTime])

  // Skip helpers — read duration from store state, not React subscription
  const skip = useCallback((delta: number) => {
    const { currentTime, duration } = useEditorStore.getState()
    setCurrentTime(Math.max(0, Math.min(duration, currentTime + delta)))
  }, [setCurrentTime])

  const toStart = useCallback(() => {
    setCurrentTime(0); setIsPlaying(false)
  }, [setCurrentTime, setIsPlaying])

  // Only needed to render the play/pause icon — safe, rarely changes
  const hasClips = useEditorStore(s => s.clips.length > 0)

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Canvas */}
      <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden min-h-0">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="max-w-full max-h-full object-contain"
          style={{ aspectRatio: '16/9' }}
        />
        <video ref={videoRef} className="hidden" muted={muted} playsInline preload="auto" />

        {!isPlaying && hasClips && (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 flex items-center justify-center group"
          >
            <div className="w-16 h-16 bg-[#DFE104] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play size={24} fill="black" className="text-black ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="border-t-2 border-[#3F3F46] bg-[#09090B] flex-shrink-0">
        {/* Scrubber — fill and thumb updated via refs in rAF, not React state */}
        <div
          className="h-1 bg-[#27272A] cursor-pointer relative group hover:h-1.5 transition-all"
          onClick={handleProgressClick}
        >
          <div ref={progressFillRef} className="h-full bg-[#DFE104]" style={{ width: '0%' }} />
          <div
            ref={progressThumbRef}
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#DFE104] -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: '0%' }}
          />
        </div>

        {/* Button row */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <button onClick={toStart} className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
              <SkipBack size={14} />
            </button>
            <button onClick={() => skip(-5)} className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors text-[10px] font-bold">
              -5s
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-[#DFE104] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying
                ? <Pause size={16} fill="black" className="text-black" />
                : <Play  size={16} fill="black" className="text-black ml-0.5" />}
            </button>
            <button onClick={() => skip(5)} className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors text-[10px] font-bold">
              +5s
            </button>
            <button
              onClick={() => { const { duration } = useEditorStore.getState(); setCurrentTime(duration) }}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <SkipForward size={14} />
            </button>
          </div>

          {/* Time display — updated via DOM ref in rAF, not React state */}
          <span
            ref={timeDisplayRef}
            className="font-bold text-xs tracking-widest text-[#FAFAFA] tabular-nums"
          >
            00:00.00 / 00:00.00
          </span>

          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors">
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
