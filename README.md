# 공장·플랜트 작업·안전관리 통합 웹서비스 구축 — 제안 자료 (위시켓 158930)

발주처 전달용 정적 웹 자료 두 개를 한 저장소에 담고, **주소로 분기**해 공개합니다.

| 주소 | 자료 |
| --- | --- |
| `/` | 두 자료를 안내하는 첫 화면 |
| `/proposal/` | **웹 제안서** — 제출 제안서를 10개 섹션과 부록으로 요약 |
| `/prototype/` | **작업안전 통합관리 화면** — 관리 웹(관리자 · 작업관리자 · 안전관리자 · 협력업체)과 작업자 모바일 화면 시연본 |

배포 주소는 `https://kenshin76.github.io/20261007011030/` 입니다.

- 웹 제안서 — `https://kenshin76.github.io/20261007011030/proposal/`
- 프로토타입 — `https://kenshin76.github.io/20261007011030/prototype/`
  (작업자 화면 `.../prototype/index.html#/m`)

두 자료의 첫 화면에 있는 **「메인으로」** 버튼은 이 첫 화면(`index.html`)으로 돌아옵니다.
모든 링크는 `index.html` 을 직접 가리키므로 폴더 목록 화면이 나오지 않습니다.

## 배포

`main` 브랜치에 push 하면 GitHub Actions 가 저장소 전체를 GitHub Pages 로 올립니다.
빌드 단계가 없습니다 — 두 자료 모두 정적 HTML·CSS·JS 입니다.

```
.github/workflows/pages.yml   configure-pages 의 enablement: true 로 첫 실행에 Pages 가 켜집니다
.nojekyll                     Jekyll 처리를 끕니다
404.html                      잘못된 주소에서 두 자료로 안내합니다
assets/cover-prototype.jpg    첫 화면 프로토타입 카드 이미지 (prototype/assets/plant-overview.jpg 의 일부)
```

첫 push 이후 **Settings → Pages → Source 가 "GitHub Actions"** 인지 한 번 확인해 주십시오.

웹 폰트(Pretendard)만 `cdn.jsdelivr.net` 에서 불러옵니다. 차단된 망에서도 시스템 글꼴로 정상 표시됩니다.

## 저장소에 올라가지 않는 것

`.gitignore` 로 아래를 제외합니다. **제안 금액 산정 근거·단가·인력 참여율이 담긴 내부 문서**이기 때문입니다.

- 저장소 루트의 모든 `.md` (이 README 만 예외) — `제안서.md`
- 검증 스크립트 `verify_web.py` · 내부 시험 `prototype/tests/`
- `.docx` · `.pptx` · `.xlsx` · `.pdf` · `design/`
- macOS·편집기 생성 파일 (`.DS_Store` 등)

`proposal/README.md` · `prototype/README.md` 는 하위 폴더에 있으므로 함께 올라갑니다.

## 두 자료의 관계

**모든 수치의 단일 출처는 `제안서.md` 입니다.** 웹 제안서는 그 내용을 재배열·요약한 것이고,
프로토타입은 제안서 §7 「개발 범위」의 필수 과업을 화면과 상호작용으로 구현한 것입니다.
값이 서로 다르면 **제출 제안서가 맞습니다.**

| 항목 | 값 |
| --- | --- |
| 개발·납품 금액 | 25,000,000원 (부가세 별도 · 포함 시 27,500,000원) |
| 개발 기간 | 90일 · 2026-11-02 ~ 2027-01-30 (개발 84일 + 예비 6일) |
| 총 투입량 | 100.0 MD · 3.33 MM · 7명 |
| 서버 운영 비용 (월) | 운영 관리비 500,000원 (부가세 별도) + 인프라 이용료 실비 |

## 공개 범위 주의

GitHub Pages 는 저장소가 Private 이어도 무료 플랜에서 페이지가 공개됩니다.
모든 페이지에 `noindex` 를 넣었지만 주소를 아는 사람은 누구나 열 수 있으므로 발주처 담당자에게만 전달해 주십시오.
