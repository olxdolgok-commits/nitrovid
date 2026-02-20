'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useEditorStore } from '@/lib/store'
import { TextOverlay, TextAnimation } from '@/lib/types'

function genId() {
  return Math.random().toString(36).slice(2)
}

const ANIMATIONS: TextAnimation[] = [
  'none',
  'fade',
  'slide-up',
  'slide-left',
  'scale',
  'typewriter',
  'glitch',
  'kinetic-bounce',
]

const FONT_FAMILIES = [
  'Space Grotesk',
  'Inter',
  'Georgia',
  'Courier New',
  'Impact',
  'Arial Black',
]

const PRESET_STYLES: Array<{ label: string; style: Partial<TextOverlay> }> = [
  {
    label: 'TITLE',
    style: {
      fontSize: 72,
      fontWeight: 700,
      color: '#FAFAFA',
      uppercase: true,
      letterSpacing: -2,
      animation: 'slide-up',
    },
  },
  {
    label: 'SUBTITLE',
    style: {
      fontSize: 32,
      fontWeight: 500,
      color: '#A1A1AA',
      uppercase: true,
      letterSpacing: 2,
      animation: 'fade',
    },
  },
  {
    label: 'KINETIC',
    style: {
      fontSize: 96,
      fontWeight: 700,
      color: '#DFE104',
      uppercase: true,
      letterSpacing: -4,
      animation: 'kinetic-bounce',
    },
  },
  {
    label: 'CAPTION',
    style: {
      fontSize: 24,
      fontWeight: 400,
      color: '#FAFAFA',
      uppercase: false,
      background: 'rgba(0,0,0,0.7)',
      backgroundOpacity: 0.7,
      animation: 'fade',
    },
  },
  {
    label: 'GLITCH',
    style: {
      fontSize: 64,
      fontWeight: 700,
      color: '#DFE104',
      uppercase: true,
      animation: 'glitch',
      outline: true,
      outlineColor: '#FAFAFA',
    },
  },
  {
    label: 'TYPEWRITER',
    style: {
      fontSize: 40,
      fontWeight: 500,
      color: '#FAFAFA',
      uppercase: false,
      fontFamily: 'Courier New',
      animation: 'typewriter',
    },
  },
]

