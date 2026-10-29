import { YtdlpOptions } from './ytdlp'

export interface DownloadPreset {
  id: string
  name: string
  description: string
  isBuiltIn: boolean
  options: Partial<YtdlpOptions>
}
