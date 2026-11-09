import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/** Local dev key so writes work without configuring anything. Never used in production. */
export const DEV_API_KEY = 'visor-dev-key';

type Handler = (req: Request) => Promise<Response>;

/**
 * Serves the /api functions from the Vite dev server (in-memory store),
 * mirroring the file routes in /api so `npm run dev` runs the full stack.
 */
export function visorApiDev(): Plugin {
  return {
    name: 'visor-api-dev',
    apply: 'serve',
    configureServer(server) {
      if (!process.env.VISOR_API_KEY) process.env.VISOR_API_KEY = DEV_API_KEY;

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();

        const routes = (await server.ssrLoadModule('/server/routes.ts')) as Record<string, Handler>;
        const table: Record<string, Record<string, Handler>> = {
          '/api/health': { GET: routes.health },
          '/api/frames': { POST: routes.postFrame },
          '/api/frames/latest': { GET: routes.getLatestFrame },
          '/api/detections': { GET: routes.listDetections, DELETE: routes.clearDetections },
          '/api/model': { GET: routes.getModel, PATCH: routes.patchModel },
        };
        const methods = table[url.pathname];
        const handler = methods?.[req.method ?? 'GET'];
        if (!methods) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'not found' }));
          return;
        }
        if (!handler) {
          res.statusCode = 405;
          res.setHeader('allow', Object.keys(methods).join(', '));
          res.end(JSON.stringify({ error: 'method not allowed' }));
          return;
        }

        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const body = chunks.length ? Buffer.concat(chunks) : undefined;
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers.set(k, v);
        }
        const response = await handler(
          new Request(url, { method: req.method, headers, body: req.method === 'GET' ? undefined : body }),
        );
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(Buffer.from(await response.arrayBuffer()));
      });
    },
  };
}
