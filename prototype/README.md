# 작업안전 통합관리 — 프로토타입 (위시켓 158930)

공장·플랜트 작업·안전관리 통합 웹서비스 제안서(`../제안서.md`)의 개발 범위를 화면과 상호작용으로 구현한 브라우저 프로토타입입니다.
공고에서 가장 강조한 **법정 안전 서류의 항목 누락 방지(양식 엔진 · 자동 대조 시험 · 항목 대조표)** 와
**작업 배정 → 알림톡 → 작업자 안전 확인 → 시작 승인 → 완료 보고** 흐름을 실제로 동작하게 만들었습니다.

## 여는 방법

`index.html`을 브라우저에서 바로 열면 됩니다. 빌드도 서버도 필요 없습니다.
GitHub Pages 에 올릴 때는 이 폴더를 그대로 배포합니다 (`.nojekyll` 포함, 자산 경로는 모두 상대 경로).

## 체험 계정

업무 영역을 선택하면 해당 영역의 체험 계정만 표시됩니다. 계정을 누르면 이메일과 비밀번호가 입력됩니다. 다른 역할을 보려면 우측 상단 계정 메뉴에서 로그아웃하세요.

| 역할 | 이메일 | 비밀번호 | 범위 |
| --- | --- | --- | --- |
| 관리자 | `admin@demo.site` | `admin2026` | 고객사 전체 현장 · 양식 정의서 · 권한 · 감사 로그 |
| 작업관리자 | `manager@demo.site` | `manager2026` | 울산 1공장 · 승인 범위 동해플랜트설비 · 세진전기 |
| 작업관리자 2 | `manager2@demo.site` | `manager2026` | 울산 2공장 |
| 안전관리자 | `safety@demo.site` | `safety2026` | 울산 1·2공장 · 작업허가 검토 · 서류 확인 서명 |
| 협력업체 | `partner@demo.site` | `partner2026` | 동해플랜트설비 |
| 협력업체 | `partner2@demo.site` | `partner2026` | 세진전기 (소속 분리 확인용) |
| 작업자 | 로그인 없음 | — | 알림톡 링크 + 휴대전화 뒤 4자리 (`#/m` 에서 체험) |

## 꼭 보셔야 할 시연 흐름

1. **작업자 안전 확인 → 시작 승인** — 작업관리자로 로그인 → 작업 관리 → `J-1031`. 시작 승인을 누르면 미확인 작업자 때문에 거부됩니다.
   작업자 줄의 「작업자 화면」 → 뒤 4자리 입력(상단의 체험 확인 번호 참고) → 필독 공지 → 작업 내용 → 필수 점검 체크 → 개인 승인.
   다시 `J-1031` 에서 시작 승인하면 「작업 중」으로 바뀝니다.
2. **양식 엔진 · 양식 검증** — 관리자 → 양식 검증. 정의서의 항목을 화면·저장·엑셀 위치·필수 누락 차단 여부와 대조합니다.
   「관리자 검증 도구」를 열고 「체험용 오류 재현」을 켜면 TBM-14의 엑셀 출력 누락을 검증 실패로 표시합니다. 브라우저 내부 검증이며 실제 서버 검사나 배포 차단은 수행하지 않습니다. 양식별 항목 대조표와 확인 서명도 같은 화면에 있습니다.
3. **양식 버전** — 양식 정의서 → TBM 일지. v1 → v2에서 항목이 추가되었고, v1로 작성된 서류(`D-0118`)는 v1 그대로 열리고 출력됩니다.
   정의서 엑셀을 내려받아 고친 뒤 「정의서 엑셀 가져오기」로 올리면 형식 검사 후 새 버전 초안이 됩니다.
4. **작업허가 차수** — 안전관리자 → 작업허가 → `PT-022` → 차수 비교. 보완 요청 · 반려는 사유가 없으면 처리되지 않습니다.
5. **서류 누락 차단 · 내려받기** — 안전 서류 → `D-0132` 제출(필수 누락 거부) · 엑셀(TBM은 원본 서식 시트 포함) · 조건으로 파일 묶음(ZIP, 만료형 링크).
6. **소속 분리** — 관리자 → 사용자 권한 → 접근 권한 점검에서 다른 소속 자료 접근을 검사하면 접근 거부와 감사 로그를 표시합니다. 실제 HTTP 403 응답을 내는 서버는 없습니다. 협력업체로 `#/permits/PT-022` 주소를 직접 열어도 거부됩니다.

