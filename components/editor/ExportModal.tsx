'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Download, CheckCircle } from 'lucide-react'
import { useEditorStore } from '@/lib/store'
import { ExportFPS, ExportFormat, ExportQuality, ExportResolution } from '@/lib/types'

const RESOLUTIONS: Array<{ value: ExportResolution; label: string; w: number; h: number }> = [
  { value: '4k', label: '4K UHD', w: 3840, h: 2160 },
  { value: '1080p', label: '1080P', w: 1920, h: 1080 },
  { value: '720p', label: '720P', w: 1280, h: 720 },
  { value: '480p', label: '480P', w: 854, h: 480 },
]

const FPS_OPTIONS: ExportFPS[] = [24, 30, 60]
const FORMAT_OPTIONS: ExportFormat[] = ['mp4', 'webm', 'gif']
const QUALITY_OPTIONS: ExportQuality[] = ['low', 'medium', 'high', 'lossless']

export function ExportModal() {
  const {
    showExportModal,
    setShowExportModal,
    exportSettings,
    setExportSettings,
    isExporting,
    exportProgress,
    setIsExporting,
    setExportProgress,
    duration,
  } = useEditorStore()

  const [done, setDone] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  if (!showExportModal) return null

  const startExport = () => {
    setIsExporting(true)
    setExportProgress(0)
    setDone(false)
    setDownloadUrl(null)

    // Simulate export progress
    let progress = 0
    timerRef.current = setInterval(() => {
      progress += Math.random() * 8 + 2
      if (progress >= 100) {
        progress = 100
        clearInterval(timerRef.current!)
        setExportProgress(100)
        setIsExporting(false)
        setDone(true)
        // Generate a dummy blob URL as a placeholder
        const blob = new Blob(['NITROVID EXPORT PLACEHOLDER'], { type: 'text/plain' })
        setDownloadUrl(URL.createObjectURL(blob))
      } else {
        setExportProgress(progress)
      }
    }, 200)
  }

  const close = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsExporting(false)
    setExportProgress(0)
    setDone(false)
    setDownloadUrl(null)
    setShowExportModal(false)
  }

  const res = RESOLUTIONS.find((r) => r.value === exportSettings.resolution)!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80" onClick={close} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-[#09090B] border-2 border-[#3F3F46] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#3F3F46]">
          <span className="text-sm font-bold uppercase tracking-tighter text-[#FAFAFA]">
            EXPORT VIDEO
          </span>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!done ? (
            <>
              {/* Resolution */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">
                  RESOLUTION
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setExportSettings({ resolution: r.value })}
                      disabled={isExporting}
                      className={`py-2 flex flex-col items-center border transition-colors disabled:opacity-50 ${
                        exportSettings.resolution === r.value
                          ? 'border-[#DFE104] text-[#DFE104]'
                          : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
                      }`}
                    >
                      <span className="text-sm font-bold">{r.label}</span>
                      <span className="text-[9px] text-[#A1A1AA]">
                        {r.w}×{r.h}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">
                  FRAME RATE
                </p>
                <div className="flex gap-1">
                  {FPS_OPTIONS.map((fps) => (
                    <button
                      key={fps}
                      onClick={() => setExportSettings({ fps })}
                      disabled={isExporting}
                      className={`flex-1 py-2 text-sm font-bold border transition-colors disabled:opacity-50 ${
                        exportSettings.fps === fps
                          ? 'border-[#DFE104] text-[#DFE104]'
                          : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
                      }`}
                    >
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">
                  FORMAT
                </p>
                <div className="flex gap-1">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportSettings({ format: fmt })}
                      disabled={isExporting}
                      className={`flex-1 py-2 text-sm font-bold uppercase border transition-colors disabled:opacity-50 ${
                        exportSettings.format === fmt
                          ? 'border-[#DFE104] text-[#DFE104]'
                          : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-2">
                  QUALITY
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setExportSettings({ quality: q })}
                      disabled={isExporting}
                      className={`py-2 text-[10px] font-bold uppercase tracking-wider border transition-colors disabled:opacity-50 ${
                        exportSettings.quality === q
                          ? 'border-[#DFE104] text-[#DFE104]'
                          : 'border-[#3F3F46] text-[#A1A1AA] hover:border-[#A1A1AA]'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio toggle */}
              <div className="flex items-center justify-between border border-[#3F3F46] px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">
                  INCLUDE AUDIO
                </span>
                <button
                  onClick={() => setExportSettings({ includeAudio: !exportSettings.includeAudio })}
                  disabled={isExporting}
                  className={`w-10 h-5 relative transition-colors ${
                    exportSettings.includeAudio ? 'bg-[#DFE104]' : 'bg-[#27272A]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-black transition-transform ${
                      exportSettings.includeAudio ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Summary */}
              <div className="border border-[#3F3F46] p-3 bg-[#27272A]/30">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-sm font-bold text-[#DFE104]">
                      {res.w}×{res.h}
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      PIXELS
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#DFE104]">{exportSettings.fps}</div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      FPS
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#DFE104]">
                      {duration.toFixed(1)}s
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      DURATION
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {isExporting && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                      RENDERING...
                    </span>
                    <span className="text-[10px] font-bold tabular-nums text-[#DFE104]">
                      {Math.round(exportProgress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#27272A] w-full">
                    <div
                      className="h-full bg-[#DFE104] transition-all duration-200"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Export button */}
              <button
                onClick={startExport}
                disabled={isExporting}
                className="w-full h-14 bg-[#DFE104] text-black text-sm font-bold uppercase tracking-tighter flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Download size={16} />
                {isExporting ? 'RENDERING...' : 'EXPORT VIDEO'}
              </button>
            </>
          ) : (
            /* Done state */
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 bg-[#DFE104] flex items-center justify-center">
                <CheckCircle size={32} className="text-black" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold uppercase tracking-tighter text-[#FAFAFA] mb-1">
                  EXPORT COMPLETE
                </h3>
                <p className="text-sm text-[#A1A1AA]">
                  {res.label} · {exportSettings.fps}fps · {exportSettings.format.toUpperCase()}
                </p>
              </div>
              <a
                href={downloadUrl!}
                download={`nitrovid_export.${exportSettings.format}`}
                className="w-full h-12 bg-[#DFE104] text-black text-sm font-bold uppercase tracking-tighter flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
              >
                <Download size={16} />
                DOWNLOAD
              </a>
              <button
                onClick={close}
                className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
              >
                CLOSE
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
