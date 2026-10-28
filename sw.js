/* 차곡차곡 서비스워커: 홈 화면 설치와 인터넷이 끊겼을 때 열기만 담당.
   - 같은 주소(taichen2k.github.io)의 다른 앱(할수있어·티끌모아·정수리캠)을 건드리지 않음:
     /chagok/ 폴더 요청만 처리, 'chagok-'로 시작하는 보관 파일만 지움
   - 알림(push)은 다루지 않음 — 할수있어 알림과 섞이지 않게
   - 계정 기록(Firebase)은 보관하지 않음. 화면 파일만 보관 */
const CACHE='chagok-v21';
const SHELL=['./','./index.html','./style.css','./app.js','./firebase-config.js','./manifest.webmanifest','./favicon.svg','./logo.svg','./icon-192.png',
  './fonts/Pretendard-Regular.subset.woff2','./fonts/Pretendard-Medium.subset.woff2','./fonts/Pretendard-SemiBold.subset.woff2','./fonts/Pretendard-Bold.subset.woff2'];
// 하나가 실패해도 나머지는 보관 (전부 실패하지 않게)
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('chagok-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const SCOPE=new URL('./',self.location).pathname; // /chagok/
const keyOf=u=>{const x=new URL(u);x.search='';x.hash='';return x.href};
const timeout=(p,ms)=>new Promise((ok,no)=>{const t=setTimeout(()=>no(new Error('timeout')),ms);p.then(v=>{clearTimeout(t);ok(v)},e=>{clearTimeout(t);no(e)})});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
  // 파이어베이스 라이브러리는 한 번 받아 두고 재사용 (계정 기록 요청은 손대지 않음)
  if(u.host==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/')){
    e.respondWith(caches.open(CACHE).then(c=>c.match(req).then(m=>m||fetch(req).then(res=>{if(res.ok)c.put(req,res.clone());return res}))));return}
  if(u.origin!==self.location.origin||!u.pathname.startsWith(SCOPE))return; // 다른 앱 요청은 손대지 않음
  if(u.pathname.endsWith('/sw.js'))return;
  // 글꼴·엑셀 라이브러리는 보관본 우선
  if(u.pathname.endsWith('.woff2')||u.pathname.includes('/lib/')){
    e.respondWith(caches.open(CACHE).then(c=>c.match(keyOf(req.url)).then(m=>m||fetch(req.url).then(res=>{if(res.ok)c.put(keyOf(req.url),res.clone());return res}))));return}
  // 화면 파일: 인터넷 우선(5초 넘으면 보관본), 끊기면 보관본
  e.respondWith(timeout(fetch(req.url,{cache:'no-cache',credentials:'same-origin'}),5000).then(res=>{if(res.ok){const c=res.clone();caches.open(CACHE).then(x=>x.put(keyOf(req.url),c))}return res})
    .catch(()=>caches.open(CACHE).then(c=>c.match(keyOf(req.url)).then(m=>m||c.match(keyOf(new URL('./',self.location).href))))).then(r=>r||fetch(req)));
});
