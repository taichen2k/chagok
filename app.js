
/* 차곡차곡 — © 2026 티제이컴퍼니. 개발·버전 이력: 기획요건.md
   같은 주소(taichen2k.github.io)의 다른 앱과 섞이지 않게 저장 이름은 모두 chagok. 으로 시작 */
const APP_VERSION='v11';
const KEY='chagok.data';
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
var Cloud=null;
const won=n=>Math.round(n||0).toLocaleString('ko-KR');
const num=(n,d=0)=>(n||0).toLocaleString('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const today=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SVC_CATS=['엔진오일','타이어','브레이크','배터리','에어컨필터','와이퍼','점검','사고수리','세차','기타'];
const EXP_CATS=['보험','자동차세','주차','통행료','세차','과태료','기타'];

function sample(){
  const f=(date,odo,price,amount,full,station)=>({id:uid(),date,odo,price,amount,liters:+(amount/price).toFixed(2),full,station});
  return {sample:true,
    car:{name:'아반떼 CN7',plate:'12가 3456',fuel:'휘발유'},
    fuels:[f('2026-07-03',41250,1689,70000,true,'SK 양재주유소'),f('2026-07-21',41780,1675,65000,true,'GS 판교'),
      f('2026-08-09',42290,1662,60000,true,'알뜰 성남'),f('2026-08-28',42830,1658,68000,true,'SK 양재주유소'),
      f('2026-09-15',43310,1649,50000,false,'S-OIL 인천'),f('2026-09-24',43620,1652,40000,true,'GS 판교'),
      f('2026-10-12',44190,1671,72000,true,'알뜰 성남')],
    services:[
      {id:uid(),kind:'svc',date:'2026-06-14',odo:40900,cat:'엔진오일',title:'엔진오일+오일필터 교환',amount:78000,shop:'양재 카센터',memo:''},
      {id:uid(),kind:'svc',date:'2026-08-02',odo:42150,cat:'타이어',title:'앞 타이어 2개 교체',amount:264000,shop:'타이어프로 분당',memo:'금호 마제스티'},
      {id:uid(),kind:'exp',date:'2026-09-01',odo:43000,cat:'보험',title:'자동차보험 갱신',amount:684000,shop:'',memo:''},
      {id:uid(),kind:'svc',date:'2026-10-05',odo:43950,cat:'와이퍼',title:'와이퍼 앞 2개',amount:28000,shop:'직접 교체',memo:''}],
    reminders:[
      {id:uid(),name:'엔진오일',km:10000,months:12,cat:'엔진오일'},
      {id:uid(),name:'에어컨필터',km:15000,months:12,cat:'에어컨필터'},
      {id:uid(),name:'타이어 위치교환',km:10000,months:0,cat:'타이어'},
      {id:uid(),name:'배터리',km:0,months:36,cat:'배터리'},
      {id:uid(),name:'와이퍼',km:0,months:12,cat:'와이퍼'}]};
}
function defaultReminders(){return [
  {id:uid(),name:'엔진오일',km:10000,months:12,cat:'엔진오일'},
  {id:uid(),name:'에어컨필터',km:15000,months:12,cat:'에어컨필터'},
  {id:uid(),name:'타이어 위치교환',km:10000,months:0,cat:'타이어'},
  {id:uid(),name:'배터리',km:0,months:36,cat:'배터리'},
  {id:uid(),name:'와이퍼',km:0,months:12,cat:'와이퍼'}]}
/* 교체 주기 표시 순서: 기본 5종 고정 순서 → 직접 추가한 항목(추가한 순서) */
const REM_ORDER=['엔진오일','에어컨필터','타이어 위치교환','배터리','와이퍼'];
function orderedRems(list){const k=r=>{const i=REM_ORDER.indexOf(r.name);return i<0?REM_ORDER.length:i};
  return list.map((r,i)=>({r,i})).sort((a,b)=>k(a.r)-k(b.r)||a.i-b.i).map(x=>x.r)}
function blank(){return{id:uid(),car:{name:'내 차',plate:'',fuel:'휘발유'},fuels:[],services:[],
  reminders:defaultReminders()}}
function sampleGarage(){
  const a=sample();delete a.sample;a.id=uid();
  const f=(date,odo,price,amount,full,station)=>({id:uid(),date,odo,price,amount,liters:+(amount/price).toFixed(2),full,station});
  const b={id:uid(),car:{name:'쏘렌토 MQ4',plate:'34나 7890',fuel:'경유'},
    fuels:[f('2026-08-20',61200,1520,90000,true,'SK 양재주유소'),f('2026-09-18',61980,1505,85000,true,'GS 판교'),f('2026-10-20',62760,1532,88000,true,'알뜰 성남')],
    services:[{id:uid(),kind:'svc',date:'2026-09-05',odo:61500,cat:'엔진오일',title:'엔진오일+필터 교환',amount:110000,shop:'양재 카센터',memo:''}],
    reminders:blank().reminders};
  return{sample:true,remV:2,cur:a.id,cars:[a,b]}}
let G,S;
try{G=JSON.parse(lsGet(KEY))}catch(e){}
if(G&&!G.cars&&G.car){const o=G;G={sample:!!o.sample,cur:null,cars:[{id:uid(),car:o.car,fuels:o.fuels||[],services:o.services||[],reminders:o.reminders||[]}]}}
if(!G||!Array.isArray(G.cars)||!G.cars.length)G=sampleGarage();
function pick(){S=G.cars.find(c=>c.id===G.cur)||G.cars[0];G.cur=S.id}
pick();
/* 기본 교체 주기 5종으로 통일 (한 번만 실행 — 이후 사용자가 지운 항목은 다시 넣지 않음) */
if((G.remV||0)<2){G.cars.forEach(c=>{const d=defaultReminders();
  c.reminders=d.map(x=>c.reminders.find(r=>r.name===x.name)||x).concat(c.reminders.filter(r=>!d.some(x=>x.name===r.name)))});G.remV=2}
function save(){if(Cloud&&Cloud.on){lsSet('chagok.cur',G.cur||'');return}lsSet(KEY,JSON.stringify(G))}
/* 기록 바꾸기는 모두 여기로: 이 기기에 저장하고, 로그인 상태면 계정에도 저장 */
const DB={
  putFuel(rec){const i=S.fuels.findIndex(x=>x.id===rec.id);if(i>=0)S.fuels[i]=rec;else S.fuels.push(rec);save();if(Cloud&&Cloud.on)Cloud.put(S.id,'fuels',rec)},
  delFuel(id){S.fuels=S.fuels.filter(x=>x.id!==id);save();if(Cloud&&Cloud.on)Cloud.del(S.id,'fuels',id)},
  putSvc(rec){const i=S.services.findIndex(x=>x.id===rec.id);if(i>=0)S.services[i]=rec;else S.services.push(rec);save();if(Cloud&&Cloud.on)Cloud.put(S.id,'services',rec)},
  delSvc(id){S.services=S.services.filter(x=>x.id!==id);save();if(Cloud&&Cloud.on)Cloud.del(S.id,'services',id)},
  putCar(c){save();if(Cloud&&Cloud.on)Cloud.putCar(c)},
  addCar(n){n.order=G.sample?0:G.cars.length;if(G.sample)G={sample:false,remV:2,cur:n.id,cars:[n]};else G.cars.push(n);G.cur=n.id;pick();save();if(Cloud&&Cloud.on)Cloud.addCar(n)},
  delCar(c){G.cars=G.cars.filter(x=>x!==c);G.cur=null;pick();save();if(Cloud&&Cloud.on)Cloud.delCar(c)},
  bulkFuels(list){S.fuels.push(...list);save();if(Cloud&&Cloud.on)Cloud.bulk(S.id,'fuels',list)}
};
save();

/* 계산 */
const byDate=a=>[...a].sort((x,y)=>x.date<y.date?1:x.date>y.date?-1:(y.odo||0)-(x.odo||0));
function curOdo(){return Math.max(0,...S.fuels.map(x=>+x.odo||0),...S.services.map(x=>+x.odo||0))}
/* 가득 주유 기준 연비: 이전 가득~이번 가득 사이 주행거리 ÷ 그 사이 넣은 기름 */
function effList(){
  const a=S.fuels.filter(x=>x.odo>0).sort((x,y)=>x.odo-y.odo);const out=[];let lastFull=null,acc=0;
  for(const r of a){
    if(lastFull){acc+=r.liters;if(r.full){const km=r.odo-lastFull.odo;if(km>0&&acc>0)out.push({date:r.date,km,liters:acc,eff:km/acc});acc=0;lastFull=r}}
    else if(r.full){lastFull=r;acc=0}
  }return out}
function avgEff(){const e=effList();const km=e.reduce((s,x)=>s+x.km,0),l=e.reduce((s,x)=>s+x.liters,0);return l?km/l:0}
function monthKey(d){return d.slice(0,7)}
function thisMonthSpend(){const m=today().slice(0,7);return [...S.fuels,...S.services].filter(x=>monthKey(x.date)===m).reduce((s,x)=>s+(+x.amount||0),0)}
function remStatus(r){
  const last=byDate(S.services.filter(s=>s.cat===r.cat))[0];
  if(!last) return {last:null,pct:1,label:'기록 없음',cls:'warn',detail:'마지막 교체 기록을 남기면 주기를 계산해요'};
  const odo=curOdo();let pk=0,pm=0,parts=[];
  if(r.km){const used=odo-last.odo;pk=used/r.km;parts.push(`${num(Math.max(0,r.km-used))}km 남음`)}
  if(r.months){const md=(new Date(today())-new Date(last.date))/(1000*60*60*24*30.44);pm=md/r.months;
    const due=new Date(last.date);due.setMonth(due.getMonth()+r.months);parts.push(`${due.getFullYear()}.${due.getMonth()+1}까지`)}
  const pct=Math.max(pk,pm);
  const cls=pct>=1?'bad':pct>=.8?'warn':'ok';const label=pct>=1?'교체 시기':pct>=.8?'곧 교체':'양호';
  return {last,pct,label,cls,detail:parts.join(' · ')};
}

/* 렌더 */
let tab='home',fuelFilter='all',svcFilter='전체';
const view=document.getElementById('view');
function render(){
  document.getElementById('carName').textContent=`${S.car.name||'내 차'} · ${S.car.fuel}`;
  document.getElementById('plateBtn').textContent=S.car.plate||'차량 등록';
  document.getElementById('sampleBanner').hidden=!G.sample;
  const ab=document.getElementById('acctBtn'),u=Cloud&&Cloud.user;
  ab.textContent=u?((u.displayName||u.email||'?').trim()[0]||'?'):'';ab.classList.toggle('on',!!(Cloud&&Cloud.on));ab.classList.toggle('in',!!u);
  ab.setAttribute('aria-label',u?'계정·동기화 ('+(u.email||'')+')':'구글 로그인');
  const lb=document.getElementById('loginBanner');
  if(Cloud&&Cloud.ok&&!u&&lsGet('chagok.loginHide')!=='1'){lb.hidden=false;lb.innerHTML='<span>구글로 로그인하면 <b>여러 폰에서 같은 기록</b>을 봐요.</span><button class="btn pri" type="button" data-login="1">로그인</button>'}
  else if(u&&!Cloud.on&&!Cloud.loading){lb.hidden=false;lb.innerHTML='<span>계정에 아직 차곡차곡 기록이 없어요.</span><button class="btn pri" type="button" data-onboard="1">시작하기</button>'}
  else if(u&&Cloud.loading){lb.hidden=false;lb.innerHTML='<span>계정 기록을 불러오는 중이에요…</span>'}
  else lb.hidden=true;
  document.getElementById('carChips').innerHTML=G.cars.map(c=>`<button type="button" class="chip num" data-car="${c.id}" aria-pressed="${c.id===S.id}">${esc(c.car.plate||c.car.name||'이름 없음')}</button>`).join('')+'<button type="button" class="chip" data-car="new">+ 차량 추가</button>';
  document.querySelectorAll('nav.tabs button').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===tab?'page':'false'));
  view.innerHTML=({home:renderHome,fuel:renderFuel,svc:renderSvc,stat:renderStat})[tab]();
}
function fuelRow(r){return `<button class="row" data-edit-fuel="${r.id}"><span class="ico f">주유</span>
  <span class="main"><span class="t1">${esc(r.station||'주유')}${r.full?'':' <span class="pill warn">부분</span>'}</span>
  <span class="t2 num">${r.date.slice(2).replaceAll('-','.')} · ${num(r.liters,2)}L · ${won(r.price)}원/L${r.odo?` · ${num(r.odo)}km`:''}</span></span>
  <span class="amt">${won(r.amount)}원</span></button>`}
