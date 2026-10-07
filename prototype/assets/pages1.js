/* ==========================================================================
   pages1.js — 로그인 · 대시보드 · 협력업체 홈 · 작업 관리 · 작업허가
   ========================================================================== */
(function (G) {
  'use strict';
  var DB = G.DB, FE = G.FE, APP = G.APP, h = FE.h, I = APP.icon;
  var P = APP.pages;
  APP.viewResetters.push(function () {
    workTab = 'active'; permitTab = 'open'; permitView = { rev: null, tab: 'req' }; draftPermit = null;
  });

  /* ====================================================================== */
  /* 로그인                                                                  */
  /* ====================================================================== */
  var DEMO = [
    ['admin@demo.site', 'admin2026', '관리자', '고객사 전체 현장 · 양식 정의서 · 권한'],
    ['manager@demo.site', 'manager2026', '작업관리자', '울산 1공장 · 작업 배정 · 시작 승인'],
    ['safety@demo.site', 'safety2026', '안전관리자', '작업허가 검토 · 서류 확인 서명'],
    ['partner@demo.site', 'partner2026', '협력업체', '동해플랜트설비 · 작업허가 신청'],
    ['partner2@demo.site', 'partner2026', '협력업체', '세진전기'],
    ['manager2@demo.site', 'manager2026', '작업관리자', '울산 2공장 · 작업 배정 · 시작 승인']
  ];
  P.login = function (root) {
    document.body.classList.remove('is-m');
    root.innerHTML =
      '<div class="login-layout">' +
      '<section class="lg-hero">' +
        '<div class="lg-brand"><span class="logo">' + APP.logo() + '</span><b>작업안전 통합관리</b></div>' +
        '<div class="lg-welcome"><span class="lg-label">현장 운영 포털</span><h1>오늘의 현장을<br>안전하게 연결합니다.</h1>' +
        '<p>작업 일정과 안전 확인, 작업허가와 서류를 한곳에서 관리하세요.</p></div>' +
        '<p class="lg-note">체험용 가상 데이터 · 실제 알림톡은 발송되지 않습니다.</p>' +
      '</section>' +
      '<section class="lg-form">' +
        '<form class="lg-card" data-login novalidate>' +
          '<a class="to-main" href="../index.html" aria-label="제안 자료 메인으로">' + I('back') + '<span>메인으로</span></a>' +
          '<h2>로그인</h2><p class="muted">업무 영역을 선택하고 계정 정보를 입력해 주세요.</p>' +
          '<label class="fl"><span>업무 영역</span><select class="in" name="area" data-area><option value="admin">관리자</option><option value="manager">작업관리자</option><option value="safety">안전관리자</option><option value="partner">협력업체</option></select></label>' +
          '<label class="fl"><span>이메일</span><input class="in" name="email" type="email" placeholder="이메일을 입력해 주세요" autocomplete="username" required></label>' +
          '<label class="fl"><span>비밀번호</span><input class="in" name="pw" type="password" placeholder="비밀번호를 입력해 주세요" autocomplete="current-password" required></label>' +
          '<p class="fi-e" data-lerr hidden></p>' +
          '<button class="btn pri lg-btn" type="submit">로그인 ' + I('arrow') + '</button>' +
          '<div class="demo-heading"><b>체험 계정</b><span>계정을 누르면 입력란에 채워집니다.</span></div><div class="demo" data-accounts></div>' +
          '<a class="lg-m" href="#/m">' + I('phone') + '<span><b>작업자 작업 확인</b><i>배정된 작업과 안전 확인 →</i></span></a>' +
          '<p class="muted sm">변경 내용은 현재 브라우저에만 저장됩니다.</p>' +
          '<button type="button" class="lnk sm" data-reset>체험 데이터 초기화</button>' +
        '</form>' +
      '</section></div>';
    var f = root.querySelector('[data-login]');
    function accounts() {
      var area = f.elements.area.value;
      root.querySelector('[data-accounts]').innerHTML = DEMO.map(function (d, i) {
        if (roleKey(d[2], i) !== area) return '';
        return '<button type="button" class="demo-a" data-demo="' + i + '"><span><b>' + d[2] + '</b><i>' + d[3] + '</i></span><span><b>' + d[0] + '</b><code>' + d[1] + '</code></span></button>';
      }).join('');
      root.querySelectorAll('[data-demo]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = DEMO[+b.getAttribute('data-demo')];
        f.email.value = d[0]; f.pw.value = d[1];
        root.querySelectorAll('.demo-a').forEach(function (x) { x.classList.toggle('on', x === b); });
        root.querySelector('[data-lerr]').hidden = true;
      });
      });
    }
    accounts();
    root.querySelector('[data-area]').addEventListener('change', function () { f.email.value = ''; f.pw.value = ''; root.querySelector('[data-lerr]').hidden = true; accounts(); });
    root.querySelector('[data-reset]').addEventListener('click', function () {
      APP.ask({ title: '체험 데이터 초기화', msg: '변경한 체험 데이터를 지우고 처음 상태로 돌아갑니다.', ok: '초기화', danger: true }, function () { DB.reset(); APP.resetViewState(); APP.toast('초기화했습니다'); });
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = DB.S.users.filter(function (x) { return x.email === f.email.value.trim().toLowerCase() && x.pw === f.pw.value; })[0];
      var er = root.querySelector('[data-lerr]');
      if (!u) { er.hidden = false; er.textContent = '이메일 또는 비밀번호가 맞지 않습니다. 체험 계정을 눌러 입력해 보세요.'; return; }
      if (u.role !== f.elements.area.value) { er.hidden = false; er.textContent = '선택한 업무 영역과 계정이 일치하지 않습니다. 업무 영역을 확인해 주세요.'; return; }
      DB.S.session = { uid: u.id, at: DB.stamp() };
      APP.resetViewState();
      DB.audit('로그인', u.email); DB.persist();
      APP.go(APP.homeOf(u));
    });
  };
  function roleKey(label, i) { return ['admin', 'manager', 'safety', 'partner', 'partner', 'manager'][i]; }
  function plant() {
    return '<svg class="lg-plant" viewBox="0 0 600 240" aria-hidden="true">' +
      '<g class="pl-far"><rect x="20" y="120" width="70" height="120"/><rect x="100" y="90" width="40" height="150"/><rect x="420" y="110" width="90" height="130"/><rect x="520" y="70" width="34" height="170"/></g>' +
      '<g class="pl-mid"><rect x="150" y="60" width="26" height="180" rx="4"/><rect x="186" y="40" width="20" height="200" rx="4"/>' +
      '<circle cx="290" cy="170" r="52"/><rect x="238" y="170" width="104" height="70"/><rect x="360" y="130" width="50" height="110" rx="6"/>' +
      '<path d="M150 100h-40M206 80h60v40M342 150h18M410 160h30"/></g>' +
      '<g class="pl-acc"><path d="M0 214 H600" /><circle cx="196" cy="34" r="4"/><circle cx="163" cy="54" r="4"/><rect x="270" y="160" width="40" height="6"/></g>' +
      '<g class="pl-steam"><circle cx="196" cy="22" r="10"/><circle cx="208" cy="12" r="7"/><circle cx="163" cy="44" r="8"/></g>' +
      '</svg>';
  }

  /* ====================================================================== */
  /* 대시보드                                                                */
  /* ====================================================================== */
  function scopedWorks() { return DB.filterScope(DB.S.works).filter(APP.siteOk); }
  function scopedPermits() { return DB.filterScope(DB.S.permits).filter(APP.siteOk); }
  function pendingWorkers(w) { return w.workers.filter(function (wid) { return !DB.checkValid(w, wid); }); }

  P.dash = function (root) {
    var u = DB.me(), t = DB.dayStr(0);
    var works = scopedWorks();
    var today = works.filter(function (w) { return w.start.slice(0, 10) === t; });
    var assigned = works.filter(function (w) { return w.status === 'assigned'; });
    var waitWorkers = assigned.reduce(function (a, w) { return a + pendingWorkers(w).length; }, 0);
    var readyStart = assigned.filter(function (w) { return DB.startGuard(w, u).ok; });
    var permits = scopedPermits().filter(function (p) { return p.status === 'submitted' || p.status === 'reviewing'; });
    var emg = DB.filterScope(DB.S.emergencies).filter(APP.siteOk).filter(function (e) { return e.status !== 'closed'; });
    var talks = DB.S.alimtalk.filter(function (a) { return (a.result === 'failed' || a.result === 'unknown') && u.sites.indexOf(a.site) >= 0 && APP.siteOk(a); });
    var docs = DB.filterScope(DB.S.docs).filter(APP.siteOk);

    var kpi = [
      ['오늘의 작업', today.length, '건', today.filter(function (w) { return w.status === 'working'; }).length + '건 작업 중', 'works', ''],
      ['작업자 확인 대기', waitWorkers, '명', assigned.length + '건 작업에 배정', 'works', waitWorkers ? 'amber' : ''],
      ['시작 승인 가능', readyStart.length, '건', '안전 확인 · 작업허가 · 승인 권한 충족', 'works', readyStart.length ? 'blue' : ''],
      ['작업허가 검토 대기', permits.length, '건', '신청 · 검토 중', 'permits', permits.length ? 'amber' : ''],
      ['긴급작업 진행', emg.length, '건', '접수 · 조치 중', 'emergency', emg.length ? 'red' : '']
    ];
    var days = [], done = [], prog = [];
    for (var i = -6; i <= 0; i++) {
      var d = DB.dayStr(i);
      var dw = works.filter(function (w) { return w.start.slice(0, 10) === d; });
      days.push(i === 0 ? '오늘' : d.slice(5).replace('-', '.'));
      done.push(dw.filter(function (w) { return w.status === 'done'; }).length);
      prog.push(dw.filter(function (w) { return w.status !== 'done'; }).length);
    }
    var forms = DB.S.forms.filter(function (f) { return !f.check; });
    var sites = u.sites.filter(function (s) { return APP.siteFilter === 'all' || s === APP.siteFilter; });

    root.innerHTML =
      '<div class="operations-banner"><div><p>현장 운영</p><h2>오늘의 작업을 확인하세요.</h2><span>안전 확인과 승인 대기 건을 먼저 확인해 주세요.</span></div><img src="assets/safety-team.jpg" alt="보호구를 착용하고 현장을 점검하는 작업자 — 생성 이미지"></div>' +
      '<div class="hello"><div><p class="eyebrow">' + t.replace(/-/g, '.') + ' · ' + h(u.title) + '</p><h2>' + h(u.name) + '님, 오늘의 현장 현황입니다</h2></div>' +
      (u.role !== 'safety' ? '<button class="btn pri" data-act="newWork">' + I('plus') + ' 작업 등록</button>' : '<a class="btn pri" href="#/permits">' + I('permits') + ' 작업허가 검토</a>') + '</div>' +
      (emg.length ? '<a class="alert red" href="#/emergency">' + I('emergency') + '<div><b>긴급작업 ' + emg.length + '건 진행 중</b><span>' + emg.map(function (e) { return h(APP.siteName(e.site) + ' · ' + e.place + ' — ' + e.what); }).join(' / ') + '</span></div><i>' + I('arrow') + '</i></a>' : '') +
      '<div class="kpis">' + kpi.map(function (k) {
        return '<a class="kpi ' + k[5] + '" href="#/' + k[4] + '"><span>' + k[0] + '</span><b data-count="' + k[1] + '">' + k[1] + '<em>' + k[2] + '</em></b><i>' + k[3] + '</i></a>';
      }).join('') + '</div>' +
      '<div class="g2">' +
        '<section class="card span2"><div class="card-h"><h3>오늘의 작업</h3><a class="lnk" href="#/works">전체 보기 ' + I('arrow') + '</a></div>' +
          (today.length ? '<div class="tw">' + today.map(workRow).join('') + '</div>' : APP.empty('오늘 예정된 작업이 없습니다')) + '</section>' +
        '<section class="card"><div class="card-h"><h3>현장별 오늘 진행률</h3></div><div class="rings">' + sites.map(function (s) {
          var sw = today.filter(function (w) { return w.site === s; });
          var fin = sw.filter(function (w) { return ['working', 'reported', 'done'].indexOf(w.status) >= 0; }).length;
          return '<div class="rg">' + APP.ring(sw.length ? fin / sw.length * 100 : 0, APP.siteName(s)) + '<div><b>' + h(APP.siteName(s)) + '</b><span>작업 ' + sw.length + '건 · 시작 ' + fin + '건</span></div></div>';
        }).join('') + '</div><p class="muted sm">시작 = 작업 시작 승인 이후(작업 중 · 완료 보고 · 완료)</p>' +
          '<ul class="dist">' + ['registered', 'assigned', 'working', 'reported', 'done'].map(function (st) {
            var c = today.filter(function (w) { return w.status === st; }).length;
            return '<li><span>' + DB.WORK_STATUS[st] + '</span><span class="mb"><i class="st-' + st + '" style="width:' + (today.length ? c / today.length * 100 : 0) + '%"></i></span><b>' + c + '</b></li>';
          }).join('') + '</ul></section>' +
        '<section class="card"><div class="card-h"><h3>최근 7일 작업</h3></div>' + APP.bars(days, [{ name: '완료 확인', cls: 's-green', values: done }, { name: '진행 · 예정', cls: 's-amber', values: prog }], { label: '최근 7일 작업 건수' }) + '</section>' +
        '<section class="card"><div class="card-h"><h3>서류 상태</h3><a class="lnk" href="#/docs">서류함 ' + I('arrow') + '</a></div>' + APP.bars(forms.map(function (f) { return f.short; }), [
          { name: '확인 완료', cls: 's-green', values: forms.map(function (f) { return docs.filter(function (d) { return d.formId === f.id && d.status === 'confirmed'; }).length; }) },
          { name: '제출', cls: 's-blue', values: forms.map(function (f) { return docs.filter(function (d) { return d.formId === f.id && d.status === 'submitted'; }).length; }) },
          { name: '작성 중', cls: 's-gray', values: forms.map(function (f) { return docs.filter(function (d) { return d.formId === f.id && d.status === 'draft'; }).length; }) }
        ], { label: '양식별 서류 상태' }) + '</section>' +
        '<section class="card"><div class="card-h"><h3>작업허가 검토 대기</h3><a class="lnk" href="#/permits">' + I('arrow') + '</a></div>' +
          (permits.length ? '<ul class="li">' + permits.map(function (p) {
            return '<li><a href="#/permits/' + p.id + '"><b>' + p.id + ' · ' + h(p.title) + '</b><span>' + h(APP.partnerName(p.partner)) + ' · ' + p.revs.length + '차 · ' + APP.relDay(p.revs[p.revs.length - 1].at) + '</span></a>' + APP.ppill(p) + '</li>';
          }).join('') + '</ul>' : APP.empty('검토 대기 중인 신청이 없습니다')) + '</section>' +
        '<section class="card"><div class="card-h"><h3>알림톡 미수신 · 결과 미확인</h3><a class="lnk" href="#/alimtalk">' + I('arrow') + '</a></div>' +
          (talks.length ? '<ul class="li">' + talks.slice(0, 5).map(function (a) {
            return '<li><div><b>' + h(a.toName) + ' · ' + h(DB.TPL[a.tpl].name) + '</b><span>' + h(a.ref) + ' · ' + h(a.reason || '') + '</span></div>' + APP.tpill(a) + '</li>';
          }).join('') + '</ul><p class="muted sm">최종 실패 · 결과 미확인 건은 작업관리자가 직접 연락할 수 있도록 표시합니다.</p>' : APP.empty('미수신 건이 없습니다')) + '</section>' +
      '</div>';
    APP.acts.newWork = function () { workModal(); };
  };
  function workRow(w) {
    var pend = pendingWorkers(w), n = w.workers.length, ok = n - pend.length;
    var per = w.permitId ? DB.byId(DB.S.permits, w.permitId) : null;
    return '<a class="twr" href="#/works/' + w.id + '">' +
      '<span class="twr-t"><b>' + h(w.title) + '</b><i>' + w.id + ' · ' + h(APP.siteName(w.site)) + ' · ' + h(APP.partnerName(w.partner)) + ' · ' + APP.hhmm(w.start) + '</i></span>' +
      '<span class="twr-k">' + (DB.needsPermit(w) ? '<em class="tag amber">' + DB.WORK_TYPES[w.type].label + '</em>' : '<em class="tag">' + DB.WORK_TYPES[w.type].label + '</em>') + '</span>' +
      '<span class="twr-c"><span class="mb"><i style="width:' + (n ? ok / n * 100 : 0) + '%"></i></span><i>확인 ' + ok + '/' + n + '</i></span>' +
      '<span class="twr-p">' + (per ? APP.ppill(per) : DB.needsPermit(w) ? APP.pill('rejected', '허가 없음') : '<span class="muted sm">허가 비대상</span>') + '</span>' +
      '<span class="twr-s">' + APP.wpill(w) + '</span></a>';
  }

  /* ====================================================================== */
  /* 협력업체 홈                                                             */
  /* ====================================================================== */
  P.home = function (root) {
    var u = DB.me(), pt = DB.partner(u.partner);
    var permits = DB.filterScope(DB.S.permits), works = DB.filterScope(DB.S.works).filter(function (w) { return w.status !== 'done'; });
    var notices = noticesFor(u);
    var sup = permits.filter(function (p) { return p.status === 'supplement'; });
    root.innerHTML =
      '<div class="operations-banner compact"><div><p>협력업체 업무</p><h2>오늘의 작업과 허가 신청</h2><span>배정된 작업과 보완 요청을 확인해 주세요.</span></div><img src="assets/plant-overview.jpg" alt="플랜트 전경 — 생성 이미지"></div>' +
      '<div class="hello"><div><p class="eyebrow">' + h(pt.name) + ' · ' + h(pt.biz) + '</p><h2>' + h(u.name) + '님, 안녕하세요</h2></div>' +
      '<div class="row"><a class="btn pri" href="#/permits/new">' + I('plus') + ' 작업허가 신청</a><a class="btn danger-o" href="#/emergency">' + I('emergency') + ' 긴급작업 접수</a></div></div>' +
      (sup.length ? '<a class="alert amber" href="#/permits/' + sup[0].id + '">' + I('permits') + '<div><b>보완 요청 ' + sup.length + '건</b><span>' + h(sup[0].reviews[sup[0].reviews.length - 1].reason) + '</span></div><i>' + I('arrow') + '</i></a>' : '') +
      '<div class="kpis k3">' +
        '<a class="kpi" href="#/permits"><span>진행 중인 작업허가</span><b>' + permits.filter(function (p) { return ['submitted', 'reviewing', 'supplement'].indexOf(p.status) >= 0; }).length + '<em>건</em></b><i>신청 · 검토 · 보완</i></a>' +
        '<a class="kpi blue" href="#/works"><span>배정된 작업</span><b>' + works.length + '<em>건</em></b><i>완료 확인 전</i></a>' +
        '<a class="kpi" href="#/master"><span>우리 작업자</span><b>' + DB.S.workers.filter(function (w) { return w.partner === u.partner; }).length + '<em>명</em></b><i>교육 만료 ' + DB.S.workers.filter(function (w) { return w.partner === u.partner && w.eduUntil < DB.dayStr(0); }).length + '명</i></a>' +
      '</div>' +
      '<div class="g2">' +
        '<section class="card"><div class="card-h"><h3>우리 회사 작업허가</h3><a class="lnk" href="#/permits">' + I('arrow') + '</a></div><ul class="li">' + permits.slice(0, 6).map(function (p) {
          return '<li><a href="#/permits/' + p.id + '"><b>' + p.id + ' · ' + h(p.title) + '</b><span>' + h(APP.siteName(p.site)) + ' · ' + p.validFrom + ' ~ ' + p.validTo + ' · ' + p.revs.length + '차</span></a>' + APP.ppill(p) + '</li>';
        }).join('') + '</ul></section>' +
        '<section class="card"><div class="card-h"><h3>배정된 작업</h3></div>' + (works.length ? '<div class="tw">' + works.map(workRow).join('') + '</div>' : APP.empty('배정된 작업이 없습니다')) + '</section>' +
        '<section class="card span2"><div class="card-h"><h3>공지</h3><a class="lnk" href="#/notices">' + I('arrow') + '</a></div><ul class="li">' + notices.slice(0, 4).map(function (n) {
          return '<li><div><b>' + (n.must ? '<em class="tag red">필독</em> ' : '') + h(n.title) + '</b><span>' + h(n.body) + '</span></div><span class="muted sm">' + n.from + '</span></li>';
        }).join('') + '</ul></section>' +
      '</div>';
  };
  function noticesFor(u) {
    var t = DB.dayStr(0);
    return DB.S.notices.filter(function (n) {
      if (n.from > t || n.to < t) return false;
      if (n.scope === 'all') return true;
      if (n.scope.charAt(0) === 'S') return u.sites.indexOf(n.scope) >= 0 && APP.siteOk({ site: n.scope });
      if (n.scope.charAt(0) === 'P') {
        var partner = DB.partner(n.scope);
        return !!partner && (u.role !== 'partner' || u.partner === n.scope) && partner.sites.some(function (s) { return u.sites.indexOf(s) >= 0 && APP.siteOk({ site: s }); });
      }
      return false;
    }).sort(function (a, b) { return (b.pin - a.pin) || (b.at > a.at ? 1 : -1); });
  }
  P.noticesFor = noticesFor;

  /* ====================================================================== */
  /* 작업 관리                                                               */
  /* ====================================================================== */
  var workTab = 'active';
  P.works = function (root, args) {
    if (args[0]) return workDetail(root, args[0]);
    var u = DB.me(), all = scopedWorks();
    var tabs = [['active', '진행 중', function (w) { return ['registered', 'assigned', 'working', 'reported'].indexOf(w.status) >= 0; }],
      ['assigned', '확인 대기', function (w) { return w.status === 'assigned'; }],
      ['working', '작업 중', function (w) { return w.status === 'working'; }],
      ['reported', '완료 보고', function (w) { return w.status === 'reported'; }],
      ['done', '완료', function (w) { return w.status === 'done'; }],
      ['all', '전체', function () { return true; }]];
    var cur = tabs.filter(function (t) { return t[0] === workTab; })[0] || tabs[0];
    var list = all.filter(cur[2]).sort(function (a, b) { return a.start < b.start ? 1 : -1; });
    var canCreate = u.role === 'admin' || u.role === 'manager';
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">작업 일정과 배정·승인·완료 현황을 관리합니다.</p><h2>작업 관리</h2></div>' +
      (canCreate ? '<button class="btn pri" data-act="new">' + I('plus') + ' 작업 등록</button>' : '') + '</div>' +
      '<div class="tabs">' + tabs.map(function (t) {
        return '<button class="tab' + (t[0] === cur[0] ? ' on' : '') + '" data-act="tab" data-t="' + t[0] + '">' + t[1] + ' <b>' + all.filter(t[2]).length + '</b></button>';
      }).join('') + '</div>' +
      '<section class="card flat">' + (list.length ? '<div class="tw">' + list.map(workRow).join('') + '</div>' : APP.empty('해당 상태의 작업이 없습니다')) + '</section>';
    APP.acts.tab = function (a) { workTab = a.getAttribute('data-t'); APP.rerender(); };
    APP.acts.new = function () { workModal(); };
  };

  var STEPS = ['등록', '배정 · 알림톡', '작업자 확인', '시작 승인', '작업 중', '완료 보고', '완료 확인'];
  function stepIndex(w) {
    if (w.status === 'registered') return 1;
    if (w.status === 'assigned') return pendingWorkers(w).length ? 2 : 3;
    if (w.status === 'working') return 5;
    if (w.status === 'reported') return 6;
    if (w.status === 'done') return 7;
    return 0;
  }
  function mask(p) { return p.replace(/(\d{3})-(\d{2})\d{2}-(\d{4})/, '$1-$2**-$3'); }

  function workDetail(root, id) {
    var w = DB.byId(DB.S.works, id), u = DB.me();
    if (!w) { root.innerHTML = APP.empty('작업을 찾을 수 없습니다'); return; }
    if (!DB.guard('work', w, '작업 ' + w.id + ' 조회 (' + APP.siteName(w.site) + ' · ' + APP.partnerName(w.partner) + ')')) { DB.persist(); root.innerHTML = APP.deny('이 작업은 허용된 현장·협력업체 범위 밖입니다.'); return; }
    var per = w.permitId ? DB.byId(DB.S.permits, w.permitId) : null;
    var g = DB.startGuard(w, u);
    var pend = pendingWorkers(w);
    var isMgr = u.role === 'admin' || u.role === 'manager';
    var permitOk = DB.needsPermit(w) ? DB.permitValid(per, w.start.slice(0, 10)) : { ok: true };
    var authOk = u.role === 'admin' || (u.role === 'manager' && u.sites.indexOf(w.site) >= 0 && (u.approve || []).indexOf(w.partner) >= 0);
    var talks = DB.S.alimtalk.filter(function (a) { return a.ref === w.id; });

    var conds = [
      [!pend.length, '배정된 작업자 전원의 유효한 안전 확인', (w.workers.length - pend.length) + ' / ' + w.workers.length + '명 · 내용 v' + w.ver],
      [permitOk.ok, DB.needsPermit(w) ? '허가 대상 작업 — 유효한 작업허가 승인' : '작업허가 — 허가 비대상 작업', DB.needsPermit(w) ? (per ? per.id + ' · ' + DB.PERMIT_STATUS[per.status] + ' · ' + per.validFrom + ' ~ ' + per.validTo : '연결된 허가 없음') : '해당 없음'],
      [authOk, '권한표상 이 협력업체·현장의 승인 권한', u.role === 'manager' ? '승인 범위: ' + (u.approve || []).map(APP.partnerName).join(', ') : DB.ROLES[u.role]]
    ];

    root.innerHTML =
      '<a class="back" href="#/works">← 작업 목록</a>' +
      '<div class="ph-h"><div><p class="eyebrow">' + w.id + ' · ' + h(APP.siteName(w.site)) + ' · ' + h(APP.partnerName(w.partner)) + ' · 내용 v' + w.ver + '</p><h2>' + h(w.title) + ' ' + APP.wpill(w) + '</h2></div>' +
      '<div class="row">' + (isMgr && (w.status === 'registered' || w.status === 'assigned') ? '<button class="btn ghost" data-act="edit">확인 대상 변경</button>' : '') +
      (isMgr && w.status === 'registered' ? '<button class="btn pri" data-act="assign">' + I('alimtalk') + ' 배정 확정 · 알림톡 발송</button>' : '') +
      (isMgr && w.status === 'reported' ? '<button class="btn pri" data-act="done">' + I('check') + ' 완료 확인</button>' : '') + '</div></div>' +
      APP.stepper(STEPS, stepIndex(w)) +
      '<div class="g2 wd">' +
        (w.status === 'assigned' ? '<section class="card span2 gate ' + (g.ok ? 'ok' : 'no') + '"><div class="card-h"><h3>' + I('lock') + ' 작업 시작 승인 조건</h3><span class="muted sm">작업자 확인과 허가·승인 권한을 확인해 주세요.</span></div>' +
          '<ul class="cond">' + conds.map(function (c) { return '<li class="' + (c[0] ? 'y' : 'n') + '"><i>' + I(c[0] ? 'check' : 'x') + '</i><div><b>' + h(c[1]) + '</b><span>' + h(c[2]) + '</span></div></li>'; }).join('') + '</ul>' +
          (isMgr ? '<div class="gate-a"><button class="btn ' + (g.ok ? 'pri' : 'off') + '" data-act="start"' + (g.ok ? '' : ' aria-disabled="true"') + '>' + I('check') + ' 작업 시작 승인</button>' +
            '<span class="muted sm">' + (g.ok ? '모든 조건을 충족했습니다' : '승인 조건을 확인해 주세요. 버튼을 누르면 미충족 항목을 볼 수 있습니다.') + '</span></div>' : '') + '</section>' : '') +
        '<section class="card"><div class="card-h"><h3>작업 정보</h3></div><dl class="kv">' +
          '<dt>일시</dt><dd>' + APP.relDay(w.start) + ' (' + w.start + ')</dd>' +
          '<dt>장소</dt><dd>' + h(w.place) + '</dd>' +
          '<dt>작업 종류</dt><dd>' + DB.WORK_TYPES[w.type].label + (DB.needsPermit(w) ? ' <em class="tag amber">허가 대상</em>' : '') + '</dd>' +
          '<dt>위험 요인</dt><dd><div class="chips ro">' + w.hazards.map(function (x) { return '<span class="chip on red">' + h(x) + '</span>'; }).join('') + '</div></dd>' +
          '<dt>착용 보호구</dt><dd><div class="chips ro">' + w.ppe.map(function (x) { return '<span class="chip on">' + h(x) + '</span>'; }).join('') + '</div></dd>' +
          '<dt>안전 수칙</dt><dd>' + h(w.rules) + '</dd>' +
          '<dt>작업허가</dt><dd>' + (per ? '<a class="lnk" href="#/permits/' + per.id + '">' + per.id + '</a> ' + APP.ppill(per) + ' <span class="muted sm">' + per.validFrom + ' ~ ' + per.validTo + '</span>' : (DB.needsPermit(w) ? '<span class="tag red">연결 필요</span>' : '허가 비대상')) + '</dd>' +
          '<dt>등록</dt><dd>' + h(w.createdBy) + '</dd></dl></section>' +
        '<section class="card"><div class="card-h"><h3>작업자 안전 확인 현황</h3><span class="muted sm">' + (w.workers.length - pend.length) + '/' + w.workers.length + '</span></div>' +
          '<div class="wk">' + w.workers.map(function (wid) {
            var wk = DB.worker(wid), c = w.checks[wid], l = w.links[wid], ok = DB.checkValid(w, wid);
            var tk = talks.filter(function (a) { return a.to === wid; })[0];
            return '<div class="wk-r ' + (ok ? 'y' : '') + '"><span class="av sm">' + h(wk.name.slice(0, 1)) + '</span><div class="wk-t"><b>' + h(wk.name) + ' <i>' + h(wk.trade) + ' · ' + mask(wk.phone) + '</i></b>' +
              '<span>' + (ok ? '확인 ' + c.at.slice(11) + ' · ' + h(c.device) + ' · IP ' + c.ip : (c ? '<em class="tag orange">이전 내용 v' + c.ver + ' 확인 — 재확인 필요</em>' : '미확인')) +
              (l && l.locked ? ' <em class="tag red">링크 잠금</em>' : '') + (wk.eduUntil < DB.dayStr(0) ? ' <em class="tag warn">교육 만료</em>' : '') + '</span></div>' +
              '<div class="wk-a">' + (tk ? APP.tpill(tk) : '') +
              (l && w.status !== 'registered' ? '<a class="btn xs ghost" href="#/m/' + l.token + '" title="작업자가 알림톡 링크를 연 화면">' + I('phone') + ' 작업자 화면</a>' : '') +
              (isMgr && l && (l.locked || (tk && tk.result === 'failed')) ? '<button class="btn xs ghost" data-act="relink" data-w="' + wid + '">링크 재발급</button>' : '') + '</div></div>';
          }).join('') + '</div>' +
          (w.status === 'registered' ? '<p class="muted sm">배정을 확정하면 작업자별 만료형 링크가 발급되고 알림톡 발송이 요청됩니다.</p>' : '<p class="muted sm">확인 기록은 수정할 수 없습니다. 확인 대상(작업자·위험 요인·보호구)이 바뀌면 기존 확인을 무효화하고 재확인을 요청합니다.</p>') + '</section>' +
        (w.report ? '<section class="card"><div class="card-h"><h3>완료 보고</h3><span class="muted sm">' + h(w.report.by) + ' · ' + w.report.at + '</span></div><p>' + h(w.report.note) + '</p><div class="ph">' + (w.report.photos || []).map(function (p) { return '<figure class="ph-i"><img src="' + FE.photoUrl(p) + '" alt="완료 사진"></figure>'; }).join('') + '</div></section>' : '') +
        '<section class="card"><div class="card-h"><h3>이력</h3><span class="muted sm">수행자 · 시각</span></div><ol class="tl">' + w.history.slice().reverse().map(function (x) {
          return '<li><i></i><b>' + h(x.what) + '</b><span>' + h(x.by) + ' · ' + x.at + '</span></li>';
        }).join('') + '</ol></section>' +
      '</div>';

    APP.acts.assign = function () {
      var r = DB.assign(w);
      if (!r.ok) { APP.toast(r.msg, 'err'); return; }
      APP.toast('배정을 확정했습니다 — 작업자 ' + w.workers.length + '명에게 알림톡 발송을 요청했습니다'); APP.rerender();
    };
    APP.acts.start = function () {
      var r = DB.startWork(w);
      if (!r.ok) {
        APP.modal({ title: '작업 시작 승인 불가', cls: 'sm', body: '<p class="mdl-msg">다음 조건을 충족하지 못해 시작 승인할 수 없습니다. 요청 결과는 감사 로그에 기록되었습니다.</p><ul class="cond">' +
          r.reasons.map(function (x) { return '<li class="n"><i>' + I('x') + '</i><div><b>' + h(x) + '</b></div></li>'; }).join('') + '</ul>', foot: '<button class="btn pri" data-mx>확인</button>' });
        return;
      }
      APP.toast('작업 시작을 승인했습니다 — 「작업 중」으로 전환'); APP.rerender();
    };
    APP.acts.done = function () { var r = DB.confirmDone(w); if (!r.ok) { APP.toast(r.msg, 'err'); return; } APP.toast('완료 확인 — 작업을 종료했습니다'); APP.rerender(); };
    APP.acts.relink = function (a) {
      var wid = a.getAttribute('data-w');
      APP.ask({ title: '링크 재발급', msg: DB.workerName(wid) + ' 작업자의 기존 링크를 폐기하고 새 링크를 알림톡으로 다시 보냅니다.', ok: '재발급' }, function () { DB.unlock(w, wid); APP.toast('새 링크를 발급했습니다'); APP.rerender(); });
    };
    APP.acts.edit = function () { editModal(w); };
  }

  /* 확인 대상 변경 → 무효화 · 재확인 */
  function editModal(w) {
    var pool = DB.S.workers.filter(function (x) { return x.partner === w.partner; });
    APP.modal({
      title: '확인 대상 변경 — ' + w.id, cls: 'md',
      body: '<p class="mdl-msg">작업자 · 위험 요인 · 보호구 · 안전 수칙을 바꾸면 <b>내용 버전이 올라가고 기존 확인이 무효화</b>되며, 작업자에게 재확인 알림톡이 발송됩니다. 이전 확인 이력은 그대로 보존됩니다.</p>' +
        '<div class="fe"><div class="fi"><div class="fi-l"><span>작업자</span></div><div class="chips">' + pool.map(function (x) {
          var on = w.workers.indexOf(x.id) >= 0; return '<label class="chip' + (on ? ' on' : '') + '"><input type="checkbox" name="wk" value="' + x.id + '"' + (on ? ' checked' : '') + '><span>' + h(x.name) + ' · ' + h(x.trade) + '</span></label>';
        }).join('') + '</div></div>' +
        '<div class="fi"><div class="fi-l"><span>위험 요인</span></div><div class="chips">' + DB.HAZARDS.map(function (x) {
          var on = w.hazards.indexOf(x) >= 0; return '<label class="chip' + (on ? ' on' : '') + '"><input type="checkbox" name="hz" value="' + h(x) + '"' + (on ? ' checked' : '') + '><span>' + h(x) + '</span></label>';
        }).join('') + '</div></div>' +
        '<div class="fi"><div class="fi-l"><span>착용 보호구</span></div><div class="chips">' + DB.PPE.map(function (x) {
          var on = w.ppe.indexOf(x) >= 0; return '<label class="chip' + (on ? ' on' : '') + '"><input type="checkbox" name="pp" value="' + h(x) + '"' + (on ? ' checked' : '') + '><span>' + h(x) + '</span></label>';
        }).join('') + '</div></div>' +
        '<label class="fl"><span>안전 수칙</span><textarea class="in" rows="2" name="rules">' + h(w.rules) + '</textarea></label></div>',
      foot: '<button class="btn ghost" data-mx>취소</button><button class="btn pri" data-ma="save">변경 저장</button>',
      mount: chipSync,
      acts: { save: function (a, el, close) {
        function vals(n) { return Array.prototype.map.call(el.querySelectorAll('input[name="' + n + '"]:checked'), function (x) { return x.value; }); }
        var ws = vals('wk');
        if (!ws.length) { APP.toast('작업자를 1명 이상 지정해 주세요', 'err'); return; }
        var r = DB.changeContent(w, { workers: ws, hazards: vals('hz'), ppe: vals('pp'), rules: el.querySelector('[name=rules]').value.trim() });
        close();
        if (r.changed) APP.toast('내용 v' + w.ver + '로 변경 — 기존 확인 ' + r.invalid + '건 무효화, 재확인 요청', 'warn');
        else APP.toast('변경된 내용이 없습니다');
        APP.rerender();
      } }
    });
  }
  function chipSync(el) {
    el.addEventListener('change', function (e) {
      var c = e.target.closest('.chip'); if (!c) return;
      if (e.target.type === 'radio') Array.prototype.forEach.call(c.parentNode.querySelectorAll('.chip'), function (x) { x.classList.remove('on'); });
      c.classList.toggle('on', e.target.checked);
    });
  }
  P.chipSync = chipSync;

  /* 작업 등록 */
  function workModal(pre, onCreated) {
    pre = pre || {};
    var u = DB.me();
    var sites = u.sites;
    var s0 = pre.site || (APP.siteFilter !== 'all' ? APP.siteFilter : sites[0]);
    function partnersOf(s) { return DB.S.partners.filter(function (p) { return p.sites.indexOf(s) >= 0; }); }
    function body(s, p, type) {
      var ps = partnersOf(s); p = p && ps.some(function (x) { return x.id === p; }) ? p : (ps[0] ? ps[0].id : '');
      var pool = DB.S.workers.filter(function (x) { return x.partner === p; });
      var permits = DB.S.permits.filter(function (x) { return x.site === s && x.partner === p && x.status !== 'rejected'; });
      var need = DB.WORK_TYPES[type].permit;
      return '<div class="frm2">' +
        '<label class="fl"><span>현장' + (pre.siteLocked ? ' · 긴급 접수 현장' : '') + '</span><select class="in" name="site"' + (pre.siteLocked ? ' disabled' : '') + '>' + sites.map(function (x) { return '<option value="' + x + '"' + (x === s ? ' selected' : '') + '>' + h(APP.siteName(x)) + '</option>'; }).join('') + '</select></label>' +
        '<label class="fl"><span>협력업체</span><select class="in" name="partner">' + ps.map(function (x) { return '<option value="' + x.id + '"' + (x.id === p ? ' selected' : '') + '>' + h(x.name) + '</option>'; }).join('') + '</select></label>' +
        '<label class="fl span2"><span>작업명 <b class="req">*</b></span><input class="in" name="title" value="' + h(pre.title || '') + '" placeholder="예: 냉각수 배관 플랜지 교체"></label>' +
        '<label class="fl"><span>작업 종류</span><select class="in" name="type">' + Object.keys(DB.WORK_TYPES).map(function (k) { return '<option value="' + k + '"' + (k === type ? ' selected' : '') + '>' + DB.WORK_TYPES[k].label + (DB.WORK_TYPES[k].permit ? ' · 허가 대상' : '') + '</option>'; }).join('') + '</select></label>' +
        '<label class="fl"><span>시작 일시 <b class="req">*</b></span><input class="in" type="datetime-local" name="start" value="' + (pre.start || (DB.dayStr(1) + 'T08:00')) + '"></label>' +
        '<label class="fl span2"><span>작업 장소 <b class="req">*</b></span><input class="in" name="place" value="' + h(pre.place || '') + '"></label>' +
        (need ? '<label class="fl span2"><span>작업허가 <b class="req">*</b> <em class="tag amber">허가 대상 작업</em></span><select class="in" name="permit"><option value="">선택 — 승인된 유효한 작업허가가 필요합니다.</option>' + permits.map(function (x) { return '<option value="' + x.id + '"' + (pre.permitId === x.id ? ' selected' : '') + '>' + x.id + ' · ' + h(x.title) + ' (' + DB.PERMIT_STATUS[x.status] + ', ' + x.validFrom + '~' + x.validTo + ')</option>'; }).join('') + '</select></label>' : '') +
        '</div><div class="fe"><div class="fi"><div class="fi-l"><span>작업자 <b class="req">*</b></span></div><div class="chips">' + pool.map(function (x) {
          var exp = x.eduUntil < DB.dayStr(0);
          var on = (pre.workers || []).indexOf(x.id) >= 0;
          return '<label class="chip' + (on ? ' on' : '') + '"><input type="checkbox" name="wk" value="' + x.id + '"' + (on ? ' checked' : '') + '><span>' + h(x.name) + ' · ' + h(x.trade) + (exp ? ' ⚠ 교육 만료' : '') + '</span></label>';
        }).join('') + '</div><p class="muted sm">교육이 만료된 작업자는 경고로 표시됩니다. 배정 전에 교육 이수 현황을 확인해 주세요.</p></div>' +
        '<div class="fi"><div class="fi-l"><span>위험 요인</span></div><div class="chips">' + DB.HAZARDS.map(function (x) { var on = (pre.hazards || []).indexOf(x) >= 0; return '<label class="chip' + (on ? ' on' : '') + '"><input type="checkbox" name="hz" value="' + h(x) + '"' + (on ? ' checked' : '') + '><span>' + h(x) + '</span></label>'; }).join('') + '</div></div>' +
        '<div class="fi"><div class="fi-l"><span>착용 보호구</span></div><div class="chips">' + DB.PPE.map(function (x) { var on = (pre.ppe || ['안전모', '안전화']).indexOf(x) >= 0; return '<label class="chip' + (on ? ' on' : '') + '"><input type="checkbox" name="pp" value="' + h(x) + '"' + (on ? ' checked' : '') + '><span>' + h(x) + '</span></label>'; }).join('') + '</div></div>' +
        '<label class="fl"><span>안전 수칙</span><textarea class="in" rows="2" name="rules">' + h(pre.rules === undefined ? '작업 전 TBM 참석, 작업 구역 통제선 설치' : pre.rules) + '</textarea></label></div>';
    }
    var state = { s: s0, p: pre.partner, t: pre.type || 'general' };
    var m = APP.modal({
      title: '작업 등록', cls: 'lg', body: '<div data-wb>' + body(state.s, state.p, state.t) + '</div>',
      foot: '<label class="chk1 sm"><input type="checkbox" data-now checked><span>등록 후 바로 배정 확정 · 알림톡 발송</span></label><span class="sp"></span><button class="btn ghost" data-mx>취소</button><button class="btn pri" data-ma="save">등록</button>',
      mount: function (el) {
        chipSync(el);
        el.addEventListener('change', function (e) {
          if (['site', 'partner', 'type'].indexOf(e.target.name) < 0) return;
          var b = el.querySelector('[data-wb]');
          state = { s: b.querySelector('[name=site]').value, p: b.querySelector('[name=partner]').value, t: b.querySelector('[name=type]').value };
          var keep = { title: b.querySelector('[name=title]').value, place: b.querySelector('[name=place]').value, start: b.querySelector('[name=start]').value };
          pre.title = keep.title; pre.place = keep.place; pre.start = keep.start;
          function vals(n) { return Array.prototype.map.call(b.querySelectorAll('input[name="' + n + '"]:checked'), function (x) { return x.value; }); }
          pre.workers = vals('wk'); pre.hazards = vals('hz'); pre.ppe = vals('pp'); pre.rules = b.querySelector('[name=rules]').value;
          var permit = b.querySelector('[name=permit]'); if (permit) pre.permitId = permit.value;
          var validPartners = partnersOf(state.s);
          if (!validPartners.some(function (p) { return p.id === state.p; })) state.p = validPartners[0] ? validPartners[0].id : '';
          pre.workers = pre.workers.filter(function (wid) { var worker = DB.worker(wid); return worker && worker.partner === state.p; });
          if (pre.permitId && !DB.S.permits.some(function (p) { return p.id === pre.permitId && p.site === state.s && p.partner === state.p && p.status !== 'rejected'; })) pre.permitId = null;
          b.innerHTML = body(state.s, state.p, state.t);
        });
      },
      acts: { save: function (a, el, close) {
        var b = el.querySelector('[data-wb]');
        function vals(n) { return Array.prototype.map.call(b.querySelectorAll('input[name="' + n + '"]:checked'), function (x) { return x.value; }); }
        var o = { site: b.querySelector('[name=site]').value, partner: b.querySelector('[name=partner]').value, title: b.querySelector('[name=title]').value.trim(),
          type: b.querySelector('[name=type]').value, start: b.querySelector('[name=start]').value.replace('T', ' '), place: b.querySelector('[name=place]').value.trim(),
          workers: vals('wk'), hazards: vals('hz'), ppe: vals('pp'), rules: b.querySelector('[name=rules]').value.trim(), permitId: b.querySelector('[name=permit]') ? b.querySelector('[name=permit]').value : null };
        var miss = [];
        if (!o.title) miss.push('작업명'); if (!o.place) miss.push('작업 장소'); if (!o.start) miss.push('시작 일시'); if (!o.workers.length) miss.push('작업자');
        if (DB.WORK_TYPES[o.type].permit && !o.permitId) miss.push('작업허가');
        if (miss.length) { APP.toast('필수 입력: ' + miss.join(', '), 'err'); return; }
        if (DB.me() !== u || sites.indexOf(o.site) < 0 || (pre.siteLocked && o.site !== s0) || !partnersOf(o.site).some(function (p) { return p.id === o.partner; }) ||
            o.workers.some(function (id) { var worker = DB.worker(id); return !worker || worker.partner !== o.partner; })) {
          APP.toast('현재 계정의 현장·협력업체 범위에 맞는 작업자를 선택해 주세요', 'err'); return;
        }
        var w = DB.createWork(o);
        if (el.querySelector('[data-now]').checked) DB.assign(w);
        if (onCreated) onCreated(w);
        close(); APP.toast(w.id + ' 등록' + (w.status === 'assigned' ? ' · 알림톡 발송 요청' : '')); APP.go('works/' + w.id);
      } }
    });
    return m;
  }
  P.workModal = workModal;

  /* ====================================================================== */
  /* 작업허가                                                                */
  /* ====================================================================== */
  var permitTab = 'open';
  P.permits = function (root, args) {
    if (args[0] === 'new') return permitForm(root, null);
    if (args[0] && args[1] === 'resubmit') return permitForm(root, args[0]);
    if (args[0]) return permitDetail(root, args[0]);
    var u = DB.me(), all = scopedPermits();
    var tabs = [['open', '진행 중', function (p) { return ['submitted', 'reviewing', 'supplement'].indexOf(p.status) >= 0; }],
      ['approved', '승인', function (p) { return p.status === 'approved'; }], ['rejected', '반려 · 취소', function (p) { return p.status === 'rejected' || p.status === 'cancelled'; }],
      ['all', '전체', function () { return true; }]];
    var cur = tabs.filter(function (t) { return t[0] === permitTab; })[0] || tabs[0];
    var list = all.filter(cur[2]);
    root.innerHTML =
      '<div class="ph-h"><div><p class="eyebrow">신청 → 검토 중 → (보완 요청 → 재신청) → 승인 / 반려 · 보완 요청과 반려는 사유 필수</p><h2>작업허가</h2></div>' +
      (u.role === 'partner' ? '<a class="btn pri" href="#/permits/new">' + I('plus') + ' 작업허가 신청</a>' : '') + '</div>' +
      '<div class="tabs">' + tabs.map(function (t) { return '<button class="tab' + (t[0] === cur[0] ? ' on' : '') + '" data-act="tab" data-t="' + t[0] + '">' + t[1] + ' <b>' + all.filter(t[2]).length + '</b></button>'; }).join('') + '</div>' +
      '<section class="card flat">' + (list.length ? '<div class="tbl"><table><thead><tr><th>번호</th><th>작업</th><th>현장</th><th>협력업체</th><th>작업 종류</th><th>허가 기간</th><th>차수</th><th>상태</th></tr></thead><tbody>' +
        list.map(function (p) {
          return '<tr data-href="#/permits/' + p.id + '"><td class="mono">' + p.id + '</td><td><b>' + h(p.title) + '</b></td><td>' + h(APP.siteName(p.site)) + '</td><td>' + h(APP.partnerName(p.partner)) + '</td><td>' +
            p.types.map(function (t) { return '<em class="tag amber">' + h(t) + '</em>'; }).join(' ') + '</td><td class="mono sm">' + p.validFrom.slice(5) + ' ~ ' + p.validTo.slice(5) + '</td><td>' + p.revs.length + '차</td><td>' + APP.ppill(p) + '</td></tr>';
        }).join('') + '</tbody></table></div>' : APP.empty('해당하는 작업허가가 없습니다')) + '</section>';
    APP.acts.tab = function (a) { permitTab = a.getAttribute('data-t'); APP.rerender(); };
    rowLinks(root);
  };
  function rowLinks(root) {
    root.querySelectorAll('tr[data-href]').forEach(function (tr) {
      tr.tabIndex = 0;
      tr.addEventListener('click', function (e) { if (e.target.closest('a,button,input,label,select,textarea,summary,[contenteditable]')) return; location.hash = tr.getAttribute('data-href'); });
      tr.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' || e.target !== tr) return;
        e.preventDefault(); location.hash = tr.getAttribute('data-href');
      });
    });
  }
  P.rowLinks = rowLinks;

  var permitView = { rev: null, tab: 'req' };
  var PF = [['req', 'F-REQ', '보수작업 신청서'], ['roster', 'F-ROSTER', '작업자 명단'], ['risk', 'F-RISK', '위험성평가']];
  function permitDetail(root, id) {
    var p = DB.byId(DB.S.permits, id), u = DB.me();
    if (!p) { root.innerHTML = APP.empty('작업허가를 찾을 수 없습니다'); return; }
    if (!DB.guard('permit', p, '작업허가 ' + p.id + ' 조회 (' + APP.partnerName(p.partner) + ' 소속 자료)')) { DB.persist(); root.innerHTML = APP.deny('다른 협력업체 또는 허용되지 않은 현장의 작업허가입니다.'); return; }
    if (permitView.id !== id) permitView = { id: id, rev: p.revs.length, tab: 'req' };
    var rev = p.revs[permitView.rev - 1] || p.revs[p.revs.length - 1];
    var canReview = (u.role === 'safety' || u.role === 'admin');
    var stepI = { submitted: 1, reviewing: 1, supplement: 2, approved: 4, rejected: 4, cancelled: 4 }[p.status];
    var steps = ['신청', '검토 중', '보완 요청 → 재신청', '승인 / 반려'];
    var works = DB.S.works.filter(function (w) { return w.permitId === p.id; });
    var tabsHtml = PF.map(function (f) { return '<button class="tab' + (permitView.tab === f[0] ? ' on' : '') + '" data-act="ptab" data-t="' + f[0] + '">' + f[2] + '</button>'; }).join('') +
      (p.revs.length > 1 ? '<button class="tab' + (permitView.tab === 'diff' ? ' on' : '') + '" data-act="ptab" data-t="diff">차수 비교</button>' : '');
    var content;
    if (permitView.tab === 'diff') content = diffTable(p);
    else {
      var f = PF.filter(function (x) { return x[0] === permitView.tab; })[0];
      var def = DB.permitFormVer(p, rev, f[1]);
      content = def ? '<p class="muted sm">제출 당시 양식 v' + def.v + '</p>' + FE.render(def.items, rev.values[f[0]], { readonly: true, site: p.site, partner: p.partner, showIds: true }) : APP.empty('이 신청본의 양식 버전을 찾을 수 없습니다');
    }
    var last = p.reviews[p.reviews.length - 1];
    root.innerHTML =
      '<a class="back" href="#/permits">← 작업허가 목록</a>' +
      '<div class="ph-h"><div><p class="eyebrow">' + p.id + ' · ' + h(APP.siteName(p.site)) + ' · ' + h(APP.partnerName(p.partner)) + ' · 허가 기간 ' + p.validFrom + ' ~ ' + p.validTo + '</p><h2>' + h(p.title) + ' ' + APP.ppill(p) + '</h2></div>' +
      '<div class="row">' + (u.role === 'partner' && p.status === 'supplement' ? '<a class="btn pri" href="#/permits/' + p.id + '/resubmit">보완 후 재신청</a>' : '') + '</div></div>' +
      APP.stepper(steps, stepI) +
      (p.status === 'supplement' && last ? '<div class="alert amber">' + I('permits') + '<div><b>보완 요청 사유 — ' + h(last.by) + ' · ' + last.at + '</b><span>' + h(last.reason) + '</span></div></div>' : '') +
      (p.status === 'rejected' && last ? '<div class="alert red">' + I('x') + '<div><b>반려 사유 — ' + h(last.by) + ' · ' + last.at + '</b><span>' + h(last.reason) + '</span></div></div>' : '') +
      '<div class="pd">' +
        '<section class="card"><div class="card-h"><h3>신청 내용</h3><div class="revs">' + p.revs.map(function (r) {
          return '<button class="rv-b' + (r.rev === rev.rev ? ' on' : '') + '" data-act="rev" data-r="' + r.rev + '">' + r.rev + '차<i>' + APP.mmdd(r.at) + '</i></button>';
        }).join('') + '</div></div>' +
          '<p class="muted sm">' + rev.rev + '차 신청본 · ' + h(rev.by) + ' · ' + rev.at + ' — 재신청 시 이전 신청본은 그대로 보존됩니다.</p>' +
          '<div class="tabs sm">' + tabsHtml + '</div>' + content + '</section>' +
        '<aside class="pd-s">' +
          (canReview && ['submitted', 'reviewing', 'approved'].indexOf(p.status) >= 0 ? '<section class="card act"><h3>검토 처리</h3>' +
            (p.status === 'submitted' ? '<button class="btn ghost full" data-act="rv" data-a="reviewing">검토 시작</button>' : '') +
            (p.status !== 'approved' ? '<button class="btn pri full" data-act="rv" data-a="approved">' + I('check') + ' 승인</button><button class="btn warn full" data-act="rv" data-a="supplement">보완 요청</button><button class="btn danger-o full" data-act="rv" data-a="rejected">반려</button>' :
              '<button class="btn danger-o full" data-act="rv" data-a="cancelled">허가 취소</button><p class="muted sm">취소하면 이 허가로 연결된 작업은 시작 승인 시 거부됩니다.</p>') +
            '<p class="muted sm">보완 요청 · 반려 · 취소는 사유 입력이 필수이며, 결과는 협력업체 담당자에게 알림톡으로 발송됩니다.</p></section>' : '') +
          '<section class="card"><h3>검토 이력</h3>' + (p.reviews.length ? '<ol class="tl">' + p.reviews.slice().reverse().map(function (r) {
            return '<li><i class="' + r.action + '"></i><b>' + DB.PERMIT_STATUS[r.action] + '</b><span>' + h(r.by) + ' (' + h(r.role) + ') · ' + r.at + '</span>' + (r.reason ? '<p>' + h(r.reason) + '</p>' : '') + '</li>';
          }).join('') + '</ol>' : '<p class="muted sm">아직 검토 이력이 없습니다.</p>') + '</section>' +
          '<section class="card"><h3>연결된 작업</h3>' + (works.length ? '<ul class="li">' + works.map(function (w) { return '<li><a href="#/works/' + w.id + '"><b>' + w.id + ' · ' + h(w.title) + '</b><span>' + APP.relDay(w.start) + '</span></a>' + APP.wpill(w) + '</li>'; }).join('') + '</ul>' : '<p class="muted sm">연결된 작업이 없습니다.</p>') +
          '<p class="muted sm">허가 대상 작업은 승인된 작업허가가 유효하고 취소되지 않은 경우에만 시작할 수 있습니다.</p></section>' +
          '<section class="card"><h3>첨부 서류</h3><ul class="li">' + PF.map(function (f) {
            var d = DB.permitDoc(p, rev, f[1]); return d ? '<li><a href="#/docs/' + d.id + '"><b>' + f[2] + '</b><span>' + d.id + ' · ' + d.rev + '차 · 양식 v' + d.ver + '</span></a>' + APP.dpill(d) + '</li>' : '<li><b>' + f[2] + '</b><span class="muted sm">' + rev.rev + '차 첨부 서류 기록 없음</span></li>';
          }).join('') + '</ul></section>' +
        '</aside></div>';
    APP.acts.ptab = function (a) { permitView.tab = a.getAttribute('data-t'); APP.rerender(); };
    APP.acts.rev = function (a) { permitView.rev = +a.getAttribute('data-r'); APP.rerender(); };
    APP.acts.rv = function (a) {
      var act = a.getAttribute('data-a');
      var needReason = act === 'supplement' || act === 'rejected' || act === 'cancelled';
      var label = DB.PERMIT_STATUS[act];
      APP.ask({ title: '작업허가 ' + label + ' — ' + p.id, msg: act === 'approved' ? '신청 내용을 확인했고 승인합니다. 첨부된 보수작업 신청서·작업자 명단·위험성평가가 「확인 완료」로 바뀝니다.' : '',
        input: needReason || act === 'approved', req: needReason, label: needReason ? label + ' 사유' : '검토 의견 (선택)', ok: label, danger: act === 'rejected' || act === 'cancelled' }, function (reason) {
        var r = DB.reviewPermit(p, act, reason);
        if (!r.ok) { APP.toast(r.msg, 'err'); return; }
        APP.toast(p.id + ' ' + label + (act !== 'reviewing' ? ' — 협력업체에 알림톡 발송 요청' : '')); APP.rerender();
      });
    };
  }
  function diffTable(p) {
    var a = p.revs[p.revs.length - 2], b = p.revs[p.revs.length - 1];
    var rows = '', changed = 0;
    PF.forEach(function (f) {
      var da = DB.permitFormVer(p, a, f[1]), db = DB.permitFormVer(p, b, f[1]);
      if (!da || !db) { rows += '<tr><td colspan="4">' + h(f[2]) + ' — 신청본의 양식 버전을 찾을 수 없어 비교할 수 없습니다.</td></tr>'; return; }
      var ids = da.items.map(function (it) { return it.id; });
      db.items.forEach(function (it) { if (ids.indexOf(it.id) < 0) ids.push(it.id); });
      ids.forEach(function (id) {
        var ia = da.items.filter(function (it) { return it.id === id; })[0], ib = db.items.filter(function (it) { return it.id === id; })[0];
        var va = ia ? FE.show(ia, a.values[f[0]][id]) : '항목 없음', vb = ib ? FE.show(ib, b.values[f[0]][id]) : '항목 없음';
        if (ia && ia.type === 'sign') va = va.split(' · ')[0];
        if (ib && ib.type === 'sign') vb = vb.split(' · ')[0];
        var ch = !ia || !ib || va !== vb || ia.label !== ib.label || ia.type !== ib.type; if (ch) changed++;
        var label = ia && ib && ia.label !== ib.label ? ia.label + ' → ' + ib.label : (ib || ia).label;
        rows += '<tr class="' + (ch ? 'chg' : '') + '"><td class="mono sm">' + h(id) + '</td><td>' + h(f[2]) + ' · ' + h(label) + ' <span class="muted sm">(v' + da.v + ' → v' + db.v + ')</span></td><td>' + h(va) + '</td><td>' + h(vb) + '</td></tr>';
      });
    });
    return '<p class="muted sm">' + a.rev + '차 → ' + b.rev + '차에서 바뀐 항목 <b>' + changed + '개</b>를 강조했습니다.</p><div class="tbl"><table class="diff"><thead><tr><th>항목 ID</th><th>항목</th><th>' + a.rev + '차</th><th>' + b.rev + '차</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* 작업허가 신청 · 재신청 */
  var draftPermit = null;
  function permitForm(root, id) {
    APP.syncSession();
    var u = DB.me();
    if (u.role !== 'partner') { root.innerHTML = APP.deny('작업허가 신청은 협력업체 계정만 할 수 있습니다.'); return; }
    var p = id ? DB.byId(DB.S.permits, id) : null;
    if (p && !DB.guard('permit', p, '작업허가 ' + p.id + ' 재신청')) { DB.persist(); root.innerHTML = APP.deny('다른 협력업체의 작업허가입니다.'); return; }
    if (p && p.status !== 'supplement') { root.innerHTML = APP.empty('보완 요청 상태에서만 재신청할 수 있습니다'); return; }
    var key = u.id + ':' + (id || 'new');
    if (!draftPermit || draftPermit.key !== key) {
      var base = p ? JSON.parse(JSON.stringify(p.revs[p.revs.length - 1].values)) : { req: {}, roster: { 'ROS-02': u.partner, 'ROS-01': DB.dayStr(1) }, risk: { 'RSK-01': DB.dayStr(0) } };
      if (!p) base.req = { 'REQ-01': DB.dayStr(1), 'REQ-02': DB.dayStr(2) };
      ['req', 'roster', 'risk'].forEach(function (k) { Object.keys(base[k]).forEach(function (i) { var v = base[k][i]; if (v && v.name !== undefined && v.at !== undefined) base[k][i] = { name: '', at: '' }; }); });
      draftPermit = { key: key, site: p ? p.site : u.sites[0], tab: 'req', values: base, errors: {} };
    }
    var dp = draftPermit;
    var f = PF.filter(function (x) { return x[0] === dp.tab; })[0];
    var def = DB.formCurrent(f[1]);
    var errCount = function (k) { return Object.keys(dp.errors[k] || {}).length; };
    root.innerHTML =
      '<a class="back" href="#/permits' + (p ? '/' + p.id : '') + '">← ' + (p ? p.id : '작업허가 목록') + '</a>' +
      '<div class="ph-h"><div><p class="eyebrow">' + (p ? p.id + ' · ' + (p.revs.length + 1) + '차 재신청 — 이전 신청본은 보존됩니다' : '새 작업허가 신청 · ' + h(APP.partnerName(u.partner))) + '</p><h2>작업허가 ' + (p ? '재신청' : '신청') + '</h2></div></div>' +
      (p ? '<div class="alert amber">' + I('permits') + '<div><b>보완 요청 사유</b><span>' + h(p.reviews[p.reviews.length - 1].reason) + '</span></div></div>' : '') +
      '<section class="card"><div class="frm2"><label class="fl"><span>현장</span><select class="in" data-chg="site"' + (p ? ' disabled' : '') + '>' + u.sites.map(function (s) { return '<option value="' + s + '"' + (s === dp.site ? ' selected' : '') + '>' + h(APP.siteName(s)) + '</option>'; }).join('') + '</select></label>' +
      '<div class="fl"><span>제출 서류</span><p class="muted sm">현재 적용 중인 양식으로 보수작업 신청서, 작업자 명단, 위험성평가를 작성해 함께 제출해 주세요.</p></div></div>' +
      '<div class="tabs">' + PF.map(function (x, i) { return '<button class="tab' + (x[0] === dp.tab ? ' on' : '') + '" data-act="ftab" data-t="' + x[0] + '"><span class="n">' + (i + 1) + '</span>' + x[2] + (errCount(x[0]) ? ' <b class="red">' + errCount(x[0]) + '</b>' : '') + '</button>'; }).join('') + '</div>' +
      '<div data-pf>' + FE.render(def.items, dp.values[dp.tab], { site: dp.site, partner: u.partner, errors: dp.errors[dp.tab] }) + '</div>' +
      '<div class="frm-a"><span class="muted sm">필수 항목(<b class="req">*</b>)을 모두 채워야 제출됩니다. 탭을 옮겨도 입력은 유지됩니다.</span><span class="sp"></span>' +
      (dp.tab !== 'risk' ? '<button class="btn ghost" data-act="next">다음 서류 ' + I('arrow') + '</button>' : '') +
      '<button class="btn pri" data-act="submit">' + (p ? '재신청 제출' : '신청 제출') + '</button></div></section>';
    var box = root.querySelector('[data-pf]');
    bindForm(box, def.items, function () { return dp.values[dp.tab]; }, function (v) { dp.values[dp.tab] = v; }, { site: dp.site, partner: u.partner });
    function keep() { dp.values[dp.tab] = FE.read(box, def.items, dp.values[dp.tab]); }
    APP.acts.ftab = function (a) { keep(); dp.tab = a.getAttribute('data-t'); APP.rerender(); };
    APP.acts.next = function () { keep(); var i = PF.map(function (x) { return x[0]; }).indexOf(dp.tab); dp.tab = PF[i + 1][0]; APP.rerender(); };
    APP.acts.site = function (a) { keep(); dp.site = a.value; APP.rerender(); };
    APP.acts.submit = function () {
      keep();
      var total = 0;
      PF.forEach(function (x) { var e = FE.validate(DB.formCurrent(x[1]).items, dp.values[x[0]], 'submit'); dp.errors[x[0]] = e; total += Object.keys(e).length; });
      if (total) {
        var first = PF.filter(function (x) { return Object.keys(dp.errors[x[0]]).length; })[0];
        dp.tab = first[0]; APP.rerender();
        APP.toast('제출할 수 없습니다 — 필수 항목과 입력 형식 오류 ' + total + '건을 확인해 주세요.', 'err');
        var e1 = document.querySelector('.fi.err'); if (e1) e1.scrollIntoView({ block: 'center' });
        return;
      }
      var r = DB.submitPermit(p, dp.values, dp.site);
      if (!r.ok) { APP.toast(r.msg, 'err'); return; }
      draftPermit = null;
      APP.toast(r.permit.id + ' ' + r.permit.revs.length + '차 신청을 제출했습니다');
      APP.go('permits/' + r.permit.id);
    };
  }

  /* 양식 엔진 화면 상호작용(사진·서명·작업자 목록) 공통 */
  function bindForm(box, items, getV, setV, ctx) {
    chipSync(box);
    function refresh() { var v = FE.read(box, items, getV()); setV(v); box.innerHTML = FE.render(items, v, ctx); }
    box.addEventListener('change', function (e) {
      var r = e.target.closest('.wl-r');
      if (r && e.target.hasAttribute('data-pick')) { var ok = r.querySelector('[data-ok]'); ok.disabled = !e.target.checked; if (!e.target.checked) ok.checked = false; r.classList.toggle('on', e.target.checked); }
      if (e.target.hasAttribute('data-refresh')) refresh();
      if (e.target.hasAttribute('data-phf') && e.target.files[0]) {
        var id = e.target.closest('[data-item]').getAttribute('data-item');
        FE.shrink(e.target.files[0], function (p) {
          if (!p) { APP.toast('이미지를 읽을 수 없습니다', 'err'); return; }
          var v = FE.read(box, items, getV()); v[id] = (v[id] || []).concat([p]); setV(v); box.innerHTML = FE.render(items, v, ctx);
          APP.toast('사진 축소 저장 · 원본 ' + p.orig + ' → ' + p.saved + ' (운영 기준 긴 변 1,600px)');
        });
      }
    });
    box.addEventListener('click', function (e) {
      var it = e.target.closest('[data-item]'); if (!it) return;
      var id = it.getAttribute('data-item'), v;
      if (e.target.closest('[data-sig]')) { v = FE.read(box, items, getV()); v[id] = { name: DB.me().name, at: DB.stamp() }; setV(v); box.innerHTML = FE.render(items, v, ctx); }
      else if (e.target.closest('[data-sigx]')) { v = FE.read(box, items, getV()); v[id] = { name: '', at: '' }; setV(v); box.innerHTML = FE.render(items, v, ctx); }
      else if (e.target.closest('[data-phs]')) { v = FE.read(box, items, getV()); v[id] = (v[id] || []).concat([{ seed: '현장 사진 ' + ((v[id] || []).length + 1) }]); setV(v); box.innerHTML = FE.render(items, v, ctx); }
      else if (e.target.closest('[data-phx]')) { v = FE.read(box, items, getV()); v[id].splice(+e.target.closest('[data-phx]').getAttribute('data-phx'), 1); setV(v); box.innerHTML = FE.render(items, v, ctx); }
    });
  }
  P.bindForm = bindForm;
})(window);
