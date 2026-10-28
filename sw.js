/* 차곡차곡 서비스워커: 홈 화면 설치와 인터넷이 끊겼을 때 열기만 담당.
   - 같은 주소(taichen2k.github.io)의 다른 앱(할수있어·티끌모아·정수리캠)을 건드리지 않음:
     /chagok/ 폴더 요청만 처리, 'chagok-'로 시작하는 보관 파일만 지움
   - 알림(push)은 다루지 않음 — 할수있어 알림과 섞이지 않게 */
const CACHE='chagok-v13';
const SHELL=['./','./index.html','./style.css','./app.js','./firebase-config.js','./manifest.webmanifest','./favicon.svg','./logo.svg','./icon-192.png',
  './fonts/Pretendard-Regular.subset.woff2','./fonts/Pretendard-Medium.subset.woff2','./fonts/Pretendard-SemiBold.subset.woff2','./fonts/Pretendard-Bold.subset.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).catch(()=>{}).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('chagok-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const SCOPE=new URL('./',self.location).pathname; // /chagok/
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
  // 라이브러리(파이어베이스·엑셀)는 한 번 받아 두고 재사용
  if((u.host==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/'))||(u.host==='cdnjs.cloudflare.com'&&u.pathname.startsWith('/ajax/libs/xlsx/'))){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(m=>m||fetch(req).then(res=>{if(res.ok)c.put(req,res.clone());return res}))));return}
  if(u.origin!==self.location.origin||!u.pathname.startsWith(SCOPE))return; // 다른 앱 요청은 손대지 않음
  if(u.pathname.endsWith('/sw.js'))return;
  if(u.pathname.endsWith('.woff2')){e.respondWith(caches.match(req,{cacheName:CACHE}).then(m=>m||fetch(req)));return}
  // 화면 파일: 인터넷 우선, 끊기면 보관본
  // (앱을 열 때의 요청은 그대로 다시 보낼 수 없어서 주소로 새로 받음 — v12에서 고침)
  e.respondWith(fetch(req.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(req.url,c))}return res})
    .catch(()=>caches.open(CACHE).then(c=>c.match(req.url,{ignoreSearch:true}).then(m=>m||c.match('./')))).then(r=>r||fetch(req)));
});
