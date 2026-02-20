'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  ZoomIn,
} from 'lucide-react'
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
  const progress = (t - overlay.startTime) / (overlay.endTime - overlay.startTime)
  let alpha = 1
  let offsetY = 0
  let offsetX = 0
  let scl = 1

  if (overlay.animation === 'fade') {
    if (progress < 0.15) alpha = progress / 0.15
    else if (progress > 0.85) alpha = (1 - progress) / 0.15
  } else if (overlay.animation === 'slide-up') {
    if (progress < 0.2) {
      offsetY = (1 - progress / 0.2) * 40
      alpha = progress / 0.2
    }
  } else if (overlay.animation === 'slide-left') {
    if (progress < 0.2) {
      offsetX = (1 - progress / 0.2) * 60
      alpha = progress / 0.2
    }
  } else if (overlay.animation === 'scale') {
    if (progress < 0.2) {
      scl = 0.6 + (progress / 0.2) * 0.4
      alpha = progress / 0.2
    }
  } else if (overlay.animation === 'kinetic-bounce') {
    const bounce = Math.sin(t * 8) * (1 - Math.min(progress * 2, 1)) * 8
    offsetY = bounce
  } else if (overlay.animation === 'glitch') {
    if (Math.random() > 0.85) {
      offsetX = (Math.random() - 0.5) * 10
    }
  } else if (overlay.animation === 'typewriter') {
    const totalChars = overlay.text.length
    const visibleChars = Math.floor(progress * totalChars * 3)
    const displayText = overlay.uppercase
      ? overlay.text.toUpperCase().substring(0, Math.min(visibleChars, overlay.text.length))
      : overlay.text.substring(0, Math.min(visibleChars, overlay.text.length))
    const x = overlay.x * w + offsetX
    const y = overlay.y * h + offsetY
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`
    ctx.fillStyle = overlay.color
    ctx.textAlign = overlay.alignment as CanvasTextAlign
    ctx.textBaseline = 'middle'
    const lh = overlay.fontSize * overlay.lineHeight
    const lines = displayText.split('\n')
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lh)
    })
    ctx.restore()
    return
  }

  const x = overlay.x * w + offsetX
  const y = overlay.y * h + offsetY
  const text = overlay.uppercase ? overlay.text.toUpperCase() : overlay.text
  const lines = text.split('\n')

  ctx.save()
  ctx.globalAlpha = alpha
  if (scl !== 1) {
    ctx.translate(x, y)
    ctx.scale(scl, scl)
    ctx.translate(-x, -y)
  }

  ctx.font = `${overlay.fontWeight} ${overlay.fontSize}px "${overlay.fontFamily}", sans-serif`
  const lh = overlay.fontSize * overlay.lineHeight

  // Background
  if (overlay.background !== 'none' && overlay.backgroundOpacity > 0) {
    ctx.fillStyle = overlay.background
    ctx.globalAlpha = alpha * overlay.backgroundOpacity
    lines.forEach((line, i) => {
      const m = ctx.measureText(line)
      const bx =
        overlay.alignment === 'center'
          ? x - m.width / 2 - 8
          : overlay.alignment === 'right'
            ? x - m.width - 8
            : x - 8
      ctx.fillRect(bx, y + i * lh - overlay.fontSize * 0.8, m.width + 16, overlay.fontSize * 1.2)
    })
    ctx.globalAlpha = alpha
  }

  // Outline
  if (overlay.outline) {
    ctx.strokeStyle = overlay.outlineColor
    ctx.lineWidth = overlay.fontSize * 0.04
    ctx.textAlign = overlay.alignment as CanvasTextAlign
    ctx.textBaseline = 'middle'
    lines.forEach((line, i) => {
      ctx.strokeText(line, x, y + i * lh)
    })
  }

  // Shadow
  if (overlay.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.8)'
    ctx.shadowBlur = overlay.fontSize * 0.1
    ctx.shadowOffsetX = overlay.fontSize * 0.03
    ctx.shadowOffsetY = overlay.fontSize * 0.03
  }

  ctx.fillStyle = overlay.color
  ctx.textAlign = overlay.alignment as CanvasTextAlign
  ctx.textBaseline = 'middle'
  lines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lh)
  })

  ctx.restore()
}

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const containerRef = useRef<HTMLDivElement>(null)
  const [muted, setMuted] = useState(false)
  const lastSrcRef = useRef<string>('')
  const seekingRef = useRef(false)

  const {
    clips,
    textOverlays,
    currentTime,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    setDuration,
    duration,
  } = useEditorStore()

  const getActiveClip = useCallback(() => {
    return (
      clips.find((c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return currentTime >= c.startTime && currentTime < end
      }) ?? null
    )
  }, [clips, currentTime])

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let running = true

    const render = () => {
      if (!running) return

      const video = videoRef.current
      const activeClip = clips.find((c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return currentTime >= c.startTime && currentTime < end
      })

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fill background
      ctx.fillStyle = '#09090B'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw video frame
      if (video && video.readyState >= 2 && activeClip) {
        try {
          ctx.save()
          // Apply transform
          if (activeClip.flipH || activeClip.flipV || activeClip.rotation !== 0) {
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate((activeClip.rotation * Math.PI) / 180)
            ctx.scale(activeClip.flipH ? -1 : 1, activeClip.flipV ? -1 : 1)
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
          }
          ctx.globalAlpha = activeClip.opacity
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          ctx.restore()
        } catch (e) {
          // ignore cross-origin etc.
        }
      } else if (clips.length === 0) {
        // Empty state
        ctx.fillStyle = '#27272A'
        ctx.font = 'bold 14px "Space Grotesk", sans-serif'
        ctx.fillStyle = '#A1A1AA'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('IMPORT MEDIA TO BEGIN', canvas.width / 2, canvas.height / 2)
      }

      // Draw text overlays
      const now = useEditorStore.getState().currentTime
      const overlays = useEditorStore.getState().textOverlays
      overlays.forEach((overlay) => {
        if (now >= overlay.startTime && now <= overlay.endTime) {
          drawTextOverlay(ctx, overlay, canvas.width, canvas.height, now)
        }
      })

      animRef.current = requestAnimationFrame(render)
    }

    render()
    return () => {
      running = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [clips, textOverlays])

  // Sync video src
  useEffect(() => {
    const video = videoRef.current
    const activeClip = getActiveClip()
    if (!video || !activeClip) return

    if (lastSrcRef.current !== activeClip.src) {
      lastSrcRef.current = activeClip.src
      video.src = activeClip.src
      video.load()
    }
  }, [getActiveClip])

  // Sync video currentTime
  useEffect(() => {
    const video = videoRef.current
    const activeClip = getActiveClip()
    if (!video || !activeClip || seekingRef.current) return

    const localTime = currentTime - activeClip.startTime + activeClip.trimStart
    if (Math.abs(video.currentTime - localTime) > 0.2) {
      video.currentTime = localTime
    }
  }, [currentTime, getActiveClip])

  // Play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [isPlaying])

  // Time tracking
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      if (!seekingRef.current) {
        const activeClip = useEditorStore.getState().clips.find((c) => {
          const end = c.startTime + c.duration - c.trimStart - c.trimEnd
          const t = useEditorStore.getState().currentTime
          return t >= c.startTime && t < end
        })
        if (activeClip) {
          const newTime = activeClip.startTime + video.currentTime - activeClip.trimStart
          setCurrentTime(newTime)
        }
      }
    }

    const handleEnded = () => {
      setIsPlaying(false)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [setCurrentTime, setIsPlaying])

  // Apply CSS filter to video
  const activeClip = getActiveClip()
  const filterStr = activeClip
    ? buildCSSFilter(activeClip.filters, activeClip.colorGrade)
    : ''

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const newTime = pct * duration
    setCurrentTime(newTime)
    const video = videoRef.current
    if (video && activeClip) {
      video.currentTime = newTime - activeClip.startTime + activeClip.trimStart
    }
  }

  const skipForward = () => setCurrentTime(Math.min(duration, currentTime + 5))
  const skipBack = () => setCurrentTime(Math.max(0, currentTime - 5))
  const toStart = () => {
    setCurrentTime(0)
    const video = videoRef.current
    if (video) video.currentTime = 0
  }

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Canvas preview */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-black relative overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="max-w-full max-h-full object-contain"
          style={{ aspectRatio: '16/9' }}
        />

        {/* Hidden video element for decode */}
        <video
          ref={videoRef}
          className="hidden"
          muted={muted}
          playsInline
          preload="auto"
          style={{ filter: filterStr }}
        />

        {/* Play button overlay */}
        {!isPlaying && clips.length > 0 && (
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
        {/* Progress bar */}
        <div
          className="h-1 bg-[#27272A] cursor-pointer relative hover:h-2 transition-all"
          onClick={handleProgressClick}
        >
          <div
            className="h-full bg-[#DFE104] transition-none"
            style={{ width: `${progressPct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-[#DFE104] -translate-x-1/2"
            style={{ left: `${progressPct}%` }}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <button
              onClick={toStart}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <SkipBack size={14} />
            </button>
            <button
              onClick={skipBack}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors text-xs font-bold"
            >
              -5s
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-[#DFE104] flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause size={16} fill="black" className="text-black" />
              ) : (
                <Play size={16} fill="black" className="text-black ml-0.5" />
              )}
            </button>
            <button
              onClick={skipForward}
              className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors text-xs font-bold"
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

          {/* Time display */}
          <div className="font-bold text-xs tracking-widest text-[#FAFAFA] tabular-nums">
            {formatTime(currentTime)}{' '}
            <span className="text-[#A1A1AA]">/ {formatTime(duration)}</span>
          </div>

          {/* Right controls */}
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
