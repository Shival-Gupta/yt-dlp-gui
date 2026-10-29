import { DownloadJob, YtdlpInfo, YtdlpFormat } from './contracts';

export type EventHandler = (payload: any) => void;

/**
 * In-memory simulator of Tauri 2 IPC Commands and Events.
 * Conforms to the IPC contract in AGENTS.md and PROJECT.md.
 */
export class MockTauriIpc {
  private jobs: Map<string, DownloadJob> = new Map();
  private eventListeners: Map<string, Set<EventHandler>> = new Map();
  private appVersion = '1.0.0';
  private ytdlpVersion = '2026.10.26';
  private updateAvailable = false;
  private updateDownloaded = false;

  public on(event: string, handler: EventHandler): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
    return () => {
      this.eventListeners.get(event)?.delete(handler);
    };
  }

  public emit(event: string, payload: any): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }

  // 12 Tauri Commands
  public async spawn_ytdlp(args: string[], jobId?: string): Promise<{ jobId: string }> {
    const id = jobId || `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const job: DownloadJob = {
      id,
      url: args[args.length - 1] || '',
      progress: 0,
      status: 'pending',
      cliArgs: args,
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(id, job);
    return { jobId: id };
  }

  public async cancel_download(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'canceled';
      this.emit('ytdlp-done', { jobId, exitCode: 1, success: false, error_message: 'Canceled by user' });
    }
  }

  public async fetch_info(url: string, mockData?: YtdlpInfo): Promise<YtdlpInfo> {
    if (!url || url.trim().length === 0) {
      throw new Error('URL cannot be empty');
    }
    return mockData || {
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up',
      webpage_url: url,
      duration: 213,
      formats: [],
    };
  }

  public async fetch_formats(url: string, rawTableFixture?: string): Promise<string> {
    if (!url || url.trim().length === 0) {
      throw new Error('URL cannot be empty');
    }
    return rawTableFixture || '[info] Available formats for ' + url;
  }

  public async check_update(): Promise<{ version: string; notes: string; pub_date: string } | null> {
    if (this.updateAvailable) {
      return {
        version: '1.1.0',
        notes: 'Release v1.1.0 notes',
        pub_date: '2026-11-01T00:00:00Z',
      };
    }
    return null;
  }

  public async download_update(): Promise<void> {
    this.emit('update-progress', { downloaded_bytes: 5000000, total_bytes: 10000000 });
    this.emit('update-progress', { downloaded_bytes: 10000000, total_bytes: 10000000 });
    this.updateDownloaded = true;
  }

  public async install_update(): Promise<void> {
    if (!this.updateDownloaded) {
      throw new Error('Update must be downloaded before installing');
    }
  }

  public async update_ytdlp_sidecar(): Promise<void> {
    this.ytdlpVersion = '2026.11.01';
  }

  public async open_path(path: string): Promise<void> {
    if (!path) throw new Error('Path cannot be empty');
  }

  public async get_app_version(): Promise<string> {
    return this.appVersion;
  }

  public async get_ytdlp_version(): Promise<string> {
    return this.ytdlpVersion;
  }

  // Simulator controls
  public setUpdateAvailable(avail: boolean): void {
    this.updateAvailable = avail;
  }

  public getTrackedJob(jobId: string): DownloadJob | undefined {
    return this.jobs.get(jobId);
  }

  public getAllTrackedJobs(): DownloadJob[] {
    return Array.from(this.jobs.values());
  }
}
