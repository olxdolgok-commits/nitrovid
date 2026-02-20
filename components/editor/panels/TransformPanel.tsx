'use client'

import { useEditorStore } from '@/lib/store'
import { FlipHorizontal, FlipVertical, RotateCcw } from 'lucide-react'

export function TransformPanel() {
  const { getSelectedClip, updateClip } = useEditorStore()
  const clip = getSelectedClip()

  if (!clip) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#3F3F46] text-center">
          SELECT A CLIP TO TRANSFORM
        </span>
      </div>
    )
  }

  const resetTransform = () => {
    updateClip(clip.id, {
      flipH: false,
      flipV: false,
      rotation: 0,
      cropX: 0,
      cropY: 0,
      cropW: 1,
      cropH: 1,
    })
  }

  return (
    <div className="px-3 pt-3 space-y-4 overflow-y-auto">
      {/* Flip + rotate quick actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">TRANSFORM</p>
          <button
            onClick={resetTransform}
            className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-[#DFE104] transition-colors"
          >
            RESET
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => updateClip(clip.id, { flipH: !clip.flipH })}
            className={`flex flex-col items-center py-3 gap-1 border transition-colors ${
              clip.flipH
                ? 'border-[#DFE104] text-[#DFE104]'
                : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
            }`}
          >
            <FlipHorizontal size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider">FLIP H</span>
          </button>
          <button
            onClick={() => updateClip(clip.id, { flipV: !clip.flipV })}
            className={`flex flex-col items-center py-3 gap-1 border transition-colors ${
              clip.flipV
                ? 'border-[#DFE104] text-[#DFE104]'
                : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
            }`}
          >
            <FlipVertical size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider">FLIP V</span>
          </button>
          <button
            onClick={() => updateClip(clip.id, { rotation: (clip.rotation + 90) % 360 })}
            className="flex flex-col items-center py-3 gap-1 border border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA] transition-colors"
          >
            <RotateCcw size={16} />
            <span className="text-[9px] font-bold uppercase tracking-wider">ROT 90</span>
          </button>
        </div>
      </div>

      {/* Rotation slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            ROTATION
          </label>
          <span className="text-[10px] font-bold tabular-nums text-[#FAFAFA]">
            {Math.round(clip.rotation)}°
          </span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={clip.rotation}
          onChange={(e) => updateClip(clip.id, { rotation: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Crop */}
      <div className="border-t border-[#3F3F46] pt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-3">CROP</p>

        {/* Visual crop indicator */}
        <div className="relative w-full h-20 border border-[#3F3F46] bg-[#27272A] mb-3 overflow-hidden">
          <div
            className="absolute border-2 border-[#DFE104]"
            style={{
              left: `${clip.cropX * 100}%`,
              top: `${clip.cropY * 100}%`,
              width: `${clip.cropW * 100}%`,
              height: `${clip.cropH * 100}%`,
            }}
          />
          <span className="absolute bottom-1 right-1 text-[9px] font-bold text-[#3F3F46] uppercase tracking-wider">
            CROP REGION
          </span>
        </div>

        {[
          { key: 'cropX', label: 'CROP X', max: 0.9 },
          { key: 'cropY', label: 'CROP Y', max: 0.9 },
          { key: 'cropW', label: 'CROP W', max: 1 },
          { key: 'cropH', label: 'CROP H', max: 1 },
        ].map(({ key, label, max }) => {
          const val = (clip as any)[key] as number
          return (
            <div key={key} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                  {label}
                </label>
                <span className="text-[10px] font-bold tabular-nums text-[#FAFAFA]">
                  {Math.round(val * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={key === 'cropW' || key === 'cropH' ? 0.1 : 0}
                max={max}
                step={0.01}
                value={val}
                onChange={(e) => updateClip(clip.id, { [key]: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
