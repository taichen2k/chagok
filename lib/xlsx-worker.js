/* 차곡차곡 엑셀 읽기 전용 작업 공간(워커)
   엑셀 라이브러리(SheetJS 0.18.5)의 알려진 취약점(조작된 파일로 내부 객체 오염·처리 지연)이
   앱 화면에 영향을 주지 못하도록, 파일 읽기는 이 분리된 공간에서만 하고 표의 값(글자·숫자·날짜)만 돌려줌 */
importScripts('xlsx.full.min.js');
const MAX_ROWS = 20000, MAX_COLS = 40, MAX_SHEETS = 20;
const plain = v => (v instanceof Date) ? v : (typeof v === 'number' || typeof v === 'boolean') ? v : String(v == null ? '' : v).slice(0, 200);
self.onmessage = e => {
  try {
    const { buf, csv } = e.data;
    let wb;
    if (csv) {
      let txt; try { txt = new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch (_) { txt = new TextDecoder('euc-kr').decode(buf) }
      wb = XLSX.read(txt, { type: 'string', cellDates: true });
    } else wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
    const names = wb.SheetNames.slice(0, MAX_SHEETS).map(n => String(n).slice(0, 60)), rows = {};
    wb.SheetNames.slice(0, MAX_SHEETS).forEach((n, i) => {
      const r = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' }).slice(0, MAX_ROWS);
      rows[names[i]] = r.map(row => (Array.isArray(row) ? row : []).slice(0, MAX_COLS).map(plain));
    });
    self.postMessage({ ok: true, names, rows });
  } catch (err) { self.postMessage({ ok: false }) }
};