function svcRow(r){return `<button class="row" data-edit-svc="${r.id}"><span class="ico s">${r.kind==='exp'?'지출':'정비'}</span>
  <span class="main"><span class="t1">${esc(r.title||r.cat)}</span>
  <span class="t2"><span class="num">${r.date.slice(2).replaceAll('-','.')}</span> · ${esc(r.cat)}${r.shop?' · '+esc(r.shop):''}${r.odo?` · <span class="num">${num(r.odo)}km</span>`:''}</span></span>
  <span class="amt">${won(r.amount)}원</span></button>`}
function renderHome(){
  const eff=avgEff(),last=byDate(S.fuels)[0];
  const rems=orderedRems(S.reminders).map(r=>({r,s:remStatus(r)}));
  const recent=byDate([...S.fuels.map(x=>({...x,_t:'f'})),...S.services.map(x=>({...x,_t:'s'}))]).slice(0,5);
  return `<section class="dash" aria-label="요약">
    <div><div class="lbl">누적 주행</div><div class="val">${num(curOdo())}<u>km</u></div></div>
    <div><div class="lbl">평균 연비</div><div class="val">${eff?num(eff,1):'–'}<u>km/L</u></div></div>
    <div><div class="lbl">이번 달 차량비</div><div class="val">${won(thisMonthSpend())}<u>원</u></div></div>
    <div><div class="lbl">최근 주유 단가</div><div class="val">${last?won(last.price):'–'}<u>원/L</u></div></div>
    <div class="wide"><span class="lbl">이번 달 주유 ${S.fuels.filter(x=>monthKey(x.date)===today().slice(0,7)).length}회</span><span class="lbl">마지막 주유 ${last?last.date.replaceAll('-','.'):'없음'}</span></div>
  </section>
  <h2>소모품 교체 주기</h2>
  <div class="list">${rems.map(({r,s})=>`<div class="rem"><div class="hd"><b>${esc(r.name)}</b><span class="pill ${s.cls}">${s.label}</span></div>
    <div class="t2">${s.last?`마지막 ${s.last.date.replaceAll('-','.')} · `:''}${esc(s.detail)}</div>
    <div class="bar"><i style="width:${Math.min(100,s.pct*100)}%;background:var(--${s.cls})"></i></div></div>`).join('')}</div>
  <h2>최근 기록</h2>
  <div class="list">${recent.length?recent.map(x=>x._t==='f'?fuelRow(x):svcRow(x)).join(''):'<div class="empty">아직 기록이 없어요. 아래 <b>+ 기록</b>을 눌러 첫 주유를 남겨보세요.</div>'}</div>`;
}
function renderFuel(){
  let a=byDate(S.fuels);const y=today().slice(0,4),m=today().slice(0,7);
  if(fuelFilter==='month')a=a.filter(x=>monthKey(x.date)===m);if(fuelFilter==='year')a=a.filter(x=>x.date.startsWith(y));
  const L=a.reduce((s,x)=>s+x.liters,0),W=a.reduce((s,x)=>s+x.amount,0);
  return `<div class="chips">${[['all','전체'],['month','이번 달'],['year','올해']].map(([k,t])=>`<button class="chip" data-ff="${k}" aria-pressed="${fuelFilter===k}">${t}</button>`).join('')}</div>
  <div style="margin:-2px 0 10px"><button class="btn" data-import="1" type="button">엑셀에서 주유 기록 가져오기</button></div>
  <dl class="kv"><dt>주유 횟수</dt><dd>${a.length}회</dd><dt>넣은 양</dt><dd>${num(L,1)} L</dd><dt>주유 금액</dt><dd>${won(W)}원</dd><dt>평균 단가</dt><dd>${L?won(W/L):'–'}원/L</dd></dl>
  <h2>주유 내역</h2><div class="list">${a.length?a.map(fuelRow).join(''):'<div class="empty">이 기간에 주유 기록이 없어요.</div>'}</div>
  <p class="hint">연비는 주행거리를 적은 ‘가득 주유’ 기록 사이로 계산해요. 주행거리가 없는 예전 기록은 금액·주유량 통계에만 쓰여요. 일부만 넣었을 땐 ‘가득 주유’를 끄고 저장하세요.</p>`;
}
function renderSvc(){
  const cats=['전체',...new Set(S.services.map(x=>x.cat))];
  const a=byDate(S.services).filter(x=>svcFilter==='전체'||x.cat===svcFilter);
  return `<div class="chips">${cats.map(c=>`<button class="chip" data-sf="${esc(c)}" aria-pressed="${svcFilter===c}">${esc(c)}</button>`).join('')}</div>
  <dl class="kv"><dt>건수</dt><dd>${a.length}건</dd><dt>합계</dt><dd>${won(a.reduce((s,x)=>s+x.amount,0))}원</dd></dl>
  <h2>정비·지출 이력</h2><div class="list">${a.length?a.map(svcRow).join(''):'<div class="empty">정비 기록이 없어요. 엔진오일 교환부터 남겨보세요.</div>'}</div>
  <h2>교체 주기 설정</h2><div class="list">${orderedRems(S.reminders).map(r=>`<button class="row" data-edit-rem="${r.id}"><span class="main"><span class="t1">${esc(r.name)}</span><span class="t2">${r.km?num(r.km)+'km':''}${r.km&&r.months?' 또는 ':''}${r.months?r.months+'개월':''}마다 · 분류 ‘${esc(r.cat)}’ 기록 기준</span></span><span class="t2">수정</span></button>`).join('')}
  <button class="row" data-edit-rem="new"><span class="main"><span class="t1" style="color:var(--accent)">+ 교체 주기 추가</span></span></button></div>`;
}
function renderStat(){
  const months=[];const d=new Date(today());for(let i=5;i>=0;i--){const t=new Date(d.getFullYear(),d.getMonth()-i,1);months.push(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}`)}
  const fuelM=months.map(m=>S.fuels.filter(x=>monthKey(x.date)===m).reduce((s,x)=>s+x.amount,0));
  const svcM=months.map(m=>S.services.filter(x=>monthKey(x.date)===m).reduce((s,x)=>s+x.amount,0));
  const max=Math.max(1,...months.map((_,i)=>fuelM[i]+svcM[i]));
  const nice=v=>{const p=Math.pow(10,Math.floor(Math.log10(v)));return Math.ceil(v/p/ (v/p>5?2:1))*p*(v/p>5?2:1)};const top=nice(max);
  const W=340,H=180,pl=40,pb=24,pt=10,cw=(W-pl-8)/6,bw=cw*.52,yy=v=>pt+(H-pt-pb)*(1-v/top);
  let bars='';months.forEach((m,i)=>{const x=pl+cw*i+(cw-bw)/2;const f=fuelM[i],s=svcM[i];
    bars+=`<rect x="${x}" y="${yy(f)}" width="${bw}" height="${yy(0)-yy(f)}" fill="var(--accent)" rx="2"/>`;
    if(s)bars+=`<rect x="${x}" y="${yy(f+s)}" width="${bw}" height="${yy(f)-yy(f+s)}" fill="var(--ink)" rx="2"/>`;
    bars+=`<text x="${x+bw/2}" y="${H-6}" text-anchor="middle" font-size="11" fill="var(--muted)">${+m.slice(5)}월</text>`});
  let grid='';[0,.5,1].forEach(k=>{const v=top*k;grid+=`<line x1="${pl}" x2="${W-4}" y1="${yy(v)}" y2="${yy(v)}" stroke="var(--line)"/><text x="${pl-6}" y="${yy(v)+4}" text-anchor="end" font-size="10.5" fill="var(--muted)">${v>=10000?num(v/10000,v%10000?1:0)+'만':num(v)}</text>`});
  const e=effList().slice(-8);let effSvg='';
  if(e.length>1){const mn=Math.min(...e.map(x=>x.eff))*.92,mx=Math.max(...e.map(x=>x.eff))*1.05,EH=120,ex=i=>pl+(W-pl-14)*i/(e.length-1),ey=v=>10+(EH-34)*(1-(v-mn)/(mx-mn));
    const pts=e.map((x,i)=>`${ex(i)},${ey(x.eff)}`).join(' ');
    effSvg=`<div class="chart"><svg viewBox="0 0 ${W} ${EH}" role="img" aria-label="연비 추이"><line x1="${pl}" x2="${W-4}" y1="${ey(mn)}" y2="${ey(mn)}" stroke="var(--line)"/>
    <polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.2"/>${e.map((x,i)=>`<circle cx="${ex(i)}" cy="${ey(x.eff)}" r="${i===e.length-1?4.5:3}" fill="${i===e.length-1?'var(--accent)':'var(--surface)'}" stroke="var(--accent)" stroke-width="2"/><text x="${ex(i)}" y="${ey(x.eff)-9}" text-anchor="middle" font-size="10.5" fill="var(--fg)">${num(x.eff,1)}</text><text x="${ex(i)}" y="${EH-6}" text-anchor="middle" font-size="10" fill="var(--muted)">${x.date.slice(5).replace('-','.')}</text>`).join('')}</svg></div>`}
  else effSvg='<div class="list"><div class="empty">가득 주유 기록이 2번 이상 쌓이면 연비 추이가 나와요.</div></div>';
  const yr=today().slice(0,4);const yF=S.fuels.filter(x=>x.date.startsWith(yr)).reduce((s,x)=>s+x.amount,0),yS=S.services.filter(x=>x.date.startsWith(yr)).reduce((s,x)=>s+x.amount,0);
  const allF=S.fuels.filter(x=>x.odo>0).sort((a,b)=>a.odo-b.odo);const kmSpan=allF.length>1?allF.at(-1).odo-allF[0].odo:0;const fuelSum=allF.slice(1).reduce((s,x)=>s+x.amount,0);
  return `<h2>최근 6개월 차량비</h2><div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 차량비">${grid}${bars}</svg>
    <div class="t2" style="display:flex;gap:14px;justify-content:center;padding:6px 0 2px"><span><span style="display:inline-block;width:10px;height:10px;background:var(--accent);border-radius:2px"></span> 주유</span><span><span style="display:inline-block;width:10px;height:10px;background:var(--ink);border-radius:2px"></span> 정비·지출</span></div></div>
  <h2>연비 추이 (가득 주유 기준)</h2>${effSvg}
  <h2>${yr}년 합계</h2><dl class="kv"><dt>주유비</dt><dd>${won(yF)}원</dd><dt>정비·기타 지출</dt><dd>${won(yS)}원</dd><dt>총 차량비</dt><dd>${won(yF+yS)}원</dd><dt>1km당 기름값</dt><dd>${kmSpan?num(fuelSum/kmSpan,0):'–'}원</dd></dl>
  <h2>연도별 주유</h2>${(()=>{const ys=[...new Set(S.fuels.map(x=>x.date.slice(0,4)))].sort().reverse();if(!ys.length)return '<div class="list"><div class="empty">주유 기록이 없어요.</div></div>';
    return `<div class="list">${ys.map(y=>{const a=S.fuels.filter(x=>x.date.startsWith(y));const W=a.reduce((s,x)=>s+x.amount,0),L=a.reduce((s,x)=>s+x.liters,0);
      return `<div class="row" style="cursor:default"><span class="main"><span class="t1 num">${y}년</span><span class="t2 num">${a.length}회 · ${num(L,0)}L · 평균 ${L?won(W/L):'–'}원/L</span></span><span class="amt">${won(W)}원</span></div>`}).join('')}</div>`})()}
  <h2>데이터</h2><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-import="1" type="button">엑셀 가져오기</button><button class="btn" id="exportBtn" type="button">백업 내용 복사</button>${Cloud&&Cloud.on?'':'<button class="btn danger" id="resetBtn" type="button">전체 초기화</button>'}</div>
  <p class="hint">${Cloud&&Cloud.on?'구글 계정('+esc(Cloud.user.email||'')+')에 실시간으로 저장돼요. 다른 폰에서 같은 계정으로 로그인하면 똑같이 보여요.':'지금은 이 기기에만 저장돼요. 위쪽 동그라미 버튼에서 구글로 로그인하면 여러 폰에서 같이 볼 수 있어요.'}</p>`;
}

/* 시트(입력창) */
const root=document.getElementById('sheetRoot');
function close(){root.innerHTML=''}
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;document.body.appendChild(e);setTimeout(()=>e.remove(),1800)}
function leaveSample(){if(G.sample){G={sample:false,remV:2,cur:null,cars:[blank()]};pick()}}
function openSheet(html,bind){root.innerHTML=`<div class="sheet-bg" id="bg"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  document.getElementById('bg').addEventListener('click',e=>{if(e.target.id==='bg')close()});bind(root)}

function fuelForm(r){
  const isNew=!r;r=r||{date:today(),odo:'',price:byDate(S.fuels)[0]?.price||'',amount:'',liters:'',full:true,station:byDate(S.fuels)[0]?.station||''};
  return `<h3>${isNew?'주유 기록':'주유 수정'}</h3><div class="hint">금액·단가·리터 중 두 개만 넣으면 나머지는 자동 계산돼요.</div>
  <form id="ff" class="fg" style="margin-top:12px">
    <label class="f">날짜<input id="f_date" type="date" value="${r.date}" required></label>
    <label class="f">계기판 주행거리(km, 선택)<input id="f_odo" type="number" inputmode="numeric" value="${r.odo||''}" placeholder="${curOdo()||''}"></label>
    <label class="f">주유 금액(원)<input id="f_amount" type="number" inputmode="numeric" value="${r.amount}" placeholder="50000"></label>
    <label class="f">리터당 단가(원)<input id="f_price" type="number" inputmode="numeric" value="${r.price}" placeholder="1650"></label>
    <label class="f">주유량(L)<input id="f_liters" type="number" inputmode="decimal" step="0.01" value="${r.liters}" placeholder="30.3"></label>
    <label class="f">주유소<input id="f_station" type="text" value="${esc(r.station)}" placeholder="예: SK 양재주유소"></label>
    <label class="check full"><input id="f_full" type="checkbox" ${r.full?'checked':''}> 가득 주유 (연비 계산에 사용)</label>
    <div class="actions full">${isNew?'<span></span>':`<button type="button" class="btn danger" id="del">삭제</button>`}<div class="r"><button type="button" class="btn" id="cancel">취소</button><button class="btn pri">저장</button></div></div>
  </form>`}
function bindFuel(r){return el=>{
  const $=id=>el.querySelector('#'+id);let lastTouched=[];
  ['f_amount','f_price','f_liters'].forEach(id=>$(id).addEventListener('input',()=>{
    lastTouched=lastTouched.filter(x=>x!==id);lastTouched.push(id);
    const a=+$('f_amount').value,p=+$('f_price').value,l=+$('f_liters').value;const other=['f_amount','f_price','f_liters'].find(x=>!lastTouched.slice(-2).includes(x));
    if(lastTouched.length<2&&!(a&&p))return;
    if(other==='f_liters'&&a&&p)$('f_liters').value=(a/p).toFixed(2);
    else if(other==='f_amount'&&p&&l)$('f_amount').value=Math.round(p*l);
    else if(other==='f_price'&&a&&l)$('f_price').value=Math.round(a/l);
  }));
  $('cancel').onclick=close;
  if($('del'))$('del').onclick=()=>{DB.delFuel(r.id);close();render();toast('삭제했어요')};
  $('ff').onsubmit=e=>{e.preventDefault();
    let a=+$('f_amount').value,p=+$('f_price').value,l=+$('f_liters').value;
    if(!l&&a&&p)l=+(a/p).toFixed(2);if(!a&&p&&l)a=Math.round(p*l);if(!p&&a&&l)p=Math.round(a/l);
    if(!(a&&p&&l)){toast('금액·단가·리터 중 두 개를 입력하세요');return}
    const rec={id:r?.id||uid(),date:$('f_date').value,odo:+$('f_odo').value||0,amount:a,price:p,liters:l,full:$('f_full').checked,station:$('f_station').value.trim()};
    if(!r)leaveSample();
    DB.putFuel(rec);close();render();toast(r?'수정했어요':'주유 기록을 저장했어요')};
}}
function svcForm(r,kind){
  const isNew=!r;r=r||{kind:kind||'svc',date:today(),odo:curOdo()||'',cat:'엔진오일',title:'',amount:'',shop:'',memo:''};
  if(isNew&&r.kind==='exp')r.cat='보험';
  const cats=r.kind==='exp'?EXP_CATS:SVC_CATS;
  return `<h3>${isNew?(r.kind==='exp'?'기타 지출 기록':'정비 기록'):'기록 수정'}</h3>
  <form id="sf" class="fg" style="margin-top:12px">
    <div class="full"><div class="hint" style="margin-bottom:6px">분류</div><div class="tags">${cats.map(c=>`<button type="button" class="chip" data-cat="${c}" aria-pressed="${r.cat===c}">${c}</button>`).join('')}</div></div>
    <label class="f full">내용<input id="s_title" type="text" value="${esc(r.title)}" placeholder="${r.kind==='exp'?'예: 자동차세 상반기':'예: 엔진오일+필터 교환'}"></label>
    <label class="f">날짜<input id="s_date" type="date" value="${r.date}" required></label>
    <label class="f">주행거리(km)<input id="s_odo" type="number" inputmode="numeric" value="${r.odo}"></label>
    <label class="f">금액(원)<input id="s_amount" type="number" inputmode="numeric" value="${r.amount}" required></label>
    <label class="f">${r.kind==='exp'?'사용처':'정비소'}<input id="s_shop" type="text" value="${esc(r.shop)}"></label>
    <label class="f full">메모<input id="s_memo" type="text" value="${esc(r.memo)}" placeholder="부품명, 다음 점검 사항 등"></label>
    <div class="actions full">${isNew?'<span></span>':`<button type="button" class="btn danger" id="del">삭제</button>`}<div class="r"><button type="button" class="btn" id="cancel">취소</button><button class="btn pri">저장</button></div></div>
  </form>`}
function bindSvc(r,kind){return el=>{
  const $=id=>el.querySelector('#'+id);let cat=r?.cat||(kind==='exp'?'보험':'엔진오일');
  el.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;el.querySelectorAll('[data-cat]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
  $('cancel').onclick=close;
  if($('del'))$('del').onclick=()=>{DB.delSvc(r.id);close();render();toast('삭제했어요')};
  $('sf').onsubmit=e=>{e.preventDefault();
    const rec={id:r?.id||uid(),kind:r?.kind||kind||'svc',date:$('s_date').value,odo:+$('s_odo').value||0,cat,title:$('s_title').value.trim()||cat,amount:+$('s_amount').value||0,shop:$('s_shop').value.trim(),memo:$('s_memo').value.trim()};
    if(!r)leaveSample();
    DB.putSvc(rec);close();render();toast(r?'수정했어요':'정비 기록을 저장했어요')};
}}
function openAdd(){
  let mode='fuel';
  const draw=()=>{openSheet(`<div class="seg" role="group" aria-label="기록 종류">${[['fuel','주유'],['svc','정비'],['exp','기타 지출']].map(([k,t])=>`<button type="button" data-mode="${k}" aria-pressed="${mode===k}">${t}</button>`).join('')}</div>`+(mode==='fuel'?fuelForm():svcForm(null,mode)),
    el=>{el.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;draw()});(mode==='fuel'?bindFuel(null):bindSvc(null,mode))(el)})};
  draw();
}
function openRem(id){
  const r=id==='new'?{id:uid(),name:'',km:'',months:'',cat:'점검'}:S.reminders.find(x=>x.id===id);
  openSheet(`<h3>교체 주기</h3><form id="rf" class="fg" style="margin-top:12px">
    <label class="f full">이름<input id="r_name" type="text" value="${esc(r.name)}" placeholder="예: 브레이크 패드" required></label>
    <label class="f">거리 주기(km)<input id="r_km" type="number" inputmode="numeric" value="${r.km||''}" placeholder="10000"></label>
    <label class="f">기간 주기(개월)<input id="r_mo" type="number" inputmode="numeric" value="${r.months||''}" placeholder="12"></label>
    <label class="f full">어떤 정비 기록을 기준으로 할까요?<select id="r_cat">${SVC_CATS.map(c=>`<option ${c===r.cat?'selected':''}>${c}</option>`).join('')}</select></label>
    <div class="hint full">거리나 기간 중 먼저 오는 쪽으로 알려드려요.</div>
    <div class="actions full">${id==='new'?'<span></span>':'<button type="button" class="btn danger" id="del">삭제</button>'}<div class="r"><button type="button" class="btn" id="cancel">취소</button><button class="btn pri">저장</button></div></div></form>`,
  el=>{const $=x=>el.querySelector('#'+x);$('cancel').onclick=close;
    if($('del'))$('del').onclick=()=>{S.reminders=S.reminders.filter(x=>x.id!==id);DB.putCar(S);close();render()};
    $('rf').onsubmit=e=>{e.preventDefault();const rec={id:r.id,name:$('r_name').value.trim(),km:+$('r_km').value||0,months:+$('r_mo').value||0,cat:$('r_cat').value};
      if(!rec.km&&!rec.months){toast('거리나 기간 중 하나는 입력하세요');return}
      if(id==='new')S.reminders.push(rec);else S.reminders=S.reminders.map(x=>x.id===id?rec:x);DB.putCar(S);close();render();toast('저장했어요')}});
}
function openCar(rec){
  const isNew=!rec;const c=rec?rec.car:{name:'',plate:'',fuel:'휘발유'};
  openSheet(`<h3>${isNew?'차량 추가':'차량 정보'}</h3><form id="cf" class="fg" style="margin-top:12px">
    <label class="f full">차 이름<input id="c_name" type="text" value="${esc(c.name)}" placeholder="예: 쏘렌토 MQ4"></label>
    <label class="f">차량번호<input id="c_plate" type="text" value="${esc(c.plate)}" placeholder="12가 3456" ${isNew?'required':''}></label>
    <label class="f">연료<select id="c_fuel">${['휘발유','경유','LPG','하이브리드','전기'].map(x=>`<option ${x===c.fuel?'selected':''}>${x}</option>`).join('')}</select></label>
    ${isNew&&G.sample?'<div class="hint full">차량을 추가하면 예시 기록은 지워지고 이 차로 시작해요.</div>':''}
    <div class="actions full">${!isNew&&G.cars.length>1?'<button type="button" class="btn danger" id="del">이 차량 삭제</button>':'<span></span>'}<div class="r"><button type="button" class="btn" id="cancel">취소</button><button class="btn pri">저장</button></div></div></form>`,
  el=>{const $=x=>el.querySelector('#'+x);$('cancel').onclick=close;
    if($('del'))$('del').onclick=()=>{const b=$('del');
      if(b.dataset.armed){DB.delCar(rec);close();render();toast('차량과 기록을 삭제했어요')}
      else{b.dataset.armed='1';b.textContent='한 번 더 누르면 기록까지 삭제'}};
    $('cf').onsubmit=e=>{e.preventDefault();const car={name:$('c_name').value.trim(),plate:$('c_plate').value.trim(),fuel:$('c_fuel').value};
      if(isNew){const n={...blank(),car};DB.addCar(n)}
      else{rec.car=car;DB.putCar(rec)}
      close();render();toast(isNew?`${car.plate||car.name} 차량을 추가했어요`:'저장했어요')}});
}
/* 엑셀 가져오기 */
const FIELDS=[['date','일자',true],['station','주유소',false],['amount','금액',true],['liters','주유량(L)',true],['price','리터당 단가',false],['odo','주행거리',false]];
const FRX={price:/단가|리터당|price/i,odo:/주행|누적|km|odo|계기/i,liters:/리터|주유량|수량|\(l\)|ℓ|liter|^l$/i,date:/일자|날짜|일시|date|년월일/i,station:/주유소|상호|장소|가맹점|업체|station/i,amount:/금액|결제|합계|비용|amount|가격/i};
function loadXLSX(){if(window.XLSX)return Promise.resolve();return new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
const pad=n=>String(n).padStart(2,'0');
function parseDate(v){
  if(v instanceof Date&&!isNaN(v))return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
  if(typeof v==='number'){if(v>20000&&v<80000){const d=new Date(Math.round((v-25569)*86400000));return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`}
    if(v>19000101&&v<21001231){v=String(v)}else return null}
  const t=String(v||'').trim();if(!t)return null;let m=t.match(/^(\d{4})(\d{2})(\d{2})$/);
  if(!m)m=t.match(/(\d{2,4})\s*[.\-\/년]\s*(\d{1,2})\s*[.\-\/월]\s*(\d{1,2})/);if(!m)return null;
  let y=+m[1];if(y<100)y+=2000;const mo=+m[2],d=+m[3];if(mo<1||mo>12||d<1||d>31||y<1990||y>2100)return null;return `${y}-${pad(mo)}-${pad(d)}`}
