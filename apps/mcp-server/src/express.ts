import express from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

export function buildExpressApp(mcpServer: Server) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'synapsemed-skills-mcp', version: '0.1.0' });
  });

  // Active SSE transports keyed by sessionId
  const transports = new Map<string, SSEServerTransport>();

  // MCP SSE endpoint — one transport per connection
  app.get('/mcp/sse', async (_req, res) => {
    const transport = new SSEServerTransport('/mcp/message', res as any);
    transports.set(transport.sessionId, transport);
    transport.onclose = () => transports.delete(transport.sessionId);
    await mcpServer.connect(transport);
  });

  // MCP message endpoint — routes POST body to the matching SSE transport
  app.post('/mcp/message', async (req, res) => {
    const sessionId = req.query['sessionId'] as string | undefined;
    if (!sessionId) {
      res.status(400).json({ error: 'Missing sessionId query parameter' });
      return;
    }
    const transport = transports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: `No active session: ${sessionId}` });
      return;
    }
    await transport.handlePostMessage(req as any, res as any, req.body);
  });

  return app;
}
