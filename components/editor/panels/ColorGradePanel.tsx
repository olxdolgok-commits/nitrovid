'use client'

import { useEditorStore } from '@/lib/store'
import { ColorGradeSettings, defaultColorGrade } from '@/lib/types'

// Exposure lives in FilterSettings — these are color grade only
const GRADE_CONTROLS: Array<{
  key: keyof ColorGradeSettings
  label: string
  min: number
  max: number
}> = [
  { key: 'shadows', label: 'SHADOWS', min: -100, max: 100 },
  { key: 'midtones', label: 'MIDTONES', min: -100, max: 100 },
  { key: 'highlights', label: 'HIGHLIGHTS', min: -100, max: 100 },
  { key: 'whites', label: 'WHITES', min: -100, max: 100 },
  { key: 'blacks', label: 'BLACKS', min: -100, max: 100 },
  { key: 'vibrance', label: 'VIBRANCE', min: -100, max: 100 },
  { key: 'temperature', label: 'TEMPERATURE', min: -100, max: 100 },
  { key: 'tint', label: 'TINT', min: -100, max: 100 },
]

export function ColorGradePanel() {
  const { getSelectedClip, updateClip } = useEditorStore()
  const clip = getSelectedClip()

  if (!clip) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#3F3F46] text-center">
          SELECT A CLIP TO COLOR GRADE
        </span>
      </div>
    )
  }

  const grade = clip.colorGrade

  const updateGrade = (key: keyof ColorGradeSettings, value: number) => {
    updateClip(clip.id, { colorGrade: { ...grade, [key]: value } })
  }

  const resetGrade = () => {
    updateClip(clip.id, { colorGrade: { ...defaultColorGrade } })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Tone curve visual placeholder */}
      <div className="mx-3 mt-3 border border-[#3F3F46] h-24 bg-[#0d0d0f] relative overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 200 96" preserveAspectRatio="none">
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#27272A" />
              <stop offset="100%" stopColor="#FAFAFA" />
            </linearGradient>
          </defs>
          {/* Grid */}
          {[48, 96, 144].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="96" stroke="#27272A" strokeWidth="1" />
          ))}
          {[24, 48, 72].map((y) => (
            <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#27272A" strokeWidth="1" />
          ))}
          {/* Gradient bar */}
          <rect x="0" y="0" width="200" height="8" fill="url(#curveGrad)" opacity="0.3" />
          {/* Diagonal baseline */}
          <line x1="0" y1="96" x2="200" y2="0" stroke="#3F3F46" strokeWidth="1" />
          {/* Simulated curve based on midtones */}
          <path
            d={`M 0 96 C 50 ${96 - (grade.shadows + 100) / 200 * 48} 100 ${48 - grade.midtones / 2} 200 ${(100 - grade.highlights) / 100 * 48}`}
            fill="none"
            stroke="#DFE104"
            strokeWidth="1.5"
          />
        </svg>
        <span className="absolute top-1 left-2 text-[9px] font-bold uppercase tracking-widest text-[#3F3F46]">
          TONE CURVE
        </span>
      </div>

      {/* Controls */}
      <div className="px-3 pt-3 space-y-3 pb-6">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            COLOR GRADE
          </p>
          <button
            onClick={resetGrade}
            className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-[#DFE104] transition-colors"
          >
            RESET
          </button>
        </div>

        {GRADE_CONTROLS.map(({ key, label, min, max }) => {
          const value = grade[key] ?? 0
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                  {label}
                </label>
                <div className="flex items-center gap-1">
                  <span
                    className={`text-[10px] font-bold tabular-nums ${
                      value !== 0 ? 'text-[#DFE104]' : 'text-[#A1A1AA]'
                    }`}
                  >
                    {value > 0 ? '+' : ''}
                    {Math.round(value)}
                  </span>
                  {value !== 0 && (
                    <button
                      onClick={() => updateGrade(key, 0)}
                      className="text-[10px] text-[#A1A1AA] hover:text-[#DFE104] ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={1}
                value={value}
                onChange={(e) => updateGrade(key, Number(e.target.value))}
                className="w-full"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
