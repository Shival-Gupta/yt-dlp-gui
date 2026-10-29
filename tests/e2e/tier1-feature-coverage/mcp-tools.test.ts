import { describe, it, expect, beforeEach } from 'vitest';
import { MockMcpServer } from '../../helpers/mock-mcp-server';

describe('Tier 1: Feature Coverage — MCP Tools & Resources', () => {
  let server: MockMcpServer;

  beforeEach(() => {
    server = new MockMcpServer();
  });

  describe('Server Lifecycle & Protocol', () => {
    it('should handle initialize request and return protocol capabilities', () => {
      const res = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {},
      });

      expect(res.jsonrpc).toBe('2.0');
      expect(res.id).toBe(1);
      expect(res.result?.serverInfo?.name).toBe('ytdeck-mcp');
      expect(res.result?.protocolVersion).toBe('2024-11-05');
    });

    it('should reject requests with invalid jsonrpc version', () => {
      const res = server.handleJsonRpc({
        jsonrpc: '1.0' as any,
        id: 2,
        method: 'initialize',
      });

      expect(res.error?.code).toBe(-32600);
      expect(res.error?.message).toContain('jsonrpc must be 2.0');
    });

    it('should return 404 method not found for unknown method', () => {
      const res = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 3,
        method: 'unknown_method_xyz',
      });

      expect(res.error?.code).toBe(-32601);
    });
  });

  describe('12 MCP Tools Coverage', () => {
    it('should enumerate all 12 tools via tools/list', () => {
      const res = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/list',
      });

      const toolNames = res.result?.tools?.map((t: any) => t.name);
      expect(toolNames).toHaveLength(12);
      expect(toolNames).toContain('download');
      expect(toolNames).toContain('get_job_status');
      expect(toolNames).toContain('cancel_job');
      expect(toolNames).toContain('list_jobs');
      expect(toolNames).toContain('fetch_info');
      expect(toolNames).toContain('fetch_formats');
      expect(toolNames).toContain('fetch_thumbnails');
      expect(toolNames).toContain('search');
      expect(toolNames).toContain('check_dependency');
      expect(toolNames).toContain('get_supported_sites');
      expect(toolNames).toContain('build_command');
      expect(toolNames).toContain('update_ytdlp');
    });

    it('tool 1: download should spawn a new job', () => {
      const res = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'download',
          arguments: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
        },
      });

      expect(res.result?.content?.[0]?.text).toBeDefined();
      const payload = JSON.parse(res.result.content[0].text);
      expect(payload.jobId).toBeTruthy();
      expect(payload.status).toBe('downloading');
    });

    it('tool 2 & 3: get_job_status and cancel_job should query and terminate jobs', () => {
      // Spawn job first
      const spawnRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: { name: 'download', arguments: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' } },
      });
      const { jobId } = JSON.parse(spawnRes.result.content[0].text);

      // Query status
      const statusRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: { name: 'get_job_status', arguments: { jobId } },
      });
      const status = JSON.parse(statusRes.result.content[0].text);
      expect(status.id).toBe(jobId);
      expect(status.status).toBe('downloading');

      // Cancel job
      const cancelRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: { name: 'cancel_job', arguments: { jobId } },
      });
      const cancelStatus = JSON.parse(cancelRes.result.content[0].text);
      expect(cancelStatus.status).toBe('canceled');
    });

    it('tool 4: list_jobs should return tracked downloads', () => {
      server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: { name: 'download', arguments: { url: 'https://youtube.com/watch?v=test' } },
      });

      const listRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: { name: 'list_jobs' },
      });
      const list = JSON.parse(listRes.result.content[0].text);
      expect(list.length).toBeGreaterThanOrEqual(1);
    });

    it('tool 5, 6, 7: fetch_info, fetch_formats, fetch_thumbnails', () => {
      const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';

      const infoRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: { name: 'fetch_info', arguments: { url } },
      });
      expect(JSON.parse(infoRes.result.content[0].text).title).toBeTruthy();

      const formatsRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: { name: 'fetch_formats', arguments: { url } },
      });
      expect(JSON.parse(formatsRes.result.content[0].text).length).toBeGreaterThan(0);

      const thumbRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 13,
        method: 'tools/call',
        params: { name: 'fetch_thumbnails', arguments: { url } },
      });
      expect(JSON.parse(thumbRes.result.content[0].text).length).toBeGreaterThan(0);
    });

    it('tool 8, 9, 10, 11, 12: search, check_dependency, get_supported_sites, build_command, update_ytdlp', () => {
      const searchRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 14,
        method: 'tools/call',
        params: { name: 'search', arguments: { query: 'lofi hip hop' } },
      });
      expect(JSON.parse(searchRes.result.content[0].text).length).toBeGreaterThan(0);

      const depRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 15,
        method: 'tools/call',
        params: { name: 'check_dependency', arguments: { name: 'ffmpeg' } },
      });
      expect(JSON.parse(depRes.result.content[0].text).installed).toBe(true);

      const sitesRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 16,
        method: 'tools/call',
        params: { name: 'get_supported_sites' },
      });
      expect(JSON.parse(sitesRes.result.content[0].text).count).toBeGreaterThan(0);

      const cmdRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 17,
        method: 'tools/call',
        params: { name: 'build_command', arguments: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' } },
      });
      expect(cmdRes.result.content[0].text).toContain('yt-dlp');

      const updateRes = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 18,
        method: 'tools/call',
        params: { name: 'update_ytdlp' },
      });
      expect(JSON.parse(updateRes.result.content[0].text).updated).toBe(true);
    });
  });

  describe('4 MCP Resources Coverage', () => {
    it('should list all 4 resources via resources/list', () => {
      const res = server.handleJsonRpc({
        jsonrpc: '2.0',
        id: 19,
        method: 'resources/list',
      });

      const uris = res.result?.resources?.map((r: any) => r.uri);
      expect(uris).toHaveLength(4);
      expect(uris).toContain('ytdeck://queue');
      expect(uris).toContain('ytdeck://history');
      expect(uris).toContain('ytdeck://settings');
      expect(uris).toContain('ytdeck://supported-sites');
    });

    it('should read ytdeck://queue, ytdeck://settings, ytdeck://history, ytdeck://supported-sites', () => {
      for (const uri of ['ytdeck://queue', 'ytdeck://settings', 'ytdeck://history', 'ytdeck://supported-sites']) {
        const res = server.handleJsonRpc({
          jsonrpc: '2.0',
          id: 20,
          method: 'resources/read',
          params: { uri },
        });

        expect(res.result?.contents?.[0]?.uri).toBe(uri);
        expect(res.result?.contents?.[0]?.mimeType).toBe('application/json');
        expect(() => JSON.parse(res.result?.contents?.[0]?.text)).not.toThrow();
      }
    });
  });
});