## 화면 구성

**관리 웹** — 로그인 / 대시보드 / 협력업체 홈 / 작업 관리(목록 · 상세 · 등록 · 확인 대상 변경) / 작업허가(목록 · 상세 · 차수 비교 · 신청 · 재신청) /
안전 서류(서류함 · 작성 · 제출 · 확인 서명 · 정정 · 엑셀 · 파일 묶음) / 긴급작업 / 양식 정의서(목록 · 버전 · 항목 추가 · 가져오기) /
양식 검증 · 항목 대조표 / 알림톡 발송 이력 / 공지 · 비상연락망 / 현장 · 협력업체 · 작업자(엑셀 일괄 등록) / 사용자 권한 · 접근 권한 점검 / 감사 로그

**작업자 모바일 웹** — 받은 작업 목록 / 본인 확인(뒤 4자리, 5회 잠금) / 필독 공지 / 작업 내용 / 안전 점검 · 개인 승인 / 확인 완료 · 동료 진행 / 완료 보고 / 비상연락망 / 링크 오류(변조 · 만료 · 폐기 · 잠금). 휴대폰 장식 프레임 없이 화면 폭에 맞춰 표시합니다.

## 이 프로토타입이 실제로 계산하는 것

- **양식 엔진** — 하나의 정의(항목 ID · 유형 · 필수)에서 입력 화면 · 저장 검증 · 엑셀 출력을 만듭니다. 임시저장은 형식만, 제출은 필수까지 검사합니다.
- **자동 대조 시험** — 정의서 항목마다 화면 구성요소 · 저장 값 왕복 · 엑셀 위치를 대조하고, 필수 항목을 하나씩 비워 제출 거부를 확인합니다.
- **작업 상태 머신** — 시작 승인은 ① 작업자 전원의 현재 내용 버전 확인 ② 허가 대상이면 유효한 작업허가(승인 · 유효기간) ③ 권한표상 승인 권한을 모두 충족해야 합니다.
  확인 대상(작업자 · 위험 요인 · 보호구 · 수칙)이 바뀌면 내용 버전이 올라가 기존 확인이 무효화되고 재확인 알림톡이 발송됩니다.
- **작업자 링크** — 작업자 · 작업마다 다른 링크를 발급하고 유효기간 · 폐기 · 배정 상태를 검사합니다. 5회 오류 시 잠기고 작업관리자가 재발급합니다.
- **알림톡** — 발송 요청 · 대행사 접수 · 전달 결과 · 작업자 확인을 구분해 기록합니다. 같은 배정 건 · 내용 버전은 한 번만 보내고, 재시도 불가 실패(번호 오류)는 재발송하지 않습니다.
- **소속 분리** — 목록 · 상세 · 내려받기 모두 같은 범위 검사를 거치며, 거부는 감사 로그에 남습니다.
- **엑셀 · 파일 묶음** — 브라우저에서 실제 `.xlsx`(병합 셀 · 결재란 포함 원본 서식 1종)와 `.zip`(현장/양식/날짜_서류번호/ 폴더, 사진 포함)을 만듭니다.
  생성 창을 닫아도 안전 서류의 「파일 묶음 작업함」에서 완료 파일을 다시 받을 수 있습니다. 파일은 완료 후 10분 동안 메모리에 보관하며, 새로고침·로그아웃·체험 데이터 초기화 때 작업함을 비웁니다. 서버의 다운로드 작업이나 인증된 서버 링크를 구현한 것은 아닙니다.

## 알아 두실 점

