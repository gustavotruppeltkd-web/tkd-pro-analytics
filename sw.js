// Network-first: sempre busca da rede, usa cache só se offline
const CACHE_NAME = 'atleta-portal-v20260506b';

self.addEventListener('install', e => { self.skipWaiting(); });

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    // Ignora requisições de extensões do Chrome
    if (!e.request.url.startsWith('http')) return;
    e.respondWith(
        fetch(e.request).then(res => {
            if (res && res.status === 200 && res.type === 'basic') {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            }
            return res;
        }).catch(() => caches.match(e.request))
    );
});
