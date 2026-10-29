import { describe, it, expect } from 'vitest';
import { MockMcpServer } from '../../helpers/mock-mcp-server';

describe('Tier 4: Real-World Scenario 4 — Programmatic MCP AI Agent Workflow', () => {
  it('should complete full autonomous agent workflow: search -> fetch formats -> download -> poll status -> verify queue', async () => {
    const server = new MockMcpServer();

    // 1. Client handshake (initialize)
    const initRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    });
    expect(initRes.result.serverInfo.name).toBe('ytdeck-mcp');

    // 2. Search for video content via 'search' tool
    const searchRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search',
        arguments: { query: 'synthwave beats' },
      },
    });
    const searchResults = JSON.parse(searchRes.result.content[0].text);
    expect(searchResults.length).toBeGreaterThan(0);
    const chosenVideoUrl = searchResults[0].url;

    // 3. Inspect available formats via 'fetch_formats' tool
    const formatsRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'fetch_formats',
        arguments: { url: chosenVideoUrl },
      },
    });
    const formats = JSON.parse(formatsRes.result.content[0].text);
    expect(formats.length).toBeGreaterThan(0);
    const chosenFormatId = formats[0].format_id;

    // 4. Trigger download job via 'download' tool
    const downloadRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'download',
        arguments: {
          url: chosenVideoUrl,
          format: chosenFormatId,
        },
      },
    });
    const { jobId, status } = JSON.parse(downloadRes.result.content[0].text);
    expect(jobId).toBeTruthy();
    expect(status).toBe('downloading');

    // 5. Poll job status via 'get_job_status' tool
    const statusRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_job_status',
        arguments: { jobId },
      },
    });
    const currentStatus = JSON.parse(statusRes.result.content[0].text);
    expect(currentStatus.id).toBe(jobId);
    expect(currentStatus.status).toBe('downloading');

    // 6. Inspect active jobs via 'ytdeck://queue' resource
    const queueRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 6,
      method: 'resources/read',
      params: { uri: 'ytdeck://queue' },
    });
    const queueJobs = JSON.parse(queueRes.result.contents[0].text);
    expect(queueJobs.some((j: any) => j.id === jobId)).toBe(true);
  });
});
