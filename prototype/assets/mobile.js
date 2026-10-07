/* ==========================================================================
   mobile.js — 작업자 모바일 웹 (앱 설치 없이 알림톡 링크로 진입)
   ① 진입(만료형 서명 링크 검사) ② 간편 확인(뒤 4자리, 5회 잠금) ③ 작업 내용 ④ 안전 점검 ⑤ 개인 승인 ⑦ 완료 보고
   ========================================================================== */
(function (G) {
  'use strict';
  var DB = G.DB, FE = G.FE, APP = G.APP, h = FE.h, I = APP.icon;
  var M = { ok: {}, step: {}, noticeOk: {}, picks: {}, report: {}, hubWorker: null };
  APP.viewResetters.push(function () { M.ok = {}; M.step = {}; M.noticeOk = {}; M.picks = {}; M.report = {}; M.hubWorker = null; });

  function device() {
    var ua = navigator.userAgent;
    var os = /iPhone|iPad/.test(ua) ? 'iPhone' : /Android/.test(ua) ? 'Android' : 'PC';
    return os + ' · ' + (/KAKAOTALK/i.test(ua) ? '카카오톡 인앱' : os === 'PC' ? '브라우저 (시연)' : '모바일 브라우저');
  }
  function frame(inner, side) {
    return '<div class="m-stage"><div class="phone"><div class="ph-scr" id="mscr">' + inner + '</div></div></div>';
  }
  function sideBase(extra) {
    var u = DB.me();
    return '<a class="m-back" href="#/' + (u ? APP.homeOf(u) : 'login') + '">← ' + (u ? '관리자 화면으로' : '로그인 화면으로') + '</a>' +
      '<p class="eyebrow">작업자 모바일 웹 · 시연</p><h2>앱 설치 없이<br>알림톡 링크 한 번으로</h2>' + (extra || '');
  }

  /* ---- 허브 — 작업자가 받은 알림톡 ----------------------------------------- */
  function hub(root) {
    var active = [];
    DB.S.works.forEach(function (w) {
      if (['assigned', 'working'].indexOf(w.status) < 0) return;
      w.workers.forEach(function (wid) { var l = w.links[wid]; if (l && !l.revoked) active.push({ w: w, wid: wid, l: l }); });
    });
    var ws = []; active.forEach(function (a) { if (ws.indexOf(a.wid) < 0) ws.push(a.wid); });
    if (!M.hubWorker || ws.indexOf(M.hubWorker) < 0) M.hubWorker = ws.indexOf('W05') >= 0 ? 'W05' : ws[0];
    var mine = active.filter(function (a) { return a.wid === M.hubWorker; });
    var wk = DB.worker(M.hubWorker);
    var inner =
      '<div class="kk"><div class="kk-top"><b>받은 작업</b><i>가온케미칼 안전관리</i></div><div class="kk-list">' +
      (mine.length ? mine.map(function (a) {
        var done = DB.checkValid(a.w, a.wid);
        return '<div class="kk-day">' + APP.relDay(a.w.history[1] ? a.w.history[1].at : a.w.start).split(' ')[0] + '</div>' +
          '<div class="kk-msg"><span class="kk-av">' + APP.logo() + '</span><div class="kk-card"><div class="kk-ch">알림톡 도착</div><div class="kk-cb">' +
          '<p><b>[작업 배정] ' + h(APP.siteName(a.w.site)) + ' ' + h(a.w.title) + '</b></p>' +
          '<p>일시: ' + a.w.start + '<br>위치: ' + h(a.w.place) + '<br>위험 요인: ' + h(a.w.hazards.join(', ')) + '<br>착용 보호구: ' + h(a.w.ppe.join(', ')) + '</p>' +
          '<p>작업 전 아래 버튼을 눌러 안전 확인을 완료해 주세요. 링크는 ' + a.l.exp + '까지 유효합니다.</p>' +
          '<a class="kk-btn" href="#/m/' + a.l.token + '">작업 확인하기</a></div></div><span class="kk-t">' + APP.hhmm(a.w.history[1] ? a.w.history[1].at : a.w.start) + (done ? ' · 확인함' : '') + '</span></div>';
      }).join('') : '<p class="kk-empty">받은 알림톡이 없습니다</p>') + '</div></div>';
    var side = sideBase(
      '<p>작업관리자가 배정을 확정하면 작업자에게 <b>작업 내용 · 안전장비 · 확인 링크</b>가 담긴 알림톡이 갑니다. 아래에서 작업자를 골라 그 사람이 받은 알림톡을 열어 보세요.</p>' +
      '<label class="fl"><span>작업자 선택</span><select class="in" data-mw>' + ws.map(function (id) {
        var x = DB.worker(id); return '<option value="' + id + '"' + (id === M.hubWorker ? ' selected' : '') + '>' + h(x.name) + ' · ' + h(APP.partnerName(x.partner)) + '</option>';
      }).join('') + '</select></label>' +
      (wk ? '<p class="muted sm">시연 안내: 간편 확인 번호는 이 작업자 휴대전화 뒤 4자리 <b>' + wk.phone.slice(-4) + '</b>입니다.</p>' : '') +
      '<ul class="m-pts"><li>' + I('lock') + '<span><b>만료형 서명 링크</b>작업자·작업마다 다른 링크. 만료·취소·배정 변경을 서버가 검사</span></li>' +
      '<li>' + I('check') + '<span><b>필수 확인을 건너뛸 수 없음</b>필수 항목을 모두 체크해야 개인 승인 — 서버도 다시 검사</span></li>' +
      '<li>' + I('works') + '<span><b>전원 확인 전 시작 불가</b>작업관리자의 시작 승인은 전원 확인 후에만</span></li></ul>');
    var u = DB.me();
    var demo = '<div class="m-demo"><a href="#/' + (u ? APP.homeOf(u) : 'login') + '">← ' + (u ? '관리자 화면' : '로그인') + '</a><select data-mw aria-label="작업자 선택">' + ws.map(function (id) {
      var x = DB.worker(id); return '<option value="' + id + '"' + (id === M.hubWorker ? ' selected' : '') + '>작업자: ' + h(x.name) + '</option>';
    }).join('') + '</select>' + (wk ? '<span>체험 확인 번호 ' + wk.phone.slice(-4) + '</span>' : '') + '</div>';
    root.innerHTML = frame(demo + inner, side);
    root.querySelectorAll('[data-mw]').forEach(function (s) { s.addEventListener('change', function () { M.hubWorker = s.value; hub(root); }); });
  }

  /* ---- 링크 진입 ---------------------------------------------------------- */
  function page(root, token) {
    var v = DB.verifyLink(token);
    var f = v.f || DB.findLink(token);
    var side = sideBase(
      '<div class="m-chk"><b>서버가 이 링크에서 검사하는 것</b><ul>' +
      '<li>' + I('check') + ' 서명 · 유효기간 · 취소(재발급) 여부</li><li>' + I('check') + ' 현재 배정 상태 — 배정에서 빠지면 거부</li>' +
      '<li>' + I('check') + ' 휴대전화 뒤 4자리 — 5회 오류 시 잠금</li><li>' + I('check') + ' 필수 점검 항목 전부 체크 — 서버 재검사</li>' +
      '<li>' + I('check') + ' 확인 시각 · IP · 기기 · 확인한 내용 버전 기록</li></ul></div>' +
      '<p class="muted sm">뒤 4자리 확인은 간편 확인이며 실제 신원을 보장하지 않습니다. 링크와 번호가 함께 공유되면 대리 확인이 가능하다는 한계를 계약 전에 안내하고, 필요하면 일회용 인증번호 등 추가 인증을 승인 후 적용합니다.</p>' +
      '<div class="m-try"><b>시험해 보기</b><a class="btn ghost sm" href="#/m/' + h(token.slice(0, -3) + 'zzz') + '">URL 변조 링크 열기</a>' +
      (f ? '<a class="btn ghost sm" href="#/m">다른 작업자 알림톡</a>' : '') + '</div>' +
      (f && DB.me() ? '<a class="lnk" href="#/works/' + f.work.id + '">관리자 화면에서 ' + f.work.id + ' 보기 →</a>' : ''));
    var inner;
    if (!v.ok) inner = errScreen(v);
    else inner = flow(token, v.f);
    var u = DB.me();
    root.innerHTML = frame('<div class="ma"><div class="m-demo"><a href="#/m">← 받은 작업</a>' + (v.ok && f ? '<span>체험 확인 번호 ' + DB.worker(f.wid).phone.slice(-4) + '</span>' : '') + '</div>' + inner + '<div class="m-demo bottom"><a href="#/m">받은 작업 목록</a>' + (u && f ? '<a href="#/works/' + f.work.id + '">작업 관리</a>' : '') + '</div></div>', side);
    bind(root, token);
  }
  function errScreen(v) {
    var t = { invalid: '확인할 수 없는 링크', expired: '만료된 링크', revoked: '폐기된 링크', unassigned: '배정되지 않은 작업', locked: '링크 잠금', state: '아직 열 수 없는 작업' }[v.code] || '열 수 없는 링크';
    return '<div class="ma-err"><span class="ma-ei">' + I(v.code === 'locked' ? 'lock' : 'x') + '</span><h3>' + t + '</h3><p>' + h(v.msg) + '</p>' +
      '<p class="muted sm">요청을 거부하고 기록했습니다. 문제가 계속되면 작업관리자에게 연락해 주세요.</p>' + contacts(v.f ? v.f.work.site : 'S1') + '</div>';
  }
  function contacts(site) {
    return '<div class="ma-ct"><b>' + I('phone') + ' 비상연락망</b>' + DB.S.contacts.filter(function (c) { return c.site === site; }).slice(0, 4).map(function (c) {
      return '<a href="tel:' + c.tel.replace(/-/g, '') + '"><span>' + h(c.role) + ' · ' + h(c.name) + '</span><i>' + c.tel + '</i></a>';
    }).join('') + '</div>';
  }
  function head(w, sub) {
    return '<div class="ma-h"><span class="ma-logo">' + APP.logo() + '</span><div><b>' + h(w.title) + '</b><i>' + h(APP.siteName(w.site)) + ' · ' + (sub || w.start.slice(5)) + '</i></div></div>';
  }
  function bar(step) {
    var S = ['본인 확인', '작업 내용', '안전 점검', '완료'];
    return '<ol class="ma-st">' + S.map(function (s, i) { return '<li class="' + (i < step ? 'd' : i === step ? 'c' : '') + '"><i></i><span>' + s + '</span></li>'; }).join('') + '</ol>';
  }
  function mustNotices(w, wid) {
    var wk = DB.worker(wid), t = DB.dayStr(0);
    return DB.S.notices.filter(function (n) {
      return n.must && n.from <= t && n.to >= t && !(n.reads && n.reads[wid]) && (n.scope === 'all' || n.scope === w.site || n.scope === wk.partner);
    });
  }

  function flow(token, f) {
    var w = f.work, wid = f.wid, wk = DB.worker(wid);
    var confirmed = DB.checkValid(w, wid), old = w.checks[wid] && !confirmed;
    if (!M.ok[token]) {
      var l = w.links[wid];
      return head(w) + bar(0) +
        '<div class="ma-b"><p class="ma-hi">' + h(wk.name) + '님,<br>본인 확인을 위해 <b>휴대전화번호 뒤 4자리</b>를 입력해 주세요.</p>' +
        '<div class="worker-pin" data-pin><span></span><span></span><span></span><span></span></div>' +
        '<p class="ma-err-l" data-perr>' + (l.fails ? '번호가 맞지 않습니다 · ' + (5 - l.fails) + '회 남음' : '') + '</p>' +
        '<div class="kp">' + [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(function (k) { return k === '' ? '<span></span>' : '<button type="button" data-k="' + k + '">' + k + '</button>'; }).join('') + '</div></div>';
    }
    var notes = mustNotices(w, wid).filter(function (n) { return !M.noticeOk[token + n.id]; });
    if (notes.length && !confirmed) {
      var n = notes[0];
      return head(w) + bar(1) + '<div class="ma-b"><div class="ma-note"><em class="tag red">필독 공지</em><h4>' + h(n.title) + '</h4><p>' + h(n.body) + '</p></div>' +
        '<button class="mbtn" data-note="' + n.id + '">확인했습니다</button></div>';
    }
    if (confirmed) {
      var c = w.checks[wid];
      var others = w.workers.filter(function (x) { return DB.checkValid(w, x); }).length;
      if (w.status === 'working') return reportScreen(token, w, wid);
      if (w.status === 'reported' || w.status === 'done') return head(w) + '<div class="ma-b ma-done"><span class="ma-ok">' + I('check') + '</span><h3>' + (w.status === 'done' ? '작업이 종료되었습니다' : '완료 보고를 보냈습니다') + '</h3><p class="muted">' + h(w.report ? w.report.by + ' · ' + w.report.at : '') + '</p></div>' + contacts(w.site);
      return head(w) + bar(4) + '<div class="ma-b ma-done"><span class="ma-ok">' + I('check') + '</span><h3>안전 확인을 완료했습니다</h3>' +
        '<p>' + c.at + ' · 내용 v' + c.ver + '<br><span class="muted sm">' + h(c.device) + ' · IP ' + c.ip + '</span></p>' +
        '<div class="ma-prog"><b>동료 확인 ' + others + ' / ' + w.workers.length + '명</b><span class="mb"><i style="width:' + (others / w.workers.length * 100) + '%"></i></span></div>' +
        '<p class="ma-wait">모든 작업자의 <b>안전 확인</b>' + (DB.needsPermit(w) ? '과 <b>작업허가 승인</b>' : '') + '이 완료된 뒤, 작업관리자의 <b>시작 승인</b>을 기다려 주세요.</p>' +
        '<p class="muted sm">확인 기록은 수정할 수 없습니다. 잘못 확인했다면 작업관리자에게 재확인 요청을 받아 주세요.</p></div>' + contacts(w.site);
    }
    var step = M.step[token] || 1;
    if (step === 1) {
      var per = w.permitId ? DB.byId(DB.S.permits, w.permitId) : null;
      return head(w) + bar(1) + (old ? '<div class="ma-chg">' + I('emergency') + '<span>작업 내용이 바뀌었습니다 (v' + w.checks[wid].ver + ' → v' + w.ver + '). 바뀐 내용을 다시 확인해 주세요.</span></div>' : '') +
        '<div class="ma-b"><dl class="ma-kv"><dt>일시</dt><dd>' + w.start + '</dd><dt>위치</dt><dd>' + h(w.place) + '</dd><dt>작업</dt><dd>' + h(DB.WORK_TYPES[w.type].label) + (per ? ' · 허가 ' + per.id : '') + '</dd></dl>' +
        '<h4 class="ma-sh">위험 요인</h4><div class="ma-tags red">' + w.hazards.map(function (x) { return '<span>' + I('emergency') + h(x) + '</span>'; }).join('') + '</div>' +
        '<h4 class="ma-sh">착용해야 할 보호구</h4><div class="ma-tags">' + w.ppe.map(function (x) { return '<span>' + I('check') + h(x) + '</span>'; }).join('') + '</div>' +
        '<h4 class="ma-sh">안전 수칙</h4><p class="ma-rule">' + h(w.rules) + '</p>' +
        '<button class="mbtn" data-go="2">내용을 확인했습니다 ' + I('arrow') + '</button></div>';
    }
    var def = DB.formCurrent('F-CHK');
    var items = def.items.filter(function (it) { return it.type !== 'check' || !it.opts || it.opts.indexOf(w.type) >= 0; });
    var pk = M.picks[token] || {};
    var req = items.filter(function (it) { return it.req; });
    var done = req.filter(function (it) { return pk[it.id]; }).length;
    return head(w) + bar(2) +
      '<div class="ma-b"><p class="ma-hi">항목마다 직접 확인하고 체크해 주세요. <b>필수 ' + req.length + '개</b>를 모두 체크해야 완료할 수 있습니다.</p>' +
      '<div class="ma-cl">' + items.filter(function (it) { return it.type === 'check'; }).map(function (it) {
        return '<label class="ma-ci' + (pk[it.id] ? ' on' : '') + '"><input type="checkbox" data-ci="' + it.id + '"' + (pk[it.id] ? ' checked' : '') + '><i>' + I('check') + '</i><span>' + h(it.label) + (it.opts ? '<em>' + h(it.basis) + '</em>' : '') + '</span></label>';
      }).join('') + '</div>' +
      '<div class="ma-ph"><b>작업 전 현장 사진 (선택)</b><div class="ph">' + (pk.photo || []).map(function (p) { return '<figure class="ph-i"><img src="' + FE.photoUrl(p) + '" alt=""></figure>'; }).join('') +
      '<label class="ph-add"><input type="file" accept="image/*" capture="environment" hidden data-mph><span>＋ 촬영</span></label></div></div>' +
      '<div class="ma-prog"><b>필수 확인 ' + done + ' / ' + req.length + '</b><span class="mb"><i style="width:' + (done / req.length * 100) + '%"></i></span></div>' +
      '<button class="mbtn' + (done === req.length ? '' : ' off') + '" data-confirm' + (done === req.length ? '' : ' aria-disabled="true"') + '>' + I('check') + ' 안전 확인 완료 (개인 승인)</button>' +
      '<button class="mlnk" data-go="1">← 작업 내용 다시 보기</button></div>';
  }
  function reportScreen(token, w, wid) {
    var r = M.report[token] || { photos: [], note: '' };
    return head(w, '작업 중') + '<div class="ma-b"><div class="ma-live"><span></span>작업 중 — 시작 승인 ' + h((w.history.filter(function (x) { return x.what.indexOf('시작 승인') >= 0; }).pop() || {}).at || '') + '</div>' +
      '<h4 class="ma-sh">완료 보고</h4><div class="ph">' + r.photos.map(function (p) { return '<figure class="ph-i"><img src="' + FE.photoUrl(p) + '" alt=""></figure>'; }).join('') +
      '<label class="ph-add"><input type="file" accept="image/*" capture="environment" hidden data-rph><span>＋ 완료 사진</span></label><button class="ph-add sm" data-rs>＋ 샘플</button></div>' +
      '<textarea class="in" rows="3" data-rn placeholder="특이사항 (예: 주변 정리 완료, 잔재물 반출)">' + h(r.note) + '</textarea>' +
      '<button class="mbtn" data-rep>' + I('check') + ' 작업 완료 보고</button><p class="muted sm">완료 사진은 업로드할 때 축소해 저장합니다. 작업관리자가 완료를 확인하면 종료됩니다.</p></div>' + contacts(w.site);
  }

  function bind(root, token) {
    var scr = root.querySelector('#mscr');
    function redraw() { page(root, token); }
    scr.addEventListener('click', function (e) {
      var k = e.target.closest('[data-k]');
      if (k) {
        var pin = scr.querySelector('[data-pin]'); var cur = pin.getAttribute('data-v') || '';
        var key = k.getAttribute('data-k');
        cur = key === '⌫' ? cur.slice(0, -1) : (cur + key).slice(0, 4);
        pin.setAttribute('data-v', cur);
        Array.prototype.forEach.call(pin.children, function (s, i) { s.classList.toggle('on', i < cur.length); });
        if (cur.length === 4) {
          var r = DB.check4(token, cur);
          if (r.ok) { M.ok[token] = true; setTimeout(redraw, 160); }
          else if (r.locked) { setTimeout(redraw, 200); }
          else { pin.classList.add('shake'); scr.querySelector('[data-perr]').textContent = '번호가 맞지 않습니다 · ' + (5 - r.fails) + '회 남음'; setTimeout(function () { pin.classList.remove('shake'); pin.setAttribute('data-v', ''); Array.prototype.forEach.call(pin.children, function (s) { s.classList.remove('on'); }); }, 420); }
        }
        return;
      }
      var g = e.target.closest('[data-go]'); if (g) { M.step[token] = +g.getAttribute('data-go'); redraw(); return; }
      var n = e.target.closest('[data-note]');
      if (n) { var nt = DB.byId(DB.S.notices, n.getAttribute('data-note')); var f = DB.findLink(token); nt.reads = nt.reads || {}; nt.reads[f.wid] = DB.stamp(); DB.persist(); M.noticeOk[token + nt.id] = true; redraw(); return; }
      if (e.target.closest('[data-confirm]')) {
        var f2 = DB.findLink(token), w = f2.work;
        var def = DB.formCurrent('F-CHK');
        var items = def.items.filter(function (it) { return it.type !== 'check' || !it.opts || it.opts.indexOf(w.type) >= 0; });
        var pk = M.picks[token] || {};
        var vals = {}; items.forEach(function (it) { vals[it.id] = it.type === 'photo' ? (pk.photo || []) : !!pk[it.id]; });
        var err = FE.validate(items, vals, 'submit');               // 서버도 같은 정의로 다시 검사
        if (Object.keys(err).length) { APP.toast('필수 확인 ' + Object.keys(err).length + '개가 남았습니다. 모든 필수 항목을 확인해 주세요.', 'err'); return; }
        var r2 = DB.workerConfirm(token, { device: device(), items: vals, photo: (pk.photo || []).length });
        if (!r2.ok) { APP.toast(r2.msg || '확인할 수 없습니다', 'err'); redraw(); return; }
        M.picks[token] = {}; M.step[token] = 1; redraw(); return;
      }
      if (e.target.closest('[data-rs]')) { var r = M.report[token] || { photos: [], note: '' }; r.note = (scr.querySelector('[data-rn]') || {}).value || r.note; r.photos.push({ seed: '완료 사진 ' + (r.photos.length + 1) }); M.report[token] = r; redraw(); return; }
      if (e.target.closest('[data-rep]')) {
        var rr = M.report[token] || { photos: [], note: '' }; rr.note = scr.querySelector('[data-rn]').value.trim();
        if (!rr.photos.length) { APP.toast('완료 사진을 1장 이상 첨부해 주세요', 'err'); return; }
        var res = DB.workerReport(token, rr.note || '특이사항 없음', rr.photos);
        if (!res.ok) { APP.toast(res.msg || '보고할 수 없습니다', 'err'); return; }
        delete M.report[token]; APP.toast('완료 보고를 보냈습니다'); redraw();
      }
    });
    scr.addEventListener('change', function (e) {
      var ci = e.target.getAttribute('data-ci');
      if (ci) { M.picks[token] = M.picks[token] || {}; M.picks[token][ci] = e.target.checked; redraw(); return; }
      if (e.target.hasAttribute('data-mph') && e.target.files[0]) FE.shrink(e.target.files[0], function (p) { if (!p) return; M.picks[token] = M.picks[token] || {}; (M.picks[token].photo = M.picks[token].photo || []).push(p); redraw(); });
      if (e.target.hasAttribute('data-rph') && e.target.files[0]) FE.shrink(e.target.files[0], function (p) { if (!p) return; var r = M.report[token] || { photos: [], note: '' }; r.note = scr.querySelector('[data-rn]').value; r.photos.push(p); M.report[token] = r; redraw(); });
    });
  }

  G.MOBILE = {
    render: function (root, args) {
      if (!args[0]) hub(root); else page(root, args[0]);
    }
  };
})(window);
