#!/usr/bin/env node
/**
 * Loopback-only HTTP proxy for the browser running inside opskl-test-runner.
 *
 * The Expo web bundles are intentionally built with http://127.0.0.1:54321 so
 * the same bundle also works in a host browser. Inside the runner, localhost is
 * the runner container, so this proxy forwards those requests to the disposable
 * Kong container. It is test-only and refuses non-loopback listen addresses.
 */
import http from 'node:http';

const listenPort = Number(process.env.BROWSER_PROXY_PORT || 54321);
const target = new URL(process.env.BROWSER_PROXY_TARGET || 'http://opskl-test-api:8000');

if (target.protocol !== 'http:') {
  console.error('BROWSER_PROXY_TARGET must be http://');
  process.exit(2);
}

const server = http.createServer((req, res) => {
  req.on('error', () => {});
  res.on('error', () => {});
  const headers = { ...req.headers, host: target.host };
  const proxyReq = http.request(
    {
      hostname: target.hostname,
      port: target.port || 80,
      path: req.url,
      method: req.method,
      headers,
      timeout: 30000,
    },
    (proxyRes) => {
      proxyRes.on('error', () => {});
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  proxyReq.on('timeout', () => proxyReq.destroy(new Error('proxy timeout')));
  proxyReq.on('error', (error) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'application/json' });
    }
    res.end(JSON.stringify({ error: 'test runner proxy failed', detail: error.message }));
  });
  req.pipe(proxyReq);
});

// Basic websocket upgrade forwarding for realtime checks. The UI suite does not
// assert realtime delivery, but this keeps the browser from silently failing.
server.on('upgrade', (req, socket, head) => {
  socket.on('error', () => socket.destroy());
  const proxyReq = http.request({
    hostname: target.hostname,
    port: target.port || 80,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: target.host },
  });
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    proxySocket.on('error', () => {
      proxySocket.destroy();
      socket.destroy();
    });
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n${Object.entries(proxyRes.headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\r\n')}\r\n\r\n`
    );
    if (proxyHead.length) socket.write(proxyHead);
    if (head.length) proxySocket.write(head);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
});

process.on('uncaughtException', (err) => {
  if (err?.code === 'ECONNRESET' || err?.code === 'EPIPE' || err?.code === 'ERR_STREAM_PREMATURE_CLOSE') {
    // Expected client teardown during browser route transitions
    return;
  }
  console.error('[browser-proxy uncaught]', err);
});

server.listen(listenPort, '127.0.0.1', () => {
  console.log(`[browser-proxy] listening on http://127.0.0.1:${listenPort} -> ${target.origin}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
