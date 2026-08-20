const CACHE_NAME = 'maybike-v17-pdv-cache-v5';
const APP_SHELL = [
  './','./index.html','./style.css',
  './app.js?v=1704','./pwa.js?v=1704','./hotfix-v155.js?v=1704','./hotfix-modulos-v155.js?v=1704',
  './v156-estavel.js?v=1704','./v156-movimentacoes-caixa.js?v=1704','./v160-venda.js?v=1704','./v161-recibo.js?v=1704',
  './v161-os-separadas.js?v=1704','./v170-gestao.js?v=1704','./v170-fix-mao-duplicada.js?v=1704','./v1702-os-itens-separados.js?v=1704',
  './v1703-impressao-profissional.js?v=1704','./v1704-faturamento-os.js?v=1704',
  './manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/maybike-logo.png','./icons/maybike-logo-horizontal.png','./icons/maybike-logo-print.png'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null))));self.clients.claim();});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const copy=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)).catch(()=>{});return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));});