const CACHE_NAME = 'maybike-v15-6-pdv-cache-v4';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js?v=1572',
  './pwa.js?v=1572',
  './cliente-sem-cadastro.js?v=1572',
  './hotfix-v155.js?v=1572',
  './hotfix-modulos-v155.js?v=1572',
  './v156-estavel.js?v=1572',
  './v156-movimentacoes-caixa.js?v=1572',
  './v156-resumo-caixa.js?v=1572',
  './v1572-cliente-venda-final.js?v=1572',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maybike-logo.png',
  './icons/maybike-logo-horizontal.png',
  './icons/maybike-logo-print.png'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)))); self.clients.claim(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response => { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{}); return response; }).catch(()=>caches.match(event.request).then(resp=>resp||caches.match('./index.html'))));
});