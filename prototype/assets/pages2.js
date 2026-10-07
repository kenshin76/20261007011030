/* ==========================================================================
   pages2.js — 안전 서류 · 양식 정의서 · 자동 대조 시험 · 긴급작업 · 알림톡 · 공지 · 기준정보 · 권한 · 감사 로그
   ========================================================================== */
(function (G) {
  'use strict';
  var DB = G.DB, FE = G.FE, APP = G.APP, FILES = G.FILES, h = FE.h, I = APP.icon;
  var P = APP.pages;

  /* ====================================================================== */
  /* 안전 서류                                                               */
  /* ====================================================================== */
  var docF = { form: '', status: '', from: '', to: '' };
  var picked = {};
  var zipJobs = [], zipSeq = 0;
  APP.viewResetters.push(function () {
    docF = { form: '', status: '', from: '', to: '' }; picked = {}; formView = {};
    docDetail.ids = false; docDetail.errs = null; lastRun = null; qcOpen = {}; qcTab = 'run'; mapForm = 'F-TBM';
    talkF = ''; masterTab = 'workers'; tests = []; auditF = '';
    zipJobs.forEach(function (job) { job.cancelled = true; job.bytes = null; job.views = []; }); zipJobs = [];
  });
  P.docs = function (root, args) {
    APP.syncSession();
    if (args[0] === 'new') return newDoc(root, args[1]);
    if (args[0]) return docDetail(root, args[0]);
    var u = DB.me();
    if (!docF.from) { docF.from = DB.dayStr(-14); docF.to = DB.dayStr(0); }
    var forms = DB.S.forms.filter(function (f) { return !f.check; });
    var list = DB.filterScope(DB.S.docs).filter(APP.siteOk).filter(function (d) {
      var day = (d.submittedAt || d.createdAt).slice(0, 10);
      return (!docF.form || d.formId === docF.form) && (!docF.status || d.status === docF.status) && day >= docF.from && day <= docF.to;
    });
    var visible = {}; list.forEach(function (d) { visible[d.id] = true; });
    Object.keys(picked).forEach(function (id) { if (!visible[id]) delete picked[id]; });
    var nPick = list.filter(function (d) { return picked[d.id]; }).length;
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">서류를 작성·제출하고 확인 상태와 이력을 관리합니다.</p><h2>안전 서류</h2></div>' +
      '<div class="row"><button class="btn ghost" data-act="zip">' + I('down') + ' 조건으로 파일 묶음(ZIP)</button><button class="btn pri" data-act="new">' + I('plus') + ' 서류 작성</button></div></div>' +
      '<section class="card flat filt"><label class="fl"><span>양식</span><select class="in" data-chg="f" data-k="form"><option value="">전체 양식</option>' + forms.map(function (f) { return '<option value="' + f.id + '"' + (docF.form === f.id ? ' selected' : '') + '>' + h(f.name) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>상태</span><select class="in" data-chg="f" data-k="status"><option value="">전체 상태</option>' + Object.keys(DB.DOC_STATUS).map(function (k) { return '<option value="' + k + '"' + (docF.status === k ? ' selected' : '') + '>' + DB.DOC_STATUS[k] + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>기간 시작</span><input class="in" type="date" data-chg="f" data-k="from" value="' + docF.from + '"></label>' +
      '<label class="fl"><span>기간 끝</span><input class="in" type="date" data-chg="f" data-k="to" value="' + docF.to + '"></label>' +
      '<div class="fl"><span>선택 ' + nPick + '건</span><button class="btn ghost" data-act="dlPicked"' + (nPick ? '' : ' disabled') + '>' + I('down') + ' 선택 내려받기</button></div></section>' +
      '<section class="card flat">' + (list.length ? '<div class="tbl"><table><thead><tr><th class="ck"><input type="checkbox" data-act="pickAll" aria-label="전체 선택"></th><th>서류 번호</th><th>양식</th><th>현장</th><th>협력업체</th><th>작성자</th><th>제출 · 작성</th><th>상태</th><th></th></tr></thead><tbody>' +
        list.map(function (d) {
          var f = DB.form(d.formId), cur = DB.formCurrent(d.formId);
          return '<tr data-href="#/docs/' + d.id + '"><td class="ck"><input type="checkbox" data-pick="' + d.id + '"' + (picked[d.id] ? ' checked' : '') + ' aria-label="' + d.id + ' 선택"></td><td class="mono">' + d.id + (d.rev > 1 ? ' <em class="tag">' + d.rev + '차</em>' : '') + '</td><td><b>' + h(f.name) + '</b> <span class="muted sm">v' + d.ver + (d.ver !== cur.v ? ' (현재 v' + cur.v + ')' : '') + '</span>' + (d.permitId ? ' <em class="tag">' + d.permitId + '</em>' : '') + '</td><td>' + h(APP.siteName(d.site)) + '</td><td>' + h(d.partner ? APP.partnerName(d.partner) : '—') + '</td><td>' + h(d.author) + '</td><td class="mono sm">' + APP.relDay(d.submittedAt || d.createdAt) + '</td><td>' + APP.dpill(d) + '</td><td><button class="btn xs ghost" data-act="xl" data-d="' + d.id + '">' + I('down') + ' 엑셀</button></td></tr>';
        }).join('') + '</tbody></table></div>' : APP.empty('조건에 맞는 서류가 없습니다')) + '</section>' +
      zipJobsPanel() +
      '<section class="card"><div class="card-h"><h3>내 내려받기 이력</h3><span class="muted sm">현재 계정으로 내려받은 파일과 조건을 확인합니다.</span></div>' +
        '<div class="tbl"><table><thead><tr><th>시각</th><th>사용자</th><th>조건</th><th>파일</th></tr></thead><tbody>' + DB.S.downloads.filter(function (x) { return x.uid ? x.uid === u.id : x.user === u.name; }).slice(0, 8).map(function (x) {
          return '<tr><td class="mono sm">' + x.at + '</td><td>' + h(x.user) + '</td><td>' + h(x.cond) + '</td><td>' + h(x.file) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
    P.rowLinks(root);
    APP.acts.f = function (a) { docF[a.getAttribute('data-k')] = a.value; APP.rerender(); };
    APP.acts.new = function () { pickForm(); };
    APP.acts.xl = function (a, e) { e.stopPropagation(); dlDoc(DB.byId(DB.S.docs, a.getAttribute('data-d'))); };
    APP.acts.pickAll = function (a) { list.forEach(function (d) { picked[d.id] = a.checked; }); APP.rerender(); };
    root.querySelectorAll('[data-pick]').forEach(function (c) { c.addEventListener('change', function () { picked[c.getAttribute('data-pick')] = c.checked; APP.rerender(); }); });
    APP.acts.dlPicked = function () {
      var ds = list.filter(function (d) { return picked[d.id] && DB.inScope(d) && APP.siteOk(d); });
      if (!ds.length) { APP.toast('현재 목록에서 내려받을 서류를 선택해 주세요', 'warn'); return; }
      if (ds.length === 1) dlDoc(ds[0]); else zipJob(ds, '선택 ' + ds.length + '건');
    };
    APP.acts.zip = function () {
      var cond = (APP.siteFilter === 'all' ? '허용 전체 현장' : APP.siteName(APP.siteFilter)) + ' · ' + (docF.form ? DB.form(docF.form).short : '전체 양식') + ' · ' + docF.from + ' ~ ' + docF.to;
      if (!list.length) { APP.toast('조건에 맞는 서류가 없습니다', 'warn'); return; }
      zipJob(list, cond);
    };
    APP.acts.zipOpen = function (a) {
      var job = zipJobs.filter(function (j) { return j.id === a.getAttribute('data-job'); })[0];
      if (job && jobAllowed(job)) showZipJob(job);
      else APP.toast('현재 계정으로 받을 수 없는 파일 묶음입니다', 'warn');
    };
  };
  function pickForm() {
    var u = DB.me();
    var forms = DB.S.forms.filter(function (f) { return !f.check && (u.role !== 'partner' || ['F-REQ', 'F-ROSTER', 'F-RISK', 'F-TBM'].indexOf(f.id) >= 0); });
    APP.modal({ title: '작성할 양식 선택', cls: 'md', body: '<div class="fpick">' + forms.map(function (f) {
      var c = DB.formCurrent(f.id);
      return '<a class="fpk" href="#/docs/new/' + f.id + '" data-mx><b>' + h(f.name) + '</b><span>v' + c.v + ' · 항목 ' + c.items.length + '개 · 필수 ' + c.items.filter(function (i) { return i.req; }).length + '개</span><i>' + h(f.writer) + '</i></a>';
    }).join('') + '</div>' + (u.role === 'partner' ? '<p class="muted sm">보수작업 신청서 · 작업자 명단 · 위험성평가는 작업허가 신청과 함께 제출하는 것을 권장합니다.</p>' : '') });
  }
  function newDoc(root, formId) {
    var f = DB.form(formId), u = DB.me();
    if (!f || f.check) { root.innerHTML = APP.empty('양식을 찾을 수 없습니다'); return; }
    var site = APP.siteFilter !== 'all' ? APP.siteFilter : u.sites[0];
    var init = {};
    DB.formCurrent(formId).items.forEach(function (it) {
      if (it.type === 'date') init[it.id] = DB.dayStr(0);
      if (it.type === 'partner' && u.role === 'partner') init[it.id] = u.partner;
    });
    var d = DB.newDoc(formId, site, init);
    DB.audit('서류 작성 시작', d.id + ' ' + f.name);
    location.replace('#/docs/' + d.id);
  }
  function docDetail(root, id) {
    var d = DB.byId(DB.S.docs, id), u = DB.me();
    if (!d) { root.innerHTML = APP.empty('서류를 찾을 수 없습니다'); return; }
    if (!DB.guard('doc', d, '서류 ' + d.id + ' 조회 (' + APP.siteName(d.site) + ')')) { DB.persist(); root.innerHTML = APP.deny('허용되지 않은 현장 또는 다른 협력업체의 서류입니다.'); return; }
    var f = DB.form(d.formId), def = DB.formVer(d.formId, d.ver), cur = DB.formCurrent(d.formId);
    var editable = d.status === 'draft' && (u.name === d.author || u.role === 'admin');
    var canConfirm = d.status === 'submitted' && u.role === 'safety' && !d.permitId;
    var showIds = !!docDetail.ids;
    root.innerHTML =
      '<a class="back" href="#/docs">← 서류함</a>' +
      '<div class="ph-h"><div><p class="eyebrow">' + d.id + (d.rev > 1 ? ' · ' + d.rev + '차' : '') + ' · ' + h(APP.siteName(d.site)) + (d.partner ? ' · ' + h(APP.partnerName(d.partner)) : '') + ' · 작성 ' + h(d.author) + '</p><h2>' + h(f.name) + ' ' + APP.dpill(d) + '</h2></div>' +
      '<div class="row"><button class="btn ghost" data-act="ids">' + (showIds ? '항목 ID 숨기기' : '항목 ID 보기') + '</button><button class="btn ghost" data-act="xl">' + I('down') + ' 엑셀' + (f.original ? ' (원본 서식 포함)' : '') + '</button>' +
      (d.status === 'confirmed' && (u.role !== 'partner') ? '<button class="btn ghost" data-act="fix">정정 (새 차수)</button>' : '') + '</div></div>' +
      '<div class="verbar">' + I('forms') + '<span>이 서류는 <b>양식 ' + f.id + ' v' + d.ver + '</b>로 작성되었습니다' + (d.ver !== cur.v ? ' — 현재 양식은 v' + cur.v + '이지만, 작성 당시 버전으로 열리고 출력됩니다.' : '.') + '</span>' +
      (d.permitId ? '<a class="lnk" href="#/permits/' + d.permitId + '">작업허가 ' + d.permitId + '</a>' : '') + (d.workId ? '<a class="lnk" href="#/works/' + d.workId + '">작업 ' + d.workId + '</a>' : '') + '</div>' +
      '<div class="pd">' +
        '<section class="card" data-docf>' + FE.render(def.items, d.values, { readonly: !editable, site: d.site, partner: d.partner || (u.role === 'partner' ? u.partner : null), showIds: showIds, errors: docDetail.errs && docDetail.errs.id === d.id ? docDetail.errs.e : null }) +
          (editable ? '<div class="frm-a"><span class="muted sm">임시저장은 필수값 누락을 허용하고 입력된 값의 형식만 검사합니다. 제출은 필수 항목을 모두 검사합니다.</span><span class="sp"></span><button class="btn ghost" data-act="save">임시저장</button><button class="btn pri" data-act="submit">제출</button></div>' : '') +
          (canConfirm ? '<div class="frm-a"><span class="muted sm">확인이 끝난 서류는 수정할 수 없습니다. 정정이 필요하면 정정 사유와 함께 새 차수로 저장합니다.</span><span class="sp"></span><button class="btn pri" data-act="confirm">' + I('check') + ' 확인 · 서명</button></div>' : '') +
          (d.status === 'submitted' && d.permitId ? '<p class="muted sm">작업허가 첨부 서류는 작업허가 승인과 함께 확인 처리됩니다.</p>' : '') +
        '</section>' +
        '<aside class="pd-s"><section class="card"><h3>상태</h3><dl class="kv"><dt>양식</dt><dd>' + f.id + ' v' + d.ver + '</dd><dt>작성</dt><dd>' + h(d.author) + ' · ' + d.createdAt + '</dd><dt>제출</dt><dd>' + (d.submittedAt || '—') + '</dd><dt>확인</dt><dd>' + (d.confirmedBy ? h(d.confirmedBy) + ' · ' + d.confirmedAt : '—') + '</dd></dl></section>' +
        '<section class="card"><h3>이력</h3><ol class="tl">' + d.history.slice().reverse().map(function (x) { return '<li><i></i><b>' + h(x.what) + '</b><span>' + h(x.by) + ' · ' + x.at + '</span></li>'; }).join('') + '</ol></section></aside></div>';
    var box = root.querySelector('[data-docf] [data-fe]');
    if (editable) P.bindForm(box.parentNode, def.items, function () { return d.values; }, function (v) { d.values = v; }, { site: d.site, partner: d.partner || (u.role === 'partner' ? u.partner : null), showIds: showIds });
    function grab() { d.values = FE.read(root.querySelector('[data-docf]'), def.items, d.values); }
    APP.acts.ids = function () { if (editable) grab(); docDetail.ids = !showIds; APP.rerender(); };
    APP.acts.xl = function () { if (editable) grab(); dlDoc(d); };
    APP.acts.save = function () {
      grab(); var e = FE.validate(def.items, d.values, 'draft');
      docDetail.errs = { id: d.id, e: e };
      if (Object.keys(e).length) { APP.toast('형식 오류 ' + Object.keys(e).length + '건 — 임시저장할 수 없습니다', 'err'); APP.rerender(); return; }
      d.history.push({ at: DB.stamp(), by: u.name, what: '임시저장' }); DB.persist(); docDetail.errs = null;
      APP.toast('임시저장했습니다 (필수 항목 누락 허용)'); APP.rerender();
    };
    APP.acts.submit = function () {
      grab(); var e = FE.validate(def.items, d.values, 'submit');
      docDetail.errs = { id: d.id, e: e };
      if (Object.keys(e).length) {
        DB.audit('서류 제출 거부', d.id + ' — 필수·형식 오류 ' + Object.keys(e).length + '건', '거부'); DB.persist();
        APP.rerender(); APP.toast('제출할 수 없습니다 — 필수 항목과 입력 형식 오류 ' + Object.keys(e).length + '건을 확인해 주세요.', 'err');
        var e1 = document.querySelector('.fi.err'); if (e1) e1.scrollIntoView({ block: 'center' });
        return;
      }
      docDetail.errs = null;
      d.status = 'submitted'; d.submittedAt = DB.stamp(); d.history.push({ at: DB.stamp(), by: u.name, what: '제출' });
      DB.audit('서류 제출', d.id + ' ' + f.name); DB.persist(); APP.toast('제출했습니다'); APP.rerender();
    };
    APP.acts.confirm = function () {
      APP.ask({ title: '서류 확인 · 서명', msg: d.id + ' ' + f.name + '을 확인하고 안전관리자 서명을 남깁니다. 확인 후에는 수정할 수 없습니다.', ok: '확인 · 서명' }, function () {
        d.status = 'confirmed'; d.confirmedAt = DB.stamp(); d.confirmedBy = u.name;
        d.history.push({ at: DB.stamp(), by: u.name, what: '안전관리자 확인 · 서명 (서명자·확인 시각 기록)' });
        DB.audit('서류 확인 서명', d.id); DB.persist(); APP.toast('확인 · 서명했습니다 — 이제 수정할 수 없습니다'); APP.rerender();
      });
    };
    APP.acts.fix = function () {
      APP.ask({ title: '정정 — 새 차수 만들기', msg: '확인된 원본은 그대로 보존하고, 같은 내용으로 ' + (d.rev + 1) + '차 작성 중 서류를 만듭니다.', input: true, req: true, label: '정정 사유', ok: '새 차수 만들기' }, function (reason) {
        var n = JSON.parse(JSON.stringify(d));
        n.id = 'D-0' + (++DB.S.seq.D); n.rev = d.rev + 1; n.status = 'draft'; n.submittedAt = null; n.confirmedAt = null; n.confirmedBy = null; n.author = u.name; n.createdAt = DB.stamp();
        n.prev = d.id; n.history = [{ at: DB.stamp(), by: u.name, what: d.id + ' 정정 — 사유: ' + reason }];
        Object.keys(n.values).forEach(function (k) { var v = n.values[k]; if (v && v.name !== undefined && v.at !== undefined) n.values[k] = { name: '', at: '' }; });
        DB.S.docs.unshift(n); d.history.push({ at: DB.stamp(), by: u.name, what: '정정 차수 ' + n.id + ' 생성' });
        DB.audit('서류 정정', d.id + ' → ' + n.id + ' — ' + reason); DB.persist(); APP.go('docs/' + n.id);
      });
    };
  }
  function dlDoc(d) {
    if (!DB.guard('doc', d, '서류 내려받기 ' + (d ? d.id : '없음'))) { DB.persist(); APP.toast('현재 계정에 허용되지 않은 서류입니다', 'err'); return; }
    var bytes = FE.excelBytes(d), name = FE.fileBase(d) + '.xlsx';
    FILES.save(bytes, name, FILES.XLSX_TYPE);
    DB.S.downloads.unshift({ at: DB.stamp(), uid: DB.me().id, user: DB.me().name, cond: '서류 1건 · ' + d.id, file: name });
    DB.audit('내려받기', '엑셀 ' + name); DB.persist();
    APP.toast(name + ' 내려받기');
  }
  /* 계정별 메모리 작업함 — 닫힌 창과 무관하게 완료 파일을 다시 받는다. */
  function jobAllowed(job) {
    var u = DB.me();
    return !!u && !job.cancelled && job.data === DB.S && job.uid === u.id && job.ids.every(function (id) { return DB.inScope(DB.byId(DB.S.docs, id)); });
  }
  function jobText(job) {
    if (job.status === 'ready' && Date.now() >= job.exp) { job.status = 'expired'; job.bytes = null; }
    if (job.status === 'ready') return '완료 · ' + job.count + '개 파일 · ' + job.size + 'KB';
    if (job.status === 'expired') return '다운로드 기한이 지났습니다. 같은 조건으로 다시 만들어 주세요.';
    if (job.status === 'failed') return '파일 생성에 실패했습니다. 같은 조건으로 다시 시도해 주세요.';
    return '서류 ' + job.done + ' / ' + job.ids.length + ' 묶는 중…';
  }
  function zipJobsPanel() {
    var jobs = zipJobs.filter(jobAllowed).slice(-5).reverse();
    if (!jobs.length) return '';
    return '<section class="card"><div class="card-h"><h3>파일 묶음 작업함</h3><span class="muted sm">완료 후 10분 동안 받을 수 있습니다. 새로고침·로그아웃하면 작업함이 비워집니다.</span></div><ul class="zip-jobs">' + jobs.map(function (job) {
      return '<li><div><b>' + h(job.cond) + '</b><p>' + h(jobText(job)) + '</p></div><button class="btn sm ghost" data-act="zipOpen" data-job="' + job.id + '">' + (job.status === 'ready' ? '파일 받기' : '상태 보기') + '</button></li>';
    }).join('') + '</ul></section>';
  }
  function updateJob(job) {
    job.views.forEach(function (view) { view(); });
    if (jobAllowed(job) && /^#\/docs\/?$/.test(location.hash)) APP.rerender();
  }
  function showZipJob(job) {
    var update;
    APP.modal({ title: '파일 묶음 만들기', cls: 'md', body:
      '<p class="mdl-msg">조건: <b>' + h(job.cond) + '</b><br>서류 ' + job.ids.length + '건 · 첨부 사진 ' + job.photos + '장 · 폴더 구조 <code>현장/양식/날짜_서류번호/</code></p>' +
      '<div class="job"><div class="job-b"><i data-bar></i></div><p data-st role="status" aria-live="polite"></p></div>' +
      '<p class="muted sm">창을 닫아도 이 브라우저에서 파일 생성은 계속됩니다. 완료 파일은 안전 서류의 「파일 묶음 작업함」에서 10분 동안 받을 수 있습니다. 새로고침·로그아웃하면 작업함이 비워집니다.</p>' +
      '<div class="dl"><button class="btn pri" data-ma="get" data-get>' + I('down') + ' 파일 받기</button><span data-cd></span></div>',
      foot: '<button class="btn ghost" data-mx>닫기</button>',
      mount: function (el) {
        update = function () {
          var text = jobText(job);
          el.querySelector('[data-bar]').style.width = (job.status === 'ready' ? 100 : Math.round(job.done / job.ids.length * 92)) + '%';
          el.querySelector('[data-st]').textContent = text;
          el.querySelector('[data-get]').disabled = job.status !== 'ready';
          el.querySelector('[data-cd]').textContent = job.status === 'ready' ? '다운로드 기한: ' + new Date(job.exp).toLocaleTimeString('ko-KR') : '';
        };
        job.views.push(update); update();
      },
      onClose: function () { job.views = job.views.filter(function (view) { return view !== update; }); },
      acts: { get: function () {
        if (!jobAllowed(job)) { APP.toast('현재 계정으로 받을 수 없는 파일 묶음입니다', 'err'); return; }
        jobText(job);
        if (job.status !== 'ready' || !job.bytes) { updateJob(job); APP.toast('파일이 준비되지 않았거나 다운로드 기한이 지났습니다', 'warn'); return; }
        FILES.save(job.bytes, job.name, 'application/zip');
        DB.S.downloads.unshift({ at: DB.stamp(), uid: DB.me().id, user: DB.me().name, cond: job.cond, file: 'ZIP · 서류 ' + job.ids.length + '건 · 사진 ' + job.photos + '장' });
        DB.audit('내려받기', '파일 묶음 — ' + job.cond); DB.persist(); APP.toast('파일 묶음을 내려받았습니다');
      } }
    });
  }
  function zipJob(docs, cond) {
    if (!docs.length || docs.some(function (d) { return !DB.inScope(d); })) { APP.toast('현재 계정에 허용된 서류만 묶을 수 있습니다', 'err'); return; }
    var photos = 0;
    docs.forEach(function (d) { Object.keys(d.values).forEach(function (k) { var v = d.values[k]; if (Array.isArray(v) && v.length && v[0] && (v[0].seed || v[0].url)) photos += v.length; }); });
    var job = { id: 'ZIP-' + (++zipSeq), uid: DB.me().id, data: DB.S, ids: docs.map(function (d) { return d.id; }), cond: cond,
      status: 'running', photos: photos, done: 0, views: [], bytes: null };
    zipJobs.push(job); showZipJob(job);
    var files = [], i = 0;
    function step() {
      if (!jobAllowed(job)) { job.cancelled = true; job.bytes = null; files = []; return; }
      try {
      if (i < docs.length) {
        var d = docs[i];
        var dir = APP.siteName(d.site) + '/' + DB.form(d.formId).short + '/' + (d.submittedAt || d.createdAt).slice(0, 10) + '_' + d.id + (d.rev > 1 ? '_' + d.rev + '차' : '') + '/';
        files.push({ name: dir + FE.fileBase(d) + '.xlsx', data: FE.excelBytes(d) });
        var n = 0;
        Object.keys(d.values).forEach(function (k) {
          var v = d.values[k];
          if (Array.isArray(v)) v.forEach(function (p) { if (p && (p.seed || p.url)) { n++; files.push({ name: dir + '사진_' + k + '_' + n + '.jpg', data: FILES.dataUrlBytes(FE.photoUrl(p)) }); } });
        });
        i++; job.done = i; updateJob(job);
        setTimeout(step, 260);
      } else {
        job.bytes = FILES.zip(files); job.size = (job.bytes.length / 1024).toFixed(0); job.count = files.length; files = [];
        job.exp = Date.now() + 10 * 60 * 1000; job.name = '안전서류_' + DB.dayStr(0) + '_' + docs.length + '건.zip'; job.status = 'ready';
        updateJob(job); APP.toast('파일 묶음이 준비되었습니다. 안전 서류의 파일 묶음 작업함에서 받아 주세요.');
        setTimeout(function () { job.status = 'expired'; job.bytes = null; if (!job.cancelled) updateJob(job); }, 10 * 60 * 1000);
      }
      } catch (e) { files = []; job.bytes = null; job.status = 'failed'; updateJob(job); APP.toast('파일 묶음을 만들지 못했습니다. 다시 시도해 주세요.', 'err'); }
    }
    setTimeout(step, 400);
  }

  /* ====================================================================== */
  /* 양식 정의서                                                             */
  /* ====================================================================== */
  var formView = {};
  P.forms = function (root, args) {
    if (args[0]) return formDetail(root, args[0]);
    var u = DB.me();
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">서류 양식의 항목과 버전을 관리합니다.</p><h2>서류 양식</h2></div>' +
      '<div class="row"><a class="btn ghost" href="#/qc">' + I('qc') + ' 양식 검증</a>' + (u.role === 'admin' ? '<button class="btn pri" data-act="imp">' + I('down') + ' 정의서 엑셀 가져오기</button>' : '') + '</div></div>' +
      '<details class="card diagnostic"><summary>양식 관리 원칙</summary><div class="flow">' +
        '<div class="fl-b"><small>발주처 확정</small><b>양식 항목 정의서</b><span>항목 ID · 항목명 · 필수 · 입력 유형 · 선택지 · 근거</span></div>' + I('arrow', 'fl-a') +
        '<div class="fl-b core"><small>정의는 한 곳에서만</small><b>양식 정의 데이터 (버전)</b><span>항목 ID마다 화면 · 저장 경로 · 엑셀 위치 연결</span></div>' + I('arrow', 'fl-a') +
        '<div class="fl-o"><span>' + I('docs') + ' 입력 화면</span><span>' + I('check') + ' 저장 검증</span><span>' + I('down') + ' 엑셀 출력</span></div></div></details>' +
      '<div class="fcards">' + DB.S.forms.map(function (f) {
        var c = DB.formCurrent(f.id), dr = f.versions.filter(function (v) { return v.status === 'draft'; })[0];
        return '<a class="fcard" href="#/forms/' + f.id + '"><div class="fc-t"><code>' + f.id + '</code>' + (f.check ? '<em class="tag">작업자 모바일</em>' : '') + (f.original ? '<em class="tag amber">원본 서식 재현</em>' : '') + '</div>' +
          '<b>' + h(f.name) + '</b><span>' + h(f.writer) + '</span>' +
          '<div class="fc-n"><div><b>v' + c.v + '</b><i>현재 버전</i></div><div><b>' + c.items.length + '</b><i>항목</i></div><div><b>' + c.items.filter(function (i) { return i.req; }).length + '</b><i>필수</i></div></div>' +
          '<div class="fc-s">' + (c.locked ? '<span class="ok">' + I('lock') + ' 발주처 확인 · 잠금</span>' : '<span class="wn">발주처 확인 대기</span>') + (dr ? '<span class="dr">초안 v' + dr.v + ' 작성 중</span>' : '') + '</div></a>';
      }).join('') + '</div>';
    APP.acts.imp = function () { importDef(); };
  };
  function formDetail(root, fid) {
    var f = DB.form(fid), u = DB.me();
    if (!f) { root.innerHTML = APP.empty('양식을 찾을 수 없습니다'); return; }
    var vs = f.versions;
    var sel = formView[fid] || vs[vs.length - 1].v;
    var ver = vs.filter(function (v) { return v.v === sel; })[0] || vs[vs.length - 1];
    var prev = vs.filter(function (v) { return v.v === ver.v - 1; })[0];
    var prevIds = prev ? prev.items.map(function (i) { return i.id; }) : null;
    var isAdmin = u.role === 'admin';
    var docsUsing = DB.S.docs.filter(function (d) { return d.formId === fid; });
    root.innerHTML =
      '<a class="back" href="#/forms">← 서류 양식</a>' +
      '<div class="ph-h"><div><p class="eyebrow">' + f.id + ' · ' + h(f.writer) + (f.original ? ' · 원본 서식 재현 대상(대표 1종)' : '') + '</p><h2>' + h(f.name) + '</h2></div>' +
      '<div class="row"><button class="btn ghost" data-act="tpl">' + I('down') + ' 정의서 엑셀</button>' +
      (isAdmin && !vs.some(function (v) { return v.status === 'draft'; }) ? '<button class="btn pri" data-act="draft">새 버전 초안</button>' : '') + '</div></div>' +
      '<div class="tabs">' + vs.map(function (v) { return '<button class="tab' + (v.v === ver.v ? ' on' : '') + '" data-act="ver" data-v="' + v.v + '">v' + v.v + (v.status === 'draft' ? ' 초안' : '') + (v.locked ? ' ' + I('lock') : '') + '</button>'; }).join('') + '</div>' +
      '<div class="g2">' +
        '<section class="card span2"><div class="card-h"><h3>항목 정의 — v' + ver.v + ' ' + (ver.status === 'draft' ? '<em class="tag amber">초안</em>' : ver.locked ? '<em class="tag green">발주처 확인 · 잠금</em>' : '<em class="tag orange">발행 · 발주처 확인 대기</em>') + '</h3>' +
          '<span class="muted sm">' + h(ver.note || '') + '</span></div>' +
          '<div class="tbl"><table class="def"><thead><tr><th>항목 ID</th><th>항목명</th><th>입력 유형</th><th>필수</th><th>선택지</th><th>근거</th><th>구역</th>' + (ver.status === 'draft' && isAdmin ? '<th></th>' : '') + '</tr></thead><tbody>' +
          ver.items.map(function (it) {
            var added = prevIds && prevIds.indexOf(it.id) < 0;
            return '<tr class="' + (added ? 'add' : '') + '"><td class="mono">' + it.id + (added ? ' <em class="tag green">추가</em>' : '') + '</td><td><b>' + h(it.label) + '</b></td><td>' + FE.TYPE_LABEL[it.type] + '</td><td>' + (it.req ? '<b class="req">필수</b>' : '선택') + '</td><td class="sm">' + h(it.opts ? (it.type === 'check' ? '작업 종류: ' + it.opts.map(function (o) { return DB.WORK_TYPES[o].label; }).join(', ') : it.opts.join(' / ')) : '—') + '</td><td class="sm">' + h(it.basis) + '</td><td class="sm">' + h(it.sec) + '</td>' +
              (ver.status === 'draft' && isAdmin ? '<td><button class="btn xs ghost" data-act="del" data-i="' + it.id + '">삭제</button></td>' : '') + '</tr>';
          }).join('') + '</tbody></table></div>' +
          (prev ? '<p class="muted sm">v' + prev.v + ' 대비 ' + (ver.items.length - prev.items.length >= 0 ? '추가 ' + ver.items.filter(function (i) { return prevIds.indexOf(i.id) < 0; }).length + '개' : '') + ' · 기존 서류는 작성 당시 버전으로 열리고 출력됩니다.</p>' : '') +
          '<p class="muted sm">항목의 근거는 고객사 담당자가 확정합니다. 현재 표시된 근거는 체험용 예시입니다.</p>' +
          (ver.status === 'draft' && isAdmin ? addItemForm(ver, fid) : '') + '</section>' +
        '<section class="card"><div class="card-h"><h3>버전 상태</h3></div><dl class="kv"><dt>발행</dt><dd>' + (ver.publishedAt || '—') + '</dd><dt>발주처 확인</dt><dd>' + (ver.signedBy ? h(ver.signedBy) + ' · ' + ver.signedAt : '—') + '</dd><dt>이 버전 서류</dt><dd>' + docsUsing.filter(function (d) { return d.ver === ver.v; }).length + '건</dd></dl>' +
          (ver.status === 'draft' && isAdmin ? '<button class="btn pri full" data-act="pub">' + I('qc') + ' 양식 검증 후 발행</button><p class="muted sm">초안의 입력 화면·저장 값·엑셀 출력을 대조해 모두 통과해야 발행할 수 있습니다.</p>' : '') +
          (ver.status === 'published' && !ver.locked && isAdmin ? '<button class="btn pri full" data-act="sign">' + I('lock') + ' 발주처 확인 서명 · 잠금</button><p class="muted sm">원본 서식과 대조한 뒤 서명하면 이 버전은 잠기고, 이후 변경은 새 버전으로만 가능합니다.</p>' : '') +
          (ver.locked ? '<p class="ok-line">' + I('lock') + ' 잠긴 버전 — 수정하려면 새 버전 초안을 만듭니다.</p>' : '') + '</section>' +
        '<section class="card"><div class="card-h"><h3>입력 화면 미리보기</h3><span class="muted sm">이 정의에서 자동 생성</span></div><div class="prev">' + FE.render(ver.items, {}, { site: 'S1', showIds: true, workType: 'hot' }) + '</div></section>' +
      '</div>';
    root.querySelectorAll('.prev input, .prev select, .prev textarea, .prev button').forEach(function (x) { x.disabled = true; });
    APP.acts.ver = function (a) { formView[fid] = +a.getAttribute('data-v'); APP.rerender(); };
    APP.acts.tpl = function () { defXlsx(f, ver); };
    APP.acts.draft = function () {
      var last = vs[vs.length - 1];
      vs.push({ v: last.v + 1, status: 'draft', locked: false, items: JSON.parse(JSON.stringify(last.items)), note: 'v' + last.v + '에서 복사한 초안' });
      formView[fid] = last.v + 1; DB.audit('설정 변경', f.id + ' v' + (last.v + 1) + ' 초안 생성'); DB.persist(); APP.rerender();
    };
    APP.acts.del = function (a) {
      if (ver.status !== 'draft' || !isAdmin) return;
      if (ver.items.length <= 1) { APP.toast('양식에는 항목이 1개 이상 있어야 합니다. 마지막 항목은 삭제할 수 없습니다.', 'warn'); return; }
      var id = a.getAttribute('data-i'); ver.items = ver.items.filter(function (i) { return i.id !== id; }); DB.persist(); APP.rerender();
    };
    APP.acts.add = function () {
      var b = root.querySelector('[data-add]');
      var it = { id: b.querySelector('[name=id]').value.trim().toUpperCase(), label: b.querySelector('[name=label]').value.trim(), type: b.querySelector('[name=type]').value,
        req: b.querySelector('[name=req]').checked, opts: null, basis: b.querySelector('[name=basis]').value.trim() || '사내 기준(예시)', sec: b.querySelector('[name=sec]').value.trim() || '추가 항목' };
      var o = b.querySelector('[name=opts]').value.trim();
      if (it.type === 'select' || it.type === 'multi') it.opts = o.split('/').map(function (x) { return x.trim(); }).filter(Boolean);
      var errs = defCheck(ver.items.concat([it]));
      if (errs.length) { APP.toast(errs[0], 'err'); return; }
      ver.items.push(it); DB.persist(); APP.toast(it.id + ' 항목을 초안에 추가했습니다'); APP.rerender();
    };
    APP.acts.pub = function () {
      var errs = defCheck(ver.items);
      if (errs.length) { APP.toast('형식 검사 실패: ' + errs[0], 'err'); return; }
      var keep = ver.status; ver.status = 'published';
      var run = FE.runQC(DB.S.qcInject);
      var r = run.results.filter(function (x) { return x.formId === fid; })[0];
      if (!r || r.fails) { ver.status = keep; DB.persist(); APP.toast('자동 대조 시험 실패 ' + (r ? r.fails : '') + '건 — 발행이 차단되었습니다', 'err'); APP.go('qc'); return; }
      ver.publishedAt = DB.stamp(); ver.note = (ver.note || '') + ' · 자동 대조 ' + r.pass + '/' + r.total + ' 통과 후 발행';
      DB.audit('설정 변경', f.id + ' v' + ver.v + ' 발행 (자동 대조 ' + r.pass + '/' + r.total + ')'); DB.persist();
      APP.toast('v' + ver.v + ' 발행 — 자동 대조 ' + r.pass + '/' + r.total + ' 통과. 발주처 확인 서명이 남았습니다'); APP.rerender();
    };
    APP.acts.sign = function () {
      APP.ask({ title: '발주처 확인 서명 · 잠금', msg: f.id + ' v' + ver.v + '의 항목 대조표를 원본 서식과 비교해 확인했습니다. 서명하면 이 버전은 잠깁니다.', ok: '서명 · 잠금' }, function () {
        ver.locked = true; ver.signedBy = u.name + ' (발주처 확인)'; ver.signedAt = DB.stamp();
        DB.audit('설정 변경', f.id + ' v' + ver.v + ' 발주처 확인 서명 · 잠금'); DB.persist(); APP.toast('v' + ver.v + '를 잠갔습니다'); APP.rerender();
      });
    };
  }
  function addItemForm(ver, fid) {
    var pfx = ver.items.length ? ver.items[0].id.split('-')[0] : fid.replace(/^F-/, '');
    var n = ver.items.reduce(function (a, i) { var k = +i.id.split('-')[1]; return Math.max(a, isNaN(k) ? 0 : k); }, 0) + 1;
    return '<div class="addi" data-add><h4>항목 추가 (지원하는 입력 유형 안에서)</h4><div class="frm4">' +
      '<label class="fl"><span>항목 ID</span><input class="in" name="id" value="' + pfx + '-' + (n < 10 ? '0' : '') + n + '"></label>' +
      '<label class="fl"><span>항목명</span><input class="in" name="label" placeholder="예: 작업 중지 기준 공유"></label>' +
      '<label class="fl"><span>입력 유형</span><select class="in" name="type">' + ['text', 'textarea', 'number', 'date', 'time', 'select', 'multi', 'yesno', 'photo', 'sign', 'phone'].map(function (t) { return '<option value="' + t + '">' + FE.TYPE_LABEL[t] + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>선택지 (선택형, / 구분)</span><input class="in" name="opts" placeholder="양호 / 불량"></label>' +
      '<label class="fl"><span>근거</span><input class="in" name="basis" placeholder="법령·사내 기준"></label>' +
      '<label class="fl"><span>구역</span><input class="in" name="sec" value="' + h(ver.items.length ? ver.items[ver.items.length - 1].sec : '추가 항목') + '"></label>' +
      '<label class="chk1"><input type="checkbox" name="req" checked><span>필수 항목</span></label>' +
      '<button class="btn ghost" data-act="add">' + I('plus') + ' 추가</button></div>' +
      '<p class="muted sm">새 입력 유형이나 원본 서식 배치 변경은 별도 영향 검토 대상입니다.</p></div>';
  }
  var TYPES = Object.keys(FE.TYPE_LABEL);
  function defCheck(items) {
    var errs = [], seen = {};
    if (!items.length) errs.push('양식에는 항목이 1개 이상 있어야 합니다');
    items.forEach(function (it, i) {
      var row = (i + 1) + '행';
      if (!it.id) errs.push(row + ': 항목 ID가 비어 있습니다');
      else if (seen[it.id]) errs.push(row + ': 항목 ID 중복 — ' + it.id);
      seen[it.id] = 1;
      if (!it.label) errs.push(row + ' ' + it.id + ': 항목명이 비어 있습니다');
      if (TYPES.indexOf(it.type) < 0) errs.push(row + ' ' + it.id + ': 입력 유형 오류 — 「' + it.type + '」');
      if ((it.type === 'select' || it.type === 'multi') && !(it.opts && it.opts.length)) errs.push(row + ' ' + it.id + ': 선택형 항목에 선택지가 없습니다');
    });
    return errs;
  }
  /* 정의서 엑셀 — 발주처가 채우는 템플릿과 같은 열 구성 */
  var DEF_COLS = ['항목 ID', '항목명', '필수 여부', '입력 유형', '선택지', '근거(법령·사내 기준)', '구역', '비고'];
  function defXlsx(f, ver) {
    var rows = [[{ v: '양식 항목 정의서 — ' + f.name + ' (' + f.id + ' v' + ver.v + ')', s: 1 }], [{ v: '한 줄에 한 항목씩 적습니다. 입력 유형: ' + TYPES.filter(function (t) { return t !== 'check' && t !== 'partner' && t !== 'workers'; }).map(function (t) { return FE.TYPE_LABEL[t]; }).join(', ') + ' · 선택지는 / 로 구분', s: 5 }], [],
      DEF_COLS.map(function (c) { return { v: c, s: 2 }; })];
    ver.items.forEach(function (it) {
      rows.push([{ v: it.id, s: 6 }, { v: it.label, s: 3 }, { v: it.req ? '필수' : '선택', s: 6 }, { v: FE.TYPE_LABEL[it.type], s: 6 }, { v: it.opts && it.type !== 'check' ? it.opts.join(' / ') : '', s: 3 }, { v: it.basis, s: 3 }, { v: it.sec, s: 3 }, { v: '', s: 3 }]);
    });
    var name = '양식정의서_' + f.id + '_v' + ver.v + '.xlsx';
    FILES.save(FILES.xlsx([{ name: '정의서', cols: [11, 28, 9, 11, 30, 26, 14, 16], rows: rows, merges: ['A1:H1', 'A2:H2'] }]), name, FILES.XLSX_TYPE);
    DB.audit('내려받기', '정의서 ' + name); DB.persist();
  }
  /* 정의서 엑셀 가져오기 — .xlsx를 브라우저에서 직접 읽는다 (압축 해제는 DecompressionStream) */
  function readXlsx(buf) {
    var u8 = new Uint8Array(buf), dv = new DataView(buf);
    var eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) return Promise.reject(new Error('엑셀(.xlsx) 파일이 아닙니다'));
    var n = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true), ents = {};
    var dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      var nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true);
      var name = dec.decode(u8.subarray(off + 46, off + 46 + nl));
      ents[name] = { method: dv.getUint16(off + 10, true), csize: dv.getUint32(off + 20, true), lho: dv.getUint32(off + 42, true) };
      off += 46 + nl + xl + cl;
    }
    function get(name) {
      var e = ents[name]; if (!e) return Promise.resolve(null);
      var lnl = dv.getUint16(e.lho + 26, true), lxl = dv.getUint16(e.lho + 28, true);
      var data = u8.subarray(e.lho + 30 + lnl + lxl, e.lho + 30 + lnl + lxl + e.csize);
      if (e.method === 0) return Promise.resolve(dec.decode(data));
      if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('이 브라우저는 압축 해제를 지원하지 않습니다'));
      var ds = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Response(ds).text();
    }
    var sheetName = Object.keys(ents).filter(function (x) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(x); }).sort()[0];
    return Promise.all([get('xl/sharedStrings.xml'), get(sheetName)]).then(function (r) {
      var P = new DOMParser(), ss = [];
      if (r[0]) Array.prototype.forEach.call(P.parseFromString(r[0], 'application/xml').getElementsByTagName('si'), function (si) {
        ss.push(Array.prototype.map.call(si.getElementsByTagName('t'), function (t) { return t.textContent; }).join(''));
      });
      var doc = P.parseFromString(r[1] || '', 'application/xml'), rows = [];
      Array.prototype.forEach.call(doc.getElementsByTagName('row'), function (row) {
        var out = [];
        Array.prototype.forEach.call(row.getElementsByTagName('c'), function (c) {
          var ref = c.getAttribute('r'), col = 0, m = /^([A-Z]+)/.exec(ref)[1];
          for (var j = 0; j < m.length; j++) col = col * 26 + (m.charCodeAt(j) - 64);
          var t = c.getAttribute('t'), v = '';
          if (t === 's') v = ss[+((c.getElementsByTagName('v')[0] || {}).textContent)] || '';
          else if (t === 'inlineStr') v = Array.prototype.map.call(c.getElementsByTagName('t'), function (x) { return x.textContent; }).join('');
          else v = (c.getElementsByTagName('v')[0] || {}).textContent || '';
          out[col - 1] = v;
        });
        rows.push(out);
      });
      return rows;
    });
  }
  function rowsToItems(rows) {
    var hi = -1;
    rows.forEach(function (r, i) { if (hi < 0 && r && r[0] === '항목 ID') hi = i; });
    if (hi < 0) throw new Error('머리글 「항목 ID」 행을 찾지 못했습니다 — 정의서 엑셀 양식을 사용해 주세요');
    var rev = {}; Object.keys(FE.TYPE_LABEL).forEach(function (k) { rev[FE.TYPE_LABEL[k]] = k; });
    return rows.slice(hi + 1).filter(function (r) { return r && r.some(function (x) { return x; }); }).map(function (r) {
      return { id: (r[0] || '').trim(), label: (r[1] || '').trim(), req: (r[2] || '').trim() === '필수', type: rev[(r[3] || '').trim()] || (r[3] || '').trim(),
        opts: r[4] ? r[4].split('/').map(function (x) { return x.trim(); }).filter(Boolean) : null, basis: (r[5] || '').trim() || '—', sec: (r[6] || '').trim() || '기본 정보' };
    });
  }
  function importDef() {
    var forms = DB.S.forms.filter(function (f) { return !f.check; });
    var m = APP.modal({ title: '양식 정의서 엑셀 가져오기', cls: 'md', body:
      '<p class="mdl-msg">항목 정의서 엑셀을 가져와 <b>새 버전 초안</b>을 만듭니다. 항목 ID 중복·항목명 누락·입력 유형 오류·선택지 누락을 검사합니다.</p>' +
      '<label class="fl"><span>대상 양식</span><select class="in" data-tf>' + forms.map(function (f) { return '<option value="' + f.id + '">' + h(f.name) + '</option>'; }).join('') + '</select></label>' +
      '<div class="row"><label class="btn ghost">' + I('down') + ' 엑셀 파일 선택<input type="file" accept=".xlsx" data-xf hidden></label><button class="btn ghost" data-ma="sample">오류가 있는 샘플로 시연</button></div>' +
      '<div data-res></div>', foot: '<button class="btn ghost" data-mx>닫기</button>',
      acts: { sample: function (a, el) {
        var f = DB.form(el.querySelector('[data-tf]').value), c = DB.formCurrent(f.id);
        var items = JSON.parse(JSON.stringify(c.items)).filter(function (i) { return i.type !== 'check'; });
        items.push({ id: items[1].id, label: '중복된 ID 항목', type: 'text', req: true, opts: null, basis: '—', sec: '추가' });
        items.push({ id: c.items[0].id.split('-')[0] + '-90', label: '작업 허가 번호', type: '바코드', req: true, opts: null, basis: '—', sec: '추가' });
        show(el, f, items);
      } },
      mount: function (el) {
        el.querySelector('[data-xf]').addEventListener('change', function (e) {
          var file = e.target.files[0]; if (!file) return;
          var f = DB.form(el.querySelector('[data-tf]').value);
          file.arrayBuffer().then(readXlsx).then(function (rows) { show(el, f, rowsToItems(rows)); })
            .catch(function (err) { el.querySelector('[data-res]').innerHTML = '<div class="alert red">' + I('x') + '<div><b>가져오기 실패</b><span>' + h(err.message) + '</span></div></div>'; });
        });
      } });
    function show(el, f, items) {
      var errs = defCheck(items), res = el.querySelector('[data-res]');
      res.innerHTML = '<div class="alert ' + (errs.length ? 'red' : 'green') + '">' + I(errs.length ? 'x' : 'check') + '<div><b>' + items.length + '개 항목 읽음 · 형식 오류 ' + errs.length + '건</b><span>' + (errs.length ? errs.map(h).join('<br>') : '형식 검사를 통과했습니다. 새 버전 초안으로 등록할 수 있습니다.') + '</span></div></div>' +
        (errs.length ? '' : '<button class="btn pri" data-ok>' + h(f.short) + ' 새 버전 초안으로 등록</button>');
      var ok = res.querySelector('[data-ok]');
      if (ok) ok.addEventListener('click', function () {
        if (f.versions.some(function (v) { return v.status === 'draft'; })) { APP.toast('이미 작성 중인 초안이 있습니다', 'err'); return; }
        var last = f.versions[f.versions.length - 1];
        f.versions.push({ v: last.v + 1, status: 'draft', locked: false, items: items, note: '정의서 엑셀에서 가져온 초안' });
        formView[f.id] = last.v + 1; DB.audit('설정 변경', f.id + ' 정의서 엑셀 가져오기 → v' + (last.v + 1) + ' 초안'); DB.persist();
        m.close(); APP.go('forms/' + f.id);
      });
    }
  }

  /* ====================================================================== */
  /* 자동 대조 시험 · 항목 대조표                                             */
  /* ====================================================================== */
  var lastRun = null, qcOpen = {}, qcTab = 'run', mapForm = 'F-TBM';
  P.qc = function (root) {
    var u = DB.me();
    if (!lastRun) lastRun = FE.runQC(DB.S.qcInject);
    var r = lastRun;
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">서류 양식의 입력 항목과 저장·출력 결과를 확인합니다.</p><h2>양식 검증</h2></div>' +
      '<div class="row"><button class="btn pri" data-act="run">' + I('refresh') + ' 검증 실행</button></div></div>' +
      (u.role === 'admin' ? '<details class="card diagnostic"><summary>관리자 검증 도구</summary><label class="sw"><input type="checkbox" data-chg="inject"' + (DB.S.qcInject ? ' checked' : '') + '><span>체험용 오류 재현 — TBM-14 출력 누락</span></label><p class="muted sm">검증 실패가 표시되는지 확인하는 체험 도구입니다. 실제 배포나 서버 검증은 수행하지 않습니다.</p></details>' : '') +
      '<div class="tabs"><button class="tab' + (qcTab === 'run' ? ' on' : '') + '" data-act="qtab" data-t="run">검증 결과</button><button class="tab' + (qcTab === 'map' ? ' on' : '') + '" data-act="qtab" data-t="map">항목 대조표</button><button class="tab' + (qcTab === 'steps' ? ' on' : '') + '" data-act="qtab" data-t="steps">양식 관리 안내</button></div>' +
      (qcTab === 'run' ? runView(r) : qcTab === 'map' ? mapView(u) : stepsView());
    APP.acts.run = function () { lastRun = FE.runQC(DB.S.qcInject); APP.toast(lastRun.ok ? '양식 검증 통과 — ' + lastRun.pass + '/' + lastRun.total + ' 항목' : '양식 검증 실패 — 일치하지 않는 항목을 확인해 주세요.', lastRun.ok ? '' : 'err'); APP.rerender(); };
    APP.acts.inject = function (a) { DB.S.qcInject = a.checked; DB.persist(); lastRun = FE.runQC(DB.S.qcInject); APP.rerender(); };
    APP.acts.qtab = function (a) { qcTab = a.getAttribute('data-t'); APP.rerender(); };
    APP.acts.tog = function (a) { var k = a.getAttribute('data-f'); qcOpen[k] = !qcOpen[k]; APP.rerender(); };
    APP.acts.mf = function (a) { mapForm = a.value; APP.rerender(); };
    APP.acts.msign = function () {
      var c = DB.formCurrent(mapForm);
      if (c.locked) { APP.toast('이미 발주처 확인 서명된 버전입니다'); return; }
      APP.ask({ title: '항목 대조표 발주처 확인', msg: '원본 서식과 최종 결과를 비교해 확인했습니다.', ok: '확인 서명' }, function () {
        c.locked = true; c.signedBy = u.name + ' (발주처 확인)'; c.signedAt = DB.stamp(); DB.audit('설정 변경', mapForm + ' 항목 대조표 발주처 확인'); DB.persist(); APP.rerender();
      });
    };
    APP.acts.mxl = function () {
      var f = DB.form(mapForm), c = DB.formCurrent(mapForm), rr = lastRun.results.filter(function (x) { return x.formId === mapForm; })[0];
      var rows = [[{ v: '양식별 항목 대조표 — ' + f.name + ' (' + f.id + ' v' + c.v + ')', s: 1 }], [{ v: '원본 서식 항목 ↔ 정의서 ↔ 시스템 화면·저장·엑셀 출력 · 시험 ' + lastRun.at, s: 5 }], [],
        ['원본 서식 항목', '정의서 항목 ID', '필수', '화면', '저장 경로', '엑셀 위치', '필수 누락 차단', '판정'].map(function (x) { return { v: x, s: 2 }; })];
      rr.items.forEach(function (x) { rows.push([{ v: x.label, s: 3 }, { v: x.id, s: 6 }, { v: x.req ? '필수' : '', s: 6 }, { v: x.scr ? '있음' : '없음', s: 6 }, { v: 'values.' + x.id, s: 3 }, { v: x.xlCell, s: 6 }, { v: x.req ? (x.blk ? '차단' : '미차단') : '—', s: 6 }, { v: x.ok ? '일치' : '불일치', s: 6 }]); });
      rows.push([]); rows.push([{ v: '발주처 확인: ' + (c.signedBy ? c.signedBy + ' · ' + c.signedAt : '미서명'), s: 4 }]);
      var name = '항목대조표_' + f.id + '_v' + c.v + '.xlsx';
      FILES.save(FILES.xlsx([{ name: '대조표', cols: [30, 14, 8, 8, 20, 16, 14, 10], rows: rows, merges: ['A1:H1', 'A2:H2'] }]), name, FILES.XLSX_TYPE);
      DB.audit('내려받기', name); DB.persist();
    };
  };
  function runView(r) {
    return '<div class="qc-hero ' + (r.ok ? 'ok' : 'no') + '"><div class="qh-i">' + I(r.ok ? 'check' : 'x') + '</div><div><b>' + (r.ok ? '모든 항목이 일치합니다' : '일치하지 않는 항목을 확인해 주세요') + '</b>' +
      '<span>' + r.at + ' · ' + h(r.by) + ' · 양식 ' + r.results.length + '종 · 항목 ' + r.pass + ' / ' + r.total + ' 통과' + (r.inject ? ' · 체험용 오류 재현 중' : '') + '</span></div>' +
      '<div class="qh-n"><b>' + r.pass + '</b><i>/ ' + r.total + '</i></div></div>' +
      '<p class="muted sm">정의서의 각 항목이 입력 화면·저장 값·엑셀 출력에 연결되는지 대조합니다. 필수 항목 누락 검증도 함께 수행하며, 정의서 자체의 누락 여부는 원본 서식과 비교해 확인해 주세요. 체험 환경의 브라우저 내 검증 결과입니다.</p>' +
      '<div class="qcl">' + r.results.map(function (x) {
        var open = qcOpen[x.formId] || x.fails;
        return '<section class="card qcf ' + (x.fails ? 'no' : 'ok') + '"><button class="qcf-h" data-act="tog" data-f="' + x.formId + '"><span class="qd">' + I(x.fails ? 'x' : 'check') + '</span><b>' + h(x.name) + '</b><code>' + x.formId + ' v' + x.v + '</code>' +
          '<span class="qcf-n">' + x.pass + ' / ' + x.total + ' · 필수 ' + x.req + '</span><span class="mb"><i style="width:' + (x.pass / x.total * 100) + '%"></i></span></button>' +
          (open ? '<div class="tbl"><table class="qct"><thead><tr><th>항목 ID</th><th>항목</th><th>필수</th><th>화면</th><th>저장</th><th>엑셀 위치</th><th>필수 누락 차단</th><th>판정</th></tr></thead><tbody>' + x.items.map(function (it) {
            function c(v) { return v === null ? '<span class="muted">—</span>' : v ? '<i class="y">' + I('check') + '</i>' : '<i class="n">' + I('x') + '</i>'; }
            return '<tr class="' + (it.ok ? '' : 'bad') + '"><td class="mono">' + it.id + '</td><td>' + h(it.label) + '</td><td>' + (it.req ? '필수' : '') + '</td><td>' + c(it.scr) + '</td><td>' + c(it.db) + '</td><td class="mono sm">' + (it.xl === false ? '<b class="red">없음</b>' : h(it.xlCell)) + '</td><td>' + (it.req ? c(it.blk) : '<span class="muted">—</span>') + '</td><td>' + (it.ok ? '<span class="pill green">일치</span>' : '<span class="pill red">불일치</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' : '') + '</section>';
      }).join('') + '</div>' +
      '<section class="card"><div class="card-h"><h3>시험 실행 이력</h3></div><div class="tbl"><table><thead><tr><th>시각</th><th>실행</th><th>결과</th><th>항목</th></tr></thead><tbody>' + DB.S.qcRuns.slice(0, 8).map(function (x) {
        return '<tr><td class="mono sm">' + x.at + '</td><td>' + h(x.by) + (x.inject ? ' <em class="tag orange">오류 재현</em>' : '') + '</td><td>' + (x.ok ? APP.pill('done', '검증 통과') : APP.pill('rejected', '확인 필요')) + '</td><td class="mono">' + x.pass + ' / ' + x.total + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
  }
  function mapView(u) {
    var forms = DB.S.forms.filter(function (f) { return !f.check; });
    var f = DB.form(mapForm), c = DB.formCurrent(mapForm), rr = lastRun.results.filter(function (x) { return x.formId === mapForm; })[0];
    return '<section class="card"><div class="card-h"><label class="fl inl"><span>양식</span><select class="in" data-chg="mf">' + forms.map(function (x) { return '<option value="' + x.id + '"' + (x.id === mapForm ? ' selected' : '') + '>' + h(x.name) + '</option>'; }).join('') + '</select></label>' +
      '<div class="row"><button class="btn ghost" data-act="mxl">' + I('down') + ' 대조표 엑셀</button>' + (u.role === 'admin' ? '<button class="btn ' + (c.locked ? 'ghost' : 'pri') + '" data-act="msign">' + I('lock') + ' ' + (c.locked ? '발주처 확인 완료' : '발주처 확인 서명') + '</button>' : '') + '</div></div>' +
      '<p class="muted sm">원본 서식과 필수 항목 목록을 대조한 뒤 확인 서명을 남겨 주세요. 현재 ' + f.id + ' v' + c.v + ' · ' + (c.signedBy ? '확인: ' + h(c.signedBy) + ' · ' + c.signedAt : '미서명') + '</p>' +
      '<div class="tbl"><table class="qct"><thead><tr><th>원본 서식 항목</th><th>정의서 항목 ID</th><th>필수</th><th>화면</th><th>저장 경로</th><th>엑셀 위치</th><th>시험 결과</th></tr></thead><tbody>' + rr.items.map(function (it) {
        return '<tr class="' + (it.ok ? '' : 'bad') + '"><td><b>' + h(it.label) + '</b></td><td class="mono">' + it.id + '</td><td>' + (it.req ? '필수' : '') + '</td><td>' + (it.scr ? '입력란 [data-item=' + it.id + ']' : '<b class="red">없음</b>') + '</td><td class="mono sm">values.' + it.id + '</td><td class="mono sm">' + h(it.xlCell) + '</td><td>' + (it.ok ? APP.pill('done', '일치') : APP.pill('rejected', '불일치')) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + (f.original ? '<p class="muted sm">엑셀 위치는 「원본 서식 시트 셀 · 항목 표 시트 셀」 순서입니다.</p>' : '') + '</section>';
  }
  function stepsView() {
    var S = [['원본 서식 확인', '원본 서식과 필수 항목 목록을 확인하고 항목명·입력 유형·필수 여부를 정의합니다.', '양식 담당자', 'forms'],
      ['초안 작성', '양식 관리에서 항목을 추가하거나 정의서 엑셀을 가져와 새 버전 초안을 만듭니다.', '관리자', 'forms'],
      ['항목 검증', '입력 화면·저장 값·엑셀 출력과 필수 항목 누락 차단 결과를 확인합니다.', '양식 검증', 'qc'],
      ['대조표 확인', '자동 검증 결과와 별도로 원본 서식을 비교하고 확인 서명을 남깁니다.', '항목 대조표', 'docs'],
      ['버전 관리', '확정된 새 버전을 사용하되 기존 서류는 작성 당시 버전으로 보관합니다.', '서류 양식', 'forms']];
    return '<div class="qsteps">' + S.map(function (s, i) {
      return '<div class="qs"><span class="qs-n">' + (i + 1) + '</span><div><b>' + s[0] + '</b><p>' + s[1] + '</p><i>' + s[2] + '</i></div></div>';
    }).join('') + '</div>';
  }

  /* ====================================================================== */
  /* 긴급작업                                                                */
  /* ====================================================================== */
  P.emergency = function (root) {
    var u = DB.me();
    var list = u.role === 'partner' ? DB.S.emergencies.filter(function (e) { return e.reporterId === u.id; })
      : DB.filterScope(DB.S.emergencies).filter(APP.siteOk);
    var canAct = u.role !== 'partner';
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">접수 → 조치 중 → 조치 완료 · 접수 즉시 작업관리자·안전관리자에게 알림톡 발송 요청</p><h2>긴급작업</h2></div>' +
      '<button class="btn danger" data-act="report">' + I('emergency') + ' 긴급작업 접수</button></div>' +
      '<div class="alert gray">' + I('lock') + '<div><b>「조치 중」으로 바꾸는 것만으로 실제 작업 착수가 승인되지는 않습니다.</b><span>실제 작업이 필요하면 작업으로 연결해 작업자 안전 확인 · 작업관리자 승인과, 허가 대상이면 작업허가 조건을 충족한 뒤 착수합니다.</span></div></div>' +
      (list.length ? '<div class="emgs">' + list.map(function (e) {
        var w = e.workId ? DB.byId(DB.S.works, e.workId) : null;
        return '<section class="card emg ' + e.status + '"><div class="emg-h"><span class="emg-i">' + I('emergency') + '</span><div><b>' + h(e.place) + '</b><span>' + e.id + ' · ' + h(APP.siteName(e.site)) + ' · ' + APP.relDay(e.at) + ' · 접수 ' + h(e.reporter) + '</span></div>' + APP.pill(e.status, DB.EMG_STATUS[e.status]) + '</div>' +
          '<p class="emg-w">' + h(e.what) + '</p>' +
          (e.photos.length ? '<div class="ph">' + e.photos.map(function (p) { return '<figure class="ph-i"><img src="' + FE.photoUrl(p) + '" alt="현장 사진"></figure>'; }).join('') + '</div>' : '') +
          '<p class="muted sm">알림톡 발송 요청: ' + (e.notified.length ? e.notified.map(h).join(', ') : '—') + '</p>' +
          '<ol class="tl">' + e.actions.slice().reverse().map(function (x) { return '<li><i></i><b>' + h(x.what) + '</b><span>' + h(x.by) + ' · ' + x.at + '</span></li>'; }).join('') + '</ol>' +
          (canAct ? '<div class="emg-a">' + (e.status === 'received' ? '<button class="btn warn sm" data-act="st" data-e="' + e.id + '" data-s="acting">조치 중으로 변경</button>' : '') +
            (e.status !== 'closed' ? '<button class="btn ghost sm" data-act="act" data-e="' + e.id + '">조치 기록</button><button class="btn ghost sm" data-act="st" data-e="' + e.id + '" data-s="closed">조치 완료</button>' : '') +
            (w ? '<a class="btn ghost sm" href="#/works/' + w.id + '">연결된 작업 ' + w.id + '</a>' : (e.status !== 'closed' && u.role !== 'safety' ? '<button class="btn pri sm" data-act="link" data-e="' + e.id + '">' + I('works') + ' 작업으로 연결</button>' : '')) + '</div>' : '') +
          '</section>';
      }).join('') + '</div>' : APP.empty('접수된 긴급작업이 없습니다'));
    APP.acts.report = function () { emgModal(); };
    APP.acts.st = function (a) {
      var e = DB.byId(DB.S.emergencies, a.getAttribute('data-e')), s = a.getAttribute('data-s');
      APP.ask({ title: DB.EMG_STATUS[s] + ' — ' + e.id, msg: s === 'acting' ? '대응 현황을 「조치 중」으로 바꿉니다. 실제 작업 착수 승인과는 별개입니다.' : '조치 결과를 기록하고 종료합니다.', input: true, req: s === 'closed', label: s === 'closed' ? '조치 결과' : '메모 (선택)', ok: DB.EMG_STATUS[s] }, function (v) {
        e.status = s; e.actions.push({ at: DB.stamp(), by: DB.who(), what: DB.EMG_STATUS[s] + (v ? ' — ' + v : '') });
        DB.audit('긴급작업 ' + DB.EMG_STATUS[s], e.id); DB.persist(); APP.rerender();
      });
    };
    APP.acts.act = function (a) {
      var e = DB.byId(DB.S.emergencies, a.getAttribute('data-e'));
      APP.ask({ title: '조치 기록 — ' + e.id, input: true, req: true, label: '조치 내용', ok: '기록' }, function (v) { e.actions.push({ at: DB.stamp(), by: DB.who(), what: v }); DB.persist(); APP.rerender(); });
    };
    APP.acts.link = function (a) {
      var e = DB.byId(DB.S.emergencies, a.getAttribute('data-e'));
      if (!e || !DB.inScope(e) || e.workId || ['admin', 'manager'].indexOf(DB.me().role) < 0) { APP.toast('작업으로 연결할 수 없는 접수 건입니다', 'warn'); return; }
      P.workModal({ site: e.site, siteLocked: true, title: '[긴급] ' + e.what.split(' — ')[0], place: e.place, start: DB.dayStr(0) + 'T' + DB.hm(new Date()) }, function (w) {
        if (!e.workId && DB.inScope(e) && DB.inScope(w) && w.site === e.site) {
          e.workId = w.id; e.actions.push({ at: DB.stamp(), by: DB.who(), what: '작업 ' + w.id + '로 연결 — 안전 확인·시작 승인 후 착수' });
          DB.audit('긴급작업 연결', e.id + ' → ' + w.id); DB.persist();
        } else APP.toast('현장이 달라 접수 건과 연결하지 않았습니다. 작업 현장을 확인해 주세요.', 'warn');
      });
    };
  };
  function emgModal() {
    var u = DB.me();
    var photos = [];
    APP.modal({ title: '긴급작업 접수', cls: 'md', body:
      '<div class="frm2"><label class="fl"><span>현장</span><select class="in" name="site">' + u.sites.map(function (s) { return '<option value="' + s + '">' + h(APP.siteName(s)) + '</option>'; }).join('') + '</select></label>' +
      '<label class="fl"><span>위치 <b class="req">*</b></span><input class="in" name="place" placeholder="예: 냉각수 펌프실 앞 배관"></label>' +
      '<label class="fl span2"><span>상황 <b class="req">*</b></span><textarea class="in" rows="3" name="what" placeholder="무엇이 어떤 상태인지 적어 주세요"></textarea></label></div>' +
      '<div class="ph" data-eph><label class="ph-add"><input type="file" accept="image/*" hidden data-ef><span>＋ 사진</span></label><button type="button" class="ph-add sm" data-es>＋ 샘플</button></div>' +
      '<p class="muted sm">접수하면 해당 현장의 작업관리자·안전관리자에게 알림톡 발송을 즉시 요청하고 대시보드 상단에 고정 표시합니다. 실제 전달은 대행사·통신 상태에 따라 달라질 수 있어 결과를 함께 표시합니다.</p>',
      foot: '<button class="btn ghost" data-mx>취소</button><button class="btn danger" data-ma="ok">' + I('emergency') + ' 접수</button>',
      mount: function (el) {
        var box = el.querySelector('[data-eph]');
        function draw() { Array.prototype.forEach.call(box.querySelectorAll('figure'), function (f) { f.remove(); }); photos.forEach(function (p) { var fg = document.createElement('figure'); fg.className = 'ph-i'; fg.innerHTML = '<img src="' + FE.photoUrl(p) + '" alt="">'; box.insertBefore(fg, box.firstChild); }); }
        el.querySelector('[data-ef]').addEventListener('change', function (e) { if (e.target.files[0]) FE.shrink(e.target.files[0], function (p) { if (p) { photos.push(p); draw(); } }); });
        el.querySelector('[data-es]').addEventListener('click', function () { photos.push({ seed: '긴급 현장 ' + (photos.length + 1) }); draw(); });
      },
      acts: { ok: function (a, el, close) {
        var o = { site: el.querySelector('[name=site]').value, place: el.querySelector('[name=place]').value.trim(), what: el.querySelector('[name=what]').value.trim(), photos: photos };
        if (!o.place || !o.what) { APP.toast('위치와 상황을 입력해 주세요', 'err'); return; }
        var e = DB.reportEmergency(o); e.reporterId = u.id; DB.persist();
        close(); APP.toast(e.id + ' 접수 — ' + e.notified.length + '명에게 알림톡 발송 요청', 'warn'); APP.rerender();
      } } });
  }

  /* ====================================================================== */
  /* 알림톡 발송 이력                                                         */
  /* ====================================================================== */
  var talkF = '';
  P.alimtalk = function (root) {
    var u = DB.me();
    var all = DB.S.alimtalk.filter(function (a) { return u.sites.indexOf(a.site) >= 0 && APP.siteOk(a); });
    var list = all.filter(function (a) { return !talkF || (talkF === 'miss' ? (a.result === 'failed' || a.result === 'unknown') : a.result === talkF); });
    var cnt = function (k) { return all.filter(function (a) { return a.result === k; }).length; };
    var sample = DB.S.works.filter(function (w) { return w.id === 'J-1031'; })[0];
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">발송 어댑터 · 대행사 1곳 · 발송 요청 / 대행사 접수 / 전달 결과 / 작업자 확인을 구분</p><h2>알림톡 발송 이력</h2></div></div>' +
      '<div class="kpis k4">' +
        '<button class="kpi' + (talkF === '' ? ' sel' : '') + '" data-act="tf" data-f=""><span>전체</span><b>' + all.length + '<em>건</em></b><i>발송 요청 기준</i></button>' +
        '<button class="kpi' + (talkF === 'delivered' ? ' sel' : '') + '" data-act="tf" data-f="delivered"><span>전달 완료</span><b>' + cnt('delivered') + '<em>건</em></b><i>전달 결과만으로 열람을 단정하지 않습니다</i></button>' +
        '<button class="kpi amber' + (talkF === 'accepted' ? ' sel' : '') + '" data-act="tf" data-f="accepted"><span>접수 · 재발송 중</span><b>' + (cnt('accepted') + cnt('retrying')) + '<em>건</em></b><i>대행사 결과 대기</i></button>' +
        '<button class="kpi red' + (talkF === 'miss' ? ' sel' : '') + '" data-act="tf" data-f="miss"><span>최종 실패 · 결과 미확인</span><b>' + (cnt('failed') + cnt('unknown')) + '<em>건</em></b><i>작업관리자 직접 연락 대상</i></button>' +
      '</div>' +
      '<div class="g2 at">' +
        '<section class="card flat span2"><div class="tbl"><table><thead><tr><th>요청 시각</th><th>템플릿</th><th>수신자</th><th>관련</th><th>결과</th><th>시도</th><th>사유</th><th></th></tr></thead><tbody>' + list.map(function (a) {
          var href = a.ref.indexOf('J-') === 0 ? '#/works/' + a.ref : a.ref.indexOf('PT-') === 0 ? '#/permits/' + a.ref : '#/emergency';
          return '<tr><td class="mono sm">' + a.at + '</td><td>' + h(DB.TPL[a.tpl].name) + ' <code class="sm">' + DB.TPL[a.tpl].code + '</code></td><td><b>' + h(a.toName) + '</b><br><span class="muted sm">' + h(a.phone.replace(/(\d{3})-(\d{2})\d{2}-(\d{4})/, '$1-$2**-$3')) + '</span></td><td><a class="lnk" href="' + href + '">' + a.ref + '</a></td><td>' + APP.tpill(a) + '</td><td>' + a.tries + '</td><td class="sm">' + h(a.reason || a.note || '') + '</td>' +
            '<td>' + (a.result === 'failed' && a.reason.indexOf('재시도 불가') < 0 || a.result === 'unknown' ? '<button class="btn xs ghost" data-act="retry" data-a="' + a.id + '">' + (a.result === 'unknown' ? '결과 재조회' : '재발송') + '</button>' : a.result === 'failed' ? '<span class="muted sm">연락처 확인</span>' : '') + '</td></tr>';
        }).join('') + '</tbody></table></div></section>' +
        '<section class="card"><div class="card-h"><h3>작업 배정 템플릿</h3><code>' + DB.TPL.assign.code + '</code></div>' +
          '<div class="kakao"><div class="kk-h"><span class="kk-logo">' + APP.logo() + '</span><b>가온케미칼 안전관리</b><i>알림톡</i></div><div class="kk-b">' +
          '<p><b>[작업 배정] #{현장} #{작업명}</b></p><p>일시: #{작업일시}<br>위치: #{작업장소}<br>위험 요인: #{위험요인}<br>착용 보호구: #{보호구}</p><p>작업 전 아래 버튼을 눌러 안전 확인을 완료해 주세요. 링크는 #{만료일시}까지 유효합니다.</p>' +
          '<span class="kk-btn">작업 확인하기</span></div></div>' +
          '<p class="muted sm">작업 내용과 위험 요인·보호구·확인 링크를 안내합니다. 아래 문안은 체험용 예시이며 실제 알림톡은 발송되지 않습니다.' + (sample ? ' 예: ' + sample.id + ' — ' + h(sample.ppe.join(', ')) : '') + '</p>' +
          '<dl class="kv sm"><dt>재시도</dt><dd>재시도 가능한 실패 건에만 재발송 버튼이 표시됩니다.</dd><dt>중복</dt><dd>같은 배정 건·내용 버전의 최초 발송은 한 번만 요청합니다.</dd><dt>직접 연락</dt><dd>최종 실패·결과 미확인 건은 연락처를 확인해 직접 안내해 주세요.</dd></dl></section>' +
        '<section class="card"><div class="card-h"><h3>발송·확인 현황</h3></div><ol class="tsteps">' + [
          ['발송 요청', '배정 확정 순간 시스템이 발송 어댑터에 요청', all.length + '건'],
          ['대행사 접수', '대행사 API가 요청을 받았다는 응답', all.filter(function (a) { return a.result !== 'failed' || a.tries > 1; }).length + '건'],
          ['전달 결과', '대행사가 알려 준 카카오톡 전달 성공·실패', cnt('delivered') + '건 전달 · ' + cnt('failed') + '건 실패 · ' + cnt('unknown') + '건 미확인'],
          ['작업자 확인', '현재 계정·선택 현장의 안전 확인 기록 — 전달 결과와 별개', DB.filterScope(DB.S.works).filter(APP.siteOk).reduce(function (n, w) { return n + w.workers.filter(function (k) { return DB.checkValid(w, k); }).length; }, 0) + '건']
        ].map(function (x, i) { return '<li><span class="ts-n">' + (i + 1) + '</span><div><b>' + x[0] + '</b><p>' + x[1] + '</p></div><em>' + x[2] + '</em></li>'; }).join('') + '</ol>' +
        '<p class="muted sm">전달 완료는 안전 확인 완료와 다릅니다. 시작 승인 전 작업자 전원의 안전 확인과 작업허가·승인 권한을 함께 확인해 주세요.</p></section>' +
      '</div>';
    APP.acts.tf = function (a) { talkF = a.getAttribute('data-f'); APP.rerender(); };
    APP.acts.retry = function (a) {
      var r = DB.retryTalk(a.getAttribute('data-a'));
      if (!r.ok) { APP.toast(r.msg, 'err'); return; }
      APP.toast('재발송을 요청했습니다 — 대행사 결과를 기다립니다'); APP.rerender();
    };
  };

  /* ====================================================================== */
  /* 공지 · 비상연락망                                                        */
  /* ====================================================================== */
  P.notices = function (root) {
    var u = DB.me(), list = P.noticesFor(u), canEdit = u.role !== 'partner';
    var sites = u.sites.filter(function (s) { return APP.siteOk({ site: s }); });
    root.innerHTML =
      '<div class="operations-banner compact safety-banner"><div><p>현장 안내</p><h2>작업 전, 현장 안내를 확인하세요.</h2><span>필독 공지와 비상연락망을 확인해 주세요.</span></div><img src="assets/safety-station.jpg" alt="안전모·보안경·장갑이 놓인 준비 공간 — 생성 이미지" loading="lazy"></div>' +
      '<div class="ph-h"><div><p class="eyebrow">현장 공지와 비상 연락처를 확인합니다.</p><h2>공지 · 비상연락망</h2></div>' +
      (canEdit ? '<button class="btn pri" data-act="new">' + I('plus') + ' 공지 등록</button>' : '') + '</div>' +
      '<div class="g2">' +
        '<section class="card span2"><div class="card-h"><h3>공지사항</h3></div><ul class="nt">' + list.map(function (n) {
          var sc = n.scope === 'all' ? '전체' : n.scope.charAt(0) === 'S' ? APP.siteName(n.scope) : APP.partnerName(n.scope);
          return '<li class="notice-item' + (n.pin ? ' notice-pinned' : '') + '"><div class="nt-h">' + (n.pin ? '<em class="tag amber">고정</em>' : '') + (n.must ? '<em class="tag red">필독</em>' : '') + '<h4>' + h(n.title) + '</h4></div>' +
            '<p class="nt-meta"><span>대상: ' + h(sc) + '</span><span>게시 기간: ' + h(n.from) + ' ~ ' + h(n.to) + '</span><span>작성자: ' + h(n.by) + '</span></p>' +
            '<p class="nt-body">' + h(n.body) + '</p>' +
            (n.must ? '<p class="nt-reads">작업자 확인 ' + Object.keys(n.reads || {}).length + '명</p>' : '') + '</li>';
        }).join('') + '</ul></section>' +
        sites.map(function (s) {
          var cs = DB.S.contacts.filter(function (c) { return c.site === s; });
          return '<section class="card"><div class="card-h"><h3>' + I('phone') + ' ' + h(APP.siteName(s)) + ' 비상연락망</h3></div><ul class="ct">' + cs.map(function (c) {
            return '<li><span class="ct-r">' + h(c.role) + '</span><b>' + h(c.name) + '</b><a class="ct-t" href="tel:' + c.tel.replace(/-/g, '') + '">' + I('phone') + ' ' + (u.role === 'partner' && c.tel.indexOf('010') === 0 ? c.tel.replace(/(\d{3})-(\d{2})\d{2}-(\d{4})/, '$1-$2**-$3') : c.tel) + '</a></li>';
          }).join('') + '</ul>' + (canEdit ? '<button class="btn xs ghost" data-act="ct" data-s="' + s + '">' + I('plus') + ' 연락처 추가</button>' : '') + '</section>';
        }).join('') +
      '</div>';
    APP.acts.new = function () {
      APP.modal({ title: '공지 등록', cls: 'md', body:
        '<label class="fl"><span>제목 <b class="req">*</b></span><input class="in" name="t"></label><label class="fl"><span>내용 <b class="req">*</b></span><textarea class="in" rows="4" name="b"></textarea></label>' +
        '<div class="frm2"><label class="fl"><span>대상</span><select class="in" name="s"><option value="all">전체</option>' + sites.map(function (s) { return '<option value="' + s + '">' + h(APP.siteName(s)) + '</option>'; }).join('') + DB.S.partners.map(function (p) { return '<option value="' + p.id + '">' + h(p.name) + '</option>'; }).join('') + '</select></label>' +
        '<label class="fl"><span>게시 종료일 <b class="req">*</b></span><input class="in" type="date" name="to" min="' + DB.dayStr(0) + '" value="' + DB.dayStr(7) + '"></label></div>' +
        '<label class="chk1"><input type="checkbox" name="pin"><span>상단 고정</span></label><label class="chk1"><input type="checkbox" name="must"><span>필독 공지 — 작업자의 안전 확인 단계에 표시</span></label>',
        foot: '<button class="btn ghost" data-mx>취소</button><button class="btn pri" data-ma="ok">등록</button>',
        acts: { ok: function (a, el, close) {
          var t = el.querySelector('[name=t]').value.trim(), b = el.querySelector('[name=b]').value.trim();
          if (!t || !b) { APP.toast('제목과 내용을 입력해 주세요', 'err'); return; }
          var to = el.querySelector('[name=to]').value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(to) || to < DB.dayStr(0)) { APP.toast('게시 종료일을 오늘 이후로 입력해 주세요', 'err'); return; }
          DB.S.notices.unshift({ id: 'N-0' + (++DB.S.seq.N), title: t, body: b, scope: el.querySelector('[name=s]').value, pin: el.querySelector('[name=pin]').checked, must: el.querySelector('[name=must]').checked, from: DB.dayStr(0), to: el.querySelector('[name=to]').value, by: u.name, at: DB.stamp(), reads: {} });
          DB.audit('공지 등록', t); DB.persist(); close(); APP.toast('공지를 등록했습니다'); APP.rerender();
        } } });
    };
    APP.acts.ct = function (a) {
      var s = a.getAttribute('data-s');
      APP.modal({ title: '비상 연락처 추가 — ' + APP.siteName(s), cls: 'sm', body: '<label class="fl"><span>구분</span><input class="in" name="r" placeholder="예: 지정 병원"></label><label class="fl"><span>이름</span><input class="in" name="n"></label><label class="fl"><span>전화번호</span><input class="in" name="t" placeholder="052-000-0000"></label>',
        foot: '<button class="btn ghost" data-mx>취소</button><button class="btn pri" data-ma="ok">추가</button>',
        acts: { ok: function (b, el, close) {
          var o = { site: s, role: el.querySelector('[name=r]').value.trim(), name: el.querySelector('[name=n]').value.trim(), tel: el.querySelector('[name=t]').value.trim() };
          if (!o.role || !o.name || !/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(o.tel)) { APP.toast('구분·이름·전화번호 형식을 확인해 주세요', 'err'); return; }
          DB.S.contacts.push(o); DB.persist(); close(); APP.rerender();
        } } });
    };
  };

  /* ====================================================================== */
  /* 기준정보 — 현장 · 협력업체 · 작업자                                        */
  /* ====================================================================== */
  var masterTab = 'workers';
  P.master = function (root) {
    var u = DB.me(), isP = u.role === 'partner';
    if (isP) masterTab = 'workers';
    var canEdit = u.role === 'admin' || isP;
    var workers = DB.S.workers.filter(function (w) {
      if (isP) return w.partner === u.partner;
      var p = DB.partner(w.partner); return p.sites.some(function (s) { return u.sites.indexOf(s) >= 0 && (APP.siteFilter === 'all' || s === APP.siteFilter); });
    });
    var t = DB.dayStr(0);
    var tabs = isP ? '' : '<div class="tabs">' + [['sites', '현장'], ['partners', '협력업체'], ['workers', '작업자']].map(function (x) { return '<button class="tab' + (masterTab === x[0] ? ' on' : '') + '" data-act="mt" data-t="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var body = '';
    if (masterTab === 'sites') body = '<section class="card flat"><div class="tbl"><table><thead><tr><th>현장</th><th>주소</th><th>담당 작업관리자</th><th>출입 협력업체</th><th>오늘 작업</th></tr></thead><tbody>' + DB.S.sites.filter(function (s) { return u.sites.indexOf(s.id) >= 0 && APP.siteOk({ site: s.id }); }).map(function (s) {
      return '<tr><td><b>' + h(s.name) + '</b> <code>' + s.id + '</code></td><td>' + h(s.addr) + '</td><td>' + h(s.manager) + '</td><td>' + DB.S.partners.filter(function (p) { return p.sites.indexOf(s.id) >= 0; }).map(function (p) { return '<em class="tag">' + h(p.name) + '</em>'; }).join(' ') + '</td><td>' + DB.S.works.filter(function (w) { return w.site === s.id && w.start.slice(0, 10) === t; }).length + '건</td></tr>';
    }).join('') + '</tbody></table></div><p class="muted sm">고객사 → 현장 → 협력업체 → 작업자의 소속 계층으로 관리합니다. 협력업체는 「현장별 출입 협력업체」로 따로 연결합니다.</p></section>';
    else if (masterTab === 'partners') body = '<section class="card flat"><div class="tbl"><table><thead><tr><th>협력업체</th><th>업종</th><th>출입 현장</th><th>담당자</th><th>작업자</th></tr></thead><tbody>' + DB.S.partners.filter(function (p) { return p.sites.some(function (s) { return u.sites.indexOf(s) >= 0 && APP.siteOk({ site: s }); }); }).map(function (p) {
      return '<tr><td><b>' + h(p.name) + '</b> <code>' + p.id + '</code></td><td>' + h(p.biz) + '</td><td>' + p.sites.filter(function (s) { return u.sites.indexOf(s) >= 0 && APP.siteOk({ site: s }); }).map(function (s) { return '<em class="tag">' + h(APP.siteName(s)) + '</em>'; }).join(' ') + '</td><td>' + h(p.contact) + '</td><td>' + DB.S.workers.filter(function (w) { return w.partner === p.id; }).length + '명</td></tr>';
    }).join('') + '</tbody></table></div></section>';
    else body = '<section class="card flat"><div class="card-h"><h3>작업자 ' + workers.length + '명</h3>' + (canEdit ? '<div class="row"><button class="btn ghost" data-act="tplx">' + I('down') + ' 일괄 등록 양식</button><button class="btn pri" data-act="bulk">' + I('plus') + ' 엑셀 일괄 등록</button></div>' : '') + '</div>' +
      '<div class="tbl"><table><thead><tr><th>이름</th><th>소속</th><th>직종</th><th>휴대전화</th><th>안전교육 이수</th><th>유효기간</th><th>상태</th></tr></thead><tbody>' + workers.map(function (w) {
        var exp = w.eduUntil < t, soon = !exp && w.eduUntil <= DB.dayStr(30);
        return '<tr><td><b>' + h(w.name) + '</b> <code class="sm">' + w.id + '</code></td><td>' + h(APP.partnerName(w.partner)) + '</td><td>' + h(w.trade) + '</td><td class="mono sm">' + w.phone.replace(/(\d{3})-(\d{2})\d{2}-(\d{4})/, '$1-$2**-$3') + '</td><td class="mono sm">' + w.eduDate + '</td><td class="mono sm">' + w.eduUntil + '</td><td>' + (exp ? APP.pill('rejected', '교육 만료') : soon ? APP.pill('supplement', '만료 임박') : APP.pill('done', '유효')) + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="muted sm">체험용 전화번호는 일부를 가려 표시합니다. 변경 내용은 현재 브라우저에 저장됩니다. 교육이 만료된 작업자는 배정 화면에서 경고로 표시합니다.</p></section>';
    root.innerHTML = '<div class="ph-h"><div><p class="eyebrow">' + (isP ? h(APP.partnerName(u.partner)) + ' 소속 작업자만 보입니다' : '허용된 현장 범위의 기준정보') + '</p><h2>' + (isP ? '우리 작업자' : '현장 · 협력업체 · 작업자') + '</h2></div></div>' + tabs + body;
    APP.acts.mt = function (a) { masterTab = a.getAttribute('data-t'); APP.rerender(); };
    APP.acts.tplx = function () {
      var rows = [[{ v: '작업자 일괄 등록 양식', s: 1 }], [{ v: '협력업체는 등록된 이름 그대로, 휴대전화는 010-0000-0000 형식, 날짜는 YYYY-MM-DD', s: 5 }], [], ['이름', '협력업체', '직종', '휴대전화', '안전교육 이수일'].map(function (x) { return { v: x, s: 2 }; }),
        [{ v: '홍길동', s: 3 }, { v: isP ? APP.partnerName(u.partner) : '동해플랜트설비', s: 3 }, { v: '배관', s: 3 }, { v: '010-1234-5678', s: 3 }, { v: DB.dayStr(-10), s: 3 }]];
      FILES.save(FILES.xlsx([{ name: '작업자', cols: [12, 18, 10, 16, 16], rows: rows, merges: ['A1:E1', 'A2:E2'] }]), '작업자_일괄등록_양식.xlsx', FILES.XLSX_TYPE);
    };
    APP.acts.bulk = function () { bulkModal(u); };
  };
  function bulkModal(u) {
    var pName = u.role === 'partner' ? APP.partnerName(u.partner) : '동해플랜트설비';
    var sample = [['고은찬', pName, '배관', '010-5521-3308', DB.dayStr(-5)], ['민서우', pName, '용접', '010-77-1234', DB.dayStr(-20)], ['강민호', pName, '용접', '010-4417-2381', DB.dayStr(-3)],
      ['도하준', '없는협력업체', '보온', '010-2231-9087', DB.dayStr(-8)], ['차유나', pName, '비계', '010-6645-1020', DB.dayStr(-1)]];
    APP.modal({ title: '작업자 엑셀 일괄 등록', cls: 'lg', body:
      '<p class="mdl-msg">양식 내려받기 → 작성 → 올리기 → <b>오류 행 표시 후 정상 행만 등록</b>합니다.</p>' +
      '<div class="row"><label class="btn ghost">' + I('down') + ' 엑셀(.xlsx) 선택<input type="file" accept=".xlsx" hidden data-bf></label><button class="btn ghost" data-ma="sample">샘플 5행으로 시연</button></div><div data-bres></div>',
      foot: '<button class="btn ghost" data-mx>닫기</button>',
      acts: { sample: function (a, el, close) { check(el, sample, close); } },
      mount: function (el, close) {
        el.querySelector('[data-bf]').addEventListener('change', function (e) {
          var f = e.target.files[0]; if (!f) return;
          f.arrayBuffer().then(readXlsx).then(function (rows) {
            var hi = -1; rows.forEach(function (r, i) { if (hi < 0 && r && r[0] === '이름') hi = i; });
            if (hi < 0) throw new Error('머리글 「이름」 행을 찾지 못했습니다 — 일괄 등록 양식을 사용해 주세요');
            check(el, rows.slice(hi + 1).filter(function (r) { return r && r.some(Boolean); }), close);
          }).catch(function (err) { el.querySelector('[data-bres]').innerHTML = '<div class="alert red">' + I('x') + '<div><b>읽기 실패</b><span>' + h(err.message) + '</span></div></div>'; });
        });
      } });
    function educationDate(value) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
      // Local noon avoids UTC parsing and keeps the calendar date stable.
      var date = new Date(value + 'T12:00:00');
      return !isNaN(date.getTime()) && DB.ymd(date) === value ? date : null;
    }
    function inspectRows(rows) {
      var phones = Object.create(null);
      rows.forEach(function (r) { var phone = (r[3] || '').trim(); phones[phone] = (phones[phone] || 0) + 1; });
      return rows.map(function (r, i) {
        var e = [], p = DB.S.partners.filter(function (x) { return x.name === (r[1] || '').trim(); })[0];
        if (!(r[0] || '').trim()) e.push('이름 없음');
        if (!p) e.push('등록되지 않은 협력업체');
        else if (u.role === 'partner' && p.id !== u.partner) e.push('다른 협력업체 작업자는 등록할 수 없음');
        if (!/^010-\d{4}-\d{4}$/.test((r[3] || '').trim())) e.push('휴대전화 형식 오류');
        else if (DB.S.workers.some(function (w) { return w.phone === r[3].trim(); })) e.push('이미 등록된 휴대전화');
        if (phones[(r[3] || '').trim()] > 1) e.push('파일 내 휴대전화 중복');
        if (!/^\d{4}-\d{2}-\d{2}$/.test((r[4] || '').trim())) e.push('교육 이수일 형식 오류');
        else if (!educationDate(r[4].trim())) e.push('존재하지 않는 교육 이수일');
        return { row: i + 1, r: r, p: p, e: e };
      });
    }
    function check(el, rows, close) {
      var res = inspectRows(rows);
      var good = res.filter(function (x) { return !x.e.length; });
      var box = el.querySelector('[data-bres]');
      box.innerHTML = '<div class="tbl"><table><thead><tr><th>행</th><th>이름</th><th>협력업체</th><th>직종</th><th>휴대전화</th><th>교육 이수일</th><th>검사</th></tr></thead><tbody>' + res.map(function (x) {
        return '<tr class="' + (x.e.length ? 'bad' : '') + '"><td>' + x.row + '</td>' + [0, 1, 2, 3, 4].map(function (k) { return '<td>' + h(x.r[k] || '') + '</td>'; }).join('') + '<td>' + (x.e.length ? '<b class="red">' + x.e.map(h).join(', ') + '</b>' : APP.pill('done', '정상')) + '</td></tr>';
      }).join('') + '</tbody></table></div><div class="row"><span class="muted sm">정상 ' + good.length + '행 · 오류 ' + (res.length - good.length) + '행 — 오류 행은 등록하지 않습니다</span><span class="sp"></span><button class="btn pri" data-go' + (good.length ? '' : ' disabled') + '>정상 행만 등록 (' + good.length + '명)</button></div>';
      var go = box.querySelector('[data-go]');
      go.addEventListener('click', function () {
        if (!good.length) return;
        // Recheck just before saving in case another registration occurred
        // after this preview was opened.
        if (inspectRows(good.map(function (x) { return x.r; })).some(function (x) { return x.e.length; })) {
          check(el, rows, close); APP.toast('등록 정보가 변경되어 다시 검사했습니다. 오류 행을 확인해 주세요.', 'warn'); return;
        }
        good.forEach(function (x) {
          var id = 'W' + (DB.S.workers.length + 1 < 10 ? '0' : '') + (DB.S.workers.length + 1);
          var ed = x.r[4].trim(), until = DB.ymd(DB.addDays(educationDate(ed), 365));
          DB.S.workers.push({ id: id, name: x.r[0].trim(), phone: x.r[3].trim(), partner: x.p.id, trade: (x.r[2] || '').trim(), eduDate: ed, eduUntil: until });
        });
        DB.audit('작업자 일괄 등록', good.length + '명 등록 · 오류 ' + (res.length - good.length) + '행 제외'); DB.persist();
        close(); APP.toast(good.length + '명을 등록했습니다'); APP.rerender();
      });
    }
  }

  /* ====================================================================== */
  /* 권한표 · 권한 시험                                                        */
  /* ====================================================================== */
  var tests = [];
  P.access = function (root) {
    var roles = ['admin', 'manager', 'safety', 'partner', 'worker'];
    var LEG = { R: '조회', W: '등록·수정', A: '승인·확인', 'R*': '자기 회사만 조회', 'W*': '자기 회사만 등록', 'A†': '승인 범위 협력업체만', 'W‡': '배정된 작업만 (링크)' };
    var SC = [
      ['U6', 'permit', 'PT-021', '세진전기 담당자가 동해플랜트설비의 작업허가 PT-021 조회'],
      ['U2', 'work', 'J-1034', '울산 1공장 작업관리자가 울산 2공장 작업 J-1034 조회'],
      ['U4', 'work', 'J-1037', '안전관리자(울산 1·2공장)가 여수 공장 작업 J-1037 조회'],
      ['U5', 'doc', 'D-0126', '동해플랜트설비 담당자가 세진전기 교육 일지 D-0126 내려받기'],
      ['U2', 'start', 'J-1034', '박서준(승인 범위 동해·세진)이 한결배관 작업 J-1034 시작 승인'],
      ['U4', 'permit', 'PT-022', '안전관리자가 울산 1공장 작업허가 PT-022 조회 (허용 범위)']
    ];
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">역할별 업무 권한과 현장·협력업체 접근 범위를 확인합니다.</p><h2>사용자 권한</h2></div></div>' +
      '<section class="card flat"><div class="tbl"><table class="perm"><thead><tr><th>기능</th>' + roles.map(function (r) { return '<th><span class="role r-' + r + '">' + DB.ROLES[r] + '</span></th>'; }).join('') + '</tr></thead><tbody>' +
        DB.PERMS.map(function (p) { return '<tr><td>' + h(p[0]) + '</td>' + roles.map(function (r) { var v = p[1][r]; return '<td>' + (v ? '<span class="pm pm-' + v.charAt(0) + '" title="' + h(LEG[v] || v) + '">' + v + '</span>' : '<span class="muted">—</span>') + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div><p class="muted sm">' + Object.keys(LEG).map(function (k) { return '<b>' + k + '</b> ' + LEG[k]; }).join(' · ') + '</p></section>' +
      '<div class="g2">' +
        '<section class="card"><div class="card-h"><h3>사용자</h3></div><ul class="li">' + DB.S.users.map(function (x) {
          return '<li><div><b>' + h(x.name) + ' <span class="role r-' + x.role + '">' + DB.ROLES[x.role] + '</span></b><span>' + h(x.title) + ' · 현장 ' + x.sites.map(APP.siteName).join(', ') + (x.approve ? ' · 승인 범위 ' + x.approve.map(APP.partnerName).join(', ') : '') + '</span></div></li>';
        }).join('') + '</ul></section>' +
        '<details class="card diagnostic"><summary>접근 권한 점검</summary><p class="muted sm">가상 계정의 접근 범위를 브라우저 내 규칙으로 점검합니다.</p><ul class="tests">' + SC.map(function (s, i) {
          var r = tests[i];
          return '<li><div><b>' + h(s[3]) + '</b>' + (r ? '<span class="' + (r.ok ? 'g' : 'r') + '">' + h(r.msg) + '</span>' : '') + '</div><button class="btn xs ghost" data-act="test" data-i="' + i + '">요청 보내기</button></li>';
        }).join('') + '</ul><a class="lnk" href="#/audit">감사 로그에서 거부 기록 보기 ' + I('arrow') + '</a></details>' +
      '</div>';
    APP.acts.test = function (a) {
      var i = +a.getAttribute('data-i'), s = SC[i];
      var who = DB.byId(DB.S.users, s[0]), obj, ok, msg;
      if (s[1] === 'start') {
        obj = DB.byId(DB.S.works, s[2]);
        var g = DB.startGuard(obj, who);
        ok = g.ok; msg = ok ? '허용' : '거부 — ' + g.reasons.filter(function (x) { return x.indexOf('권한') >= 0; }).concat(g.reasons)[0];
      } else {
        obj = DB.byId(s[1] === 'permit' ? DB.S.permits : s[1] === 'work' ? DB.S.works : DB.S.docs, s[2]);
        ok = DB.inScope(obj, who);
        msg = ok ? '허용 — 200 · 허용된 범위의 요청입니다' : '거부 — 403 · 허용 범위 밖 (' + APP.siteName(obj.site) + (obj.partner ? ' · ' + APP.partnerName(obj.partner) : '') + ')';
      }
      DB.S.audit.unshift({ at: DB.stamp(), user: who.name + ' (' + DB.ROLES[who.role] + ') — 권한 시험', action: ok ? '접근 허용' : '권한 거부', target: s[3], result: ok ? '성공' : '거부 403' });
      DB.persist(); tests[i] = { ok: ok, msg: msg }; APP.rerender();
    };
  };

  /* ====================================================================== */
  /* 감사 로그                                                               */
  /* ====================================================================== */
  var auditF = '';
  P.audit = function (root) {
    var kinds = ['권한 거부', '로그인', '내려받기', '설정 변경', '작업 시작 승인', '작업허가'];
    var list = DB.S.audit.filter(function (a) { return !auditF || a.action.indexOf(auditF) === 0; });
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">로그인 · 권한 거부 · 서류 내려받기 · 관리자 설정 변경을 별도 기록</p><h2>감사 로그</h2></div></div>' +
      '<div class="tabs"><button class="tab' + (!auditF ? ' on' : '') + '" data-act="af" data-f="">전체 <b>' + DB.S.audit.length + '</b></button>' + kinds.map(function (k) {
        return '<button class="tab' + (auditF === k ? ' on' : '') + '" data-act="af" data-f="' + k + '">' + k + ' <b>' + DB.S.audit.filter(function (a) { return a.action.indexOf(k) === 0; }).length + '</b></button>';
      }).join('') + '</div>' +
      '<section class="card flat"><div class="tbl"><table><thead><tr><th>시각</th><th>사용자</th><th>행위</th><th>대상</th><th>결과</th></tr></thead><tbody>' + list.slice(0, 120).map(function (a) {
        return '<tr class="' + (a.result.indexOf('거부') >= 0 ? 'bad' : '') + '"><td class="mono sm">' + a.at + '</td><td>' + h(a.user) + '</td><td><b>' + h(a.action) + '</b></td><td class="sm">' + h(a.target) + '</td><td>' + (a.result.indexOf('거부') >= 0 || a.result === '잠금' ? APP.pill('rejected', a.result) : APP.pill('done', a.result)) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    APP.acts.af = function (a) { auditF = a.getAttribute('data-f'); APP.rerender(); };
  };
})(window);
