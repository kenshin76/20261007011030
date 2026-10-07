/* ==========================================================================
   ui.js — 앱 셸 · 해시 라우터 · 공통 부품(모달·토스트·상태 칩·차트)
   ========================================================================== */
(function (G) {
  'use strict';
  var DB = G.DB, h = G.FE.h;

  var ICON = {
    dash: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
    home: 'M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5',
    back: 'M10 6 4 12l6 6M4 12h16',
    works: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 14l2 2 4-4',
    permits: 'M12 3 4 6v6c0 5 3.4 8.3 8 9 4.6-.7 8-4 8-9V6zM9 12l2 2 4-4',
    docs: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6M9 9h2',
    emergency: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0',
    forms: 'M4 4h16v4H4zM4 12h7v8H4zM15 12h5M15 16h5M15 20h5',
    qc: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    alimtalk: 'M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5A8.5 8.5 0 1 1 21 12z',
    notices: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14',
    master: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    access: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2',
    audit: 'M12 8v4l3 3M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
    phone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM11 18h2',
    logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
    down: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    plus: 'M12 5v14M5 12h14',
    x: 'M18 6 6 18M6 6l12 12',
    menu: 'M3 6h18M3 12h18M3 18h18',
    check: 'M20 6 9 17l-5-5',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    refresh: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
    site: 'M3 21h18M5 21V8l5-3v16M10 21V11l9-4v14M14 13h2M14 17h2'
  };
  function icon(n, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICON[n] || '') + '"/></svg>'; }

  var NAV = [
    { sec: '운영' },
    { id: 'dash', label: '대시보드', icon: 'dash', roles: ['admin', 'manager', 'safety'] },
    { id: 'home', label: '내 현황', icon: 'home', roles: ['partner'] },
    { id: 'works', label: '작업 관리', icon: 'works', roles: ['admin', 'manager', 'safety', 'partner'] },
    { id: 'permits', label: '작업허가', icon: 'permits', roles: ['admin', 'manager', 'safety', 'partner'] },
    { id: 'docs', label: '안전 서류', icon: 'docs', roles: ['admin', 'manager', 'safety', 'partner'] },
    { id: 'emergency', label: '긴급작업', icon: 'emergency', roles: ['admin', 'manager', 'safety', 'partner'] },
    { sec: '양식 관리', roles: ['admin', 'safety'] },
    { id: 'forms', label: '서류 양식', icon: 'forms', roles: ['admin', 'safety'] },
    { id: 'qc', label: '양식 검증', icon: 'qc', roles: ['admin', 'safety'] },
    { sec: '소통' },
    { id: 'alimtalk', label: '알림톡 발송 이력', icon: 'alimtalk', roles: ['admin', 'manager', 'safety'] },
    { id: 'notices', label: '공지 · 비상연락망', icon: 'notices', roles: ['admin', 'manager', 'safety', 'partner'] },
    { sec: '관리' },
    { id: 'master', label: '현장 · 협력업체 · 작업자', icon: 'master', roles: ['admin', 'manager', 'safety'] },
    { id: 'master', label: '우리 작업자', icon: 'master', roles: ['partner'] },
    { id: 'access', label: '사용자 권한', icon: 'access', roles: ['admin'] },
    { id: 'audit', label: '감사 로그', icon: 'audit', roles: ['admin'] }
  ];
  var TITLES = {
    dash: '대시보드', home: '내 현황', works: '작업 관리', permits: '작업허가', docs: '안전 서류', emergency: '긴급작업', forms: '서류 양식',
    qc: '양식 검증', alimtalk: '알림톡 발송 이력', notices: '공지 · 비상연락망', master: '현장 · 협력업체 · 작업자', access: '사용자 권한', audit: '감사 로그'
  };

  var APP = { pages: {}, acts: {}, siteFilter: 'all', viewResetters: [] };
  var appEl, mainEl;
  var viewUid, viewData;
  function resetViewState() {
    modalStack.slice().reverse().forEach(function (m) { m.close(); });
    APP.acts = {}; APP.siteFilter = 'all';
    APP.viewResetters.forEach(function (reset) { reset(); });
    viewUid = DB.me() ? DB.me().id : null; viewData = DB.S;
  }
  function syncSession() {
    var uid = DB.me() ? DB.me().id : null;
    if (viewUid !== uid || viewData !== DB.S) resetViewState();
  }
  APP.resetViewState = resetViewState; APP.syncSession = syncSession;

  /* ---- 토스트 · 모달 ---------------------------------------------------- */
  function toast(msg, kind) {
    var box = document.getElementById('toasts');
    var t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = icon(kind === 'err' ? 'x' : kind === 'warn' ? 'emergency' : 'check') + '<span>' + msg + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 3600);
    setTimeout(function () { t.remove(); }, 4100);
  }
  var modalStack = [], modalBackground;
  function focusables(el) {
    return Array.prototype.filter.call(el.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'), function (x) {
      return !x.disabled && !x.hidden && x.getAttribute('tabindex') !== '-1' && x.type !== 'hidden' &&
        (!x.getClientRects || x.getClientRects().length > 0);
    });
  }
  function modal(o) {
    var root = document.getElementById('modal-root');
    var m = document.createElement('div');
    m.className = 'mdl-bg';
    m.innerHTML = '<div class="mdl ' + (o.cls || '') + '" role="dialog" aria-modal="true" tabindex="-1" aria-label="' + h(o.title || '') + '">' +
      (o.title ? '<div class="mdl-h"><h3>' + o.title + '</h3><button class="ib" data-mx aria-label="닫기">' + icon('x') + '</button></div>' : '') +
      '<div class="mdl-b">' + (o.body || '') + '</div>' + (o.foot ? '<div class="mdl-f">' + o.foot + '</div>' : '') + '</div>';
    root.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('on'); });
    var previousFocus = document.activeElement, closed = false;
    if (!modalStack.length) {
      var background = document.getElementById('app');
      modalBackground = { el: background, inert: background ? background.inert : false, overflow: document.body.style.overflow };
      if (background) background.inert = true;
      document.body.style.overflow = 'hidden';
    } else modalStack[modalStack.length - 1].el.inert = true;
    function close() {
      if (closed) return;
      closed = true; m.classList.remove('on'); m.inert = true;
      setTimeout(function () { m.remove(); }, 180);
      var index = modalStack.indexOf(api); if (index >= 0) modalStack.splice(index, 1);
      if (o.onClose) o.onClose();
      var top = modalStack[modalStack.length - 1];
      if (top) top.el.inert = false;
      else if (modalBackground) {
        if (modalBackground.el) modalBackground.el.inert = modalBackground.inert;
        document.body.style.overflow = modalBackground.overflow; modalBackground = null;
      }
      if (previousFocus && previousFocus.isConnected && (!top || top.el.contains(previousFocus))) previousFocus.focus();
      else if (top) top.el.focus();
    }
    m.addEventListener('click', function (e) {
      if (e.target === m || e.target.closest('[data-mx]')) { close(); return; }
      var a = e.target.closest('[data-ma]');
      if (a && o.acts && o.acts[a.getAttribute('data-ma')]) o.acts[a.getAttribute('data-ma')](a, m.querySelector('.mdl'), close, e);
    });
    var api = { el: m.querySelector('.mdl'), close: close };
    modalStack.push(api);
    m.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || modalStack[modalStack.length - 1] !== api) return;
      var fs = focusables(api.el), first = fs[0], last = fs[fs.length - 1], current = document.activeElement;
      if (!fs.length) { e.preventDefault(); api.el.focus(); return; }
      if (e.shiftKey && (current === first || current === api.el || !api.el.contains(current))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (current === last || current === api.el || !api.el.contains(current))) { e.preventDefault(); first.focus(); }
    });
    if (o.mount) o.mount(api.el, close);
    setTimeout(function () {
      if (closed || modalStack[modalStack.length - 1] !== api) return;
      var f = api.el.querySelector('[autofocus]') || focusables(api.el)[0] || api.el; f.focus();
    }, 60);
    return api;
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modalStack.length) modalStack[modalStack.length - 1].close(); });
  /* 사유 입력 (브라우저 대화상자 대신) */
  function ask(o, cb) {
    modal({
      title: o.title, cls: 'sm',
      body: (o.msg ? '<p class="mdl-msg">' + o.msg + '</p>' : '') + (o.input ? '<label class="fl"><span>' + (o.label || '사유') + (o.req ? ' <b class="req">*</b>' : '') + '</span><textarea class="in" rows="3" data-ask autofocus placeholder="' + h(o.ph || '') + '"></textarea></label><p class="fi-e" data-askerr hidden></p>' : ''),
      foot: '<button class="btn ghost" data-mx>취소</button><button class="btn ' + (o.danger ? 'danger' : 'pri') + '" data-ma="ok">' + (o.ok || '확인') + '</button>',
      acts: { ok: function (a, el, close) {
        var v = o.input ? el.querySelector('[data-ask]').value.trim() : '';
        if (o.req && !v) { var e = el.querySelector('[data-askerr]'); e.hidden = false; e.textContent = (o.label || '사유') + '를 입력해 주세요 — 필수 입력입니다'; return; }
        close(); cb(v);
      } }
    });
  }

  /* ---- 공통 표시 부품 ---------------------------------------------------- */
  var PILL = {
    registered: 'gray', assigned: 'amber', working: 'blue', reported: 'violet', done: 'green', cancelled: 'gray',
    submitted: 'blue', reviewing: 'amber', supplement: 'orange', approved: 'green', rejected: 'red',
    draft: 'gray', confirmed: 'green', received: 'red', acting: 'amber', closed: 'green',
    delivered: 'green', accepted: 'blue', requested: 'blue', retrying: 'amber', failed: 'red', unknown: 'orange'
  };
  var TALK = { delivered: '전달 완료', accepted: '대행사 접수', requested: '발송 요청', retrying: '재발송 중', failed: '최종 실패', unknown: '결과 미확인' };
  function pill(st, label) { return '<span class="pill ' + (PILL[st] || 'gray') + '">' + h(label) + '</span>'; }
  function wpill(w) { return pill(w.status, DB.WORK_STATUS[w.status]); }
  function ppill(p) { return pill(p.status, DB.PERMIT_STATUS[p.status]); }
  function dpill(d) { return pill(d.status, DB.DOC_STATUS[d.status]); }
  function tpill(a) { return pill(a.result, TALK[a.result] || a.result); }
  function empty(msg) { return '<div class="empty">' + icon('docs') + '<p>' + msg + '</p></div>'; }
  function siteName(id) { var s = DB.site(id); return s ? s.name : id; }
  function partnerName(id) { var p = DB.partner(id); return p ? p.name : '—'; }
  function hhmm(s) { return s ? s.slice(11, 16) : ''; }
  function mmdd(s) { return s ? s.slice(5, 10).replace('-', '.') : ''; }
  function relDay(s) {
    var d = s.slice(0, 10), t = DB.dayStr(0);
    if (d === t) return '오늘 ' + hhmm(s);
    if (d === DB.dayStr(-1)) return '어제 ' + hhmm(s);
    if (d === DB.dayStr(1)) return '내일 ' + hhmm(s);
    return mmdd(s) + ' ' + hhmm(s);
  }
  function siteOk(o) { return APP.siteFilter === 'all' || !o.site || o.site === APP.siteFilter; }

  /* 막대 차트 (SVG) — series: [{name, cls, values}] */
  function bars(labels, series, opt) {
    opt = opt || {};
    var W = 560, H = opt.h || 210, pl = 30, pb = 26, pt = 12, max = 1;
    labels.forEach(function (l, i) { var s = 0; series.forEach(function (se) { s += se.values[i]; }); max = Math.max(max, s); });
    max = Math.ceil(max / 2) * 2 || 2;
    var cw = (W - pl - 10) / labels.length, bw = Math.min(30, cw * .52);
    var g = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + h(opt.label || '') + '">';
    for (var k = 0; k <= 4; k++) {
      var y = pt + (H - pt - pb) * (1 - k / 4);
      g += '<line class="gl" x1="' + pl + '" x2="' + (W - 6) + '" y1="' + y + '" y2="' + y + '"/><text class="ax" x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round(max * k / 4) + '</text>';
    }
    labels.forEach(function (l, i) {
      var x = pl + cw * i + (cw - bw) / 2, acc = 0;
      series.forEach(function (se) {
        var v = se.values[i]; if (!v) return;
        var bh = (H - pt - pb) * v / max, y = H - pb - (H - pt - pb) * acc / max - bh;
        g += '<rect class="b ' + se.cls + '" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="3"><title>' + h(l + ' · ' + se.name + ' ' + v) + '</title></rect>';
        acc += v;
      });
      g += '<text class="ax" x="' + (x + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + h(l) + '</text>';
    });
    return g + '</svg>' + '<div class="legend">' + series.map(function (se) { return '<span><i class="' + se.cls + '"></i>' + h(se.name) + '</span>'; }).join('') + '</div>';
  }
  function ring(pct, label) {
    var r = 26, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<svg class="ring" viewBox="0 0 64 64" aria-label="' + h(label || '') + '"><circle cx="32" cy="32" r="' + r + '" class="rt"/><circle cx="32" cy="32" r="' + r + '" class="rv" style="stroke-dasharray:' + c + ';stroke-dashoffset:' + off + '"/><text x="32" y="36" text-anchor="middle">' + Math.round(pct) + '%</text></svg>';
  }
  /* 상태 단계 표시 */
  function stepper(steps, cur) {
    return '<ol class="stp">' + steps.map(function (s, i) {
      var st = i < cur ? 'done' : i === cur ? 'cur' : '';
      return '<li class="' + st + '"><i>' + (i < cur ? icon('check') : (i + 1)) + '</i><span>' + s + '</span></li>';
    }).join('') + '</ol>';
  }

  /* ---- 라우터 · 셸 ------------------------------------------------------- */
  function parse() {
    var hsh = location.hash.replace(/^#\/?/, '');
    var parts = hsh.split('/').filter(Boolean).map(decodeURIComponent);
    return { page: parts[0] || '', args: parts.slice(1) };
  }
  function go(path) { if (location.hash === '#/' + path) route(); else location.hash = '#/' + path; }
  function allowed(page, u) {
    var items = NAV.filter(function (n) { return n.id === page; });
    if (!items.length) return true;
    return items.some(function (n) { return n.roles.indexOf(u.role) >= 0; });
  }
  function homeOf(u) { return u.role === 'partner' ? 'home' : 'dash'; }

  function shell(u, page) {
    var navHtml = '', lastSec = null;
    NAV.forEach(function (n) {
      if (n.sec) { if (!n.roles || n.roles.indexOf(u.role) >= 0) lastSec = n.sec; return; }
      if (n.roles.indexOf(u.role) < 0) return;
      if (lastSec) { navHtml += '<div class="nv-sec">' + lastSec + '</div>'; lastSec = null; }
      var badge = '';
      if (n.id === 'emergency') { var c = DB.filterScope(DB.S.emergencies).filter(function (e) { return e.status !== 'closed'; }).length; if (c) badge = '<b class="nv-b red">' + c + '</b>'; }
      if (n.id === 'permits' && (u.role === 'safety' || u.role === 'admin')) { var pc = DB.filterScope(DB.S.permits).filter(function (p) { return p.status === 'submitted' || p.status === 'reviewing'; }).length; if (pc) badge = '<b class="nv-b">' + pc + '</b>'; }
      navHtml += '<a class="nv' + (page === n.id ? ' on' : '') + '" href="#/' + n.id + '">' + icon(n.icon) + '<span>' + n.label + '</span>' + badge + '</a>';
    });
    var sites = u.sites.map(function (s) { return '<option value="' + s + '"' + (APP.siteFilter === s ? ' selected' : '') + '>' + h(siteName(s)) + '</option>'; }).join('');
    var openE = DB.filterScope(DB.S.emergencies).filter(function (e) { return e.status !== 'closed'; });
    appEl.innerHTML =
      '<div class="lay">' +
      '<aside class="sb" id="sb">' +
        '<a class="brand" href="#/' + homeOf(u) + '"><span class="logo">' + logo() + '</span><span><b>작업안전 통합관리</b><i>가온케미칼 · 현장 운영</i></span></a>' +
        '<nav class="nvs" aria-label="주 메뉴">' + navHtml + '</nav>' +
        '<a class="sb-m" href="#/m">' + icon('phone') + '<span><b>작업자 작업 확인</b><i>배정된 작업 · 안전 확인</i></span></a>' +
        '<div class="sb-f">체험 환경 · 가상 데이터</div>' +
      '</aside>' +
      '<div class="mn">' +
        '<header class="tb">' +
          '<button class="ib only-m" data-act="nav" aria-label="메뉴">' + icon('menu') + '</button>' +
          '<div class="tb-t"><h1>' + (TITLES[page] || '') + '</h1></div>' +
          '<label class="scope">' + icon('site') + '<select data-scope aria-label="현장 범위">' +
            (u.sites.length > 1 ? '<option value="all"' + (APP.siteFilter === 'all' ? ' selected' : '') + '>허용된 전체 현장 (' + u.sites.length + ')</option>' : '') + sites + '</select></label>' +
          (openE.length ? '<a class="tb-emg" href="#/emergency">' + icon('emergency') + '<span>긴급 ' + openE.length + '</span></a>' : '') +
          '<a class="ib to-main-ic" href="../index.html" aria-label="제안 자료 메인으로" title="메인으로">' + icon('home') + '</a>' +
          '<button type="button" class="who" data-act="who" aria-label="계정 메뉴"><span class="av">' + h(u.name.slice(0, 1)) + '</span><span class="who-t"><b>' + h(u.name) + '</b><i>' + h(u.title) + '</i></span><span class="role r-' + u.role + '">' + DB.ROLES[u.role] + '</span></button>' +
        '</header>' +
        '<main class="pg" id="pg"></main>' +
      '</div></div><div class="sb-dim" data-act="nav"></div>';
    mainEl = document.getElementById('pg');
    if (!DB.storageOk()) toast('브라우저 저장 공간을 쓸 수 없어 변경 내용이 새로고침 후 유지되지 않습니다', 'warn');
  }
  function logo() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 4 7v8c0 7.2 5 12.6 12 15 7-2.4 12-7.8 12-15V7z" fill="#52C6BA"/><path d="M10.5 16.5l3.8 3.8 7.4-8" fill="none" stroke="#102B30" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function route() {
    syncSession();
    var r = parse();
    var u = DB.me();
    document.body.classList.toggle('is-m', r.page === 'm');
    if (r.page === 'm') { G.MOBILE.render(appEl, r.args); window.scrollTo(0, 0); return; }
    if (!u) { if (r.page !== 'login') { location.replace('#/login'); } APP.pages.login(appEl); return; }
    if (r.page === 'login' || !r.page) { location.replace('#/' + homeOf(u)); return; }
    if (APP.siteFilter !== 'all' && u.sites.indexOf(APP.siteFilter) < 0) APP.siteFilter = 'all';
    if (u.sites.length === 1) APP.siteFilter = u.sites[0];
    shell(u, r.page);
    APP.acts = {};
    if (!APP.pages[r.page]) { mainEl.innerHTML = empty('없는 화면입니다'); return; }
    if (!allowed(r.page, u)) {
      DB.audit('권한 거부', '화면 접근 #/' + r.page, '거부 403'); DB.persist();
      mainEl.innerHTML = deny('이 화면은 ' + DB.ROLES[u.role] + ' 역할에 허용되지 않습니다.');
      return;
    }
    try { APP.pages[r.page](mainEl, r.args); }
    catch (e) { mainEl.innerHTML = '<div class="empty"><p>화면을 그리는 중 오류가 발생했습니다.</p><pre>' + h(e.message) + '</pre></div>'; console.error(e); }
    mainEl.classList.remove('pg-in'); void mainEl.offsetWidth; mainEl.classList.add('pg-in');
    document.body.classList.remove('nav-open');
    window.scrollTo(0, 0);
  }
  function deny(msg) {
    return '<div class="deny"><div class="deny-c">' + icon('lock') + '<h2>403 · 접근 권한이 없습니다</h2><p>' + h(msg) + '</p>' +
      '<p class="muted sm">현재 계정에 허용된 업무와 소속 범위를 확인해 주세요. 접근 거부 내역은 감사 로그에 기록됩니다.</p>' +
      '<a class="btn ghost" href="#/' + homeOf(DB.me()) + '">처음 화면으로</a></div></div>';
  }
  function rerender() { route(); }

  /* ---- 전역 이벤트 ------------------------------------------------------ */
  function onClick(e) {
    var a = e.target.closest('[data-act]');
    if (!a || !appEl.contains(a)) return;
    var k = a.getAttribute('data-act');
    if (k === 'nav') { document.body.classList.toggle('nav-open'); return; }
    if (k === 'who') { whoMenu(); return; }
    if (APP.acts[k]) APP.acts[k](a, e);
  }
  function whoMenu() {
    var u = DB.me();
    modal({ title: '계정 정보', cls: 'sm account-modal', body:
      '<div class="account-profile"><span class="av av-lg" aria-hidden="true">' + h(u.name.slice(0, 1)) + '</span><div><b>' + h(u.name) + '</b><p>' + h(u.title) + '</p></div></div>' +
      '<dl class="account-details"><div><dt>업무 영역</dt><dd>' + h(DB.ROLES[u.role]) + '</dd></div>' +
      '<div><dt>이메일</dt><dd>' + h(u.email) + '</dd></div>' +
      (u.partner ? '<div><dt>소속 협력업체</dt><dd>' + h(partnerName(u.partner)) + '</dd></div>' : '') +
      '<div><dt>허용 현장</dt><dd>' + u.sites.map(function (s) { return '<span class="account-tag">' + h(siteName(s)) + '</span>'; }).join('') + '</dd></div>' +
      (u.approve ? '<div><dt>작업 시작 승인 범위</dt><dd>' + u.approve.map(function (p) { return '<span class="account-tag">' + h(partnerName(p)) + '</span>'; }).join('') + '</dd></div>' : '') + '</dl>',
      foot: '<button class="btn ghost" data-ma="reset">체험 데이터 초기화</button><button class="btn pri" data-ma="out">' + icon('logout') + ' 로그아웃</button>',
      acts: {
        out: function (a, el, close) { DB.audit('로그아웃', u.email); DB.S.session = null; DB.persist(); close(); resetViewState(); go('login'); },
        reset: function (a, el, close) { close(); ask({ title: '체험 데이터 초기화', msg: '이 프로토타입에서 변경한 내용을 모두 지우고 처음 상태로 돌아갑니다.', ok: '초기화', danger: true }, function () { DB.reset(); resetViewState(); toast('체험 데이터를 초기화했습니다'); go('login'); }); }
      } });
  }

  APP.start = function () {
    appEl = document.getElementById('app');
    DB.load();
    appEl.addEventListener('click', onClick);
    appEl.addEventListener('change', function (e) {
      if (e.target.matches('[data-scope]')) { APP.siteFilter = e.target.value; rerender(); return; }
      var a = e.target.closest('[data-chg]');
      if (a && APP.acts[a.getAttribute('data-chg')]) APP.acts[a.getAttribute('data-chg')](a, e);
    });
    window.addEventListener('hashchange', route);
    /* 알림톡: 대행사 접수 → 전달 완료 (시연) */
    setInterval(function () { if (DB.settleTalks() && parse().page === 'alimtalk') rerender(); }, 6000);
    route();
  };

  APP.go = go; APP.route = route; APP.rerender = rerender; APP.toast = toast; APP.modal = modal; APP.ask = ask; APP.icon = icon; APP.deny = deny;
  APP.pill = pill; APP.wpill = wpill; APP.ppill = ppill; APP.dpill = dpill; APP.tpill = tpill; APP.TALK = TALK; APP.empty = empty;
  APP.siteName = siteName; APP.partnerName = partnerName; APP.hhmm = hhmm; APP.mmdd = mmdd; APP.relDay = relDay; APP.siteOk = siteOk;
  APP.bars = bars; APP.ring = ring; APP.stepper = stepper; APP.logo = logo; APP.homeOf = homeOf; APP.mainEl = function () { return mainEl; };
  G.APP = APP;
})(window);
