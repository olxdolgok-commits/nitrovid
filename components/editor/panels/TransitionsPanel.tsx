'use client'

import { useState } from 'react'
import { useEditorStore } from '@/lib/store'
import { Transition, TransitionType, TRANSITION_LABELS } from '@/lib/types'

function genId() {
  return Math.random().toString(36).slice(2)
}

const TRANSITION_ICONS: Record<TransitionType, string> = {
  fade: '◐',
  dissolve: '⊹',
  'wipe-left': '◁',
  'wipe-right': '▷',
  'wipe-up': '△',
  'zoom-in': '⊕',
  'zoom-out': '⊖',
  flash: '⚡',
  blur: '◎',
  'slide-left': '←',
  'slide-right': '→',
}

export function TransitionsPanel() {
  const { clips, transitions, addTransition, removeTransition } = useEditorStore()
  const [selectedType, setSelectedType] = useState<TransitionType>('fade')
  const [duration, setDuration] = useState(0.8)

  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)

  const addBetween = (clipA: string, clipB: string) => {
    const existing = transitions.find(
      (t) => t.betweenClipA === clipA && t.betweenClipB === clipB
    )
    if (existing) {
      removeTransition(existing.id)
    }
    addTransition({
      id: genId(),
      type: selectedType,
      duration,
      betweenClipA: clipA,
      betweenClipB: clipB,
    })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Type picker */}
      <div className="px-3 pt-3 pb-3 border-b-2 border-[#3F3F46]">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">
          TRANSITION TYPE
        </p>
        <div className="grid grid-cols-3 gap-1">
          {(Object.keys(TRANSITION_LABELS) as TransitionType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`py-2 px-1 flex flex-col items-center gap-0.5 border transition-colors text-center ${
                selectedType === type
                  ? 'border-[#DFE104] text-[#DFE104] bg-[#DFE104]/10'
                  : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
              }`}
            >
              <span className="text-base">{TRANSITION_ICONS[type]}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider leading-tight">
                {TRANSITION_LABELS[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="px-3 pt-3 pb-3 border-b-2 border-[#3F3F46]">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            DURATION
          </label>
          <span className="text-[10px] font-bold tabular-nums text-[#FAFAFA]">
            {duration.toFixed(1)}s
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={3}
          step={0.1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Cut points */}
      <div className="px-3 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">
          APPLY TO CUT
        </p>

        {sortedClips.length < 2 ? (
          <div className="flex flex-col items-center justify-center h-20 text-[#3F3F46]">
            <span className="text-xs font-bold uppercase tracking-widest text-center">
              ADD 2+ CLIPS TO APPLY TRANSITIONS
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedClips.slice(0, -1).map((clipA, i) => {
              const clipB = sortedClips[i + 1]
              const existing = transitions.find(
                (t) => t.betweenClipA === clipA.id && t.betweenClipB === clipB.id
              )
              return (
                <div
                  key={clipA.id + clipB.id}
                  className="flex items-center gap-2 border border-[#3F3F46] p-2"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-tight text-[#A1A1AA] truncate block">
                      {clipA.name.substring(0, 10)} → {clipB.name.substring(0, 10)}
                    </span>
                    {existing && (
                      <span className="text-[9px] text-[#DFE104] uppercase font-bold">
                        {TRANSITION_LABELS[existing.type]} · {existing.duration}s
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addBetween(clipA.id, clipB.id)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      existing
                        ? 'border-[#DFE104] text-[#DFE104] hover:bg-red-900/30 hover:border-red-500 hover:text-red-400'
                        : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#DFE104] hover:text-[#DFE104]'
                    }`}
                  >
                    {existing ? 'CHANGE' : 'APPLY'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Applied transitions list */}
      {transitions.length > 0 && (
        <div className="px-3 pt-4 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">
            APPLIED ({transitions.length})
          </p>
          <div className="space-y-1">
            {transitions.map((t) => {
              const clipA = clips.find((c) => c.id === t.betweenClipA)
              const clipB = clips.find((c) => c.id === t.betweenClipB)
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between border border-[#3F3F46] p-2"
                >
                  <span className="text-[10px] font-bold uppercase text-[#A1A1AA]">
                    {TRANSITION_LABELS[t.type]} · {t.duration}s
                  </span>
                  <button
                    onClick={() => removeTransition(t.id)}
                    className="text-[10px] text-[#A1A1AA] hover:text-red-400 transition-colors font-bold uppercase"
                  >
                    REMOVE
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
