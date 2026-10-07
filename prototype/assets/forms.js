/* ==========================================================================
   forms.js — 양식 엔진
   하나의 양식 정의(항목 ID · 유형 · 필수 여부)에서
   ① 입력 화면 ② 저장 검증 ③ 엑셀 출력을 만든다. 자동 대조 시험(QC)도 같은 정의를 기준으로 돈다.
   ========================================================================== */
(function (G) {
  'use strict';
  var DB = G.DB;

  function h(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  var TYPE_LABEL = {
    text: '글자', textarea: '긴 글', number: '숫자', date: '날짜', time: '시각', select: '단일 선택', multi: '복수 선택',
    yesno: '예/아니오', photo: '사진', sign: '서명', workers: '작업자 목록', partner: '협력업체', phone: '전화번호', check: '확인 체크'
  };

  /* ---- 사진 ------------------------------------------------------------- */
  var seedCache = {};
  function seedPhoto(label) {
    if (seedCache[label]) return seedCache[label];
    var c = document.createElement('canvas'); c.width = 480; c.height = 320;
    var x = c.getContext('2d');
    var hue = 0; for (var i = 0; i < label.length; i++) hue = (hue + label.charCodeAt(i) * 7) % 360;
    var g = x.createLinearGradient(0, 0, 480, 320);
    g.addColorStop(0, 'hsl(' + (200 + hue % 40) + ',22%,30%)'); g.addColorStop(1, 'hsl(' + (210 + hue % 30) + ',28%,16%)');
    x.fillStyle = g; x.fillRect(0, 0, 480, 320);
    x.fillStyle = 'rgba(255,255,255,.07)';
    for (var k = 0; k < 7; k++) { x.fillRect(30 + k * 64, 120 - (k % 3) * 30, 34, 200); }
    x.strokeStyle = 'rgba(255,184,28,.85)'; x.lineWidth = 6;
    x.beginPath(); x.moveTo(0, 250); x.lineTo(480, 210); x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 14;
    x.beginPath(); x.moveTo(0, 90); x.lineTo(480, 90); x.stroke();
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, 268, 480, 52);
    x.fillStyle = '#fff'; x.font = 'bold 20px sans-serif'; x.fillText(label, 18, 300);
    x.fillStyle = 'rgba(255,255,255,.65)'; x.font = '12px sans-serif'; x.fillText('시연용 이미지', 380, 300);
    seedCache[label] = c.toDataURL('image/jpeg', 0.82);
    return seedCache[label];
  }
  function photoUrl(p) { return p.url || seedPhoto(p.seed || '사진'); }
  /* 업로드 사진 축소 — 운영 기준은 긴 변 1,600px. 시연은 브라우저 저장 용량 때문에 800px로 줄여 보관 */
  function shrink(file, cb) {
    var r = new FileReader();
    r.onload = function () {
      var img = new Image();
      img.onload = function () {
        var long = Math.max(img.width, img.height), sc = Math.min(1, 800 / long);
        var c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb({ url: c.toDataURL('image/jpeg', 0.78), name: file.name, orig: img.width + '×' + img.height, saved: c.width + '×' + c.height });
      };
      img.onerror = function () { cb(null); };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  }

  /* ---- 값 표시 ---------------------------------------------------------- */
  function show(it, v) {
    if (v == null || v === '') return '';
    switch (it.type) {
      case 'multi': return (v || []).join(', ');
      case 'workers': return (v || []).map(function (x) { return DB.workerName(x.wid) + (x.ok ? '(확인)' : '(미확인)'); }).join(', ');
      case 'photo': return (v || []).length ? (v.length + '장') : '';
      case 'sign': return v && v.name ? v.name + ' · ' + v.at : '';
      case 'partner': var p = DB.partner(v); return p ? p.name : v;
      case 'check': return v ? '확인' : '';
      default: return String(v);
    }
  }
  function empty(it, v) {
    if (v == null || v === '') return true;
    if (it.type === 'multi' || it.type === 'photo' || it.type === 'workers') return !v.length;
    if (it.type === 'sign') return !(v && v.name);
    if (it.type === 'check') return !v;
    return false;
  }

  /* ---- 입력 화면 생성 --------------------------------------------------- */
  function workerPool(ctx, values, items) {
    var pId = ctx.partner || null;
    items.forEach(function (it) { if (it.type === 'partner' && values[it.id]) pId = values[it.id]; });
    return DB.S.workers.filter(function (w) {
      if (pId) return w.partner === pId;
      var p = DB.partner(w.partner);
      return !ctx.site || p.sites.indexOf(ctx.site) >= 0;
    });
  }
  function control(it, v, ctx, values, items) {
    var ro = ctx.readonly, n = 'name="' + it.id + '" aria-label="' + h(it.label) + '"' + (it.req ? ' aria-required="true"' : ''), dis = ro ? ' disabled' : '';
    switch (it.type) {
      case 'text': return '<input class="in" type="text" ' + n + ' value="' + h(v || '') + '"' + dis + '>';
      case 'phone': return '<input class="in" type="tel" inputmode="tel" placeholder="010-0000-0000" ' + n + ' value="' + h(v || '') + '"' + dis + '>';
      case 'textarea': return '<textarea class="in" rows="2" ' + n + dis + '>' + h(v || '') + '</textarea>';
      case 'number': return '<input class="in" type="text" inputmode="decimal" ' + n + ' value="' + h(v == null ? '' : v) + '"' + dis + '>';
      case 'date': return '<input class="in" type="date" ' + n + ' value="' + h(v || '') + '"' + dis + '>';
      case 'time': return '<input class="in" type="time" ' + n + ' value="' + h(v || '') + '"' + dis + '>';
      case 'select':
        return '<select class="in" ' + n + dis + '><option value="">선택</option>' + it.opts.map(function (o) {
          return '<option' + (o === v ? ' selected' : '') + '>' + h(o) + '</option>';
        }).join('') + '</select>';
      case 'partner':
        var ps = DB.S.partners.filter(function (p) { return !ctx.site || p.sites.indexOf(ctx.site) >= 0; });
        if (ctx.partner) ps = ps.filter(function (p) { return p.id === ctx.partner; });
        return '<select class="in" ' + n + dis + ' data-refresh="1"><option value="">선택</option>' + ps.map(function (p) {
          return '<option value="' + p.id + '"' + (p.id === v ? ' selected' : '') + '>' + h(p.name) + '</option>';
        }).join('') + '</select>';
      case 'multi':
        return '<div class="chips">' + it.opts.map(function (o) {
          var on = (v || []).indexOf(o) >= 0;
          return '<label class="chip' + (on ? ' on' : '') + '"><input type="checkbox" ' + n + ' value="' + h(o) + '"' + (on ? ' checked' : '') + dis + '><span>' + h(o) + '</span></label>';
        }).join('') + '</div>';
      case 'yesno':
        return '<div class="chips">' + ['예', '아니오'].map(function (o) {
          return '<label class="chip' + (v === o ? ' on' : '') + '"><input type="radio" ' + n + ' value="' + o + '"' + (v === o ? ' checked' : '') + dis + '><span>' + o + '</span></label>';
        }).join('') + '</div>';
      case 'check':
        return '<label class="chk1"><input type="checkbox" ' + n + (v ? ' checked' : '') + dis + '><span>' + h(it.label) + '</span></label>';
      case 'workers':
        var sel = {}; (v || []).forEach(function (x) { sel[x.wid] = x; });
        var pool = workerPool(ctx, values, items);
        if (ro) pool = pool.filter(function (w) { return sel[w.id]; });
        if (!pool.length) return '<p class="muted sm">' + (ro ? '선택된 작업자가 없습니다' : '협력업체를 먼저 선택하면 작업자 목록이 나옵니다') + '</p>';
        return '<div class="wl" data-wl="' + it.id + '">' + pool.map(function (w) {
          var s = sel[w.id], exp = w.eduUntil < DB.ymd(new Date());
          return '<div class="wl-r' + (s ? ' on' : '') + '" data-wid="' + w.id + '">' +
            '<label class="wl-n"><input type="checkbox" data-pick' + (s ? ' checked' : '') + dis + '><b>' + h(w.name) + '</b><i>' + h(w.trade) + ' · ' + h(DB.partner(w.partner).name) + '</i>' +
            (exp ? '<em class="tag warn">교육 만료</em>' : '') + '</label>' +
            '<label class="wl-ok"><input type="checkbox" data-ok' + (s && s.ok ? ' checked' : '') + (s ? '' : ' disabled') + dis + '><span>본인 확인</span></label></div>';
        }).join('') + '</div>';
      case 'photo':
        var ph = v || [];
        return '<div class="ph" data-ph="' + it.id + '">' + ph.map(function (p, i) {
          return '<figure class="ph-i"><img src="' + photoUrl(p) + '" alt="' + h(p.name || p.seed || '사진') + '">' + (ro ? '' : '<button type="button" class="ph-x" data-phx="' + i + '" aria-label="사진 삭제">×</button>') + '</figure>';
        }).join('') + (ro ? (ph.length ? '' : '<p class="muted sm">첨부 없음</p>') :
          '<label class="ph-add"><input type="file" accept="image/*" data-phf hidden><span>＋ 사진</span></label><button type="button" class="ph-add sm" data-phs>＋ 샘플</button>') + '</div>';
      case 'sign':
        if (v && v.name) return '<div class="sig on"><b>' + h(v.name) + '</b><span>' + h(v.at) + '</span>' + (ro ? '' : '<button type="button" class="lnk" data-sigx>취소</button>') + '</div>';
        return ro ? '<div class="sig"><span class="muted">미서명</span></div>' : '<button type="button" class="btn sm ghost" data-sig>확인 서명</button><span class="muted sm"> 서명자와 확인 시각이 기록됩니다</span>';
      default: return '';
    }
  }
  function render(items, values, ctx) {
    ctx = ctx || {}; values = values || {};
    var secs = [], by = {};
    items.forEach(function (it) {
      if (it.type === 'check' && it.opts && ctx.workType && it.opts.indexOf(ctx.workType) < 0) return;
      if (!by[it.sec]) { by[it.sec] = []; secs.push(it.sec); }
      by[it.sec].push(it);
    });
    return '<div class="fe" data-fe>' + secs.map(function (s) {
      return '<fieldset class="fe-sec"><legend>' + h(s) + '</legend>' + by[s].map(function (it) {
        var err = ctx.errors && ctx.errors[it.id];
        return '<div class="fi' + (err ? ' err' : '') + (it.type === 'check' ? ' fi-chk' : '') + '" role="group" aria-label="' + h(it.label) + '" data-item="' + it.id + '" data-type="' + it.type + '">' +
          (it.type === 'check' ? '' : '<div class="fi-l"><span>' + h(it.label) + (it.req ? '<b class="req" title="필수">*</b>' : '') + '</span>' + (ctx.showIds ? '<code>' + it.id + '</code>' : '') + '</div>') +
          '<div class="fi-c">' + control(it, values[it.id], ctx, values, items) + '</div>' +
          (err ? '<p class="fi-e">' + h(err) + '</p>' : '') + '</div>';
      }).join('') + '</fieldset>';
    }).join('') + '</div>';
  }

  /* ---- 화면에서 값 읽기 -------------------------------------------------- */
  function read(root, items, prev) {
    var out = {};
    prev = prev || {};
    items.forEach(function (it) {
      var box = root.querySelector('[data-item="' + it.id + '"]');
      if (!box) { if (prev[it.id] !== undefined) out[it.id] = prev[it.id]; return; }
      switch (it.type) {
        case 'multi':
          out[it.id] = Array.prototype.map.call(box.querySelectorAll('input:checked'), function (x) { return x.value; }); break;
        case 'yesno':
          var c = box.querySelector('input:checked'); out[it.id] = c ? c.value : ''; break;
        case 'check':
          out[it.id] = !!box.querySelector('input:checked'); break;
        case 'workers':
          out[it.id] = Array.prototype.filter.call(box.querySelectorAll('.wl-r'), function (r) { return r.querySelector('[data-pick]').checked; })
            .map(function (r) { return { wid: r.getAttribute('data-wid'), ok: r.querySelector('[data-ok]').checked }; });
          if (!box.querySelector('.wl') && prev[it.id]) out[it.id] = prev[it.id];
          break;
        case 'photo': case 'sign':
          out[it.id] = prev[it.id] !== undefined ? prev[it.id] : (it.type === 'photo' ? [] : { name: '', at: '' }); break;
        case 'number':
          var nv = box.querySelector('[name]').value.trim(); out[it.id] = nv === '' ? '' : (isFinite(+nv) ? +nv : nv); break;
        default:
          var el = box.querySelector('[name]'); out[it.id] = el ? el.value.trim() : '';
      }
    });
    return out;
  }

  /* ---- 저장 검증 — 임시저장: 형식만 / 제출: 필수·형식·선택지 ---------------- */
  function validate(items, values, mode) {
    var e = {};
    items.forEach(function (it) {
      var v = values[it.id];
      if (empty(it, v)) {
        if (mode === 'submit' && it.req) e[it.id] = '필수 항목입니다';
        return;
      }
      switch (it.type) {
        case 'number': if (typeof v !== 'number' || v < 0) e[it.id] = '0 이상의 숫자로 입력해 주세요'; break;
        case 'date': if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) e[it.id] = '날짜 형식이 아닙니다'; break;
        case 'time': if (!/^\d{2}:\d{2}$/.test(v)) e[it.id] = '시각 형식이 아닙니다'; break;
        case 'phone': if (!/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(v)) e[it.id] = '전화번호 형식(010-0000-0000)으로 입력해 주세요'; break;
        case 'select': if (it.opts.indexOf(v) < 0) e[it.id] = '선택지에 없는 값입니다'; break;
        case 'multi': if (v.some(function (x) { return it.opts.indexOf(x) < 0; })) e[it.id] = '선택지에 없는 값이 있습니다'; break;
        case 'workers': if (mode === 'submit' && v.some(function (x) { return !x.ok; })) e[it.id] = '선택한 작업자 전원의 본인 확인이 필요합니다'; break;
      }
    });
    if (mode === 'submit') {
      var a = values['REQ-01'], b = values['REQ-02'];
      if (a && b && a > b) e['REQ-02'] = '종료일이 시작일보다 빠릅니다';
    }
    return e;
  }

  /* ---- 엑셀 출력 --------------------------------------------------------- */
  var C = function (v, s) { return { v: v, s: s }; };
  function metaRows(doc, f, def) {
    var st = DB.site(doc.site), p = doc.partner ? DB.partner(doc.partner) : null;
    return [
      [C('서류 번호', 4), C(doc.id + (doc.rev > 1 ? ' (' + doc.rev + '차)' : ''), 3), C('양식', 4), C(f.id + ' v' + def.v, 3)],
      [C('현장', 4), C(st ? st.name : '', 3), C('협력업체', 4), C(p ? p.name : '—', 3)],
      [C('상태', 4), C(DB.DOC_STATUS[doc.status], 3), C('작성자', 4), C(doc.author, 3)],
      [C('제출 시각', 4), C(doc.submittedAt || '—', 3), C('확인', 4), C(doc.confirmedBy ? doc.confirmedBy + ' · ' + doc.confirmedAt : '—', 3)]
    ];
  }
  /* 항목 표 형식 — 정의서 순서 그대로, 항목 ID별 위치를 함께 돌려준다 */
  function itemSheet(doc, opt) {
    var f = DB.form(doc.formId), def = DB.formVer(doc.formId, doc.ver);
    var rows = [[C(f.name, 1)], [C('가온케미칼 (가상 고객사) · 작업안전 통합관리 · 출력 ' + DB.stamp(), 5)], []];
    rows = rows.concat(metaRows(doc, f, def));
    rows.push([]);
    rows.push([C('항목 ID', 2), C('항목', 2), C('값', 2), C('필수', 2)]);
    var map = {};
    def.items.forEach(function (it) {
      if (opt && opt.skip === it.id) return;            // QC 결함 주입 시연용
      rows.push([C(it.id, 6), C(it.label, 4), C(show(it, doc.values[it.id]), 3), C(it.req ? '필수' : '', 6)]);
      map[it.id] = 'C' + rows.length;
    });
    return { sheet: { name: f.short, cols: [12, 26, 54, 8], rows: rows, merges: ['A1:D1', 'A2:D2'] }, map: map };
  }
  /* 원본 서식 재현 — 대표 1종(TBM 일지): 병합 셀 · 결재란 */
  function tbmOriginal(doc, opt) {
    var f = DB.form(doc.formId), def = DB.formVer(doc.formId, doc.ver), v = doc.values;
    var it = {}; def.items.forEach(function (x) { it[x.id] = x; });
    function val(id) { return opt && opt.skip === id ? '' : show(it[id], v[id]); }
    var rows = [], merges = [], map = {};
    function put(r, cells) { rows[r - 1] = cells; }
    put(1, [C('작업 전 안전회의(TBM) 일지', 1), '', '', '', C('담당', 2), C('검토', 2), C('승인', 2)]);
    put(2, ['', '', '', '', C(doc.author || '', 6), C(doc.status === 'confirmed' ? doc.confirmedBy : '', 6), C('', 6)]);
    merges.push('A1:D2');
    put(3, [C('서류 번호 ' + doc.id + ' · 양식 ' + f.id + ' v' + def.v + ' · ' + (DB.site(doc.site) || {}).name, 5)]);
    merges.push('A3:G3');
    var grid = [
      ['작업 일자', 'TBM-01', '시작 시각', 'TBM-02'],
      ['작업 장소', 'TBM-03', '협력업체', 'TBM-05'],
      ['작업 내용', 'TBM-04'],
      ['주요 위험 요인', 'TBM-06'],
      ['안전 대책', 'TBM-07'],
      ['보호구 착용', 'TBM-08'],
      ['건강 이상자', 'TBM-09', '작업 중지 기준', 'TBM-14'],
      ['특이사항', 'TBM-10'],
      ['참석자 확인', 'TBM-11'],
      ['현장 사진', 'TBM-12'],
      ['작성자 서명', 'TBM-13']
    ];
    var r = 5;
    put(4, [C('구분', 2), C('내용', 2), '', '', '', '', '']); merges.push('B4:G4');
    grid.forEach(function (g) {
      if (g.length === 4) {
        var has2 = !!it[g[3]];
        put(r, [C(g[0], 4), C(val(g[1]), 3), '', C(has2 ? g[2] : '', 4), C(has2 ? val(g[3]) : '', 3), '', '']);
        merges.push('B' + r + ':C' + r, 'E' + r + ':G' + r);
        if (it[g[1]] && !(opt && opt.skip === g[1])) map[g[1]] = 'B' + r;
        if (has2 && !(opt && opt.skip === g[3])) map[g[3]] = 'E' + r;
      } else {
        put(r, [C(g[0], 4), C(val(g[1]), 3), '', '', '', '', '']);
        merges.push('B' + r + ':G' + r);
        if (it[g[1]] && !(opt && opt.skip === g[1])) map[g[1]] = 'B' + r;
      }
      r++;
    });
    put(r + 1, [C('※ 원본 서식 재현 출력(대표 1종). 항목 위치는 양식별 항목 대조표의 엑셀 위치와 같습니다.', 5)]);
    merges.push('A' + (r + 1) + ':G' + (r + 1));
    var heights = { 1: 22, 2: 30 };
    for (var k = 5; k < r; k++) heights[k] = 30;
    return { sheet: { name: '원본 서식', cols: [14, 18, 16, 14, 14, 14, 14], rows: rows, merges: merges, heights: heights }, map: map };
  }
  function excelFor(doc, opt) {
    var f = DB.form(doc.formId);
    var a = itemSheet(doc, opt);
    var sheets = [a.sheet], map = { table: a.map };
    if (f.original) { var b = tbmOriginal(doc, opt); sheets.unshift(b.sheet); map.original = b.map; }
    return { sheets: sheets, map: map };
  }
  function excelBytes(doc) { return G.FILES.xlsx(excelFor(doc).sheets); }
  function fileBase(doc) { return doc.id + '_' + DB.form(doc.formId).short.replace(/[\s()·]/g, '') + (doc.rev > 1 ? '_' + doc.rev + '차' : ''); }

  /* ---- 자동 대조 시험 (QC ②③) -------------------------------------------- */
  function sampleValue(it) {
    switch (it.type) {
      case 'text': return '시험 ' + it.id;
      case 'textarea': return '시험 입력 ' + it.id;
      case 'number': return 3;
      case 'date': return DB.dayStr(0);
      case 'time': return '07:30';
      case 'phone': return '010-1234-5678';
      case 'select': return it.opts[0];
      case 'multi': return [it.opts[0]];
      case 'yesno': return '예';
      case 'check': return true;
      case 'partner': return 'P1';
      case 'workers': return [{ wid: 'W01', ok: true }];
      case 'photo': return [{ seed: '시험' }];
      case 'sign': return { name: '시험자', at: DB.stamp() };
    }
    return '';
  }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function runQC(inject) {
    var host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:900px';
    document.body.appendChild(host);
    var results = DB.S.forms.map(function (f) {
      var def = DB.formCurrent(f.id);
      var vals = {}; def.items.forEach(function (it) { vals[it.id] = sampleValue(it); });
      host.innerHTML = render(def.items, vals, { site: 'S1', showIds: true });
      var onScreen = {}; Array.prototype.forEach.call(host.querySelectorAll('[data-item]'), function (n) { onScreen[n.getAttribute('data-item')] = true; });
      var back = read(host, def.items, vals);
      var doc = { id: 'QC-' + f.id, formId: f.id, ver: def.v, site: 'S1', partner: 'P1', status: 'submitted', rev: 1, values: back, author: '시험', submittedAt: DB.stamp() };
      var skip = inject && f.id === 'F-TBM' ? 'TBM-14' : null;
      var ex = f.check ? null : excelFor(doc, skip ? { skip: skip } : null);
      var items = def.items.map(function (it) {
        var scr = !!onScreen[it.id];
        var db = same(back[it.id], vals[it.id]);
        var xl = f.check ? null : !!(ex.map.table[it.id] && (!ex.map.original || ex.map.original[it.id] || !isOriginalItem(it.id)));
        var blk = true;
        if (it.req) { var bad = JSON.parse(JSON.stringify(vals)); bad[it.id] = it.type === 'photo' || it.type === 'multi' || it.type === 'workers' ? [] : it.type === 'sign' ? { name: '', at: '' } : it.type === 'check' ? false : ''; blk = !!validate(def.items, bad, 'submit')[it.id]; }
        var ok = scr && db && (xl === null || xl) && blk;
        return { id: it.id, label: it.label, req: it.req, scr: scr, db: db, xl: xl, xlCell: ex ? (ex.map.original && ex.map.original[it.id] ? ex.map.original[it.id] + ' · ' : '') + (ex.map.table[it.id] || '없음') : '—', blk: blk, ok: ok };
      });
      var fails = items.filter(function (x) { return !x.ok; }).length;
      return { formId: f.id, name: f.name, v: def.v, total: items.length, pass: items.length - fails, fails: fails, req: items.filter(function (x) { return x.req; }).length, items: items };
    });
    document.body.removeChild(host);
    var run = { at: DB.stamp(), by: DB.who(), inject: !!inject, ok: results.every(function (r) { return r.fails === 0; }), results: results,
      total: results.reduce(function (a, r) { return a + r.total; }, 0), pass: results.reduce(function (a, r) { return a + r.pass; }, 0) };
    DB.S.qcRuns.unshift({ at: run.at, by: run.by, inject: run.inject, ok: run.ok, total: run.total, pass: run.pass });
    if (DB.S.qcRuns.length > 20) DB.S.qcRuns.length = 20;
    DB.persist();
    return run;
  }
  var ORIG_IDS = ['TBM-01', 'TBM-02', 'TBM-03', 'TBM-04', 'TBM-05', 'TBM-06', 'TBM-07', 'TBM-08', 'TBM-09', 'TBM-10', 'TBM-11', 'TBM-12', 'TBM-13', 'TBM-14'];
  function isOriginalItem(id) { return ORIG_IDS.indexOf(id) >= 0; }

  G.FE = {
    h: h, TYPE_LABEL: TYPE_LABEL, render: render, read: read, validate: validate, show: show, empty: empty,
    seedPhoto: seedPhoto, photoUrl: photoUrl, shrink: shrink, excelFor: excelFor, excelBytes: excelBytes, fileBase: fileBase,
    runQC: runQC, sampleValue: sampleValue
  };
})(window);
