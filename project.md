# matmatch-admin — 프로젝트 문서

## 개요

맛매치 콘텐츠 관리 시스템(CMS). Google OAuth(NextAuth)로 관리자 1인만 접근 가능하며, 포스트·스페셜 기획전을 작성·수정·삭제한다.

- **레포**: `https://github.com/nemonecoltd/matmatch-admin`
- **포트**: 3001 (PM2 프로세스명: `admin`)
- **VM 경로**: `/home/nemonecoltd/nemone-network/admin`
- **프레임워크**: Next.js 14.2 (App Router)
- **인증**: NextAuth v4 + Google OAuth

---

## 서비스 구조

```
admin (Next.js, :3001)
├── Google OAuth 로그인 (NextAuth)
├── 포스트 관리    /              글 목록·삭제
├── 글 작성        /new           FormData → 백엔드 POST /posts
├── 글 수정        /edit/[id]     FormData → 백엔드 PUT /posts/{id}
├── 스페셜 관리    /special       기획전 목록·삭제
├── 스페셜 작성    /special/new   백엔드 POST /specials
├── 스페셜 수정    /special/edit/[id]
└── 통계           /data          백엔드 /analytics/summary
```

---

## 파일 구조

```
admin/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   NextAuth 핸들러
│   │   │   ├── posts/route.ts                GET + POST 프록시
│   │   │   ├── posts/[id]/route.ts           GET + PUT + DELETE 프록시
│   │   │   ├── specials/route.ts             GET + POST 프록시
│   │   │   └── specials/[id]/route.ts        GET + PUT + DELETE 프록시
│   │   ├── page.tsx                          글 목록 (메인)
│   │   ├── new/page.tsx                      글 작성
│   │   ├── edit/[id]/page.tsx                글 수정
│   │   ├── special/page.tsx                  스페셜 목록
│   │   ├── special/new/page.tsx              스페셜 작성
│   │   ├── special/edit/[id]/page.tsx        스페셜 수정
│   │   ├── data/page.tsx                     통계
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── lib/
│       ├── auth.ts                           NextAuth authOptions (공유)
│       └── adminProxy.ts                     백엔드 프록시 유틸리티
├── ecosystem.config.cjs                      PM2 설정
├── next.config.js                            rewrites 설정
├── .env.local                                환경변수 (커밋 금지)
└── .env.local.example                        환경변수 템플릿
```

---

## 인증 구조

### Google OAuth (NextAuth)
- `ADMIN_EMAIL`과 일치하는 Google 계정만 로그인 허용
- `src/lib/auth.ts`에 authOptions 정의 → 모든 서버 컴포넌트에서 공유

### API 보안 (백엔드 write 엔드포인트)
- admin의 `/api/posts`, `/api/specials` 등은 파일 시스템 라우트 핸들러로 처리
- `src/lib/adminProxy.ts`가 요청을 가로채서:
  1. NextAuth 세션 검증
  2. `x-admin-secret` 헤더 추가 후 백엔드로 포워딩
- 백엔드는 `ADMIN_SECRET_KEY`로 헤더 검증 → 인증 없는 직접 호출 차단

```
클라이언트 fetch("/api/posts", POST)
  → adminProxy (세션 확인 + x-admin-secret 주입)
  → 백엔드 :8080/posts (x-admin-secret 검증)
```

---

## API 라우팅

`next.config.js` rewrites:
- `/api/auth/*` → NextAuth 핸들러 (파일시스템)
- `/api/*` → `http://34.64.98.113:8080/*` (백엔드 프록시)

파일시스템 라우트가 rewrite보다 우선순위 높음:
- `/api/posts`, `/api/posts/[id]`, `/api/specials`, `/api/specials/[id]` → 프록시 핸들러 (세션 + 시크릿 주입)
- `/api/analytics/*`, `/api/posts/*/comments` 등 → rewrite로 백엔드 직접 전달

---

## 환경변수 (`.env.local`)

```
GOOGLE_CLIENT_ID=           # GCP OAuth 클라이언트 ID
GOOGLE_CLIENT_SECRET=       # GCP OAuth 클라이언트 시크릿
NEXTAUTH_SECRET=            # JWT 암호화 키 (openssl rand -base64 32)
NEXTAUTH_URL=               # https://admin.nemoneai.com
ADMIN_EMAIL=                # 허용할 관리자 Google 이메일
ADMIN_SECRET_KEY=           # 백엔드 write API 인증 키
BACKEND_URL=                # http://34.64.98.113:8080
```

**PM2 주의사항**: `ecosystem.config.cjs`에 시크릿 변수를 넣으면 undefined로 override될 수 있음. VM의 `.env.local`을 Next.js가 직접 읽도록 ecosystem에서 시크릿 변수를 제외해야 함. PM2 환경변수 갱신 시 `pm2 delete admin && pm2 start ecosystem.config.cjs && pm2 save` 필요.

---

## 배포 방식 (수동)

