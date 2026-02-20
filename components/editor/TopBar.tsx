'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Undo2, Redo2, Settings, ChevronDown } from 'lucide-react'
import { useEditorStore } from '@/lib/store'

export function TopBar() {
  const { projectName, setProjectName, setShowExportModal, clips } = useEditorStore()
  const [editingName, setEditingName] = useState(false)

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b-2 border-[#3F3F46] bg-[#09090B] flex-shrink-0 z-30">
      {/* Left: logo + project name */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-0">
          <span className="text-sm font-bold uppercase tracking-tighter text-[#FAFAFA]">
            NITRO
          </span>
          <span className="text-sm font-bold uppercase tracking-tighter text-[#DFE104]">VID</span>
        </Link>

        <span className="text-[#3F3F46]">/</span>

        {editingName ? (
          <input
            autoFocus
            value={projectName}
            onChange={(e) => setProjectName(e.target.value.toUpperCase())}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
            className="bg-transparent border-b-2 border-[#DFE104] text-[#FAFAFA] text-sm font-bold uppercase tracking-tighter outline-none w-48 h-6"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-bold uppercase tracking-tighter text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            {projectName}
          </button>
        )}
      </div>

      {/* Center: undo/redo */}
      <div className="flex items-center gap-1">
        <button className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors">
          <Undo2 size={14} />
        </button>
        <button className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors">
          <Redo2 size={14} />
        </button>
      </div>

      {/* Right: settings + export */}
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] transition-colors">
          <Settings size={14} />
        </button>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={clips.length === 0}
          className="h-8 px-4 bg-[#DFE104] text-black text-xs font-bold uppercase tracking-tighter flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          <Download size={12} />
          EXPORT
        </button>
      </div>
    </header>
  )
}
