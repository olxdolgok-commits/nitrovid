'use client'

import { useEditorStore } from '@/lib/store'

const SPEED_PRESETS = [
  { label: '0.25×', value: 0.25 },
  { label: '0.5×', value: 0.5 },
  { label: '0.75×', value: 0.75 },
  { label: '1×', value: 1 },
  { label: '1.25×', value: 1.25 },
  { label: '1.5×', value: 1.5 },
  { label: '2×', value: 2 },
  { label: '4×', value: 4 },
]

export function SpeedPanel() {
  const { getSelectedClip, updateClip } = useEditorStore()
  const clip = getSelectedClip()

  if (!clip) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#3F3F46] text-center">
          SELECT A CLIP TO ADJUST SPEED
        </span>
      </div>
    )
  }

  return (
    <div className="px-3 pt-3 space-y-4">
      {/* Speed display */}
      <div className="flex flex-col items-center py-6 border border-[#3F3F46]">
        <span
          className="font-bold text-[#DFE104] leading-none tabular-nums"
          style={{ fontSize: 'clamp(2rem, 6vw, 4rem)' }}
        >
          {clip.speed}×
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mt-1">
          PLAYBACK SPEED
        </span>
      </div>

      {/* Presets */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">PRESETS</p>
        <div className="grid grid-cols-4 gap-1">
          {SPEED_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => updateClip(clip.id, { speed: p.value })}
              className={`py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                clip.speed === p.value
                  ? 'border-[#DFE104] text-[#DFE104] bg-[#DFE104]/10'
                  : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            CUSTOM SPEED
          </label>
          <span className="text-[10px] font-bold tabular-nums text-[#FAFAFA]">{clip.speed}×</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={4}
          step={0.05}
          value={clip.speed}
          onChange={(e) => updateClip(clip.id, { speed: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Duration info */}
      <div className="border border-[#3F3F46] p-3">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-[#FAFAFA] tabular-nums">
              {clip.duration.toFixed(1)}s
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
              ORIGINAL
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-[#DFE104] tabular-nums">
              {(clip.duration / clip.speed).toFixed(1)}s
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
              NEW DURATION
            </div>
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            OPACITY
          </label>
          <span className="text-[10px] font-bold tabular-nums text-[#FAFAFA]">
            {Math.round(clip.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={clip.opacity}
          onChange={(e) => updateClip(clip.id, { opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Volume */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            VOLUME
          </label>
          <span className="text-[10px] font-bold tabular-nums text-[#FAFAFA]">
            {Math.round(clip.volume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={clip.volume}
          onChange={(e) => updateClip(clip.id, { volume: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  )
}
