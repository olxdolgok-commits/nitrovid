'use client'

import { useEditorStore } from '@/lib/store'
import { FilterSettings, FILTER_PRESETS, defaultFilters } from '@/lib/types'

const FILTER_CONTROLS: Array<{
  key: keyof FilterSettings
  label: string
  min: number
  max: number
  step: number
}> = [
  { key: 'brightness', label: 'BRIGHTNESS', min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'CONTRAST', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'SATURATION', min: -100, max: 100, step: 1 },
  { key: 'exposure', label: 'EXPOSURE', min: -100, max: 100, step: 1 },
  { key: 'hue', label: 'HUE ROTATE', min: -180, max: 180, step: 1 },
  { key: 'sepia', label: 'SEPIA', min: 0, max: 100, step: 1 },
  { key: 'blur', label: 'BLUR', min: 0, max: 20, step: 0.1 },
  { key: 'invert', label: 'INVERT', min: 0, max: 100, step: 1 },
]

export function FiltersPanel() {
  const { getSelectedClip, updateClip } = useEditorStore()
  const clip = getSelectedClip()

  if (!clip) {
    return (
      <div className="flex flex-col items-center justify-center h-32 px-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#3F3F46] text-center">
          SELECT A CLIP TO ADJUST FILTERS
        </span>
      </div>
    )
  }

  const filters = clip.filters

  const updateFilter = (key: keyof FilterSettings, value: number) => {
    updateClip(clip.id, {
      filters: { ...filters, [key]: value },
      preset: 'none',
    })
  }

  const applyPreset = (presetName: string) => {
    const preset = FILTER_PRESETS[presetName]
    updateClip(clip.id, {
      filters: { ...defaultFilters, ...preset },
      preset: presetName,
    })
  }

  const resetFilters = () => {
    updateClip(clip.id, { filters: { ...defaultFilters }, preset: 'none' })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Presets */}
      <div className="px-3 pt-3 pb-3 border-b-2 border-[#3F3F46]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">PRESETS</p>
          <button
            onClick={resetFilters}
            className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] hover:text-[#DFE104] transition-colors"
          >
            RESET
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Object.keys(FILTER_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => applyPreset(name)}
              className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                clip.preset === name
                  ? 'border-[#DFE104] text-[#DFE104] bg-[#DFE104]/10'
                  : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA] hover:text-[#FAFAFA]'
              }`}
            >
              {name === 'black & white' ? 'B&W' : name.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Fine-tune sliders */}
      <div className="px-3 pt-3 space-y-3 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">FINE TUNE</p>
        {FILTER_CONTROLS.map(({ key, label, min, max, step }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                {label}
              </label>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    filters[key] !== 0 ? 'text-[#DFE104]' : 'text-[#A1A1AA]'
                  }`}
                >
                  {key === 'blur' ? filters[key].toFixed(1) : Math.round(filters[key])}
                  {key === 'hue' ? '°' : key === 'blur' ? 'px' : '%'}
                </span>
                {filters[key] !== 0 && (
                  <button
                    onClick={() => updateFilter(key, 0)}
                    className="text-[10px] text-[#A1A1AA] hover:text-[#DFE104] transition-colors ml-1"
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
              step={step}
              value={filters[key]}
              onChange={(e) => updateFilter(key, Number(e.target.value))}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
