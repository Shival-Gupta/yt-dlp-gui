import { describe, it, expect } from 'vitest';
import { MockMcpServer } from '../../helpers/mock-mcp-server';

describe('Tier 3: Cross-Feature Combinations — MCP Tool + SSE Progress Streaming', () => {
  it('should stream real-time progress events over SSE when a download job is active', () => {
    const server = new MockMcpServer();
    const receivedEvents: Array<{ event: string; data: any }> = [];

    // Client connects to /sse and subscribes to events
    const unsubscribe = server.subscribeSse((event, data) => {
      receivedEvents.push({ event, data });
    });

    // Client invokes 'download' tool via JSON-RPC POST /message
    const downloadRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 101,
      method: 'tools/call',
      params: {
        name: 'download',
        arguments: { url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
      },
    });

    const { jobId } = JSON.parse(downloadRes.result.content[0].text);
    expect(jobId).toBeTruthy();

    // Verify initial spawn event was dispatched over SSE
    expect(receivedEvents.length).toBeGreaterThanOrEqual(1);
    expect(receivedEvents[0].event).toBe('progress');
    expect(receivedEvents[0].data.jobId).toBe(jobId);
    expect(receivedEvents[0].data.status).toBe('downloading');

    // Simulate progress updates from backend sidecar
    server.simulateJobProgress(jobId, 50, 'downloading');
    server.simulateJobProgress(jobId, 100, 'completed');

    expect(receivedEvents).toHaveLength(3);
    expect(receivedEvents[1].data.progress).toBe(50);
    expect(receivedEvents[2].data.status).toBe('completed');
    expect(receivedEvents[2].data.progress).toBe(100);

    // Verify job transitioned into history resource
    const historyRes = server.handleJsonRpc({
      jsonrpc: '2.0',
      id: 102,
      method: 'resources/read',
      params: { uri: 'ytdeck://history' },
    });
    const historyList = JSON.parse(historyRes.result.contents[0].text);
    expect(historyList.find((h: any) => h.id === jobId)).toBeDefined();

    unsubscribe();
  });
});
