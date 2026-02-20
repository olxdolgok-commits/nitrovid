import { create } from 'zustand'
import {
  VideoClip,
  AudioTrack,
  TextOverlay,
  Transition,
  ExportSettings,
  FilterSettings,
  ColorGradeSettings,
  ToolMode,
  defaultFilters,
  defaultColorGrade,
} from './types'

interface EditorStore {
  // Media
  clips: VideoClip[]
  audioTracks: AudioTrack[]
  textOverlays: TextOverlay[]
  transitions: Transition[]

  // Playback
  currentTime: number
  duration: number
  isPlaying: boolean
  zoom: number // pixels per second

  // Selection
  selectedClipId: string | null
  selectedTextId: string | null
  selectedTransitionId: string | null

  // UI
  activeToolMode: ToolMode
  showExportModal: boolean

  // Project
  projectName: string

  // Export
  exportSettings: ExportSettings
  isExporting: boolean
  exportProgress: number

  // Actions — Clips
  addClip: (clip: VideoClip) => void
  updateClip: (id: string, updates: Partial<VideoClip>) => void
  removeClip: (id: string) => void
  reorderClips: (clips: VideoClip[]) => void

  // Actions — Text
  addTextOverlay: (text: TextOverlay) => void
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void
  removeTextOverlay: (id: string) => void

  // Actions — Audio
  addAudioTrack: (track: AudioTrack) => void
  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void
  removeAudioTrack: (id: string) => void

  // Actions — Transitions
  addTransition: (t: Transition) => void
  updateTransition: (id: string, updates: Partial<Transition>) => void
  removeTransition: (id: string) => void

  // Playback
  setCurrentTime: (t: number) => void
  setDuration: (d: number) => void
  setIsPlaying: (p: boolean) => void
  togglePlayback: () => void
  setZoom: (z: number) => void

  // Selection
  setSelectedClip: (id: string | null) => void
  setSelectedText: (id: string | null) => void
  setSelectedTransition: (id: string | null) => void

  // UI
  setActiveToolMode: (mode: ToolMode) => void
  setShowExportModal: (show: boolean) => void

  // Project
  setProjectName: (name: string) => void

  // Export
  setExportSettings: (s: Partial<ExportSettings>) => void
  setIsExporting: (v: boolean) => void
  setExportProgress: (p: number) => void

  // Computed
  getSelectedClip: () => VideoClip | null
  getSelectedText: () => TextOverlay | null
  getActiveClipAtTime: (t: number) => VideoClip | null
  getTotalDuration: () => number
}

