import { YtdlpFormat, YtdlpInfo } from './ytdlp'

export interface YtdlpOutputEvent {
  job_id: string
  line: string
  is_stderr: boolean
  stream: 'stdout' | 'stderr'
}

export interface YtdlpDoneEvent {
  job_id: string
  exit_code: number
  success: boolean
  error_message?: string | null
}

export interface UpdateAvailableEvent {
  version: string
  notes: string
  pub_date?: string
}

export interface UpdateProgressEvent {
  downloaded_bytes: number
  total_bytes: number
}

export interface UpdateCheckResult {
  available: boolean
  current_version: string
  latest_version?: string
  release_notes?: string
  pub_date?: string
}

export type { YtdlpFormat, YtdlpInfo }