- 모든 회사명 · 현장 · 인물 · 전화번호 · 수치는 **시연용 가상 데이터**입니다. 양식의 「근거」 칸은 예시이며 실제 법정 항목은 발주처가 정의서에서 확정합니다(제안서 §4-3).
- 체험 데이터와 로그인 상태는 **현재 브라우저의 로컬 저장소**에만 보관됩니다. 로그인 화면이나 계정 메뉴의 「체험 데이터 초기화」로 처음 상태로 돌아갑니다.
- 알림톡은 실제로 발송하지 않습니다. 대행사 응답은 시연용으로 흉내 내며, 「대행사 접수」 건은 몇 초 뒤 「전달 완료」로 바뀝니다.
- 사진은 업로드할 때 축소합니다(운영 기준 긴 변 1,600px, 시연은 브라우저 저장 용량 때문에 800px). 기본 증빙 사진은 화면용으로 그린 이미지입니다. 로그인·대시보드·협력업체 홈·공지 화면의 사진은 AI 생성 이미지이며 실제 고객사 시설이나 현장 증빙이 아닙니다.
- 정의서 · 작업자 엑셀 가져오기는 `.xlsx`만 읽습니다(압축 해제에 브라우저 기본 기능 사용 — 최신 Chrome · Edge · Safari · Firefox).
- 웹 폰트(Pretendard)만 `cdn.jsdelivr.net` 에서 불러옵니다. 차단된 망에서도 시스템 글꼴로 정상 표시됩니다.

## 공개 범위

배포 시 저장소와 페이지의 공개 범위 설정을 확인하세요. `noindex`는 접근 통제가 아닙니다. 공개 페이지에는 실제 개인정보나 고객사 자료를 넣지 마세요. 이 프로토타입의 로그인은 서버 인증을 대체하지 않습니다.

## 이번 검토와 화면 개선

- 슬레이트·딥틸 색상과 사진 기반 로그인 화면, 대시보드·협력업체 홈 배너를 적용했습니다.
- 역할별 체험 계정 표시와 선택한 업무 영역에 맞는 로그인을 적용했습니다.
- 작업자 웹은 휴대폰 장식과 기술 설명 패널을 제거하고 반응형 업무 화면으로 정리했습니다.
- 양식 오류 재현과 권한 점검은 관리자용 펼침 메뉴로 정리했습니다. 메뉴와 안내 문구는 업무 중심으로 수정했습니다.
- 후속 검토에서 공지·비상연락망에 안전장비 사진을 추가하고, 양식 관리 설명을 펼침 메뉴로 정리했습니다. 교육 만료·서류 관리·알림톡·작업자 확인 문구에서 제안 단계 용어와 실제 동작을 과장한 표현을 줄였습니다.
- 계정 정보 창의 세로 늘어짐을 수정했습니다. 로그인 레이아웃(`login-layout`), 프로필 크기(`av-lg`), 큰 모달(`mdl lg`)의 클래스를 분리해 스타일 충돌을 제거했습니다. 계정 창은 이름·업무 영역·이메일·허용 현장·작업 시작 승인 범위·소속 협력업체를 역할에 맞춰 표시합니다.
- 고정 공지와 작업자 인증 표시가 공유하던 `pin` 클래스를 `notice-pinned`와 `worker-pin`으로 분리했습니다. 공지 제목·대상·게시 기간·작성자·본문을 구분하고, 긴 문구가 다음 공지와 겹치지 않도록 줄바꿈 스타일을 정리했습니다. 비상연락망의 긴 이름은 줄바꿈하고 전화번호는 한 줄로 표시합니다.
- 계정 전환·로그아웃·초기화 때 문서 선택·필터·작업허가 초안·작업함·모바일 임시 상태를 초기화합니다. 개별 파일과 ZIP 수신 시점에도 현재 계정의 현장·소속 범위를 검사합니다. 내려받기 이력은 현재 계정의 기록만 표시합니다.
- 작업 등록에서 유형·현장·협력업체를 바꿀 때 작업명·장소·일정·위험 요인·보호구·수칙을 유지합니다. 작업자와 작업허가는 변경한 소속·현장에서 사용할 수 있는 선택만 유지합니다. 긴급 접수의 작업 연결은 해당 현장에 새 작업이 정상 등록된 뒤 반환된 작업 번호로만 처리합니다.
- 양식의 마지막 항목 삭제와 빈 양식 발행을 차단합니다. 기존에 빈 초안이 저장되어 있더라도 항목 추가 화면을 열어 복구할 수 있습니다.
- 대시보드의 ‘시작 승인 가능’은 안전 확인·작업허가·승인 권한을 모두 검사합니다. 알림톡 작업자 확인 집계, 공지·비상연락망과 기준정보는 현재 계정·선택 현장에 맞춰 표시합니다. 공지 게시 기간도 검사합니다.
- 필독 공지·전화번호 저장·일반 서류 서명 안내를 실제 구현에 맞춰 수정했습니다. 공지 등록에는 실제 발송하지 않는 알림톡 선택 기능을 안내하지 않습니다. 일반 서류 서명은 서명자·확인 시각을 기록하며, 전화번호를 암호화해 저장한다고 주장하지 않습니다.
- 팝업의 초기 포커스·Tab 순환·닫은 뒤 포커스 복원과 배경 스크롤·입력 차단을 추가했습니다. 모바일 안전 확인 항목에는 키보드 포커스 표시를, 양식 입력란에는 접근 가능한 항목명을 추가했습니다.
- 작업자 엑셀 일괄등록은 파일 안에서 중복된 휴대전화의 모든 행과 달력에 없는 교육 이수일을 오류로 표시합니다. 등록 직전에도 저장된 번호를 다시 확인하여 중복 등록을 차단합니다. 교육 유효기간은 현지 날짜를 기준으로 365일을 더해 계산합니다.
- 작업허가는 신청 차수별로 제출 당시의 양식 버전을 보존합니다. 과거 신청 내용과 첨부 서류 링크는 선택한 차수를 따르며, 차수 비교에서는 각 버전의 추가·삭제·항목명·입력 유형 변경을 반영합니다. 기존 저장 자료는 같은 차수의 첨부 서류를 우선 참조하고, 첨부 기록이 없으면 발행 이력으로 버전을 복원해 고정합니다. 이미 저장된 입력 값과 이력은 지우지 않습니다.
- 표 내부의 버튼·체크박스 등에서 Enter를 눌러도 상세 화면 이동이 함께 실행되지 않도록 분리했습니다. 행 자체에 포커스가 있을 때만 Enter로 상세 화면에 이동합니다.
- 제안서 Markdown 원본과 웹제안서는 수정하지 않았습니다.