const defaultExportSettings: ExportSettings = {
  resolution: '1080p',
  fps: 30,
  format: 'mp4',
  quality: 'high',
  includeAudio: true,
  startTime: 0,
  endTime: 0,
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  clips: [],
  audioTracks: [],
  textOverlays: [],
  transitions: [],

  currentTime: 0,
  duration: 0,
  isPlaying: false,
  zoom: 80,

  selectedClipId: null,
  selectedTextId: null,
  selectedTransitionId: null,

  activeToolMode: 'media',
  showExportModal: false,

  projectName: 'UNTITLED PROJECT',

  exportSettings: defaultExportSettings,
  isExporting: false,
  exportProgress: 0,

  addClip: (clip) =>
    set((state) => {
      const newClips = [...state.clips, clip]
      const totalDur = newClips.reduce((max, c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return Math.max(max, end)
      }, 0)
      return {
        clips: newClips,
        duration: totalDur,
        exportSettings: { ...state.exportSettings, endTime: totalDur },
      }
    }),

  updateClip: (id, updates) =>
    set((state) => {
      const clips = state.clips.map((c) => (c.id === id ? { ...c, ...updates } : c))
      const totalDur = clips.reduce((max, c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return Math.max(max, end)
      }, 0)
      return { clips, duration: totalDur }
    }),

  removeClip: (id) =>
    set((state) => {
      const clips = state.clips.filter((c) => c.id !== id)
      const totalDur = clips.reduce((max, c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return Math.max(max, end)
      }, 0)
      return {
        clips,
        duration: totalDur,
        selectedClipId: state.selectedClipId === id ? null : state.selectedClipId,
      }
    }),

  reorderClips: (clips) => set({ clips }),

  addTextOverlay: (text) => set((state) => ({ textOverlays: [...state.textOverlays, text] })),
  updateTextOverlay: (id, updates) =>
    set((state) => ({
      textOverlays: state.textOverlays.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTextOverlay: (id) =>
    set((state) => ({
      textOverlays: state.textOverlays.filter((t) => t.id !== id),
      selectedTextId: state.selectedTextId === id ? null : state.selectedTextId,
    })),

  addAudioTrack: (track) => set((state) => ({ audioTracks: [...state.audioTracks, track] })),
  updateAudioTrack: (id, updates) =>
    set((state) => ({
      audioTracks: state.audioTracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeAudioTrack: (id) =>
    set((state) => ({ audioTracks: state.audioTracks.filter((t) => t.id !== id) })),

  addTransition: (t) => set((state) => ({ transitions: [...state.transitions, t] })),
  updateTransition: (id, updates) =>
    set((state) => ({
      transitions: state.transitions.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),
  removeTransition: (id) =>
    set((state) => ({ transitions: state.transitions.filter((t) => t.id !== id) })),

  setCurrentTime: (t) => set({ currentTime: Math.max(0, t) }),
  setDuration: (d) => set({ duration: d }),
  setIsPlaying: (p) => set({ isPlaying: p }),
  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setZoom: (z) => set({ zoom: Math.max(20, Math.min(400, z)) }),

  setSelectedClip: (id) => set({ selectedClipId: id }),
  setSelectedText: (id) => set({ selectedTextId: id }),
  setSelectedTransition: (id) => set({ selectedTransitionId: id }),

  setActiveToolMode: (mode) => set({ activeToolMode: mode }),
  setShowExportModal: (show) => set({ showExportModal: show }),

  setProjectName: (name) => set({ projectName: name }),
  setExportSettings: (s) =>
    set((state) => ({ exportSettings: { ...state.exportSettings, ...s } })),
  setIsExporting: (v) => set({ isExporting: v }),
  setExportProgress: (p) => set({ exportProgress: p }),

  getSelectedClip: () => {
    const { clips, selectedClipId } = get()
    return clips.find((c) => c.id === selectedClipId) ?? null
  },

  getSelectedText: () => {
    const { textOverlays, selectedTextId } = get()
    return textOverlays.find((t) => t.id === selectedTextId) ?? null
  },

  getActiveClipAtTime: (t) => {
    const { clips } = get()
    return (
      clips.find((c) => {
        const end = c.startTime + c.duration - c.trimStart - c.trimEnd
        return t >= c.startTime && t < end
      }) ?? null
    )
  },

  getTotalDuration: () => {
    const { clips } = get()
    return clips.reduce((max, c) => {
      const end = c.startTime + c.duration - c.trimStart - c.trimEnd
      return Math.max(max, end)
    }, 0)
  },
}))

// Utility: build CSS filter string from FilterSettings
export function buildCSSFilter(f: FilterSettings, cg: ColorGradeSettings): string {
  const br = 1 + (f.brightness + f.exposure) / 100
  const ct = 1 + f.contrast / 100
  const sat = 1 + f.saturation / 100
  const hue = f.hue
  const blur = f.blur
  const sepia = f.sepia / 100
  const invert = f.invert / 100

  // Apply temperature as hue-rotate offset
  const tempHue = cg.temperature * 0.3
  const totalHue = hue + tempHue

  return [
    `brightness(${Math.max(0, br)})`,
    `contrast(${Math.max(0, ct)})`,
    `saturate(${Math.max(0, sat + cg.vibrance / 100)})`,
    totalHue !== 0 ? `hue-rotate(${totalHue}deg)` : '',
    blur > 0 ? `blur(${blur}px)` : '',
    sepia > 0 ? `sepia(${sepia})` : '',
    invert > 0 ? `invert(${invert})` : '',
  ]
    .filter(Boolean)
    .join(' ')
}
