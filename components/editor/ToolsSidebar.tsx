'use client'

import { useState } from 'react'
import {
  Film,
  Type,
  Sliders,
  GitBranch,
  Palette,
  Gauge,
  Crop,
  ChevronRight,
} from 'lucide-react'
import { useEditorStore } from '@/lib/store'
import { ToolMode } from '@/lib/types'
import { MediaPanel } from './panels/MediaPanel'
import { TextPanel } from './panels/TextPanel'
import { FiltersPanel } from './panels/FiltersPanel'
import { TransitionsPanel } from './panels/TransitionsPanel'
import { ColorGradePanel } from './panels/ColorGradePanel'
import { SpeedPanel } from './panels/SpeedPanel'
import { TransformPanel } from './panels/TransformPanel'

const TOOLS: Array<{ mode: ToolMode; icon: React.ReactNode; label: string }> = [
  { mode: 'media', icon: <Film size={16} />, label: 'MEDIA' },
  { mode: 'text', icon: <Type size={16} />, label: 'TEXT' },
  { mode: 'filters', icon: <Sliders size={16} />, label: 'FILTERS' },
  { mode: 'transitions', icon: <GitBranch size={16} />, label: 'TRANS' },
  { mode: 'color', icon: <Palette size={16} />, label: 'COLOR' },
  { mode: 'speed', icon: <Gauge size={16} />, label: 'SPEED' },
  { mode: 'transform', icon: <Crop size={16} />, label: 'CROP' },
]

function PanelContent({ mode }: { mode: ToolMode }) {
  switch (mode) {
    case 'media':
      return <MediaPanel />
    case 'text':
      return <TextPanel />
    case 'filters':
      return <FiltersPanel />
    case 'transitions':
      return <TransitionsPanel />
    case 'color':
      return <ColorGradePanel />
    case 'speed':
      return <SpeedPanel />
    case 'transform':
      return <TransformPanel />
    default:
      return null
  }
}

export function ToolsSidebar() {
  const { activeToolMode, setActiveToolMode } = useEditorStore()
  const [collapsed, setCollapsed] = useState(false)

  const activeTool = TOOLS.find((t) => t.mode === activeToolMode)

  return (
    <div className="flex h-full border-r-2 border-[#3F3F46]">
      {/* Icon rail */}
      <div className="flex flex-col border-r-2 border-[#3F3F46] bg-[#09090B] w-12 flex-shrink-0">
        {TOOLS.map((tool) => (
          <button
            key={tool.mode}
            onClick={() => {
              if (activeToolMode === tool.mode) {
                setCollapsed(!collapsed)
              } else {
                setActiveToolMode(tool.mode)
                setCollapsed(false)
              }
            }}
            title={tool.label}
            className={`w-12 h-12 flex flex-col items-center justify-center gap-0.5 border-b border-[#3F3F46] transition-colors ${
              activeToolMode === tool.mode && !collapsed
                ? 'bg-[#DFE104] text-black'
                : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]'
            }`}
          >
            {tool.icon}
            <span className="text-[8px] font-bold tracking-wider">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      {!collapsed && (
        <div className="w-56 bg-[#09090B] flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#3F3F46] flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#DFE104]">
              {activeTool?.label}
            </span>
            <button
              onClick={() => setCollapsed(true)}
              className="text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <PanelContent mode={activeToolMode} />
          </div>
        </div>
      )}
    </div>
  )
}