### 검사 방법과 한계

```sh
node submissions/2026100701/prototype/tests/review.cjs
```

프로젝트 루트에서 실행합니다. 외부 패키지 없이 메뉴 경로·화면 생성·이벤트 핸들러 연결·작업 승인·소속 범위·링크 잠금·필수 항목 검사·엑셀 컨테이너 생성을 검사합니다. 로그인 영역 변경·체험 계정 자동 입력·로그인 처리, 긴급작업 접수와 본인 목록 표시, 작업자 안전 확인→작업관리자 시작 승인→사진 첨부 완료 보고→완료 확인 흐름, 작업허가 보완·재신청·승인, 계정 창, 역할별 공지·연락망 등록을 검사합니다.

추가로 계정·현장 전환 후 선택과 초안 제거, 권한 밖 파일 수신 차단, 작업 유형 변경 시 입력 유지, 실패한 긴급 작업 등록의 연결 차단, 빈 양식 복구·발행 차단, 다운로드 창을 닫은 뒤 작업함에서 재수신·만료·계정 전환 차단, 집계와 게시 기간, 팝업 포커스·배경 차단을 검사했습니다. 기존 저장 자료의 서명 안내는 입력 기록과 사용자 정의 내용을 보존하면서 해당 기본 문구만 갱신합니다. CSS 구분자·사용자 정의 속성과 생성 HTML의 태그·ID·상호작용 요소 중첩도 확인했습니다. 엑셀 중복·날짜 검증, 저장 직전 재검사, 과거 양식 버전·첨부 링크·차수 비교, 표 내부 키보드 조작에 대한 **9개 회귀 검사 묶음을 추가하여 총 94개 검사와 200개 화면 HTML 구조 검사가 통과했습니다.** 서울·UTC·로스앤젤레스 시간대에서도 같은 검사를 통과했습니다.

검사에는 최소 DOM 대역을 사용하며, 화면 생성 검사 중 양식 검증 실행은 대역으로 대체합니다. 과거 양식 검사에는 발행된 버전 데이터를 구성한 테스트 자료를 사용합니다. 엑셀 업로드 검사는 실제 XLSX 생성·ZIP 읽기·업로드·검증·등록 처리와 최소 XML DOM 대역을 사용하며, 외부 엑셀 프로그램이 만든 압축 파일이나 브라우저 XML 파서 전체를 검증한 것은 아닙니다. 실제 브라우저 클릭·레이아웃·전체 양식 검증을 완료했다는 의미는 아닙니다. 브라우저의 로컬 파일 접근 제한 때문에 이번 검토에서 실제 화면 검수는 진행하지 못했습니다. 공고 URL도 이번 웹 도구에서 열리지 않아, 기능 대조는 로컬 제안서의 개발 범위를 기준으로 했습니다.