function parseNum(v){if(typeof v==='number')return v;const t=String(v||'').replace(/[^0-9.\-]/g,'');return t?+t:0}
function openImport(){
  const st={wb:null,sheet:'',rows:null,hdr:0,map:{},file:'',err:''};
  function loadSheet(name){st.sheet=name;st.rows=XLSX.utils.sheet_to_json(st.wb.Sheets[name],{header:1,raw:true,defval:''});
    let best=0,bi=0;for(let i=0;i<Math.min(15,st.rows.length);i++){const sc=st.rows[i].filter(c=>typeof c==='string'&&Object.values(FRX).some(r=>r.test(c.trim()))).length;if(sc>best){best=sc;bi=i}}
    st.hdr=bi;st.map={};const hdr=st.rows[bi]||[],used=new Set();
    for(const k of ['price','odo','liters','date','station','amount']){const i=hdr.findIndex((c,j)=>!used.has(j)&&FRX[k].test(String(c).trim()));if(i>=0){st.map[k]=i;used.add(i)}}}
  function build(){
    const r={ok:[],dup:0,bad:0,sum:0,min:'',max:''};if(!st.rows)return r;const M=st.map,g=(row,k)=>M[k]>=0&&M[k]!==undefined?row[M[k]]:'';
    const seen=new Set(G.sample?[]:S.fuels.map(x=>`${x.date}|${Math.round(x.amount)}`));
    for(const row of st.rows.slice(st.hdr+1)){
      if(!row||row.every(c=>c===''||c==null))continue;
      const date=parseDate(g(row,'date')),amount=Math.round(parseNum(g(row,'amount'))),liters=+parseNum(g(row,'liters')).toFixed(2);
      if(!date||amount<=0||liters<=0){r.bad++;continue}
      const key=`${date}|${amount}`;if(seen.has(key)){r.dup++;continue}seen.add(key);
      const price=Math.round(parseNum(g(row,'price')))||Math.round(amount/liters);
      r.ok.push({id:uid(),date,odo:Math.round(parseNum(g(row,'odo')))||0,price,amount,liters,full:true,station:String(g(row,'station')||'').trim()});r.sum+=amount}
    if(r.ok.length){const ds=r.ok.map(x=>x.date).sort();r.min=ds[0].replaceAll('-','.');r.max=ds.at(-1).replaceAll('-','.')}
    return r}
  function html(){
    let h=`<h3>엑셀로 주유 기록 가져오기</h3><div class="hint">일자·금액·주유량(L) 열만 있으면 돼요. 주유소·단가·주행거리는 없어도 괜찮아요.</div>
    <div class="banner" style="margin:10px 0 0"><span>가져올 차량: <b>${esc(S.car.plate||S.car.name)}</b> · 다른 차라면 닫고 위쪽에서 차량을 바꿔주세요.</span></div>
    <label class="f" style="margin-top:12px">파일 선택 (.xlsx · .xls · .csv)<input id="imp_file" type="file" accept=".xlsx,.xls,.csv"></label>`;
    if(st.file)h+=`<div class="hint">불러온 파일: ${esc(st.file)}</div>`;
    if(st.err)h+=`<div class="hint" style="color:var(--bad)">${esc(st.err)}</div>`;
    let r={ok:[]};
    if(st.rows){
      const hdr=st.rows[st.hdr]||[];r=build();
      const opts=sel=>`<option value="-1">없음</option>`+hdr.map((c,i)=>`<option value="${i}" ${sel===i?'selected':''}>${esc(String(c).trim()||(i+1)+'번째 열')}</option>`).join('');
      if(st.wb.SheetNames.length>1)h+=`<label class="f" style="margin-top:10px">시트<select id="imp_sheet">${st.wb.SheetNames.map(n=>`<option ${n===st.sheet?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
      h+=`<h2>열 맞추기</h2><div class="hint" style="margin:-4px 2px 8px">제목 줄: ${st.hdr+1}번째 줄 · 자동으로 맞췄어요. 틀리면 고쳐주세요.</div><div class="fg">${FIELDS.map(([k,t,req])=>`<label class="f">${t}${req?'':' (선택)'}<select data-map="${k}">${opts(st.map[k])}</select></label>`).join('')}</div>`;
      h+=`<h2>미리보기</h2><dl class="kv"><dt>가져올 기록</dt><dd>${num(r.ok.length)}건</dd><dt>이미 있는 기록 (건너뜀)</dt><dd>${r.dup}건</dd><dt>읽을 수 없는 줄</dt><dd>${r.bad}건</dd>${r.ok.length?`<dt>기간</dt><dd>${r.min} ~ ${r.max}</dd><dt>총 금액</dt><dd>${won(r.sum)}원</dd>`:''}</dl>
      <div class="list" style="margin-top:10px;pointer-events:none">${r.ok.length?byDate(r.ok).slice(0,5).map(fuelRow).join(''):'<div class="empty">일자·금액·주유량 열을 맞춰주세요.</div>'}</div>`;
      if(G.sample&&r.ok.length)h+=`<div class="hint">가져오면 지금 보이는 예시 기록은 지워져요.</div>`;
    }
    h+=`<div class="actions"><span></span><div class="r"><button type="button" class="btn" id="cancel">닫기</button>${st.rows?`<button type="button" class="btn pri" id="imp_go" ${r.ok.length?'':'disabled'}>${num(r.ok.length)}건 가져오기</button>`:''}</div></div>`;
    return h}
  function draw(){const sh=root.querySelector('.sheet');if(sh){const t=sh.scrollTop;sh.innerHTML=html();bind(root);sh.scrollTop=t}else openSheet(html(),bind)}
  function bind(el){
    el.querySelector('#cancel').onclick=close;
    el.querySelector('#imp_file').onchange=async e=>{const f=e.target.files[0];if(!f)return;st.file=f.name;st.err='';
      try{await loadXLSX();const buf=await f.arrayBuffer();
        if(/\.csv$/i.test(f.name)){let txt;try{txt=new TextDecoder('utf-8',{fatal:true}).decode(buf)}catch(_){txt=new TextDecoder('euc-kr').decode(buf)}st.wb=XLSX.read(txt,{type:'string',cellDates:true})}
        else st.wb=XLSX.read(buf,{type:'array',cellDates:true});
        loadSheet(st.wb.SheetNames[0])}catch(err){st.rows=null;st.err='파일을 읽지 못했어요. 엑셀(.xlsx) 또는 CSV 파일인지 확인해주세요.'}
      draw()};
    const ss=el.querySelector('#imp_sheet');if(ss)ss.onchange=()=>{loadSheet(ss.value);draw()};
    el.querySelectorAll('[data-map]').forEach(s=>s.onchange=()=>{st.map[s.dataset.map]=+s.value;draw()});
    const go=el.querySelector('#imp_go');if(go)go.onclick=()=>{const r=build();if(!r.ok.length)return;leaveSample();DB.bulkFuels(r.ok);close();tab='fuel';fuelFilter='all';render();toast(`주유 기록 ${num(r.ok.length)}건을 가져왔어요`)};
  }
  draw();
}

/* 이벤트 */
document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();window.scrollTo(0,0)});
document.getElementById('fab').onclick=openAdd;
document.getElementById('plateBtn').onclick=()=>openCar(S);
document.getElementById('acctBtn').onclick=()=>openAccount();
document.getElementById('loginBanner').onclick=e=>{if(e.target.closest('[data-login]'))Cloud.login();else if(e.target.closest('[data-onboard]'))Cloud.onboard(true)};
document.getElementById('carChips').onclick=e=>{const b=e.target.closest('[data-car]');if(!b)return;
  if(b.dataset.car==='new'){openCar(null);return}
  if(b.dataset.car!==S.id){G.cur=b.dataset.car;pick();save();fuelFilter='all';svcFilter='전체';render();window.scrollTo(0,0);toast(`${S.car.plate||S.car.name}(으)로 바꿨어요`)}};
