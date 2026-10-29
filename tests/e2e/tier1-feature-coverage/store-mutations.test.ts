import { describe, it, expect, beforeEach } from 'vitest';
import { DownloadJob, AppSettings, Preset } from '../../helpers/contracts';

// In-memory store doubles mirroring the Zustand stores in src/stores/
class MockDownloadStore {
  public jobs: Map<string, DownloadJob> = new Map();

  public addJob(job: DownloadJob) {
    this.jobs.set(job.id, { ...job });
  }

  public updateJobProgress(id: string, progress: number, speed?: string, eta?: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = progress;
      if (speed) job.speed = speed;
      if (eta) job.eta = eta;
      if (progress >= 100) {
        job.status = 'completed';
      }
    }
  }

  public setJobStatus(id: string, status: DownloadJob['status'], error?: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = status;
      if (error) job.error = error;
    }
  }

  public removeJob(id: string) {
    this.jobs.delete(id);
  }

  public clearAll() {
    this.jobs.clear();
  }
}

class MockQueueStore {
  public queue: string[] = [];
  public maxConcurrent = 3;

  public enqueue(id: string) {
    if (!this.queue.includes(id)) {
      this.queue.push(id);
    }
  }

  public dequeue(): string | undefined {
    return this.queue.shift();
  }

  public reorder(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= this.queue.length || toIndex < 0 || toIndex >= this.queue.length) return;
    const [item] = this.queue.splice(fromIndex, 1);
    this.queue.splice(toIndex, 0, item);
  }

  public clear() {
    this.queue = [];
  }
}

class MockPresetStore {
  public presets: Preset[] = [
    { id: 'p1', name: 'Best Quality', description: 'Best video and best audio merged', isBuiltin: true, options: { formatSelection: 'bv*+ba/b' } },
    { id: 'p2', name: 'Audio Only MP3', description: 'Extract highest quality mp3', isBuiltin: true, options: { extractAudio: true, audioFormat: 'mp3', audioQuality: '0' } },
    { id: 'p3', name: 'Instagram Reel', description: 'Optimized vertical mp4', isBuiltin: true, options: { formatSelection: 'bv*[height<=1080]+ba/b', mergeOutputFormat: 'mp4' } },
    { id: 'p4', name: 'YouTube Playlist', description: 'Download playlist with metadata', isBuiltin: true, options: { writeInfoJson: true, embedMetadata: true } },
    { id: 'p5', name: 'Twitter/X Video', description: 'Single video best mp4', isBuiltin: true, options: { noPlaylist: true, mergeOutputFormat: 'mp4' } },
  ];

  public addCustomPreset(name: string, description: string, options: any): Preset {
    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name,
      description,
      isBuiltin: false,
      options,
    };
    this.presets.push(newPreset);
    return newPreset;
  }

  public deletePreset(id: string): boolean {
    const idx = this.presets.findIndex(p => p.id === id);
    if (idx !== -1 && !this.presets[idx].isBuiltin) {
      this.presets.splice(idx, 1);
      return true;
    }
    return false; // Cannot delete built-in presets
  }
}

describe('Tier 1: Feature Coverage — Store Mutations', () => {
  let downloadStore: MockDownloadStore;
  let queueStore: MockQueueStore;
  let presetStore: MockPresetStore;

  beforeEach(() => {
    downloadStore = new MockDownloadStore();
    queueStore = new MockQueueStore();
    presetStore = new MockPresetStore();
  });

  describe('DownloadStore Mutations', () => {
    it('should add a job with pending status', () => {
      downloadStore.addJob({
        id: 'job-1',
        url: 'https://youtube.com/watch?v=test1',
        progress: 0,
        status: 'pending',
        cliArgs: ['-f', 'best'],
        createdAt: new Date().toISOString(),
      });

      expect(downloadStore.jobs.size).toBe(1);
      const job = downloadStore.jobs.get('job-1');
      expect(job?.status).toBe('pending');
      expect(job?.progress).toBe(0);
    });

    it('should update job progress and mark completed at 100%', () => {
      downloadStore.addJob({
        id: 'job-1',
        url: 'https://youtube.com/watch?v=test1',
        progress: 0,
        status: 'downloading',
        cliArgs: [],
        createdAt: new Date().toISOString(),
      });

      downloadStore.updateJobProgress('job-1', 45, '2.1 MB/s', '00:10');
      let job = downloadStore.jobs.get('job-1');
      expect(job?.progress).toBe(45);
      expect(job?.speed).toBe('2.1 MB/s');
      expect(job?.status).toBe('downloading');

      downloadStore.updateJobProgress('job-1', 100);
      job = downloadStore.jobs.get('job-1');
      expect(job?.progress).toBe(100);
      expect(job?.status).toBe('completed');
    });

    it('should set job error status and message', () => {
      downloadStore.addJob({
        id: 'job-err',
        url: 'https://youtube.com/watch?v=err',
        progress: 10,
        status: 'downloading',
        cliArgs: [],
        createdAt: new Date().toISOString(),
      });

      downloadStore.setJobStatus('job-err', 'error', 'HTTP 429 Too Many Requests');
      const job = downloadStore.jobs.get('job-err');
      expect(job?.status).toBe('error');
      expect(job?.error).toBe('HTTP 429 Too Many Requests');
    });
  });

  describe('QueueStore Mutations', () => {
    it('should enqueue and dequeue jobs in FIFO order', () => {
      queueStore.enqueue('job-a');
      queueStore.enqueue('job-b');
      queueStore.enqueue('job-c');

      expect(queueStore.queue.length).toBe(3);
      expect(queueStore.dequeue()).toBe('job-a');
      expect(queueStore.dequeue()).toBe('job-b');
      expect(queueStore.dequeue()).toBe('job-c');
      expect(queueStore.dequeue()).toBeUndefined();
    });

    it('should reorder queued items', () => {
      queueStore.enqueue('job-1');
      queueStore.enqueue('job-2');
      queueStore.enqueue('job-3');

      queueStore.reorder(2, 0); // move job-3 to index 0
      expect(queueStore.queue).toEqual(['job-3', 'job-1', 'job-2']);
    });
  });

  describe('PresetStore Mutations', () => {
    it('should have 5 immutable built-in presets', () => {
      expect(presetStore.presets.length).toBe(5);
      expect(presetStore.presets.every(p => p.isBuiltin)).toBe(true);

      const names = presetStore.presets.map(p => p.name);
      expect(names).toContain('Best Quality');
      expect(names).toContain('Audio Only MP3');
      expect(names).toContain('Instagram Reel');
      expect(names).toContain('YouTube Playlist');
      expect(names).toContain('Twitter/X Video');
    });

    it('should disallow deleting built-in presets', () => {
      const p1 = presetStore.presets[0];
      const deleted = presetStore.deletePreset(p1.id);
      expect(deleted).toBe(false);
      expect(presetStore.presets.length).toBe(5);
    });

    it('should allow adding and deleting custom user presets', () => {
      const custom = presetStore.addCustomPreset('My Custom Preset', 'Custom settings', { formatSort: 'res:720' });
      expect(presetStore.presets.length).toBe(6);
      expect(custom.isBuiltin).toBe(false);

      const deleted = presetStore.deletePreset(custom.id);
      expect(deleted).toBe(true);
      expect(presetStore.presets.length).toBe(5);
    });
  });
});
