'use client'

import { useCallback, useRef, useState } from 'react'
import { Upload, Film, Music, Trash2, Plus } from 'lucide-react'
import { useEditorStore } from '@/lib/store'
import { VideoClip, defaultFilters, defaultColorGrade } from '@/lib/types'

function genId() {
  return Math.random().toString(36).slice(2)
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

interface MediaItem {
  id: string
  name: string
  src: string
  duration: number
  type: 'video' | 'audio'
  thumbnail?: string
}

export function MediaPanel() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [draggingOver, setDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addClip, clips } = useEditorStore()

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) return
        const src = URL.createObjectURL(file)
        const type = file.type.startsWith('video/') ? 'video' : 'audio'

        // Get duration
        const el = type === 'video' ? document.createElement('video') : document.createElement('audio')
        el.src = src
        el.onloadedmetadata = () => {
          const dur = el.duration
          const item: MediaItem = {
            id: genId(),
            name: file.name.replace(/\.[^/.]+$/, '').toUpperCase(),
            src,
            duration: isFinite(dur) ? dur : 10,
            type,
          }

          // Generate thumbnail for video
          if (type === 'video') {
            const canvas = document.createElement('canvas')
            canvas.width = 120
            canvas.height = 68
            const ctx = canvas.getContext('2d')
            const vid = el as HTMLVideoElement
            vid.currentTime = Math.min(1, dur * 0.1)
            vid.onseeked = () => {
              if (ctx) {
                ctx.drawImage(vid, 0, 0, 120, 68)
                item.thumbnail = canvas.toDataURL()
              }
              setMediaItems((prev) => [...prev, item])
            }
          } else {
            setMediaItems((prev) => [...prev, item])
          }
        }
      })
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDraggingOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const addToTimeline = useCallback(
    (item: MediaItem) => {
      // Calculate start time (place after last clip on track 0)
      const track0clips = clips.filter((c) => c.trackIndex === 0)
      const lastEnd =
        track0clips.length > 0
          ? Math.max(
              ...track0clips.map((c) => c.startTime + c.duration - c.trimStart - c.trimEnd)
            )
          : 0

      const clip: VideoClip = {
        id: genId(),
        name: item.name,
        src: item.src,
        duration: item.duration,
        startTime: lastEnd,
        trimStart: 0,
        trimEnd: 0,
        trackIndex: 0,
        opacity: 1,
        speed: 1,
        volume: 1,
        filters: { ...defaultFilters },
        colorGrade: { ...defaultColorGrade },
        preset: 'none',
        flipH: false,
        flipV: false,
        rotation: 0,
        cropX: 0,
        cropY: 0,
        cropW: 1,
        cropH: 1,
      }
      addClip(clip)
    },
    [clips, addClip]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed m-3 flex flex-col items-center justify-center py-6 px-4 cursor-pointer transition-colors ${
          draggingOver ? 'border-[#DFE104] bg-[#DFE104]/5' : 'border-[#3F3F46] hover:border-[#A1A1AA]'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDraggingOver(true)
        }}
        onDragLeave={() => setDraggingOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={20} className="text-[#A1A1AA] mb-2" />
        <span className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] text-center">
          DROP VIDEO / AUDIO
        </span>
        <span className="text-[10px] uppercase tracking-wider text-[#3F3F46] mt-1">
          OR CLICK TO BROWSE
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Media list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {mediaItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#3F3F46]">
            <Film size={24} className="mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest">NO MEDIA YET</span>
          </div>
        ) : (
          <div className="space-y-1">
            {mediaItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 border border-[#3F3F46] p-2 hover:border-[#A1A1AA] transition-colors group cursor-default"
              >
                {/* Thumbnail / icon */}
                <div className="w-14 h-8 bg-[#27272A] flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music size={14} className="text-[#A1A1AA]" />
                  )}
                </div>

                {/* Name + duration */}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-tight text-[#FAFAFA] truncate">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-[#A1A1AA]">{formatDuration(item.duration)}</p>
                </div>

                {/* Add to timeline */}
                <button
                  onClick={() => addToTimeline(item)}
                  title="Add to timeline"
                  className="w-6 h-6 flex items-center justify-center text-[#A1A1AA] hover:text-[#DFE104] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Plus size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick add button */}
      {mediaItems.length > 0 && (
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              const last = mediaItems[mediaItems.length - 1]
              if (last) addToTimeline(last)
            }}
            className="w-full h-8 border-2 border-[#DFE104] text-[#DFE104] text-xs font-bold uppercase tracking-tighter hover:bg-[#DFE104] hover:text-black transition-colors"
          >
            ADD LAST TO TIMELINE
          </button>
        </div>
      )}
    </div>
  )
}
