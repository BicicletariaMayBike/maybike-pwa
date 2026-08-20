const CACHE_NAME = 'maybike-v17-pdv-cache-v3';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js?v=1702',
  './pwa.js?v=1702',
  './hotfix-v155.js?v=1702',
  './hotfix-modulos-v155.js?v=1702',
  './v156-estavel.js?v=1702',
  './v156-movimentacoes-caixa.js?v=1702',
  './v160-venda.js?v=1702',
  './v161-recibo.js?v=1702',
  './v161-os-separadas.js?v=1702',
  './v170-gestao.js?v=1702',
  './v170-fix-mao-duplicada.js?v=1702',
  './v1702-os-itens-separados.js?v=1702',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maybike-logo.png',
  './icons/maybike-logo-horizontal.png',
  './icons/maybike-logo-print.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response => {
    const copy=response.clone();
    caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)).catch(()=>{});
    return response;
  }).catch(()=>caches.match(event.request).then(resp=>resp||caches.match('./index.html'))));
});