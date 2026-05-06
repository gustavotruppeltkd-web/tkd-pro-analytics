// Self-destruct service worker — substitui qualquer SW antigo, limpa todos os caches
// e se desinstala. Sem SW = sem cache stale entre versões.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
    e.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll();
        clients.forEach(c => c.navigate(c.url));
    })());
});
