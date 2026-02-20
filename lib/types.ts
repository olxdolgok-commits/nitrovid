export interface FilterSettings {
  brightness: number   // -100 to 100
  contrast: number     // -100 to 100
  saturation: number   // -100 to 100
  hue: number          // -180 to 180
  exposure: number     // -100 to 100
  blur: number         // 0 to 20
  sepia: number        // 0 to 100
  invert: number       // 0 to 100
}

export interface ColorGradeSettings {
  shadows: number      // -100 to 100
  midtones: number     // -100 to 100
  highlights: number   // -100 to 100
  whites: number       // -100 to 100
  blacks: number       // -100 to 100
  vibrance: number     // -100 to 100
  temperature: number  // -100 to 100 (cool to warm)
  tint: number         // -100 to 100
}

export const defaultFilters: FilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  exposure: 0,
  blur: 0,
  sepia: 0,
  invert: 0,
}

export const defaultColorGrade: ColorGradeSettings = {
  shadows: 0,
  midtones: 0,
  highlights: 0,
  whites: 0,
  blacks: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
}

export interface VideoClip {
  id: string
  name: string
  src: string
  duration: number
  startTime: number   // position on timeline (seconds)
  trimStart: number   // seconds trimmed from start
  trimEnd: number     // seconds trimmed from end
  trackIndex: number  // 0=main video, 1=overlay, etc.
  opacity: number     // 0-1
  speed: number       // 0.25 to 4
  volume: number      // 0-1
  filters: FilterSettings
  colorGrade: ColorGradeSettings
  preset: string      // applied filter preset name
  flipH: boolean
  flipV: boolean
  rotation: number    // degrees
  cropX: number       // 0-1
  cropY: number       // 0-1
  cropW: number       // 0-1
  cropH: number       // 0-1
}

export interface AudioTrack {
  id: string
  name: string
  src: string
  startTime: number
  duration: number
  volume: number
  fadeIn: number
  fadeOut: number
  trackIndex: number
}

export type TextAnimation = 'none' | 'fade' | 'slide-up' | 'slide-left' | 'scale' | 'typewriter' | 'glitch' | 'kinetic-bounce'

export interface TextOverlay {
  id: string
  text: string
  startTime: number
  endTime: number
  x: number           // 0-1 relative to canvas
  y: number           // 0-1 relative to canvas
  fontSize: number    // px
  fontFamily: string
  color: string
  fontWeight: number
  uppercase: boolean
  letterSpacing: number
  lineHeight: number
  animation: TextAnimation
  alignment: 'left' | 'center' | 'right'
  background: string  // 'none' or color
  backgroundOpacity: number
  shadow: boolean
  outline: boolean
  outlineColor: string
}

export type TransitionType =
  | 'fade'
  | 'dissolve'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'zoom-in'
  | 'zoom-out'
  | 'flash'
  | 'blur'
  | 'slide-left'
  | 'slide-right'

export interface Transition {
  id: string
  type: TransitionType
  duration: number      // seconds
  betweenClipA: string
  betweenClipB: string
}

export type ExportResolution = '4k' | '1080p' | '720p' | '480p'
export type ExportFPS = 24 | 30 | 60
export type ExportFormat = 'mp4' | 'webm' | 'gif'
export type ExportQuality = 'low' | 'medium' | 'high' | 'lossless'

export interface ExportSettings {
  resolution: ExportResolution
  fps: ExportFPS
  format: ExportFormat
  quality: ExportQuality
  includeAudio: boolean
  startTime: number
  endTime: number
}

export type ToolMode = 'media' | 'text' | 'filters' | 'transitions' | 'color' | 'audio' | 'speed' | 'transform'

export const FILTER_PRESETS: Record<string, Partial<FilterSettings>> = {
  none: {},
  cinematic: { contrast: 20, saturation: -15, brightness: -5 },
  vintage: { sepia: 40, contrast: 10, saturation: -20, brightness: 5 },
  vivid: { saturation: 40, contrast: 20, brightness: 10 },
  muted: { saturation: -30, contrast: -10, brightness: 5 },
  'black & white': { saturation: -100 },
  warm: { hue: 10, saturation: 15, brightness: 5 },
  cool: { hue: -10, saturation: 10, brightness: 0 },
  'hard light': { contrast: 50, brightness: 10 },
  dreamy: { brightness: 15, saturation: 20, blur: 0.5 },
  noir: { saturation: -100, contrast: 40, brightness: -10 },
  summer: { saturation: 25, brightness: 10, hue: 5 },
}

export const TRANSITION_LABELS: Record<TransitionType, string> = {
  fade: 'FADE',
  dissolve: 'DISSOLVE',
  'wipe-left': 'WIPE LEFT',
  'wipe-right': 'WIPE RIGHT',
  'wipe-up': 'WIPE UP',
  'zoom-in': 'ZOOM IN',
  'zoom-out': 'ZOOM OUT',
  flash: 'FLASH',
  blur: 'BLUR',
  'slide-left': 'SLIDE LEFT',
  'slide-right': 'SLIDE RIGHT',
}