document.getElementById('clearSample').onclick=()=>{G={sample:false,remV:2,cur:null,cars:[blank()]};pick();save();render();toast('예시를 지웠어요. 첫 기록을 남겨보세요')};
view.addEventListener('click',e=>{
  const t=e.target.closest('[data-edit-fuel],[data-edit-svc],[data-edit-rem],[data-ff],[data-sf],[data-import],#exportBtn,#resetBtn');if(!t)return;
  if(t.dataset.import){openImport();return}
  if(t.dataset.editFuel){const r=S.fuels.find(x=>x.id===t.dataset.editFuel);openSheet(fuelForm(r),bindFuel(r))}
  else if(t.dataset.editSvc){const r=S.services.find(x=>x.id===t.dataset.editSvc);openSheet(svcForm(r),bindSvc(r))}
  else if(t.dataset.editRem)openRem(t.dataset.editRem);
  else if(t.dataset.ff){fuelFilter=t.dataset.ff;render()}
  else if(t.dataset.sf){svcFilter=t.dataset.sf;render()}
  else if(t.id==='exportBtn'){const txt=JSON.stringify(S);navigator.clipboard?.writeText(txt).then(()=>toast('백업 내용을 복사했어요'),()=>toast('복사가 막혀 있어요'))}
  else if(t.id==='resetBtn'){
    if(t.dataset.armed){G={sample:false,remV:2,cur:null,cars:[blank()]};pick();save();render();toast('모든 차량 기록을 초기화했어요')}else{t.dataset.armed='1';t.textContent='한 번 더 누르면 전부 삭제';setTimeout(()=>{if(t.isConnected){delete t.dataset.armed;t.textContent='전체 초기화'}},3000)}}
});
render();
startCloud();