export function TextPanel() {
  const { textOverlays, addTextOverlay, updateTextOverlay, removeTextOverlay, selectedTextId, setSelectedText, currentTime, duration } =
    useEditorStore()

  const selectedOverlay = textOverlays.find((t) => t.id === selectedTextId)

  const createOverlay = (presetStyle?: Partial<TextOverlay>) => {
    const overlay: TextOverlay = {
      id: genId(),
      text: 'YOUR TEXT',
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration || currentTime + 5),
      x: 0.5,
      y: 0.5,
      fontSize: 64,
      fontFamily: 'Space Grotesk',
      color: '#FAFAFA',
      fontWeight: 700,
      uppercase: true,
      letterSpacing: -2,
      lineHeight: 1.1,
      animation: 'fade',
      alignment: 'center',
      background: 'none',
      backgroundOpacity: 0.5,
      shadow: false,
      outline: false,
      outlineColor: '#000000',
      ...presetStyle,
    }
    addTextOverlay(overlay)
    setSelectedText(overlay.id)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Presets */}
      <div className="px-3 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">PRESETS</p>
        <div className="grid grid-cols-3 gap-1">
          {PRESET_STYLES.map((p) => (
            <button
              key={p.label}
              onClick={() => createOverlay(p.style)}
              className="border border-[#3F3F46] py-2 text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA] hover:border-[#DFE104] hover:text-[#DFE104] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add custom */}
      <div className="px-3 pt-2 pb-3 border-b-2 border-[#3F3F46]">
        <button
          onClick={() => createOverlay()}
          className="w-full h-8 border-2 border-[#DFE104] text-[#DFE104] text-xs font-bold uppercase tracking-tighter hover:bg-[#DFE104] hover:text-black transition-colors flex items-center justify-center gap-1"
        >
          <Plus size={12} /> ADD TEXT
        </button>
      </div>

      {/* Text overlay list */}
      {textOverlays.length > 0 && (
        <div className="px-3 pt-3 border-b-2 border-[#3F3F46]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">LAYERS</p>
          <div className="space-y-1 mb-3">
            {textOverlays.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-2 border p-2 cursor-pointer transition-colors ${
                  selectedTextId === t.id
                    ? 'border-[#DFE104] bg-[#DFE104]/5'
                    : 'border-[#3F3F46] hover:border-[#A1A1AA]'
                }`}
                onClick={() => setSelectedText(t.id)}
              >
                <span className="flex-1 text-[10px] font-bold uppercase tracking-tight text-[#FAFAFA] truncate">
                  {t.text.substring(0, 20)}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTextOverlay(t.id)
                  }}
                  className="text-[#A1A1AA] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected overlay editor */}
      {selectedOverlay && (
        <div className="px-3 pt-3 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#DFE104]">EDIT TEXT</p>

          {/* Text content */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-1">
              CONTENT
            </label>
            <textarea
              value={selectedOverlay.text}
              onChange={(e) => updateTextOverlay(selectedOverlay.id, { text: e.target.value })}
              rows={3}
              className="w-full bg-[#27272A] border border-[#3F3F46] text-[#FAFAFA] text-sm px-2 py-1.5 resize-none outline-none focus:border-[#DFE104] transition-colors"
            />
          </div>

          {/* Timing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-1">
                START (s)
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={selectedOverlay.startTime.toFixed(1)}
                onChange={(e) =>
                  updateTextOverlay(selectedOverlay.id, { startTime: Number(e.target.value) })
                }
                className="w-full bg-[#27272A] border border-[#3F3F46] text-[#FAFAFA] text-xs px-2 py-1.5 outline-none focus:border-[#DFE104]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-1">
                END (s)
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={selectedOverlay.endTime.toFixed(1)}
                onChange={(e) =>
                  updateTextOverlay(selectedOverlay.id, { endTime: Number(e.target.value) })
                }
                className="w-full bg-[#27272A] border border-[#3F3F46] text-[#FAFAFA] text-xs px-2 py-1.5 outline-none focus:border-[#DFE104]"
              />
            </div>
          </div>

          {/* Font size */}
          <SliderField
            label="FONT SIZE"
            value={selectedOverlay.fontSize}
            min={12}
            max={200}
            onChange={(v) => updateTextOverlay(selectedOverlay.id, { fontSize: v })}
            unit="px"
          />

          {/* Font family */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-1">
              FONT
            </label>
            <select
              value={selectedOverlay.fontFamily}
              onChange={(e) => updateTextOverlay(selectedOverlay.id, { fontFamily: e.target.value })}
              className="w-full bg-[#27272A] border border-[#3F3F46] text-[#FAFAFA] text-xs px-2 py-1.5 outline-none focus:border-[#DFE104]"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-1">
              COLOR
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedOverlay.color}
                onChange={(e) => updateTextOverlay(selectedOverlay.id, { color: e.target.value })}
                className="w-8 h-8 border border-[#3F3F46] bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={selectedOverlay.color}
                onChange={(e) => updateTextOverlay(selectedOverlay.id, { color: e.target.value })}
                className="flex-1 bg-[#27272A] border border-[#3F3F46] text-[#FAFAFA] text-xs px-2 py-1.5 uppercase outline-none focus:border-[#DFE104]"
              />
            </div>
          </div>

          {/* Animation */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-1">
              ANIMATION
            </label>
            <div className="grid grid-cols-2 gap-1">
              {ANIMATIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => updateTextOverlay(selectedOverlay.id, { animation: a })}
                  className={`py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    selectedOverlay.animation === a
                      ? 'border-[#DFE104] text-[#DFE104] bg-[#DFE104]/10'
                      : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
                  }`}
                >
                  {a.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Alignment */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] block mb-1">
              ALIGNMENT
            </label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => updateTextOverlay(selectedOverlay.id, { alignment: a })}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    selectedOverlay.alignment === a
                      ? 'border-[#DFE104] text-[#DFE104]'
                      : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Position */}
          <SliderField
            label="POSITION X"
            value={Math.round(selectedOverlay.x * 100)}
            min={0}
            max={100}
            onChange={(v) => updateTextOverlay(selectedOverlay.id, { x: v / 100 })}
            unit="%"
          />
          <SliderField
            label="POSITION Y"
            value={Math.round(selectedOverlay.y * 100)}
            min={0}
            max={100}
            onChange={(v) => updateTextOverlay(selectedOverlay.id, { y: v / 100 })}
            unit="%"
          />

          {/* Toggles */}
          <div className="flex gap-2">
            <ToggleField
              label="UPPERCASE"
              value={selectedOverlay.uppercase}
              onChange={(v) => updateTextOverlay(selectedOverlay.id, { uppercase: v })}
            />
            <ToggleField
              label="SHADOW"
              value={selectedOverlay.shadow}
              onChange={(v) => updateTextOverlay(selectedOverlay.id, { shadow: v })}
            />
            <ToggleField
              label="OUTLINE"
              value={selectedOverlay.outline}
              onChange={(v) => updateTextOverlay(selectedOverlay.id, { outline: v })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
  unit = '',
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  unit?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
          {label}
        </label>
        <span className="text-[10px] font-bold tabular-nums text-[#FAFAFA]">
          {Math.round(value)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
        value ? 'border-[#DFE104] text-[#DFE104] bg-[#DFE104]/10' : 'border-[#3F3F46] text-[#A1A1AA]'
      }`}
    >
      {label}
    </button>
  )
}
