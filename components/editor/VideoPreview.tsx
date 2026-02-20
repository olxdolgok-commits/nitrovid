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
  let alpha = 1
  let offsetY = 0
  let offsetX = 0
  let scl = 1

  if (overlay.animation === 'fade') {
    if (progress < 0.15) alpha = progress / 0.15
    else if (progress > 0.85) alpha = (1 - progress) / 0.15
  } else if (overlay.animation === 'slide-up') {
    if (progress < 0.25) {
      const p = progress / 0.25
      offsetY = (1 - p) * 50
      alpha = p
    }
  } else if (overlay.animation === 'slide-left') {
    if (progress < 0.25) {
      const p = progress / 0.25
      offsetX = (1 - p) * 80
      alpha = p
    }
  } else if (overlay.animation === 'scale') {
    if (progress < 0.25) {
      const p = progress / 0.25
      scl = 0.5 + p * 0.5
      alpha = p
    }
  } else if (overlay.animation === 'kinetic-bounce') {
    const decay = Math.max(0, 1 - progress * 1.5)
    offsetY = Math.sin(t * 10) * decay * 12
  } else if (overlay.animation === 'glitch') {
    if (Math.random() > 0.88) offsetX = (Math.random() - 0.5) * 14
    if (Math.random() > 0.95) alpha = Math.random() * 0.5 + 0.5
  } else if (overlay.animation === 'typewriter') {
    const visible = Math.floor(progress * overlay.text.length * 2.5)
    const display = (overlay.uppercase ? overlay.text.toUpperCase() : overlay.text).substring(
      0,
      Math.min(visible, overlay.text.length)
    )
    const x = overlay.x * w
    const y = overlay.y * h
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`
    ctx.fillStyle = overlay.color
    ctx.textAlign = overlay.alignment as CanvasTextAlign
    ctx.textBaseline = 'middle'
    ctx.fillText(display, x, y)
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

  if (scl !== 1) {
    ctx.translate(x, y)
    ctx.scale(scl, scl)
    ctx.translate(-x, -y)
  }

  ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`
  ctx.textAlign = overlay.alignment as CanvasTextAlign
  ctx.textBaseline = 'middle'

  if (overlay.background !== 'none' && overlay.backgroundOpacity > 0) {
    ctx.globalAlpha = alpha * overlay.backgroundOpacity
    ctx.fillStyle = overlay.background
    lines.forEach((line, i) => {
      const m = ctx.measureText(line)
      const bx =
        overlay.alignment === 'center'
          ? x - m.width / 2 - 8
          : overlay.alignment === 'right'
            ? x - m.width - 8
            : x - 8
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const lastSrcRef = useRef<string>('')
  const [muted, setMuted] = useState(false)

  const {
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    duration,
    currentTime,
    isExporting,
    setIsExporting,
    setExportProgress,
    setExportDownloadUrl,
  } = useEditorStore()

  // ── Render loop: reads fresh state every frame (no stale closure) ──────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    const render = () => {
      if (!running) return

      // Fresh store state every frame
      const { clips, textOverlays, currentTime: t } = useEditorStore.getState()

      const activeClip =
        clips.find((c) => {
          const end = c.startTime + c.duration - c.trimStart - c.trimEnd
          return t >= c.startTime && t < end
        }) ?? null

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#09090B'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const video = videoRef.current

      if (video && video.readyState >= 2 && activeClip) {
        try {
          ctx.save()

          // ★ Apply filter via ctx.filter (CSS on the element has NO effect on drawImage)
          const filterStr = buildCSSFilter(activeClip.filters, activeClip.colorGrade)
          ctx.filter = filterStr || 'none'

          // Flip / rotate transform
          if (activeClip.flipH || activeClip.flipV || activeClip.rotation !== 0) {
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate((activeClip.rotation * Math.PI) / 180)
            ctx.scale(activeClip.flipH ? -1 : 1, activeClip.flipV ? -1 : 1)
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
          }

          ctx.globalAlpha = activeClip.opacity
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          ctx.restore()
        } catch (_) {
          // decode not ready — skip frame silently
        }
      } else if (clips.length === 0) {
        ctx.fillStyle = '#A1A1AA'
        ctx.font = 'bold 14px "Space Grotesk", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('IMPORT MEDIA TO BEGIN', canvas.width / 2, canvas.height / 2)
      }

      // Text overlays drawn without the video filter (reset to none automatically via save/restore)
      textOverlays.forEach((overlay) => {
        if (t >= overlay.startTime && t <= overlay.endTime) {
          drawTextOverlay(ctx, overlay, canvas.width, canvas.height, t)
        }
      })

      animRef.current = requestAnimationFrame(render)
    }

    render()
    return () => {
      running = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, []) // intentionally empty — reads from store state each frame

  // ── Sync video src when active clip changes ────────────────────────────────
  useEffect(() => {
    return useEditorStore.subscribe((state) => {
      const { clips, currentTime: t } = state
      const activeClip =
        clips.find((c) => {
          const end = c.startTime + c.duration - c.trimStart - c.trimEnd
          return t >= c.startTime && t < end
        }) ?? null

      const video = videoRef.current
      if (!video || !activeClip) return

      if (lastSrcRef.current !== activeClip.src) {
        lastSrcRef.current = activeClip.src
        video.src = activeClip.src
        video.load()
      }
    })
  }, [])

  // ── Seek video element when scrubbing (not during playback) ───────────────
  useEffect(() => {
    return useEditorStore.subscribe((state) => {
      if (state.isPlaying) return
      const { clips, currentTime: t } = state
      const activeClip =
        clips.find((c) => {
          const end = c.startTime + c.duration - c.trimStart - c.trimEnd
          return t >= c.startTime && t < end
        }) ?? null

      const video = videoRef.current
      if (!video || !activeClip) return
      const localTime = t - activeClip.startTime + activeClip.trimStart
      if (Math.abs(video.currentTime - localTime) > 0.25) {
        video.currentTime = localTime
      }
    })
  }, [])

  // ── Play / pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPlaying])

  // ── Forward video timeupdate → store currentTime ──────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const { clips, currentTime: t } = useEditorStore.getState()
      const activeClip =
        clips.find((c) => {
          const end = c.startTime + c.duration - c.trimStart - c.trimEnd
          return t >= c.startTime && t < end
        }) ?? null
      if (activeClip) {
        setCurrentTime(activeClip.startTime + video.currentTime - activeClip.trimStart)
      }
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
  // Triggered when ExportModal sets isExporting = true in the store.
  useEffect(() => {
    if (!isExporting) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const { exportSettings, clips, duration: totalDur } = useEditorStore.getState()

    if (!canvas || !video || clips.length === 0 || totalDur === 0) {
      setIsExporting(false)
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      alert('MediaRecorder API is not supported in this browser. Please use Chrome or Firefox.')
      setIsExporting(false)
      return
    }

    // Pick the best supported MIME type
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
    ]
    const mimeType = candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'

    const stream = canvas.captureStream(exportSettings.fps)
    const recorder = new MediaRecorder(stream, { mimeType })
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType })
      setExportDownloadUrl(URL.createObjectURL(blob))
      setExportProgress(100)
      setIsExporting(false)
    }

    // Seek to start and begin playback through the whole project
    setCurrentTime(0)
    const sorted = [...clips].sort((a, b) => a.startTime - b.startTime)
    const first = sorted[0]
    video.src = first.src
    lastSrcRef.current = first.src
    video.currentTime = first.trimStart
    video.muted = true
    video.play().catch(() => {})
    setIsPlaying(true)

    recorder.start(100)

    // Progress ticker
    const wallStart = Date.now()
    const progressTimer = setInterval(() => {
      const elapsed = (Date.now() - wallStart) / 1000
      setExportProgress(Math.min(92, (elapsed / totalDur) * 100))
    }, 300)

    // Stop after totalDuration + 0.5 s buffer
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

  // ── Progress bar click ────────────────────────────────────────────────────
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (duration === 0) return
      const rect = e.currentTarget.getBoundingClientRect()
      setCurrentTime(((e.clientX - rect.left) / rect.width) * duration)
    },
    [duration, setCurrentTime]
  )

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

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

        {/* Hidden video — only for decoding; CSS filters on it have no effect on drawImage */}
        <video
          ref={videoRef}
          className="hidden"
          muted={muted}
          playsInline
          preload="auto"
        />

        {/* Big play overlay when paused */}
        {!isPlaying && useEditorStore.getState().clips.length > 0 && (
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
        {/* Scrubber */}
        <div
          className="h-1 bg-[#27272A] cursor-pointer relative group hover:h-1.5 transition-all"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-[#DFE104]"
            style={{ width: `${progressPct}%`, transition: 'width 0.05s linear' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#DFE104] -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Button row */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setCurrentTime(0); setIsPlaying(false) }}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors text-[10px] font-bold"
            >
              -5s
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-[#DFE104] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause size={16} fill="black" className="text-black" />
              ) : (
                <Play size={16} fill="black" className="text-black ml-0.5" />
              )}
            </button>
            <button
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 5))}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors text-[10px] font-bold"
            >
              +5s
            </button>
            <button
              onClick={() => setCurrentTime(duration)}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <SkipForward size={14} />
            </button>
          </div>

          <div className="font-bold text-xs tracking-widest text-[#FAFAFA] tabular-nums">
            {formatTime(currentTime)}{' '}
            <span className="text-[#A1A1AA]">/ {formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
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