/* ───────── 구글 로그인 · 실시간 동기화 (Firebase 프로젝트 chagok-8ec44) ─────────
   데이터 구조: cars/{차량} {owner, members[], car, reminders, order}
                cars/{차량}/fuels/{기록}, cars/{차량}/services/{기록}
   members에 들어 있는 사람만 읽고 쓸 수 있음 (firestore.rules) */
const clean=o=>JSON.parse(JSON.stringify(o));
function authErr(e){const c=(e&&e.code)||'';
  if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return '로그인 창이 닫혔어요. 다시 눌러 주세요.';
  if(c==='auth/unauthorized-domain')return '이 주소는 아직 로그인이 허용되지 않았어요.';
  if(c==='auth/network-request-failed')return '인터넷 연결을 확인해 주세요.';
  return '로그인하지 못했어요. 잠시 뒤 다시 해 주세요.'}
function startCloud(){
  Cloud={ok:false,on:false,user:null,loading:false,fs:null,cars:{},subs:{},carsUnsub:null,asked:false,deleting:new Set(),
    init(){
      if(!window.firebase||!window.CHAGOK_FIREBASE||!firebase.initializeApp){return}
      try{firebase.initializeApp(CHAGOK_FIREBASE)}catch(e){}
      this.fs=firebase.firestore();try{this.fs.enablePersistence({synchronizeTabs:true}).catch(()=>{})}catch(e){}
      this.ok=true;
      firebase.auth().getRedirectResult().catch(e=>toast(authErr(e)));
      firebase.auth().onAuthStateChanged(u=>{this.user=u;if(u)this.start();else this.stop();render()});
      render();
    },
    async login(){
      if(!this.ok){toast('인터넷 연결을 확인해 주세요.');return}
      const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
      try{await firebase.auth().signInWithPopup(p);close()}
      catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/web-storage-unsupported'].includes(e.code)){try{await firebase.auth().signInWithRedirect(p);return}catch(e2){e=e2}}toast(authErr(e))}
    },
    async logout(){
      try{await firebase.auth().signOut()}catch(e){}
      try{await this.fs.terminate();await this.fs.clearPersistence()}catch(e){}
      location.reload();
    },
    col(carId,k){return this.fs.collection('cars').doc(carId).collection(k)},
    err(e){console.warn('[chagok]',e);toast(e&&e.code==='permission-denied'?'이 기록을 바꿀 권한이 없어요.':'저장하지 못했어요. 인터넷이 연결되면 다시 시도돼요.')},
    put(carId,k,rec){this.col(carId,k).doc(rec.id).set(clean(rec)).catch(e=>this.err(e))},
    del(carId,k,id){this.col(carId,k).doc(id).delete().catch(e=>this.err(e))},
    carDoc(c,isNew){const d={car:c.car,reminders:c.reminders,order:c.order||0};if(isNew){d.owner=this.user.uid;d.members=[this.user.uid];d.createdAt=Date.now()}return clean(d)},
    addCar(c){return this.fs.collection('cars').doc(c.id).set(this.carDoc(c,true)).catch(e=>this.err(e))},
    putCar(c){this.fs.collection('cars').doc(c.id).set(this.carDoc(c,false),{merge:true}).catch(e=>this.err(e))},
    async delCar(c){
      this.deleting.add(c.id);(this.subs[c.id]||[]).forEach(f=>f());delete this.subs[c.id];delete this.cars[c.id];
      try{for(const k of ['fuels','services']){const snap=await this.col(c.id,k).get();for(let i=0;i<snap.docs.length;i+=400){const b=this.fs.batch();snap.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}}
        await this.fs.collection('cars').doc(c.id).delete()}catch(e){this.err(e)}
    },
    async bulk(carId,k,list){
      try{for(let i=0;i<list.length;i+=400){const b=this.fs.batch();list.slice(i,i+400).forEach(r=>b.set(this.col(carId,k).doc(r.id),clean(r)));await b.commit()}}catch(e){this.err(e)}
    },
    start(){
      this.loading=true;this.asked=false;
      this.carsUnsub=this.fs.collection('cars').where('members','array-contains',this.user.uid).onSnapshot(snap=>{
        const seen=new Set();
        snap.forEach(d=>{if(this.deleting.has(d.id))return;seen.add(d.id);const v=d.data();const c=this.cars[d.id]||(this.cars[d.id]={id:d.id,fuels:[],services:[]});
          c.car=v.car||{name:'내 차',plate:'',fuel:'휘발유'};c.reminders=Array.isArray(v.reminders)?v.reminders:defaultReminders();
          c.order=v.order||0;c.owner=v.owner;c.members=v.members||[];c.created=v.createdAt||0;
          if(!this.subs[d.id])this.subs[d.id]=['fuels','services'].map(k=>d.ref.collection(k).onSnapshot(s=>{c[k]=s.docs.map(x=>x.data());this.rebuild()},e=>console.warn('[chagok]',e)));
        });
        for(const id of Object.keys(this.cars))if(!seen.has(id)){(this.subs[id]||[]).forEach(f=>f());delete this.subs[id];delete this.cars[id]}
        if(snap.metadata.fromCache&&snap.empty)return; // 서버 답을 기다림
        this.loading=false;
        if(!this.on){if(snap.empty){if(!this.asked){this.asked=true;this.onboard(false)}render();return}this.switchOn()}
        this.rebuild();
      },e=>{console.warn('[chagok]',e);this.loading=false;toast('계정 기록을 불러오지 못했어요.');render()});
    },
    stop(){if(this.carsUnsub)this.carsUnsub();Object.values(this.subs).forEach(a=>a.forEach(f=>f()));this.subs={};this.cars={};this.carsUnsub=null;this.loading=false;
      if(this.on){this.on=false;location.reload()}},
    switchOn(){this.on=true;G={cloud:true,remV:2,cur:lsGet('chagok.cur')||null,cars:[]};this.rebuild()},
    rebuild(){if(!this.on)return;
      const list=Object.values(this.cars).sort((a,b)=>(a.order-b.order)||(a.created-b.created));
      if(!list.length){const n={...blank(),order:0};this.cars[n.id]=n;list.push(n);this.addCar(n)}
      G.cars=list;pick();render()},
    localSummary(){const L=lastLocal();if(!L||L.sample)return null;const cars=L.cars.filter(c=>c.fuels.length||c.services.length||c.car.plate);if(!cars.length)return null;
      return{L,cars,f:cars.reduce((s,c)=>s+c.fuels.length,0),v:cars.reduce((s,c)=>s+c.services.length,0)}},
    onboard(force){
      const sm=this.localSummary();
      if(!sm){if(!force&&this.asked===true&&this._auto)return;this._auto=true;const n={...blank(),order:0};this.addCar(n);toast('계정에 첫 차량을 만들었어요');return}
      openSheet(`<h3>이 폰의 기록을 계정에 올릴까요?</h3>
        <p class="hint" style="font-size:14px;color:var(--fg)">차량 <b>${sm.cars.length}대</b> · 주유 <b>${num(sm.f)}건</b> · 정비·지출 <b>${num(sm.v)}건</b></p>
        <p class="hint">올리면 다른 폰에서 같은 구글 계정으로 로그인했을 때 똑같이 보여요. 이 폰의 기록은 지워지지 않아요.</p>
        <div class="actions"><button type="button" class="btn" id="ob_new">올리지 않고 새로 시작</button><div class="r"><button type="button" class="btn pri" id="ob_up">계정에 올리기</button></div></div>`,
      el=>{el.querySelector('#ob_new').onclick=()=>{close();const n={...blank(),order:0};this.addCar(n)};
        el.querySelector('#ob_up').onclick=async()=>{const b=el.querySelector('#ob_up');b.disabled=true;b.textContent='올리는 중…';
          let i=0;for(const c of sm.cars){const n={id:c.id,car:c.car,reminders:c.reminders,order:i++};await this.addCar(n);await this.bulk(c.id,'fuels',c.fuels);await this.bulk(c.id,'services',c.services)}
          lsSet('chagok.uploaded',this.user.uid);close();toast(`차량 ${sm.cars.length}대 기록을 계정에 올렸어요`)}});
    }
  };
  Cloud.init();
}
function lastLocal(){try{return JSON.parse(lsGet(KEY))}catch(e){return null}}