### 기존 집계 오류 재검사

사용자의 수정 승인 후 두 집계를 반영했습니다. 초기 관리자 화면의 ‘시작 승인 가능’은 실제 조건 검사와 같은 **0건**, 울산 2공장 작업관리자의 ‘작업자 확인’은 해당 범위와 같은 **10건**입니다. 두 값은 실제 화면 생성 결과를 검사하며, 다른 역할·현장 조합도 같은 기준으로 대조합니다.

**이전 검토 정정:** 긴급작업 접수 도메인 함수만 호출한 검사에서는 작성자 ID가 없었지만, 실제 접수 화면은 반환된 접수 건에 작성자 ID를 추가하고 저장합니다. UI 처리까지 검사한 결과 협력업체가 새로 접수한 건은 본인 목록에 정상 표시됩니다. 이전의 ‘본인 목록에 표시되지 않는다’는 사용자 화면 오류 판단을 철회합니다. 별도 업무 기능 수정은 하지 않았습니다.

## 생성 이미지 기록

내장 `image_gen`으로 생성하고 JPEG로 변환해 저장했습니다. 생성 사진을 실제 시설·인물·증빙 자료로 표시하지 않습니다.

- `assets/plant-overview.jpg`: 로그인 배경과 협력업체 홈 배너
- `assets/safety-team.jpg`: 관리 대시보드 배너
- `assets/safety-station.jpg`: 공지·비상연락망 배너

### 플랜트 사진 프롬프트

> Use case: photorealistic-natural. Asset type: industrial safety management web portal login background. Create a photorealistic architectural photograph of a modern Korean factory and process plant, stainless steel pipes, ordered equipment, clean walkways, subtle distant mountains. Wide landscape 1536x1024 composition usable as cover-cropped background, cool slate blue and muted teal grading, natural early morning light, understated premium industrial photography, realistic metal texture. No readable lettering, brand logos, watermarks, people or hazardous activity. This is a generic fictional site, not a real client facility.

### 현장 점검 사진 프롬프트

> Use case: photorealistic-natural. Asset type: workplace safety portal supporting photograph for dashboard and site information. Photorealistic editorial photograph of two industrial maintenance staff in a clean factory inspection zone, wearing safety helmets, protective workwear and eye protection, discussing a tablet while standing safely on a floor walkway beside stainless pipes and pumps. Natural credible posture and anatomically correct hands, no active hazardous work. Wide landscape 1536x1024, cool slate gray and subdued teal tones, premium restrained industrial photography, daylight, realistic material textures. Generic fictional people and facility, no readable text on tablet, no logos or watermark.

### 안전장비 사진 프롬프트

```text
Use case: photorealistic-natural
Asset type: supporting photo for a factory safety portal notice and emergency contact page
Primary request: photorealistic photograph of an orderly industrial safety preparation station in a modern Korean plant, a white hard hat, clear safety goggles and protective gloves neatly arranged on a slate gray desk, blurred stainless steel equipment and a clean walkway in the background.
Composition/framing: wide landscape 1536x1024, realistic close-up textures, room for cover cropping.
Lighting/mood: natural soft daylight, restrained premium editorial industrial photography.
Color palette: cool slate gray, subtle deep teal accents matching a professional operations portal.
Constraints: generic fictional scene; no people, no readable text, no logos, no watermark, no active hazardous work. This is decorative portal photography, not evidence of a real safety inspection.
```

## 개발 메모

- 정적 HTML · CSS · JavaScript, 외부 라이브러리 없음. 해시 라우터 + 이벤트 위임.
- `assets/files.js` xlsx · zip 작성 · `assets/data.js` 도메인 엔진과 가상 데이터 · `assets/forms.js` 양식 엔진 · 자동 대조 시험 ·
  `assets/ui.js` 셸 · 라우터 · 공통 부품 · `assets/pages1.js` 로그인 · 대시보드 · 작업 · 작업허가 · `assets/pages2.js` 서류 · 양식 · QC · 긴급 · 알림톡 · 공지 · 기준정보 · 권한 · 감사 · `assets/mobile.js` 작업자 모바일.
