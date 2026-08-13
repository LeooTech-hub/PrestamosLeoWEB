import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDirectory, '..');
const backendRoot = path.resolve(frontendRoot, '..', 'backend');
process.chdir(backendRoot);

const [{ buildDashboardSummary }, { default: pool }] = await Promise.all([
  import('../../backend/src/controllers/loanController.js'),
  import('../../backend/src/config/db.js'),
]);

const vite = await createServer({
  root: frontendRoot,
  appType: 'custom',
  resolve: {
    alias: {
      'react-router-dom': path.join(scriptDirectory, 'reactRouterSsrShim.mjs'),
    },
  },
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const summary = await buildDashboardSummary(pool);
  const { VistaDashboard } = await vite.ssrLoadModule('/src/pages/VistaDashboard.jsx');
  const html = renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      null,
      React.createElement(VistaDashboard, {
        summary,
        recentLoans: summary.recentLoans,
        recentPayments: summary.recentPayments,
        user: { id: 'render-check', role: 'ADMIN' },
      })
    )
  );

  assert.match(html, /Últimos Cobros Realizados/);
  assert.match(html, /KERSTIN LUCIANA TRAPIELLO ROJAS/);
  assert.match(html, /S\/\. 30(?:\.00)?/);
  assert.doesNotMatch(html, /No hay cobros registrados hoy/);

  console.log(JSON.stringify({
    rendered: true,
    containsSection: true,
    containsRealClient: true,
    containsRealAmount: true,
    emptyStateVisible: false,
  }, null, 2));
} finally {
  await vite.close();
  await pool.end();
}
