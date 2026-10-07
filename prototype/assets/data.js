/* ==========================================================================
   data.js — 시연용 도메인 엔진과 가상 데이터
   상태 머신 · 역할/소속 범위 검사 · 양식 엔진 정의 · 알림톡 발송 이력 · 감사 로그
   모든 회사·현장·인물·수치는 시연용 가상 데이터입니다.
   ========================================================================== */
(function (G) {
  'use strict';

  var KEY = 'pt158930-v1';
  var S = null;               // 현재 상태
  var storageOk = true;

  /* ---- 날짜 도우미 ------------------------------------------------------ */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function stamp(d) { d = d || new Date(); return ymd(d) + ' ' + hm(d); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function at(dayOffset, h, m) { var d = addDays(new Date(), dayOffset); d.setHours(h, m || 0, 0, 0); return d; }
  function dayStr(off) { return ymd(addDays(new Date(), off)); }
  function rnd(n) { var s = ''; var c = 'abcdefghijkmnpqrstuvwxyz23456789'; for (var i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }

  /* ---- 역할 · 라벨 ------------------------------------------------------ */
  var ROLES = {
    admin: '관리자', manager: '작업관리자', safety: '안전관리자', partner: '협력업체', worker: '작업자'
  };
  var WORK_TYPES = {
    hot: { label: '화기 작업', permit: true }, height: { label: '고소 작업', permit: true },
    confined: { label: '밀폐공간 작업', permit: true }, electric: { label: '전기 작업', permit: true },
    heavy: { label: '중장비 작업', permit: false }, general: { label: '일반 정비', permit: false }
  };
  var WORK_STATUS = {
    registered: '등록', assigned: '작업자 확인 대기', working: '작업 중', reported: '완료 보고', done: '완료 확인', cancelled: '취소'
  };
  var PERMIT_STATUS = {
    submitted: '신청', reviewing: '검토 중', supplement: '보완 요청', approved: '승인', rejected: '반려', cancelled: '취소'
  };
  var DOC_STATUS = { draft: '작성 중', submitted: '제출', confirmed: '확인 완료' };
  var EMG_STATUS = { received: '접수', acting: '조치 중', closed: '조치 완료' };
  var HAZARDS = ['추락', '협착·끼임', '화재·폭발', '감전', '질식·산소결핍', '낙하·비래', '화상', '유해물질 노출'];
  var PPE = ['안전모', '안전화', '안전대', '보안경', '방독마스크', '절연장갑', '방열복', '송기마스크'];

  /* ---- 양식 정의 ---------------------------------------------------------
     항목: id · label(원본 서식 항목명) · type · req(필수) · opts · basis(근거 — 발주처 확정 예정) · sec(구역)
     ---------------------------------------------------------------------- */
  function I(id, label, type, req, opts, basis, sec) {
    return { id: id, label: label, type: type, req: !!req, opts: opts || null, basis: basis || '사내 기준(예시)', sec: sec || '기본 정보' };
  }
  var TBM_V1 = [
    I('TBM-01', '작업 일자', 'date', 1, null, '기록 보존(예시)', '기본 정보'),
    I('TBM-02', '작업 시작 시각', 'time', 1, null, null, '기본 정보'),
    I('TBM-03', '작업 장소', 'text', 1, null, null, '기본 정보'),
    I('TBM-04', '작업 내용', 'textarea', 1, null, null, '기본 정보'),
    I('TBM-05', '협력업체', 'partner', 1, null, null, '기본 정보'),
    I('TBM-06', '주요 위험 요인', 'multi', 1, HAZARDS, '위험성평가 연계(예시)', '위험 요인과 대책'),
    I('TBM-07', '안전 대책', 'textarea', 1, null, '위험성평가 연계(예시)', '위험 요인과 대책'),
    I('TBM-08', '보호구 착용 확인', 'multi', 1, PPE, null, '위험 요인과 대책'),
    I('TBM-09', '건강 이상자 유무', 'yesno', 1, null, null, '위험 요인과 대책'),
    I('TBM-10', '특이사항', 'textarea', 0, null, null, '위험 요인과 대책'),
    I('TBM-11', '참석자 확인', 'workers', 1, null, '참석자별 확인 기록(예시)', '참석자'),
    I('TBM-12', '현장 사진', 'photo', 0, null, null, '참석자'),
    I('TBM-13', '작성자 서명', 'sign', 1, null, '확인 버튼 + 서명자·확인 시각 기록', '서명')
  ];
  var TBM_V2 = TBM_V1.slice(0, 9).concat([
    I('TBM-14', '작업 중지 기준 공유', 'yesno', 1, null, '2차 개정 추가 항목(예시)', '위험 요인과 대책')
  ], TBM_V1.slice(9));

  var FORMS_SEED = [
    { id: 'F-TBM', name: '작업 전 안전회의(TBM) 일지', short: 'TBM 일지', writer: '작업관리자 · 참석 작업자 확인', original: true,
      versions: [
        { v: 1, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-40, 16, 20)), publishedAt: stamp(at(-41, 10, 0)), note: '최초 확정 — 원본 서식 대조 완료', items: TBM_V1 },
        { v: 2, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-6, 15, 5)), publishedAt: stamp(at(-6, 14, 30)), note: '「작업 중지 기준 공유」 항목 추가', items: TBM_V2 }
      ] },
    { id: 'F-EDU', name: '안전교육 일지', short: '안전교육', writer: '안전관리자', versions: [{ v: 1, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-40, 16, 30)), publishedAt: stamp(at(-41, 10, 0)), note: '최초 확정', items: [
      I('EDU-01', '교육 일자', 'date', 1, null, null, '교육 정보'),
      I('EDU-02', '교육 구분', 'select', 1, ['정기 교육', '채용 시 교육', '작업내용 변경 시 교육', '특별 교육'], '교육 구분 기준(예시)', '교육 정보'),
      I('EDU-03', '교육 시간(시간)', 'number', 1, null, null, '교육 정보'),
      I('EDU-04', '교육 장소', 'text', 1, null, null, '교육 정보'),
      I('EDU-05', '교육 내용', 'textarea', 1, null, null, '교육 정보'),
      I('EDU-06', '강사명', 'text', 1, null, null, '교육 정보'),
      I('EDU-07', '교육 대상자', 'workers', 1, null, '대상자별 이수 기록(예시)', '대상자'),
      I('EDU-08', '교육 자료 사진', 'photo', 0, null, null, '대상자'),
      I('EDU-09', '안전관리자 서명', 'sign', 1, null, '확인 버튼 + 서명자·확인 시각 기록', '서명')
    ] }] },
    { id: 'F-INSP', name: '안전점검 일지', short: '안전점검', writer: '안전관리자', versions: [{ v: 1, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-40, 16, 40)), publishedAt: stamp(at(-41, 10, 0)), note: '최초 확정', items: [
      I('INSP-01', '점검 일자', 'date', 1, null, null, '점검 정보'),
      I('INSP-02', '점검 구역', 'text', 1, null, null, '점검 정보'),
      I('INSP-03', '통로·작업장 정리정돈', 'select', 1, ['양호', '불량', '해당 없음'], null, '점검 결과'),
      I('INSP-04', '소화설비 상태', 'select', 1, ['양호', '불량', '해당 없음'], null, '점검 결과'),
      I('INSP-05', '전기설비 상태', 'select', 1, ['양호', '불량', '해당 없음'], null, '점검 결과'),
      I('INSP-06', '화학물질 보관 상태', 'select', 1, ['양호', '불량', '해당 없음'], null, '점검 결과'),
      I('INSP-07', '고소작업 안전시설', 'select', 1, ['양호', '불량', '해당 없음'], null, '점검 결과'),
      I('INSP-08', '지적 사항', 'textarea', 0, null, null, '조치'),
      I('INSP-09', '조치 기한', 'date', 0, null, null, '조치'),
      I('INSP-10', '점검 사진', 'photo', 1, null, '사진 증빙(예시)', '조치'),
      I('INSP-11', '점검자 서명', 'sign', 1, null, '확인 버튼 + 서명자·확인 시각 기록', '서명')
    ] }] },
    { id: 'F-REQ', name: '보수작업 신청서', short: '보수작업 신청', writer: '협력업체', versions: [{ v: 1, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-40, 16, 50)), publishedAt: stamp(at(-41, 10, 0)), note: '최초 확정', items: [
      I('REQ-01', '작업 시작일', 'date', 1, null, '허가 유효기간(예시)', '작업 정보'),
      I('REQ-02', '작업 종료일', 'date', 1, null, '허가 유효기간(예시)', '작업 정보'),
      I('REQ-03', '작업 장소', 'text', 1, null, null, '작업 정보'),
      I('REQ-04', '작업 내용', 'textarea', 1, null, null, '작업 정보'),
      I('REQ-05', '작업 종류', 'multi', 1, ['화기 작업', '고소 작업', '밀폐공간 작업', '전기 작업', '중장비 작업', '일반 정비'], '허가 대상 판정(예시)', '작업 정보'),
      I('REQ-06', '투입 인원(명)', 'number', 1, null, null, '투입 계획'),
      I('REQ-07', '사용 장비', 'text', 0, null, null, '투입 계획'),
      I('REQ-08', '첨부 서류', 'photo', 0, null, '절차서·도면 등', '투입 계획'),
      I('REQ-09', '신청자 서명', 'sign', 1, null, '확인 버튼 + 서명자·확인 시각 기록', '서명')
    ] }] },
    { id: 'F-ROSTER', name: '작업자 명단', short: '작업자 명단', writer: '협력업체 · 작업관리자', versions: [{ v: 1, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-40, 17, 0)), publishedAt: stamp(at(-41, 10, 0)), note: '최초 확정', items: [
      I('ROS-01', '작업 일자', 'date', 1, null, null, '명단'),
      I('ROS-02', '협력업체', 'partner', 1, null, null, '명단'),
      I('ROS-03', '투입 작업자', 'workers', 1, null, '작업자 정보 불러오기', '명단'),
      I('ROS-04', '현장 책임자', 'text', 1, null, null, '연락'),
      I('ROS-05', '비상 연락처', 'phone', 1, null, '연락처 형식 검사', '연락'),
      I('ROS-06', '제출자 서명', 'sign', 1, null, '확인 버튼 + 서명자·확인 시각 기록', '서명')
    ] }] },
    { id: 'F-RISK', name: '위험성평가', short: '위험성평가', writer: '협력업체 작성·제출 · 안전관리자 검토', versions: [{ v: 1, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-40, 17, 10)), publishedAt: stamp(at(-41, 10, 0)), note: '최초 확정', items: [
      I('RSK-01', '평가 일자', 'date', 1, null, null, '평가'),
      I('RSK-02', '작업 단계', 'text', 1, null, null, '평가'),
      I('RSK-03', '유해·위험 요인', 'multi', 1, HAZARDS, '작업자 확인 화면 표시', '평가'),
      I('RSK-04', '가능성(빈도)', 'select', 1, ['1 낮음', '2 보통', '3 높음'], '평가 척도(예시)', '평가'),
      I('RSK-05', '중대성(강도)', 'select', 1, ['1 경미', '2 보통', '3 중대'], '평가 척도(예시)', '평가'),
      I('RSK-06', '감소 대책', 'textarea', 1, null, null, '대책'),
      I('RSK-07', '필요 보호구', 'multi', 1, PPE, '작업자 확인 화면 표시', '대책'),
      I('RSK-08', '개선 후 위험성', 'select', 1, ['낮음', '보통', '높음'], null, '대책'),
      I('RSK-09', '평가자 서명', 'sign', 1, null, '확인 버튼 + 서명자·확인 시각 기록', '서명')
    ] }] },
    { id: 'F-CHK', name: '작업자 안전 확인 항목', short: '작업자 확인 항목', writer: '작업자 (모바일)', check: true, versions: [{ v: 1, status: 'published', locked: true, signedBy: '김도윤 (발주처 확인)', signedAt: stamp(at(-40, 17, 20)), publishedAt: stamp(at(-41, 10, 0)), note: '작업 종류별 점검 항목', items: [
      I('CHK-01', '작업 위치와 작업 내용을 확인했습니다', 'check', 1, null, '공통', '공통'),
      I('CHK-02', '위험 요인과 안전 대책을 확인했습니다', 'check', 1, null, '공통', '공통'),
      I('CHK-03', '필요 보호구를 모두 착용했습니다', 'check', 1, null, '공통', '공통'),
      I('CHK-04', '비상 연락처와 대피 경로를 확인했습니다', 'check', 1, null, '공통', '공통'),
      I('CHK-05', '화기 감시자 배치와 소화기 비치를 확인했습니다', 'check', 1, ['hot'], '화기 작업', '작업 종류별'),
      I('CHK-06', '안전대 부착 설비와 체결 상태를 확인했습니다', 'check', 1, ['height'], '고소 작업', '작업 종류별'),
      I('CHK-07', '산소·유해가스 농도 측정 결과를 확인했습니다', 'check', 1, ['confined'], '밀폐공간 작업', '작업 종류별'),
      I('CHK-08', '정전·잠금 표지(LOTO) 상태를 확인했습니다', 'check', 1, ['electric'], '전기 작업', '작업 종류별'),
      I('CHK-09', '작업 전 현장 사진', 'photo', 0, null, '선택', '사진')
    ] }] }
  ];

  /* ---- 가상 데이터 ------------------------------------------------------ */
  function seed() {
    var tenant = { id: 'T1', name: '가온케미칼', note: '가상 고객사' };
    var sites = [
      { id: 'S1', name: '울산 1공장', addr: '울산광역시 (가상 주소)', manager: '박서준' },
      { id: 'S2', name: '울산 2공장', addr: '울산광역시 (가상 주소)', manager: '이하은' },
      { id: 'S3', name: '여수 공장', addr: '전라남도 여수시 (가상 주소)', manager: '윤태오' }
    ];
    var partners = [
      { id: 'P1', name: '동해플랜트설비', biz: '배관·용접', sites: ['S1', 'S2'], contact: '한지호', phone: '010-3184-2207' },
      { id: 'P2', name: '세진전기', biz: '전기·계장', sites: ['S1', 'S3'], contact: '오세린', phone: '010-5521-7730' },
      { id: 'P3', name: '한결배관', biz: '배관·보온', sites: ['S2'], contact: '문가람', phone: '010-2748-1196' }
    ];
    var W = [
      ['W01', '강민호', '010-4417-2381', 'P1', '용접', -120], ['W02', '서지훈', '010-2296-5104', 'P1', '배관', -95],
      ['W03', '임채원', '010-8813-4469', 'P1', '보온', -60], ['W04', '노현우', '010-5042-7738', 'P1', '용접', -380],
      ['W05', '백승민', '010-6627-1903', 'P1', '비계', -30], ['W06', '조은성', '010-3375-8820', 'P1', '배관', -15],
      ['W07', '황보람', '010-9174-6612', 'P2', '전기', -40], ['W08', '유지성', '010-2683-4457', 'P2', '계장', -70],
      ['W09', '남궁진', '010-0000-0000', 'P2', '전기', -55], ['W10', '권태양', '010-7716-3348', 'P2', '전기', -20],
      ['W11', '신동혁', '010-4429-9015', 'P2', '계장', -200], ['W12', '안예준', '010-8851-2276', 'P3', '배관', -12],
      ['W13', '전하람', '010-3398-6641', 'P3', '보온', -88], ['W14', '홍석진', '010-6604-1185', 'P3', '배관', -400],
      ['W15', '송다온', '010-2219-7754', 'P3', '보온', -35]
    ];
    var workers = W.map(function (w) {
      var edu = addDays(new Date(), w[5]);
      return { id: w[0], name: w[1], phone: w[2], partner: w[3], trade: w[4], eduDate: ymd(edu), eduUntil: ymd(addDays(edu, 365)) };
    });
    var users = [
      { id: 'U1', email: 'admin@demo.site', pw: 'admin2026', name: '김도윤', role: 'admin', sites: ['S1', 'S2', 'S3'], title: '고객사 관리자' },
      { id: 'U2', email: 'manager@demo.site', pw: 'manager2026', name: '박서준', role: 'manager', sites: ['S1'], approve: ['P1', 'P2'], title: '울산 1공장 작업관리자' },
      { id: 'U3', email: 'manager2@demo.site', pw: 'manager2026', name: '이하은', role: 'manager', sites: ['S2'], approve: ['P1', 'P3'], title: '울산 2공장 작업관리자' },
      { id: 'U4', email: 'safety@demo.site', pw: 'safety2026', name: '최민재', role: 'safety', sites: ['S1', 'S2'], title: '안전관리자' },
      { id: 'U5', email: 'partner@demo.site', pw: 'partner2026', name: '한지호', role: 'partner', partner: 'P1', sites: ['S1', 'S2'], title: '동해플랜트설비 담당자' },
      { id: 'U6', email: 'partner2@demo.site', pw: 'partner2026', name: '오세린', role: 'partner', partner: 'P2', sites: ['S1', 'S3'], title: '세진전기 담당자' }
    ];

    S = {
      v: 1, seededAt: stamp(), tenant: tenant, sites: sites, partners: partners, workers: workers, users: users,
      forms: JSON.parse(JSON.stringify(FORMS_SEED)),
      works: [], permits: [], docs: [], emergencies: [], notices: [], contacts: [], alimtalk: [], audit: [], downloads: [],
      seq: { J: 1040, PT: 26, D: 140, E: 8, N: 4, A: 300 },
      session: null, qcInject: false, qcRuns: []
    };

    /* 작업허가 */
    function permit(id, site, partner, title, types, from, to, status, revs, reviews) {
      return { id: id, site: site, partner: partner, title: title, types: types, validFrom: from, validTo: to,
        status: status, revs: revs, reviews: reviews || [], createdAt: revs[0].at };
    }
    function reqVals(from, to, place, what, types, n, eq) {
      return { 'REQ-01': from, 'REQ-02': to, 'REQ-03': place, 'REQ-04': what, 'REQ-05': types, 'REQ-06': n, 'REQ-07': eq || '',
        'REQ-08': [{ seed: '작업 절차서' }], 'REQ-09': { name: '', at: '' } };
    }
    function rosterVals(day, p, ws, boss, tel) {
      return { 'ROS-01': day, 'ROS-02': p, 'ROS-03': ws.map(function (w) { return { wid: w, ok: true }; }), 'ROS-04': boss, 'ROS-05': tel, 'ROS-06': { name: '', at: '' } };
    }
    function riskVals(day, step, hz, f, s, plan, ppe, after) {
      return { 'RSK-01': day, 'RSK-02': step, 'RSK-03': hz, 'RSK-04': f, 'RSK-05': s, 'RSK-06': plan, 'RSK-07': ppe, 'RSK-08': after, 'RSK-09': { name: '', at: '' } };
    }
    function signed(v, who, when) {
      Object.keys(v).forEach(function (k) { if (v[k] && typeof v[k] === 'object' && 'name' in v[k] && 'at' in v[k]) v[k] = { name: who, at: when }; });
      return v;
    }
    var t0 = dayStr(0), t1 = dayStr(1), t2 = dayStr(2), y1 = dayStr(-1), y3 = dayStr(-3);
    S.permits.push(permit('PT-021', 'S1', 'P1', '증류탑 하부 배관 용접 교체', ['화기 작업'], y1, t2, 'approved', [
      { rev: 1, at: stamp(at(-2, 10, 12)), by: '한지호', values: {
        req: signed(reqVals(y1, t2, '증류탑 하부 배관 랙 B-3', '부식 배관 120mm 구간 절단 후 용접 교체', ['화기 작업'], 3, '용접기 2대, 가스 절단기'), '한지호', stamp(at(-2, 10, 12))),
        roster: signed(rosterVals(t0, 'P1', ['W01', 'W02', 'W05'], '강민호', '010-4417-2381'), '한지호', stamp(at(-2, 10, 12))),
        risk: signed(riskVals(y1, '배관 절단 · 용접', ['화재·폭발', '화상', '낙하·비래'], '2 보통', '3 중대', '화기 감시자 1명 상시 배치, 소화기 2대 비치, 불티 비산 방지포 설치', ['안전모', '안전화', '보안경', '방열복'], '보통'), '한지호', stamp(at(-2, 10, 12))) } }
    ], [
      { by: '최민재', role: '안전관리자', action: 'reviewing', at: stamp(at(-2, 13, 40)), reason: '' },
      { by: '최민재', role: '안전관리자', action: 'approved', at: stamp(at(-2, 16, 5)), reason: '화기 감시자 배치 확인' }
    ]));
    S.permits.push(permit('PT-022', 'S1', 'P2', '변전실 MCC 패널 교체', ['전기 작업'], t0, t1, 'reviewing', [
      { rev: 1, at: stamp(at(-2, 9, 30)), by: '오세린', values: {
        req: signed(reqVals(t0, t1, '1변전실 MCC-2 패널', 'MCC-2 차단기 3개 교체', ['전기 작업'], 3, '절연 공구 세트'), '오세린', stamp(at(-2, 9, 30))),
        roster: signed(rosterVals(t0, 'P2', ['W07', 'W08', 'W09'], '황보람', '010-9174-6612'), '오세린', stamp(at(-2, 9, 30))),
        risk: signed(riskVals(t0, '차단기 해체 · 교체', ['감전'], '2 보통', '3 중대', '작업 전 검전', ['안전모', '절연장갑'], '보통'), '오세린', stamp(at(-2, 9, 30))) } },
      { rev: 2, at: stamp(at(-1, 11, 15)), by: '오세린', values: {
        req: signed(reqVals(t0, t1, '1변전실 MCC-2 패널', 'MCC-2 차단기 3개 교체 — 정전 작업 절차서 첨부', ['전기 작업'], 4, '절연 공구 세트, 검전기, 잠금장치(LOTO)'), '오세린', stamp(at(-1, 11, 15))),
        roster: signed(rosterVals(t0, 'P2', ['W07', 'W08', 'W09', 'W10'], '황보람', '010-9174-6612'), '오세린', stamp(at(-1, 11, 15))),
        risk: signed(riskVals(t0, '정전 확인 · 차단기 해체 · 교체', ['감전', '화상'], '2 보통', '3 중대', '정전 후 검전, 잠금·표지(LOTO) 설치, 작업 감독자 상주', ['안전모', '절연장갑', '보안경'], '낮음'), '오세린', stamp(at(-1, 11, 15))) } }
    ], [
      { by: '최민재', role: '안전관리자', action: 'reviewing', at: stamp(at(-2, 11, 0)), reason: '' },
      { by: '최민재', role: '안전관리자', action: 'supplement', at: stamp(at(-2, 15, 20)), reason: '정전 작업 절차서와 잠금·표지(LOTO) 계획을 보완해 주세요. 투입 인원도 다시 확인 바랍니다.' },
      { by: '최민재', role: '안전관리자', action: 'reviewing', at: stamp(at(-1, 13, 0)), reason: '2차 신청 검토 시작' }
    ]));
    S.permits.push(permit('PT-023', 'S1', 'P1', '원료 저장탱크 T-102 내부 청소', ['밀폐공간 작업'], t1, t2, 'submitted', [
      { rev: 1, at: stamp(at(0, 8, 40)), by: '한지호', values: {
        req: signed(reqVals(t1, t2, '원료 저장탱크 T-102', '탱크 내부 슬러지 제거 및 내부 점검', ['밀폐공간 작업'], 4, '송풍기, 가스 측정기'), '한지호', stamp(at(0, 8, 40))),
        roster: signed(rosterVals(t1, 'P1', ['W02', 'W03', 'W05', 'W06'], '서지훈', '010-2296-5104'), '한지호', stamp(at(0, 8, 40))),
        risk: signed(riskVals(t1, '탱크 진입 · 청소', ['질식·산소결핍', '유해물질 노출'], '2 보통', '3 중대', '진입 전 산소·가스 측정, 연속 환기, 감시인 배치', ['안전모', '송기마스크', '안전대'], '보통'), '한지호', stamp(at(0, 8, 40))) } }
    ], []));
    S.permits.push(permit('PT-019', 'S2', 'P3', '스팀 배관 보온재 교체', ['고소 작업'], y3, y1, 'rejected', [
      { rev: 1, at: stamp(at(-5, 10, 0)), by: '문가람', values: {
        req: signed(reqVals(y3, y1, '2공장 스팀 배관 랙 C', '보온재 해체 및 교체', ['고소 작업'], 2, '이동식 비계'), '문가람', stamp(at(-5, 10, 0))),
        roster: signed(rosterVals(y3, 'P3', ['W13', 'W15'], '전하람', '010-3398-6641'), '문가람', stamp(at(-5, 10, 0))),
        risk: signed(riskVals(y3, '비계 설치 · 보온재 교체', ['추락'], '2 보통', '3 중대', '안전대 착용', ['안전모', '안전대'], '보통'), '문가람', stamp(at(-5, 10, 0))) } }
    ], [
      { by: '최민재', role: '안전관리자', action: 'rejected', at: stamp(at(-4, 14, 0)), reason: '작업 기간이 정기 보수 일정과 겹칩니다. 일정 조정 후 새로 신청해 주세요.' }
    ]));
    S.permits.push(permit('PT-024', 'S3', 'P2', '여수 공장 계장 케이블 포설', ['전기 작업'], t0, t2, 'approved', [
      { rev: 1, at: stamp(at(-3, 9, 0)), by: '오세린', values: {
        req: signed(reqVals(t0, t2, '여수 공장 계장실', '계장 케이블 포설', ['전기 작업'], 2, '케이블 드럼'), '오세린', stamp(at(-3, 9, 0))),
        roster: signed(rosterVals(t0, 'P2', ['W10', 'W11'], '권태양', '010-7716-3348'), '오세린', stamp(at(-3, 9, 0))),
        risk: signed(riskVals(t0, '케이블 포설', ['감전'], '1 낮음', '2 보통', '정전 확인', ['안전모', '절연장갑'], '낮음'), '오세린', stamp(at(-3, 9, 0))) } }
    ], [{ by: '윤태오', role: '관리자', action: 'approved', at: stamp(at(-3, 15, 0)), reason: '' }]));

    /* 작업 */
    function work(id, site, partner, title, type, place, start, workers, status, opt) {
      opt = opt || {};
      var w = { id: id, site: site, partner: partner, title: title, type: type, place: place, start: start,
        workers: workers, status: status, permitId: opt.permit || null, ver: 1, hazards: opt.hz || [], ppe: opt.ppe || ['안전모', '안전화'],
        rules: opt.rules || '작업 전 TBM 참석, 작업 구역 통제선 설치', checks: {}, links: {}, history: [], report: null, createdBy: opt.by || '박서준' };
      w.history.push({ at: stamp(at(opt.day || 0, 7, 10)), by: w.createdBy, what: '작업 등록' });
      return w;
    }
    var J = [];
    J.push(work('J-1031', 'S1', 'P1', '증류탑 하부 배관 용접 교체', 'hot', '증류탑 하부 배관 랙 B-3', stamp(at(0, 9, 0)), ['W01', 'W02', 'W05'], 'assigned',
      { permit: 'PT-021', hz: ['화재·폭발', '화상', '낙하·비래'], ppe: ['안전모', '안전화', '보안경', '방열복'], rules: '화기 감시자 상시 배치, 반경 11m 가연물 제거, 불티 비산 방지포 설치' }));
    J.push(work('J-1032', 'S1', 'P2', '변전실 MCC 패널 교체', 'electric', '1변전실 MCC-2 패널', stamp(at(0, 10, 0)), ['W07', 'W08', 'W10'], 'assigned',
      { permit: 'PT-022', hz: ['감전', '화상'], ppe: ['안전모', '절연장갑', '보안경'], rules: '정전 후 검전, 잠금·표지(LOTO) 설치' }));
    J.push(work('J-1033', 'S1', 'P1', '반응기 상부 보온재 보수', 'height', '반응기 R-201 상부 플랫폼', stamp(at(0, 8, 30)), ['W03', 'W06'], 'working',
      { permit: 'PT-021', hz: ['추락', '낙하·비래'], ppe: ['안전모', '안전화', '안전대'], rules: '안전대 2중 체결, 하부 출입 통제' }));
    J.push(work('J-1034', 'S2', 'P3', '냉각수 펌프 정비', 'general', '2공장 냉각탑 펌프실', stamp(at(0, 8, 0)), ['W12', 'W13'], 'working',
      { hz: ['협착·끼임'], ppe: ['안전모', '안전화', '보안경'], rules: '정비 전 전원 차단 확인', by: '이하은' }));
    J.push(work('J-1035', 'S1', 'P1', '원료 저장탱크 T-102 내부 청소', 'confined', '원료 저장탱크 T-102', stamp(at(1, 8, 0)), ['W02', 'W03', 'W05', 'W06'], 'registered',
      { permit: 'PT-023', hz: ['질식·산소결핍', '유해물질 노출'], ppe: ['안전모', '송기마스크', '안전대'], rules: '진입 전 산소·가스 측정, 연속 환기, 감시인 배치' }));
    J.push(work('J-1036', 'S1', 'P2', '계장 신호선 점검', 'general', '제어실 하부 케이블 트레이', stamp(at(1, 13, 0)), ['W08', 'W09'], 'assigned',
      { hz: ['감전'], ppe: ['안전모', '안전화'], rules: '작업 구역 표시' }));
    J.push(work('J-1029', 'S1', 'P1', '열교환기 E-105 가스켓 교체', 'general', '열교환기 E-105', stamp(at(-1, 9, 0)), ['W01', 'W04'], 'reported',
      { hz: ['협착·끼임', '화상'], ppe: ['안전모', '안전화', '보안경'], day: -1 }));
    J.push(work('J-1037', 'S3', 'P2', '여수 공장 계장 케이블 포설', 'electric', '여수 공장 계장실', stamp(at(0, 9, 30)), ['W10', 'W11'], 'working',
      { permit: 'PT-024', hz: ['감전'], ppe: ['안전모', '절연장갑'], by: '윤태오' }));
    var pastTitles = [['J-1018', 'S1', 'P1', '배관 서포트 보강', -6], ['J-1019', 'S1', 'P2', '조명 설비 교체', -6], ['J-1020', 'S2', 'P3', '보온재 보수', -5],
      ['J-1021', 'S1', 'P1', '밸브 교체', -5], ['J-1022', 'S1', 'P2', '분전반 점검', -4], ['J-1023', 'S2', 'P1', '배관 누설 보수', -4], ['J-1024', 'S1', 'P1', '펌프 얼라인먼트', -3],
      ['J-1025', 'S2', 'P3', '스팀 트랩 교체', -3], ['J-1026', 'S1', 'P2', '접지 저항 측정', -2], ['J-1027', 'S1', 'P1', '드레인 배관 교체', -2], ['J-1028', 'S2', 'P1', '탱크 외부 도장 보수', -1]];
    pastTitles.forEach(function (p) {
      var ws = p[2] === 'P1' ? ['W01', 'W06'] : p[2] === 'P2' ? ['W07', 'W10'] : ['W12', 'W15'];
      var w = work(p[0], p[1], p[2], p[3], 'general', p[3] + ' 구역', stamp(at(p[4], 9, 0)), ws, 'done', { day: p[4], hz: ['협착·끼임'], by: p[1] === 'S2' ? '이하은' : '박서준' });
      J.push(w);
    });
    S.works = J;

    /* 작업별 링크·확인·이력 */
    J.forEach(function (w) {
      var dayOff = w.status === 'done' || w.status === 'reported' ? -1 : 0;
      if (w.status === 'registered') return;
      w.history.push({ at: stamp(at(dayOff, 7, 25)), by: w.createdBy, what: '배정 확정 · 알림톡 발송 요청 ' + w.workers.length + '명' });
      w.workers.forEach(function (wid, i) {
        w.links[wid] = { token: w.id.toLowerCase().replace('-', '') + '-' + wid.toLowerCase() + '-' + rnd(6), exp: ymd(addDays(new Date(w.start.slice(0, 10)), 1)) + ' 23:59', revoked: false, fails: 0, locked: false, ver: 1 };
        var confirmed = w.status !== 'assigned' || (w.id === 'J-1031' && i < 2) || w.id === 'J-1032';
        if (confirmed) {
          w.checks[wid] = { at: stamp(at(dayOff, 7, 40 + i * 4)), ver: 1, ip: '211.36.' + (140 + i) + '.' + (20 + i * 7), device: i % 2 ? 'iPhone · 카카오톡 인앱' : 'Android · 카카오톡 인앱' };
        }
      });
      Object.keys(w.checks).forEach(function (wid) {
        w.history.push({ at: w.checks[wid].at, by: workerName(wid), what: '작업자 안전 확인 완료 (내용 v' + w.checks[wid].ver + ')' });
      });
      if (['working', 'reported', 'done'].indexOf(w.status) >= 0) w.history.push({ at: stamp(at(dayOff, 8, 5)), by: w.createdBy, what: '작업 시작 승인 → 작업 중' });
      if (['reported', 'done'].indexOf(w.status) >= 0) {
        w.report = { at: stamp(at(dayOff, 16, 20)), by: workerName(w.workers[0]), note: '작업 완료. 주변 정리 및 잔재물 반출 완료.', photos: [{ seed: '완료 사진' }] };
        w.history.push({ at: w.report.at, by: w.report.by, what: '완료 보고' });
      }
      if (w.status === 'done') w.history.push({ at: stamp(at(dayOff, 17, 0)), by: w.createdBy, what: '완료 확인 → 종료' });
    });

    /* 알림톡 이력 */
    J.forEach(function (w) {
      if (w.status === 'registered' || w.status === 'done') return;
      w.workers.forEach(function (wid) {
        var wk = worker(wid), res = 'delivered', reason = '', tries = 1;
        if (wk.phone === '010-0000-0000') { res = 'failed'; reason = '수신 번호 오류 — 재시도 불가'; }
        else if (w.id === 'J-1036' && wid === 'W08') { res = 'unknown'; reason = '대행사 결과 미수신'; }
        S.alimtalk.push({ id: 'A-' + (++S.seq.A), at: w.history[1] ? w.history[1].at : stamp(), tpl: 'assign', to: wid, toName: wk.name, phone: wk.phone,
          ref: w.id, site: w.site, result: res, reason: reason, tries: tries, ver: 1 });
      });
    });
    S.alimtalk.push({ id: 'A-' + (++S.seq.A), at: stamp(at(-2, 15, 21)), tpl: 'permit', to: 'P2', toName: '오세린 (세진전기)', phone: '010-5521-7730', ref: 'PT-022', site: 'S1', result: 'delivered', reason: '', tries: 1 });
    S.alimtalk.push({ id: 'A-' + (++S.seq.A), at: stamp(at(-2, 16, 6)), tpl: 'permit', to: 'P1', toName: '한지호 (동해플랜트설비)', phone: '010-3184-2207', ref: 'PT-021', site: 'S1', result: 'delivered', reason: '', tries: 2, note: '1회 일시 오류 후 재발송 성공' });

    /* 서류 */
    function doc(id, formId, ver, site, partner, status, values, by, created, extra) {
      var d = { id: id, formId: formId, ver: ver, site: site, partner: partner || null, status: status, rev: 1, values: values,
        author: by, createdAt: created, submittedAt: status !== 'draft' ? created : null, confirmedAt: null, confirmedBy: null, history: [{ at: created, by: by, what: '작성' }] };
      if (status !== 'draft') d.history.push({ at: created, by: by, what: '제출' });
      if (status === 'confirmed') { d.confirmedAt = created.slice(0, 11) + '17:30'; d.confirmedBy = '최민재'; d.history.push({ at: d.confirmedAt, by: '최민재', what: '안전관리자 확인 · 서명' }); }
      if (extra) Object.keys(extra).forEach(function (k) { d[k] = extra[k]; });
      return d;
    }
    function tbm(day, place, what, p, ws, hz, ppe, by, v) {
      var o = { 'TBM-01': day, 'TBM-02': '07:30', 'TBM-03': place, 'TBM-04': what, 'TBM-05': p, 'TBM-06': hz, 'TBM-07': '작업 구역 통제, 감시자 배치, 보호구 착용 상호 확인',
        'TBM-08': ppe, 'TBM-09': '아니오', 'TBM-10': '', 'TBM-11': ws.map(function (w) { return { wid: w, ok: true }; }), 'TBM-12': [{ seed: 'TBM 현장' }], 'TBM-13': { name: by, at: day + ' 07:45' } };
      if (v === 2) o['TBM-14'] = '예';
      return o;
    }
    var D = [];
    D.push(doc('D-0131', 'F-TBM', 2, 'S1', 'P1', 'submitted', tbm(t0, '증류탑 하부 배관 랙 B-3', '배관 용접 교체 작업 전 TBM', 'P1', ['W01', 'W02', 'W05'], ['화재·폭발', '화상'], ['안전모', '안전화', '보안경', '방열복'], '박서준', 2), '박서준', t0 + ' 07:45', { workId: 'J-1031' }));
    D.push(doc('D-0130', 'F-TBM', 2, 'S1', 'P1', 'confirmed', tbm(y1, '열교환기 E-105', '가스켓 교체 작업 전 TBM', 'P1', ['W01', 'W04'], ['협착·끼임', '화상'], ['안전모', '안전화', '보안경'], '박서준', 2), '박서준', y1 + ' 07:45', { workId: 'J-1029' }));
    D.push(doc('D-0118', 'F-TBM', 1, 'S1', 'P1', 'confirmed', tbm(dayStr(-8), '배관 랙 A-1', '배관 서포트 보강 작업 전 TBM', 'P1', ['W01', 'W06'], ['추락'], ['안전모', '안전화', '안전대'], '박서준', 1), '박서준', dayStr(-8) + ' 07:45'));
    D.push(doc('D-0129', 'F-TBM', 2, 'S2', 'P3', 'confirmed', tbm(y1, '2공장 탱크 외부', '도장 보수 작업 전 TBM', 'P3', ['W12', 'W15'], ['추락', '유해물질 노출'], ['안전모', '안전화', '방독마스크'], '이하은', 2), '이하은', y1 + ' 07:40'));
    D.push(doc('D-0132', 'F-INSP', 1, 'S1', null, 'draft', { 'INSP-01': t0, 'INSP-02': '증류 공정 구역', 'INSP-03': '양호', 'INSP-04': '양호', 'INSP-05': '', 'INSP-06': '', 'INSP-07': '',
      'INSP-08': '', 'INSP-09': '', 'INSP-10': [], 'INSP-11': { name: '', at: '' } }, '최민재', t0 + ' 10:10'));
    D.push(doc('D-0127', 'F-INSP', 1, 'S1', null, 'confirmed', { 'INSP-01': dayStr(-2), 'INSP-02': '원료 저장 구역', 'INSP-03': '양호', 'INSP-04': '불량', 'INSP-05': '양호', 'INSP-06': '양호', 'INSP-07': '해당 없음',
      'INSP-08': '소화기 압력 저하 2대', 'INSP-09': dayStr(1), 'INSP-10': [{ seed: '소화기 점검' }], 'INSP-11': { name: '최민재', at: dayStr(-2) + ' 14:30' } }, '최민재', dayStr(-2) + ' 14:30'));
    D.push(doc('D-0126', 'F-EDU', 1, 'S1', 'P2', 'confirmed', { 'EDU-01': dayStr(-3), 'EDU-02': '작업내용 변경 시 교육', 'EDU-03': 2, 'EDU-04': '1공장 교육장', 'EDU-05': '정전 작업 절차와 잠금·표지(LOTO)',
      'EDU-06': '최민재', 'EDU-07': [{ wid: 'W07', ok: true }, { wid: 'W08', ok: true }, { wid: 'W10', ok: true }], 'EDU-08': [{ seed: '교육 현장' }], 'EDU-09': { name: '최민재', at: dayStr(-3) + ' 16:00' } }, '최민재', dayStr(-3) + ' 16:00'));
    S.docs = D;
    /* 작업허가에 딸린 서류 (보수작업 신청서·명단·위험성평가) */
    S.permits.forEach(function (p) {
      var last = p.revs[p.revs.length - 1];
      var st = p.status === 'approved' ? 'confirmed' : 'submitted';
      [['F-REQ', 'req'], ['F-ROSTER', 'roster'], ['F-RISK', 'risk']].forEach(function (f) {
        var id = 'D-0' + (++S.seq.D);
        S.docs.push(doc(id, f[0], 1, p.site, p.partner, st, JSON.parse(JSON.stringify(last.values[f[1]])), last.by, last.at, { permitId: p.id, rev: last.rev }));
        p[f[1] + 'Doc'] = id;
      });
    });

    /* 긴급작업 */
    S.emergencies = [
      { id: 'E-008', site: 'S1', place: '냉각수 공급 배관 (펌프실 앞)', what: '플랜지 이음부 누수 — 바닥 미끄럼 위험', reporter: '임채원 (동해플랜트설비)', at: stamp(at(0, 7, 52)), status: 'acting',
        photos: [{ seed: '누수 부위' }], actions: [{ at: stamp(at(0, 8, 3)), by: '박서준', what: '구역 통제선 설치, 흡착포 배치' }], workId: null, notified: ['박서준', '최민재'] },
      { id: 'E-007', site: 'S1', place: '원료 이송 컨베이어 2호기', what: '벨트 이탈로 설비 정지', reporter: '박서준', at: stamp(at(-1, 14, 10)), status: 'closed',
        photos: [{ seed: '컨베이어' }], actions: [{ at: stamp(at(-1, 14, 25)), by: '박서준', what: '전원 차단·잠금' }, { at: stamp(at(-1, 16, 40)), by: '박서준', what: '벨트 재정렬 후 시운전 — 정상' }], workId: 'J-1028', notified: ['박서준', '최민재'] },
      { id: 'E-006', site: 'S2', place: '2공장 스팀 배관', what: '보온재 탈락', reporter: '이하은', at: stamp(at(-3, 10, 0)), status: 'closed', photos: [], actions: [{ at: stamp(at(-3, 11, 0)), by: '이하은', what: '임시 보온 조치' }], workId: null, notified: ['이하은', '최민재'] }
    ];

    /* 공지 · 비상연락망 */
    S.notices = [
      { id: 'N-004', title: '정기 보수 기간 화기 작업 허가 강화 안내', body: '이번 주 정기 보수 기간에는 모든 화기 작업에 화기 감시자 1명 이상 상시 배치를 의무화합니다. 작업허가 신청 시 감시자 성명을 함께 적어 주세요.', scope: 'all', pin: true, must: true, from: dayStr(-2), to: dayStr(5), by: '최민재', at: stamp(at(-2, 9, 0)), reads: { W01: true, W02: true } },
      { id: 'N-003', title: '울산 1공장 동문 출입 통제 (배관 교체)', body: '배관 교체 공사로 동문 차량 출입을 통제합니다. 서문을 이용해 주세요.', scope: 'S1', pin: false, must: false, from: dayStr(-1), to: dayStr(3), by: '박서준', at: stamp(at(-1, 8, 0)), reads: {} },
      { id: 'N-002', title: '협력업체 안전교육 일정 (세진전기)', body: '정전 작업 절차 교육을 실시합니다. 대상: 세진전기 투입 작업자 전원.', scope: 'P2', pin: false, must: false, from: dayStr(-5), to: dayStr(2), by: '최민재', at: stamp(at(-5, 10, 0)), reads: {} },
      { id: 'N-001', title: '여름철 온열질환 예방 수칙 종료 안내', body: '온열질환 예방 수칙 적용을 종료합니다.', scope: 'all', pin: false, must: false, from: dayStr(-30), to: dayStr(-10), by: '김도윤', at: stamp(at(-30, 9, 0)), reads: {} }
    ];
    S.contacts = [
      { site: 'S1', role: '안전관리자', name: '최민재', tel: '010-6203-4418' },
      { site: 'S1', role: '작업관리자', name: '박서준', tel: '010-2287-6650' },
      { site: 'S1', role: '방재센터', name: '1공장 방재센터', tel: '052-000-0119' },
      { site: 'S1', role: '지정 병원', name: '협력 병원 응급실 (가상)', tel: '052-000-7575' },
      { site: 'S2', role: '작업관리자', name: '이하은', tel: '010-4472-1093' },
      { site: 'S2', role: '방재센터', name: '2공장 방재센터', tel: '052-000-0129' },
      { site: 'S3', role: '관리자', name: '윤태오', tel: '010-7714-2280' },
      { site: 'S3', role: '방재센터', name: '여수 공장 방재센터', tel: '061-000-0119' }
    ];
    S.audit = [
      { at: stamp(at(-1, 18, 2)), user: '오세린 (협력업체)', action: '권한 거부', target: '작업허가 PT-021 조회 (동해플랜트설비 소속 자료)', result: '거부 403' },
      { at: stamp(at(-1, 9, 14)), user: '최민재 (안전관리자)', action: '내려받기', target: '파일 묶음 — 울산 1공장 · TBM 일지 · 최근 7일', result: '성공' },
      { at: stamp(at(-6, 15, 5)), user: '김도윤 (관리자)', action: '설정 변경', target: '양식 F-TBM v2 발주처 확인 서명 · 잠금', result: '성공' }
    ];
    S.downloads = [{ at: stamp(at(-1, 9, 14)), user: '최민재', cond: '울산 1공장 · TBM 일지 · ' + dayStr(-7) + ' ~ ' + dayStr(-1), file: 'ZIP · 서류 4건 · 사진 4장', expires: stamp(at(-1, 9, 24)) }];
  }

  /* ---- 저장 ------------------------------------------------------------- */
  function updateSignatureCopy() {
    var changed = false;
    (S.forms || []).forEach(function (f) { f.versions.forEach(function (ver) { ver.items.forEach(function (it) {
      if (it.type === 'sign' && it.basis === '확인 버튼 + 시각·IP·기기 기록') {
        it.basis = '확인 버튼 + 서명자·확인 시각 기록'; changed = true;
      }
    }); }); });
    if (changed) persist();
  }
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { S = JSON.parse(raw); if (S && S.v === 1) { updateSignatureCopy(); pinPermitVersions(); return; } }
    } catch (e) { storageOk = false; }
    seed(); pinPermitVersions(); persist();
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }
    catch (e) { storageOk = false; }
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) { /* noop */ } seed(); pinPermitVersions(); persist(); }

  /* ---- 조회 도우미 ------------------------------------------------------ */
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function worker(id) { return byId(S.workers, id); }
  function workerName(id) { var w = worker(id); return w ? w.name : id; }
  function site(id) { return byId(S.sites, id); }
  function partner(id) { return byId(S.partners, id); }
  function form(id) { return byId(S.forms, id); }
  function formVer(id, v) { var f = form(id); if (!f) return null; for (var i = 0; i < f.versions.length; i++) if (f.versions[i].v === v) return f.versions[i]; return null; }
  function formCurrent(id) {
    var f = form(id); if (!f) return null;
    var pub = f.versions.filter(function (x) { return x.status === 'published'; });
    return pub[pub.length - 1];
  }
  function permitDoc(p, rev, formId) {
    return S.docs.filter(function (d) { return d.permitId === p.id && d.rev === rev.rev && d.formId === formId; })[0] || null;
  }
  function permitFormVer(p, rev, formId) {
    if (rev.formVersions && Object.prototype.hasOwnProperty.call(rev.formVersions, formId)) return formVer(formId, rev.formVersions[formId]);
    var d = permitDoc(p, rev, formId);
    if (d) return formVer(formId, d.ver);
    // Legacy revisions without an attached document: use publication history,
    // never the currently active version. Pin the result when loading old data.
    var f = form(formId), pub = f ? f.versions.filter(function (v) { return v.status === 'published'; }).slice() : [];
    pub.sort(function (a, b) { return (a.publishedAt || '').localeCompare(b.publishedAt || '') || a.v - b.v; });
    var eligible = pub.filter(function (v) { return v.publishedAt && rev.at && v.publishedAt <= rev.at; });
    return eligible[eligible.length - 1] || pub[0] || null;
  }
  function pinPermitVersions() {
    var changed = false;
    (S.permits || []).forEach(function (p) { p.revs.forEach(function (rev) {
      ['F-REQ', 'F-ROSTER', 'F-RISK'].forEach(function (fid) {
        if (rev.formVersions && Object.prototype.hasOwnProperty.call(rev.formVersions, fid)) return;
        var def = permitFormVer(p, rev, fid);
        if (def) { rev.formVersions = rev.formVersions || {}; rev.formVersions[fid] = def.v; changed = true; }
      });
    }); });
    if (changed) persist();
  }
  function me() { return S.session ? byId(S.users, S.session.uid) : null; }
  function who(u) { u = u || me(); return u ? u.name + ' (' + ROLES[u.role] + ')' : '시스템'; }

  /* ---- 감사 로그 -------------------------------------------------------- */
  function audit(action, target, result) {
    S.audit.unshift({ at: stamp(), user: who(), action: action, target: target, result: result || '성공' });
    if (S.audit.length > 300) S.audit.length = 300;
  }

  /* ---- 소속 범위 · 접근 제어 (공통 접근 제어 계층) ------------------------ */
  function scopeSites(u) { u = u || me(); return u ? u.sites.slice() : []; }
  function inScope(obj, u) {
    u = u || me(); if (!u || !obj) return false;
    if (u.role === 'partner') return obj.partner === u.partner && u.sites.indexOf(obj.site) >= 0;
    if (obj.site && u.sites.indexOf(obj.site) < 0) return false;
    return true;
  }
  /* 화면·API가 같은 기준을 쓴다. 거부되면 감사 로그를 남긴다. */
  function guard(kind, obj, label) {
    var ok = inScope(obj);
    if (!ok) audit('권한 거부', label || (kind + ' ' + (obj && obj.id)), '거부 403');
    return ok;
  }
  function filterScope(list) { return list.filter(function (o) { return inScope(o); }); }

  var PERMS = [
    ['대시보드 · 진행 현황', { admin: 'R', manager: 'R', safety: 'R', partner: 'R*', worker: '' }],
    ['작업 등록 · 배정', { admin: 'W', manager: 'W', safety: 'R', partner: 'R*', worker: '' }],
    ['작업 시작 승인 · 완료 확인', { admin: 'A', manager: 'A†', safety: '', partner: '', worker: '' }],
    ['작업자 안전 확인 · 완료 보고', { admin: '', manager: '', safety: '', partner: '', worker: 'W‡' }],
    ['작업허가 신청', { admin: '', manager: '', safety: '', partner: 'W', worker: '' }],
    ['작업허가 검토 · 보완 요청 · 승인 · 반려', { admin: 'A', manager: 'R', safety: 'A', partner: 'R*', worker: '' }],
    ['안전 서류 작성 · 제출', { admin: 'W', manager: 'W', safety: 'W', partner: 'W*', worker: '' }],
    ['안전 서류 확인(서명)', { admin: '', manager: '', safety: 'A', partner: '', worker: '' }],
    ['서류 엑셀 · 파일 묶음 내려받기', { admin: 'R', manager: 'R', safety: 'R', partner: 'R*', worker: '' }],
    ['양식 정의서 · 버전 관리', { admin: 'W', manager: '', safety: 'R', partner: '', worker: '' }],
    ['항목 대조표 발주처 확인 서명', { admin: 'A', manager: '', safety: '', partner: '', worker: '' }],
    ['긴급작업 접수', { admin: 'W', manager: 'W', safety: 'W', partner: 'W', worker: '' }],
    ['긴급작업 조치 기록', { admin: 'W', manager: 'W', safety: 'W', partner: '', worker: '' }],
    ['공지 · 비상연락망 관리', { admin: 'W', manager: 'W', safety: 'W', partner: 'R', worker: 'R' }],
    ['현장 · 협력업체 · 작업자 관리', { admin: 'W', manager: 'R', safety: 'R', partner: 'W*', worker: '' }],
    ['알림톡 발송 이력', { admin: 'R', manager: 'R', safety: 'R', partner: '', worker: '' }],
    ['사용자 · 권한 · 감사 로그', { admin: 'W', manager: '', safety: '', partner: '', worker: '' }]
  ];

  /* ---- 알림톡 (발송 어댑터 — 시연은 대행사 응답을 흉내 낸다) ---------------- */
  var TPL = {
    assign: { name: '작업 배정', code: 'WS_ASSIGN_01' },
    permit: { name: '작업허가 결과', code: 'WS_PERMIT_01' },
    emergency: { name: '긴급작업 접수', code: 'WS_EMG_01' },
    notice: { name: '필독 공지', code: 'WS_NOTICE_01' },
    recheck: { name: '재확인 요청', code: 'WS_RECHECK_01' }
  };
  function sendTalk(tpl, to, toName, phone, ref, siteId, opt) {
    opt = opt || {};
    /* 같은 배정 건의 중복 발송 방지 */
    var dup = S.alimtalk.filter(function (a) { return a.tpl === tpl && a.to === to && a.ref === ref && a.ver === opt.ver && !opt.force && a.result !== 'failed'; });
    if (dup.length && opt.ver) return dup[0];
    var a = { id: 'A-' + (++S.seq.A), at: stamp(), tpl: tpl, to: to, toName: toName, phone: phone, ref: ref, site: siteId,
      result: 'requested', reason: '', tries: 1, ver: opt.ver || null };
    if (phone === '010-0000-0000') { a.result = 'failed'; a.reason = '수신 번호 오류 — 재시도 불가'; }
    else a.result = 'accepted';
    S.alimtalk.unshift(a);
    return a;
  }
  /* 시연: 접수된 건은 잠시 뒤 전달 완료로 바뀐다 */
  function settleTalks() {
    var changed = false;
    S.alimtalk.forEach(function (a) {
      if (a.result === 'accepted' || a.result === 'retrying') { a.result = 'delivered'; changed = true; }
    });
    if (changed) persist();
    return changed;
  }
  function retryTalk(id) {
    var a = byId(S.alimtalk, id); if (!a) return null;
    if (a.reason.indexOf('재시도 불가') >= 0) return { ok: false, msg: '재시도할 수 없는 실패입니다. 작업자 연락처를 확인해 주세요.' };
    a.tries++; a.result = 'retrying'; a.reason = ''; audit('알림톡 재발송', a.id + ' → ' + a.toName); persist();
    return { ok: true };
  }

  /* ---- 작업 상태 머신 --------------------------------------------------- */
  function permitValid(p, day) {
    if (!p) return { ok: false, why: '연결된 작업허가가 없습니다' };
    if (p.status !== 'approved') return { ok: false, why: '작업허가 ' + p.id + ' 상태가 「' + PERMIT_STATUS[p.status] + '」입니다' };
    day = day || ymd(new Date());
    if (day < p.validFrom || day > p.validTo) return { ok: false, why: '작업허가 ' + p.id + ' 유효기간(' + p.validFrom + ' ~ ' + p.validTo + ') 밖입니다' };
    return { ok: true };
  }
  function needsPermit(w) { return !!(WORK_TYPES[w.type] && WORK_TYPES[w.type].permit); }
  function checkValid(w, wid) { var c = w.checks[wid]; return !!(c && c.ver === w.ver); }
  function startGuard(w, u) {
    u = u || me();
    var reasons = [];
    if (w.status !== 'assigned') reasons.push('「' + WORK_STATUS[w.status] + '」 상태에서는 시작 승인을 할 수 없습니다');
    var pending = w.workers.filter(function (wid) { return !checkValid(w, wid); });
    if (pending.length) reasons.push('안전 확인 미완료 작업자 ' + pending.length + '명 — ' + pending.map(workerName).join(', '));
    if (needsPermit(w)) {
      var pv = permitValid(w.permitId ? byId(S.permits, w.permitId) : null, w.start.slice(0, 10));
      if (!pv.ok) reasons.push('허가 대상 작업 — ' + pv.why);
    }
    if (u) {
      if (u.role !== 'manager' && u.role !== 'admin') reasons.push(ROLES[u.role] + '는 작업 시작을 승인할 수 없습니다');
      if (u.role === 'manager' && (u.sites.indexOf(w.site) < 0 || (u.approve || []).indexOf(w.partner) < 0)) reasons.push('권한표상 이 협력업체·현장의 승인 권한이 없습니다');
    }
    return { ok: reasons.length === 0, reasons: reasons };
  }
  function linkFor(w, wid) {
    var l = w.links[wid];
    if (!l || l.revoked) {
      l = w.links[wid] = { token: w.id.toLowerCase().replace('-', '') + '-' + wid.toLowerCase() + '-' + rnd(6), exp: ymd(addDays(new Date(w.start.slice(0, 10)), 1)) + ' 23:59', revoked: false, fails: 0, locked: false, ver: w.ver };
    }
    return l;
  }
  function assign(w) {
    if (w.status !== 'registered') return { ok: false, msg: '등록 상태에서만 배정할 수 있습니다' };
    if (!w.workers.length) return { ok: false, msg: '작업자를 1명 이상 지정해 주세요' };
    w.status = 'assigned';
    w.history.push({ at: stamp(), by: who(), what: '배정 확정 · 알림톡 발송 요청 ' + w.workers.length + '명' });
    w.workers.forEach(function (wid) {
      linkFor(w, wid);
      var wk = worker(wid);
      sendTalk('assign', wid, wk.name, wk.phone, w.id, w.site, { ver: w.ver });
    });
    audit('작업 배정', w.id + ' ' + w.title); persist();
    return { ok: true };
  }
  /* 확인 대상(작업자·위험 요인·보호구)이 바뀌면 기존 확인을 무효화하고 재확인을 요구한다 */
  function changeContent(w, patch) {
    var before = JSON.stringify([w.workers, w.hazards, w.ppe, w.rules, w.place]);
    Object.keys(patch).forEach(function (k) { w[k] = patch[k]; });
    var after = JSON.stringify([w.workers, w.hazards, w.ppe, w.rules, w.place]);
    if (before === after) return { changed: false };
    if (w.status === 'working') return { changed: false, blocked: true };
    w.ver++;
    var removed = Object.keys(w.links).filter(function (wid) { return w.workers.indexOf(wid) < 0; });
    removed.forEach(function (wid) { w.links[wid].revoked = true; });
    var invalid = Object.keys(w.checks).length;
    w.history.push({ at: stamp(), by: who(), what: '확인 대상 변경 → 내용 v' + w.ver + ' · 기존 확인 ' + invalid + '건 무효화 · 재확인 요청' });
    if (w.status === 'assigned') {
      w.workers.forEach(function (wid) {
        var l = linkFor(w, wid); l.ver = w.ver;
        var wk = worker(wid);
        sendTalk('recheck', wid, wk.name, wk.phone, w.id, w.site, { ver: w.ver });
      });
    }
    audit('작업 내용 변경', w.id + ' 내용 v' + w.ver); persist();
    return { changed: true, invalid: invalid };
  }
  function startWork(w) {
    var g = startGuard(w);
    if (!g.ok) { audit('작업 시작 승인 거부', w.id + ' — ' + g.reasons[0], '거부'); persist(); return { ok: false, reasons: g.reasons }; }
    w.status = 'working';
    w.history.push({ at: stamp(), by: who(), what: '작업 시작 승인 → 작업 중' + (w.permitId ? ' (허가 ' + w.permitId + ' 확인)' : '') });
    audit('작업 시작 승인', w.id); persist();
    return { ok: true };
  }
  function confirmDone(w) {
    if (w.status !== 'reported') return { ok: false, msg: '완료 보고 후에 완료 확인할 수 있습니다' };
    w.status = 'done'; w.history.push({ at: stamp(), by: who(), what: '완료 확인 → 종료' });
    audit('작업 완료 확인', w.id); persist();
    return { ok: true };
  }
  function createWork(o) {
    var id = 'J-' + (++S.seq.J);
    var w = { id: id, site: o.site, partner: o.partner, title: o.title, type: o.type, place: o.place, start: o.start, workers: o.workers,
      status: 'registered', permitId: o.permitId || null, ver: 1, hazards: o.hazards || [], ppe: o.ppe || [], rules: o.rules || '', checks: {}, links: {},
      history: [{ at: stamp(), by: who(), what: '작업 등록' }], report: null, createdBy: me() ? me().name : '' };
    S.works.unshift(w); audit('작업 등록', id + ' ' + o.title); persist();
    return w;
  }

  /* ---- 작업자 링크 검증 ------------------------------------------------- */
  function findLink(token) {
    for (var i = 0; i < S.works.length; i++) {
      var w = S.works[i];
      for (var wid in w.links) if (w.links[wid].token === token) return { work: w, wid: wid, link: w.links[wid] };
    }
    return null;
  }
  function verifyLink(token) {
    var f = findLink(token);
    if (!f) return { ok: false, code: 'invalid', msg: '유효하지 않은 링크입니다. 받은 작업 목록 또는 최신 안내의 링크를 다시 확인해 주세요.' };
    var now = stamp();
    if (f.link.revoked) return { ok: false, code: 'revoked', msg: '재발급 또는 배정 취소로 폐기된 링크입니다. 최신 알림톡의 링크를 열어 주세요.' };
    if (now > f.link.exp) return { ok: false, code: 'expired', msg: '만료된 링크입니다 (유효기간 ' + f.link.exp + ').' };
    if (f.work.workers.indexOf(f.wid) < 0) return { ok: false, code: 'unassigned', msg: '이 작업에 현재 배정되어 있지 않습니다.' };
    if (f.link.locked) return { ok: false, code: 'locked', msg: '확인 번호를 5회 잘못 입력해 링크가 잠겼습니다. 작업관리자에게 문의해 주세요.', f: f };
    if (['assigned', 'working', 'reported', 'done'].indexOf(f.work.status) < 0) return { ok: false, code: 'state', msg: '아직 배정이 확정되지 않은 작업입니다.' };
    return { ok: true, f: f };
  }
  function check4(token, digits) {
    var f = findLink(token); if (!f) return { ok: false };
    var wk = worker(f.wid);
    if (f.link.locked) return { ok: false, locked: true };
    if (wk.phone.replace(/\D/g, '').slice(-4) === digits) { f.link.fails = 0; persist(); return { ok: true }; }
    f.link.fails++;
    if (f.link.fails >= 5) {
      f.link.locked = true;
      f.work.history.push({ at: stamp(), by: wk.name, what: '확인 번호 5회 오류 → 링크 잠금' });
      audit('작업자 링크 잠금', f.work.id + ' · ' + wk.name, '잠금');
    }
    persist();
    return { ok: false, fails: f.link.fails, locked: f.link.locked };
  }
  function unlock(w, wid) {
    var l = w.links[wid]; if (!l) return;
    l.revoked = true;
    var nl = linkFor(w, wid); nl.ver = w.ver;
    var wk = worker(wid);
    sendTalk('assign', wid, wk.name, wk.phone, w.id, w.site, { ver: w.ver, force: true });
    w.history.push({ at: stamp(), by: who(), what: wk.name + ' 링크 재발급 (기존 링크 폐기)' });
    audit('작업자 링크 재발급', w.id + ' · ' + wk.name); persist();
  }
  function workerConfirm(token, payload) {
    var v = verifyLink(token); if (!v.ok) return v;
    var w = v.f.work, wid = v.f.wid;
    if (w.status !== 'assigned') return { ok: false, msg: '확인 단계가 아닙니다.' };
    if (checkValid(w, wid)) return { ok: true, dup: true };   // 중복 요청은 한 건으로 처리
    w.checks[wid] = { at: stamp(), ver: w.ver, ip: '211.36.' + (100 + Math.floor(Math.random() * 90)) + '.' + Math.floor(Math.random() * 200), device: payload.device || '모바일 · 카카오톡 인앱', items: payload.items, photo: payload.photo || null };
    w.history.push({ at: stamp(), by: workerName(wid), what: '작업자 안전 확인 완료 (내용 v' + w.ver + ')' });
    persist();
    return { ok: true };
  }
  function workerReport(token, note, photos) {
    var v = verifyLink(token); if (!v.ok) return v;
    var w = v.f.work;
    if (w.status !== 'working') return { ok: false, msg: '작업 중 상태에서만 완료 보고할 수 있습니다.' };
    w.status = 'reported';
    w.report = { at: stamp(), by: workerName(v.f.wid), note: note, photos: photos || [] };
    w.history.push({ at: stamp(), by: workerName(v.f.wid), what: '완료 보고' });
    persist();
    return { ok: true };
  }

  /* ---- 작업허가 ---------------------------------------------------------- */
  function permitTypesNeed(types) { return types.some(function (t) { return ['화기 작업', '고소 작업', '밀폐공간 작업', '전기 작업'].indexOf(t) >= 0; }); }
  function submitPermit(p, values, siteId) {
    var u = me();
    if (!p) {
      p = { id: 'PT-0' + (++S.seq.PT), site: siteId, partner: u.partner, title: (values.req['REQ-04'] || '').split('\n')[0].slice(0, 30) || '작업허가 신청', types: values.req['REQ-05'] || [],
        validFrom: values.req['REQ-01'], validTo: values.req['REQ-02'], status: 'submitted', revs: [], reviews: [], createdAt: stamp() };
      S.permits.unshift(p);
    } else {
      if (p.status !== 'supplement') return { ok: false, msg: '보완 요청 상태에서만 재신청할 수 있습니다' };
      p.status = 'submitted'; p.validFrom = values.req['REQ-01']; p.validTo = values.req['REQ-02']; p.types = values.req['REQ-05'] || [];
    }
    var rev = p.revs.length + 1;
    var formVersions = {};
    ['F-REQ', 'F-ROSTER', 'F-RISK'].forEach(function (fid) { formVersions[fid] = formCurrent(fid).v; });
    p.revs.push({ rev: rev, at: stamp(), by: u.name, formVersions: formVersions, values: JSON.parse(JSON.stringify(values)) });
    [['F-REQ', 'req'], ['F-ROSTER', 'roster'], ['F-RISK', 'risk']].forEach(function (f) {
      var id = 'D-0' + (++S.seq.D);
      S.docs.unshift({ id: id, formId: f[0], ver: formVersions[f[0]], site: p.site, partner: p.partner, status: 'submitted', rev: rev,
        values: JSON.parse(JSON.stringify(values[f[1]])), author: u.name, createdAt: stamp(), submittedAt: stamp(), permitId: p.id,
        history: [{ at: stamp(), by: u.name, what: '작업허가 ' + p.id + ' ' + rev + '차 신청과 함께 제출' }] });
      p[f[1] + 'Doc'] = id;
    });
    audit('작업허가 신청', p.id + ' ' + rev + '차'); persist();
    return { ok: true, permit: p };
  }
  function reviewPermit(p, action, reason) {
    var u = me();
    var allowed = { submitted: ['reviewing', 'supplement', 'approved', 'rejected'], reviewing: ['supplement', 'approved', 'rejected'], approved: ['cancelled'] };
    if (!allowed[p.status] || allowed[p.status].indexOf(action) < 0) return { ok: false, msg: '「' + PERMIT_STATUS[p.status] + '」 상태에서는 「' + PERMIT_STATUS[action] + '」 처리를 할 수 없습니다' };
    if ((action === 'supplement' || action === 'rejected' || action === 'cancelled') && !(reason || '').trim()) return { ok: false, msg: '보완 요청 · 반려 · 취소에는 사유 입력이 필수입니다' };
    if (u.role !== 'safety' && u.role !== 'admin') return { ok: false, msg: '검토 권한이 없습니다' };
    p.status = action;
    p.reviews.push({ by: u.name, role: ROLES[u.role], action: action, at: stamp(), reason: reason || '' });
    if (action === 'approved') {
      ['reqDoc', 'rosterDoc', 'riskDoc'].forEach(function (k) {
        var d = byId(S.docs, p[k]); if (d) { d.status = 'confirmed'; d.confirmedAt = stamp(); d.confirmedBy = u.name; d.history.push({ at: stamp(), by: u.name, what: '작업허가 승인과 함께 검토 확인' }); }
      });
    }
    if (action !== 'reviewing') {
      var pt = partner(p.partner);
      sendTalk('permit', p.partner, pt.contact + ' (' + pt.name + ')', pt.phone, p.id, p.site, { ver: p.id + '-' + p.reviews.length });
    }
    audit('작업허가 ' + PERMIT_STATUS[action], p.id + (reason ? ' — ' + reason : '')); persist();
    return { ok: true };
  }

  /* ---- 서류 ------------------------------------------------------------- */
  function newDoc(formId, siteId, values, extra) {
    var u = me();
    var d = { id: 'D-0' + (++S.seq.D), formId: formId, ver: formCurrent(formId).v, site: siteId, partner: u.role === 'partner' ? u.partner : (extra && extra.partner) || null,
      status: 'draft', rev: 1, values: values || {}, author: u.name, createdAt: stamp(), submittedAt: null, confirmedAt: null, confirmedBy: null,
      history: [{ at: stamp(), by: u.name, what: '작성 시작 (양식 v' + formCurrent(formId).v + ')' }] };
    S.docs.unshift(d); persist();
    return d;
  }

  /* ---- 긴급작업 --------------------------------------------------------- */
  function reportEmergency(o) {
    var u = me();
    var e = { id: 'E-0' + (++S.seq.E < 10 ? '0' + S.seq.E : S.seq.E), site: o.site, place: o.place, what: o.what, reporter: who(u), at: stamp(), status: 'received', photos: o.photos || [], actions: [], workId: null, notified: [] };
    e.id = 'E-' + String(S.seq.E).padStart(3, '0');
    S.users.filter(function (x) { return (x.role === 'manager' || x.role === 'safety') && x.sites.indexOf(o.site) >= 0; }).forEach(function (x) {
      sendTalk('emergency', x.id, x.name + ' (' + ROLES[x.role] + ')', '010-' + (2000 + x.id.length * 1111) + '-' + (3000 + x.name.length * 7), e.id, o.site, { ver: e.id });
      e.notified.push(x.name);
    });
    S.emergencies.unshift(e); audit('긴급작업 접수', e.id + ' ' + o.place); persist();
    return e;
  }

  G.DB = {
    get S() { return S; }, load: load, persist: persist, reset: reset, storageOk: function () { return storageOk; },
    ROLES: ROLES, WORK_TYPES: WORK_TYPES, WORK_STATUS: WORK_STATUS, PERMIT_STATUS: PERMIT_STATUS, DOC_STATUS: DOC_STATUS, EMG_STATUS: EMG_STATUS,
    HAZARDS: HAZARDS, PPE: PPE, PERMS: PERMS, TPL: TPL,
    ymd: ymd, hm: hm, stamp: stamp, addDays: addDays, dayStr: dayStr,
    byId: byId, worker: worker, workerName: workerName, site: site, partner: partner, form: form, formVer: formVer, formCurrent: formCurrent,
    permitDoc: permitDoc, permitFormVer: permitFormVer,
    me: me, who: who, audit: audit, scopeSites: scopeSites, inScope: inScope, guard: guard, filterScope: filterScope,
    sendTalk: sendTalk, settleTalks: settleTalks, retryTalk: retryTalk,
    permitValid: permitValid, needsPermit: needsPermit, checkValid: checkValid, startGuard: startGuard, linkFor: linkFor,
    assign: assign, changeContent: changeContent, startWork: startWork, confirmDone: confirmDone, createWork: createWork,
    findLink: findLink, verifyLink: verifyLink, check4: check4, unlock: unlock, workerConfirm: workerConfirm, workerReport: workerReport,
    permitTypesNeed: permitTypesNeed, submitPermit: submitPermit, reviewPermit: reviewPermit, newDoc: newDoc, reportEmergency: reportEmergency
  };
})(window);
