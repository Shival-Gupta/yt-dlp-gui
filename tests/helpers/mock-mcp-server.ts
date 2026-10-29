/**
 * In-memory Model Context Protocol (MCP) Server Simulator.
 * Implements 12 tools, 4 resources, and JSON-RPC 2.0 protocol conforming to E-mcp-agent.md.
 */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MockMcpServer {
  private jobs: Map<string, { id: string; url: string; status: string; progress: number; speed: string; eta: string; outputPath: string }> = new Map();
  private history: any[] = [];
  private settings: Record<string, any> = {
    theme: 'dark',
    defaultOutputDir: 'C:\\Downloads',
    maxConcurrentDownloads: 3,
  };
  private supportedSites: string[] = ['youtube', 'instagram', 'twitter', 'tiktok', 'vimeo', 'soundcloud'];
  private sseSubscribers: Set<(event: string, data: any) => void> = new Set();

  public subscribeSse(callback: (event: string, data: any) => void): () => void {
    this.sseSubscribers.add(callback);
    return () => {
      this.sseSubscribers.delete(callback);
    };
  }

  private broadcastSse(event: string, data: any): void {
    for (const sub of this.sseSubscribers) {
      sub(event, data);
    }
  }

  public handleJsonRpc(request: JsonRpcRequest): JsonRpcResponse {
    if (request.jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', id: request.id, error: { code: -32600, message: 'Invalid Request: jsonrpc must be 2.0' } };
    }

    const { method, params, id } = request;

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
            },
            serverInfo: {
              name: 'ytdeck-mcp',
              version: '1.0.0',
            },
          },
        };

      case 'notifications/initialized':
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: [
              { name: 'download', description: 'Download media from URL' },
              { name: 'get_job_status', description: 'Get status of active or completed job' },
              { name: 'cancel_job', description: 'Cancel active download' },
              { name: 'list_jobs', description: 'List all jobs' },
              { name: 'fetch_info', description: 'Fetch video metadata' },
              { name: 'fetch_formats', description: 'Fetch available formats' },
              { name: 'fetch_thumbnails', description: 'Fetch thumbnail options' },
              { name: 'search', description: 'Search video platforms' },
              { name: 'check_dependency', description: 'Check sidecar installation' },
              { name: 'get_supported_sites', description: 'List supported extractors' },
              { name: 'build_command', description: 'Reconstruct CLI command' },
              { name: 'update_ytdlp', description: 'Update yt-dlp binary' },
            ],
          },
        };

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              { uri: 'ytdeck://queue', name: 'Active and queued downloads' },
              { uri: 'ytdeck://history', name: 'Download history' },
              { uri: 'ytdeck://settings', name: 'Application settings' },
              { uri: 'ytdeck://supported-sites', name: 'Supported extractors' },
            ],
          },
        };

      case 'resources/read': {
        const uri = params?.uri;
        if (uri === 'ytdeck://queue') {
          return { jsonrpc: '2.0', id, result: { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(Array.from(this.jobs.values())) }] } };
        } else if (uri === 'ytdeck://history') {
          return { jsonrpc: '2.0', id, result: { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(this.history) }] } };
        } else if (uri === 'ytdeck://settings') {
          return { jsonrpc: '2.0', id, result: { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(this.settings) }] } };
        } else if (uri === 'ytdeck://supported-sites') {
          return { jsonrpc: '2.0', id, result: { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(this.supportedSites) }] } };
        }
        return { jsonrpc: '2.0', id, error: { code: -32602, message: `Resource not found: ${uri}` } };
      }

      case 'tools/call':
        return this.handleToolCall(id, params?.name, params?.arguments);

      default:
        return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
    }
  }

  private handleToolCall(id: any, toolName: string, args: any): JsonRpcResponse {
    switch (toolName) {
      case 'download': {
        const url = args?.url;
        if (!url) {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing required argument: url' } };
        }
        const jobId = `job-${Date.now()}`;
        const newJob = {
          id: jobId,
          url,
          status: 'downloading',
          progress: 0,
          speed: '2.5 MB/s',
          eta: '00:15',
          outputPath: `C:\\Downloads\\${jobId}.mp4`,
        };
        this.jobs.set(jobId, newJob);
        this.broadcastSse('progress', { jobId, status: 'downloading', progress: 0 });
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify({ jobId, status: 'downloading' }) }] },
        };
      }

      case 'get_job_status': {
        const jobId = args?.jobId;
        const job = this.jobs.get(jobId);
        if (!job) {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: `Job not found: ${jobId}` } };
        }
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(job) }] },
        };
      }

      case 'cancel_job': {
        const jobId = args?.jobId;
        const job = this.jobs.get(jobId);
        if (!job) {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: `Job not found: ${jobId}` } };
        }
        job.status = 'canceled';
        this.broadcastSse('progress', { jobId, status: 'canceled', progress: job.progress });
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify({ jobId, status: 'canceled' }) }] },
        };
      }

      case 'list_jobs': {
        const filter = args?.status;
        let jobList = Array.from(this.jobs.values());
        if (filter) {
          jobList = jobList.filter(j => j.status === filter);
        }
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(jobList) }] },
        };
      }

      case 'fetch_info': {
        const url = args?.url;
        if (!url) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing url' } };
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify({ title: 'Sample Title', duration: 180, url }) }] },
        };
      }

      case 'fetch_formats': {
        const url = args?.url;
        if (!url) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing url' } };
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify([{ format_id: '137', resolution: '1080p' }, { format_id: '140', resolution: 'audio only' }]) }] },
        };
      }

      case 'fetch_thumbnails': {
        const url = args?.url;
        if (!url) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing url' } };
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify([{ url: 'https://example.com/thumb.jpg', width: 1280, height: 720 }]) }] },
        };
      }

      case 'search': {
        const query = args?.query;
        if (!query) return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Missing query' } };
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify([{ id: 'dQw4w9WgXcQ', title: `Result for ${query}`, url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' }]) }] },
        };
      }

      case 'check_dependency': {
        const name = args?.name || 'yt-dlp';
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify({ name, installed: true, version: '2026.10.26', path: `C:\\bin\\${name}.exe` }) }] },
        };
      }

      case 'get_supported_sites': {
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify({ count: this.supportedSites.length, extractors: this.supportedSites }) }] },
        };
      }

      case 'build_command': {
        const options = args?.options || {};
        const url = args?.url || '';
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: `yt-dlp -f "${options.format || 'b'}" "${url}"` }] },
        };
      }

      case 'update_ytdlp': {
        return {
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify({ updated: true, version: '2026.11.01' }) }] },
        };
      }

      default:
        return { jsonrpc: '2.0', id, error: { code: -32601, message: `Tool not found: ${toolName}` } };
    }
  }

  // Simulator helper to trigger progress event and history completion
  public simulateJobProgress(jobId: string, progress: number, status = 'downloading'): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
      job.status = status;
      this.broadcastSse('progress', { jobId, status, progress });
      if (status === 'completed') {
        this.history.push({
          id: jobId,
          url: job.url,
          outputPath: job.outputPath,
          timestamp: new Date().toISOString(),
          status: 'completed',
        });
      }
    }
  }
}