/* 계정·설치 화면 */
let installEvt=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e});
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function openAccount(){
  const u=Cloud&&Cloud.user;const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const acct=!Cloud||!Cloud.ok?`<p class="hint">로그인 기능을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 열어 주세요.</p>`
    :u?`<dl class="kv" style="margin-top:12px"><dt>계정</dt><dd style="font-family:var(--sans);font-weight:600;word-break:break-all">${esc(u.email||'')}</dd><dt>상태</dt><dd style="font-family:var(--sans)">${Cloud.on?'<span class="pill ok">실시간 동기화 중</span>':Cloud.loading?'<span class="pill warn">불러오는 중</span>':'<span class="pill warn">시작 전</span>'}</dd><dt>차량</dt><dd>${Cloud.on?G.cars.length+'대':'–'}</dd></dl>
       <p class="hint">다른 폰에서도 이 구글 계정으로 로그인하면 같은 기록이 실시간으로 보여요.</p>
       <div class="actions"><span></span><div class="r"><button type="button" class="btn" id="ac_out">로그아웃</button></div></div>`
    :`<p class="hint" style="font-size:14px;color:var(--fg)">구글 계정으로 로그인하면 <b>여러 폰에서 같은 기록</b>을 실시간으로 볼 수 있어요.</p>
       <p class="hint">지금 이 폰에 있는 기록은 로그인한 뒤 계정으로 올릴 수 있어요.</p>
       <div class="actions"><span></span><div class="r"><button type="button" class="btn pri" id="ac_in">구글로 로그인</button></div></div>`;
  const inst=isStandalone()?`<p class="hint">홈 화면에 설치된 앱으로 열려 있어요.</p>`
    :installEvt?`<p class="hint">홈 화면에 설치하면 앱처럼 바로 열 수 있어요.</p><div class="actions"><span></span><div class="r"><button type="button" class="btn" id="ac_inst">홈 화면에 설치</button></div></div>`
    :ios?`<p class="hint">Safari 아래쪽 <b>공유 버튼 → 홈 화면에 추가</b>를 누르면 앱처럼 설치돼요.</p>`
    :`<p class="hint">Chrome 오른쪽 위 <b>︙ → 홈 화면에 추가(앱 설치)</b>를 누르면 앱처럼 설치돼요.</p>`;
  openSheet(`<h3>계정·동기화</h3>${acct}
    <h2>홈 화면 설치</h2>${inst}
    <div class="banner" style="margin-top:10px;display:block"><b>알림 설정 안내</b><br>같은 주소(taichen2k.github.io)의 <b>할수있어</b> 알림이 잘 오도록, 설치한 뒤 폰 <b>설정 → 애플리케이션 → 차곡차곡 → 알림 → 허용</b>을 켜 두세요. 차곡차곡은 알림을 보내지 않아요.</div>
    <div class="actions"><span class="hint num">${APP_VERSION}</span><div class="r"><button type="button" class="btn" id="cancel">닫기</button></div></div>`,
  el=>{el.querySelector('#cancel').onclick=close;
    const i=el.querySelector('#ac_in');if(i)i.onclick=()=>Cloud.login();
    const o=el.querySelector('#ac_out');if(o)o.onclick=()=>{if(o.dataset.armed){Cloud.logout()}else{o.dataset.armed='1';o.textContent='한 번 더 누르면 로그아웃'}};
    const n=el.querySelector('#ac_inst');if(n)n.onclick=async()=>{installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;close()};
  });
}

/* 설치용 서비스워커: chagok 폴더 안에서만 동작 */
if('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{})});
