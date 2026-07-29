const CACHE='ielti-shell-v119';
const SHELL=['./','./index.html','./apple-ui.css','./eink-ui.css','./ielti-config.js','./ielti-core.js','./ielts-roadmap-data.js','./manifest.webmanifest','./icon.png','./icon_local.png','./ielts-roadmap.html','./ielts-core-vocabulary.html','./ielts-vocabulary-categories.html','./ielts_word_memory_v2_ipa.html','./121-letter-combinations.html'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
const MEDIA_RE=/\.(?:mp4|m4v|mov|mp3|m4a|wav|aac|pdf)(?:[?#]|$)/i;
const isAppNavigation=request=>request.mode==='navigate'||(request.headers.get('accept')||'').includes('text/html');
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const isMedia=MEDIA_RE.test(url.pathname);
  if(isMedia){event.respondWith(fetch(event.request));return;}
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match(event.request).then(hit=>{
    if(hit)return hit;
    if(isAppNavigation(event.request))return caches.match('./index.html');
    return new Response('Resource unavailable',{status:503,statusText:'Resource unavailable'});
  })));
});
