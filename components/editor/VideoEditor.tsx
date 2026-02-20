'use client'

import { useEffect } from 'react'
import { TopBar } from './TopBar'
import { VideoPreview } from './VideoPreview'
import { Timeline } from './Timeline'
import { ToolsSidebar } from './ToolsSidebar'
import { ExportModal } from './ExportModal'
import { useEditorStore } from '@/lib/store'

export function VideoEditor() {
  const { showExportModal } = useEditorStore()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const { togglePlayback, setCurrentTime, currentTime, duration, setZoom, zoom, selectedClipId, removeClip } =
        useEditorStore.getState()

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayback()
          break
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentTime(currentTime - (e.shiftKey ? 10 : 1))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentTime(currentTime + (e.shiftKey ? 10 : 1))
          break
        case 'Home':
          e.preventDefault()
          setCurrentTime(0)
          break
        case 'End':
          e.preventDefault()
          setCurrentTime(duration)
          break
        case '+':
        case '=':
          e.preventDefault()
          setZoom(zoom * 1.3)
          break
        case '-':
          e.preventDefault()
          setZoom(zoom * 0.75)
          break
        case 'Delete':
        case 'Backspace':
          if (selectedClipId) {
            removeClip(selectedClipId)
          }
          break
        case 'Escape':
          useEditorStore.getState().setSelectedClip(null)
          useEditorStore.getState().setSelectedText(null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-[#09090B] overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* Main workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Left: tools sidebar */}
        <ToolsSidebar />

        {/* Center: preview + timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Video preview — takes ~60% height */}
          <div className="flex-1 min-h-0 border-b-2 border-[#3F3F46]" style={{ minHeight: 0 }}>
            <VideoPreview />
          </div>

          {/* Timeline — fixed height */}
          <div style={{ height: 220 }} className="flex-shrink-0">
            <Timeline />
          </div>
        </div>
      </div>

      {/* Export modal */}
      {showExportModal && <ExportModal />}
    </div>
  )
}