```bash
# 1. 로컬 빌드
cd /Users/hansjung/Desktop/matmatch/admin
npm run build

# 2. 빌드 결과물 압축
tar -czf admin_build.tar.gz .next src/lib src/app/api/posts src/app/api/specials ecosystem.config.cjs

# 3. VM 전송
scp admin_build.tar.gz nemonecoltd@34.64.98.113:/home/nemonecoltd/nemone-network/admin/
scp .env.local nemonecoltd@34.64.98.113:/home/nemonecoltd/nemone-network/admin/

# 4. VM에서 압축 해제 + 재시작
# tar -xzf admin_build.tar.gz
# pm2 delete admin && pm2 start ecosystem.config.cjs && pm2 save
```

---

## 2026-05-30 작업 내역

### 문제 1: 글 목록 빈 화면
- **원인**: 백엔드 `GET /posts` 응답 포맷이 배열 → `{total, posts}` 로 변경됐는데 admin이 미대응
- **수정**: `Array.isArray(data) ? data : (data.posts || [])` 패턴으로 3곳 수정
  - `src/app/page.tsx` (메인 글 목록)
  - `src/app/special/new/page.tsx` (스페셜 작성 - 포스트 선택)
  - `src/app/special/edit/[id]/page.tsx` (스페셜 수정 - 포스트 선택)

### 문제 2: NextAuth `digest` null / `NO_SECRET` 에러
- **원인**: `ecosystem.config.cjs`에서 `NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET` 평가 시 undefined → PM2가 빈 값으로 override
- **해결**: VM에서 환경변수를 shell에서 export 후 `pm2 delete admin && pm2 start ecosystem.config.cjs && pm2 save` 실행

### 신규 기능: 백엔드 admin API 보안

#### 백엔드 (`main.py`)
- `ADMIN_SECRET_KEY` 환경변수 추가
- `verify_admin` FastAPI 의존성 함수 추가 (`x-admin-secret` 헤더 검증)
- POST/PUT/DELETE `/posts`, POST/PUT/DELETE `/specials` 6개 엔드포인트에 `Depends(verify_admin)` 적용

#### admin Next.js
- `src/lib/auth.ts`: NextAuth authOptions 분리 (서버 컴포넌트 공유용)
- `src/lib/adminProxy.ts`: 세션 검증 + `x-admin-secret` 헤더 주입 프록시 유틸리티
- `src/app/api/posts/route.ts`: GET/POST 프록시
- `src/app/api/posts/[id]/route.ts`: GET/PUT/DELETE 프록시
- `src/app/api/specials/route.ts`: GET/POST 프록시
- `src/app/api/specials/[id]/route.ts`: GET/PUT/DELETE 프록시

### Git 연결
- `https://github.com/nemonecoltd/matmatch-admin` 레포 생성 및 초기 커밋
- `.gitignore`: `node_modules/`, `.next/`, `.env*`, `*.tar.gz` 등 제외

---

## 2026-05-31 작업 내역

### 문제: 어드민 글 저장 실패 (403 Forbidden)

- **증상**: 어드민 패널에서 글/스페셜 저장 시 `403 Forbidden` 반환, `404 Not Found` 병행 발생
- **원인**: Nginx `admin.nemoneai.com`의 `/api/` location이 Next.js(3001)가 아닌 백엔드(8080)로 직접 라우팅
  - `adminProxy.ts`를 거치지 않으므로 `x-admin-secret` 헤더가 주입되지 않음
  - 2026-05-30에 백엔드에 `verify_admin` 인증을 추가한 이후 즉시 발생 (그 전까지는 인증 없이 통과됐음)
- **수정**: Nginx `admin.nemoneai.com` `/api/` 블록의 `proxy_pass` 를 `8080` → `3001`(Next.js)로 변경
  ```nginx
  location ^~ /api/ {
      proxy_pass http://127.0.0.1:3001;
      ...
  }
  ```
- **흐름 복구**: 브라우저 → Nginx → Next.js(3001) → adminProxy(x-admin-secret 주입) → 백엔드(8080)

### 문제: home.nemoneai.com → nemoneai.com/api/news CORS 차단

- **증상**: `x-news-secret` 헤더가 CORS preflight에서 차단 → 게시글 DB 입력 불가
- **원인**: Nginx `nemoneai.com` `/api/` location의 `Access-Control-Allow-Headers`에 `x-news-secret` 미포함
- **수정**: `nemoneai.com` `/api/` 블록에 헤더 및 OPTIONS preflight 처리 추가
  ```nginx
  add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
  add_header 'Access-Control-Allow-Headers' 'DNT,...,x-news-secret,x-admin-secret' always;

  if ($request_method = 'OPTIONS') {
      return 204;
  }
  ```

### 참고: 서버 다운 원인 (2026-05-30 23:35 KST)

- **원인**: Spot VM(선점형) — GCP가 인프라 용량 필요 시 강제 종료
  - `shutdownEvent: {0}` (비정상 종료 시그니처)
  - 약 7시간 다운 후 수동 재부팅
- **lateBootReportEvent ERROR**: 비정상 종료 후 재부팅 시 Shielded VM 무결성 측정값 불일치 → 서비스 영향 없음
- **대응**: GCP Monitoring Uptime Check 설정 권장 (서버 다운 시 즉시 이메일 알림)

---

## 남은 작업

- [ ] `ecosystem.config.cjs` PM2 환경변수 로딩 방식 개선 (현재 수동 export 필요)
- [ ] GCP Monitoring Uptime Check 설정 (Spot VM 다운 시 즉시 알림)
