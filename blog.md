# SketchTo: AI 스케치 변환 SaaS를 만들며 배운 것들

> 손그림 스케치를 AI로 고품질 2D 그래픽으로 변환하는 풀스택 SaaS 서비스, SketchTo의 기술 스택과 아키텍처를 소개합니다.

---

## 프로젝트 소개

**SketchTo**는 사용자가 러프한 손그림 스케치를 업로드하면, AI가 선택한 아트 스타일에 맞춰 고품질 2D 그래픽으로 변환해주는 서비스입니다. 플랫 아이콘, 픽셀 아트, 애니메, 수채화 등 26가지 스타일을 지원하며, Freemium 모델 기반의 구독 결제 시스템을 갖추고 있습니다.

이 글에서는 SketchTo를 구축하면서 선택한 기술 스택, 아키텍처 설계, 그리고 실제 구현 과정에서 마주한 문제와 해결 방법을 공유합니다.

---

## 기술 스택 한눈에 보기

| 영역 | 기술 |
|------|------|
| **프레임워크** | Next.js 16 (App Router) + React 19 + TypeScript |
| **스타일링** | Tailwind CSS 4 + shadcn/ui + Radix UI |
| **AI 엔진** | Google Gemini 2.5 Flash (멀티모달 이미지 생성) |
| **인증** | Supabase Auth (Google/GitHub OAuth) |
| **데이터베이스** | Supabase (PostgreSQL + RLS) |
| **결제** | Stripe (구독 결제 + Webhook) |
| **배포** | Vercel |
| **광고** | Kakao AdFit |

---

## 1. Next.js 16 App Router: 풀스택의 핵심

SketchTo는 **Next.js 16**의 App Router를 기반으로 구축했습니다. 프론트엔드와 백엔드를 하나의 프로젝트에서 관리할 수 있다는 점이 1인 개발에서 큰 장점이었습니다.

### API Routes 구조

```
app/
├── api/
│   ├── generate/route.ts          # 이미지 생성 API
│   ├── payments/stripe/
│   │   ├── checkout/route.ts      # 결제 세션 생성
│   │   └── webhook/route.ts       # Stripe 이벤트 처리
│   └── subscriptions/
│       └── cancel/route.ts        # 구독 취소
├── auth/
│   ├── login/page.tsx             # 로그인 페이지
│   └── callback/route.ts         # OAuth 콜백
├── pricing/page.tsx               # 요금제 페이지
└── page.tsx                       # 메인 페이지
```

Server Component와 Client Component를 적절히 분리하여 SSR의 이점을 최대한 활용했습니다. 특히 메타데이터와 SEO 관련 설정은 서버 사이드에서, 사용자 인터랙션이 필요한 업로드/스타일 선택 등은 클라이언트 사이드에서 처리합니다.

### React 19의 새로운 기능 활용

React 19의 최신 기능을 적극 활용했습니다. `useCallback`, `useMemo` 등의 최적화 훅과 함께 서버 컴포넌트의 데이터 페칭 패턴을 활용하여 초기 로딩 속도를 개선했습니다.

---

## 2. Gemini 2.5 Flash: 멀티모달 AI 이미지 생성

SketchTo의 핵심은 **Google Gemini 2.5 Flash** 모델을 활용한 이미지 생성입니다.

### 왜 Gemini인가?

- **멀티모달 입출력**: 이미지를 입력받아 이미지를 출력할 수 있는 모델
- **빠른 응답 속도**: Flash 모델 특유의 저지연 응답
- **합리적인 비용**: 대량의 이미지 생성에도 부담 없는 가격 정책

### 프롬프트 엔지니어링

26가지 스타일 각각에 대해 200~300단어 분량의 상세한 프롬프트를 설계했습니다. 단순히 "플랫 아이콘으로 변환해줘"가 아니라, 색상 팔레트, 선의 두께, 그림자 처리, 배경 설정 등 세밀한 지시를 포함합니다.

```typescript
// 프롬프트 구조 예시
{
  id: "flat-icon",
  name: "Flat Icon",
  emoji: "🎯",
  category: "Icons",
  tier: "free",
  prompt: "Transform this sketch into a modern flat icon design..."
}
```

### 커스텀 프롬프트 기능

사용자가 스타일 프롬프트에 추가 지시사항을 덧붙일 수 있는 기능도 구현했습니다. 500자 제한의 텍스트 입력을 통해 "배경을 파란색으로", "좀 더 귀엽게" 등의 세부 조정이 가능합니다. 서버 사이드에서 입력값을 검증하여 프롬프트 인젝션을 방지합니다.

### 이미지 처리 파이프라인

```
[사용자 스케치 업로드]
    ↓ 클라이언트: Base64 인코딩 (최대 4MB)
    ↓ API: 인증 → 사용량 확인 → 티어 검증
    ↓ Gemini API: 스타일 프롬프트 + 이미지 전송
    ↓ 응답: Base64 이미지 수신
    ↓ 클라이언트: 포맷 변환 (PNG/JPG/ICO) + 리사이즈
[결과 이미지 다운로드]
```

---

## 3. Supabase: 인증부터 데이터베이스까지

**Supabase**를 BaaS(Backend as a Service)로 선택한 이유는 PostgreSQL 기반의 강력한 데이터베이스, 내장 인증 시스템, 그리고 Row Level Security(RLS)를 한 번에 제공하기 때문입니다.

### 데이터베이스 스키마

```sql
-- 사용자 프로필 (회원가입 시 자동 생성)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  name TEXT,
  plan TEXT DEFAULT 'free',  -- free | silver | gold | platinum
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 일일 사용량 추적
CREATE TABLE daily_usage (
  user_id UUID REFERENCES profiles(id),
  date DATE DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- 구독 관리
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  plan TEXT NOT NULL,
  provider TEXT DEFAULT 'stripe',
  status TEXT DEFAULT 'pending',
  external_customer_id TEXT,
  external_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
);
```

### Row Level Security (RLS)

RLS를 통해 데이터베이스 레벨에서 접근 제어를 적용했습니다. 사용자는 자신의 데이터만 읽고 쓸 수 있으며, 구독 데이터는 서비스 역할 키(Service Role Key)를 통해서만 서버에서 기록할 수 있습니다.

```sql
-- 사용자는 자신의 프로필만 조회 가능
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 일일 사용량은 본인 것만 갱신 가능
CREATE POLICY "Users can update own usage"
  ON daily_usage FOR UPDATE
  USING (auth.uid() = user_id);
```

### OAuth 인증 플로우

Google과 GitHub OAuth를 지원하며, `@supabase/ssr` 패키지를 활용하여 서버 사이드 세션 관리를 구현했습니다. 회원가입 시 트리거를 통해 `auth.users`의 메타데이터에서 이메일과 이름을 자동으로 `profiles` 테이블에 복사합니다.

```typescript
// 로그인 시 동적 origin 사용
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

이 방식은 로컬 개발(localhost:3000)과 프로덕션(sketch-to.vercel.app) 환경 모두에서 코드 변경 없이 동작합니다.

---

## 4. Stripe 결제: Freemium SaaS 구독 모델

4단계 구독 모델을 Stripe로 구현했습니다.

### 요금제 구성

| 플랜 | 가격 (월) | 일일 생성 | PRO 스타일 |
|------|-----------|-----------|-----------|
| **Free** | ₩0 | 2회 | 12가지 |
| **Silver** | ₩13,900 | 10회 | 26가지 |
| **Gold** | ₩39,900 | 30회 | 26가지 |
| **Platinum** | ₩109,900 | 100회 | 26가지 |

### Webhook 기반 상태 동기화

Stripe의 이벤트를 Webhook으로 수신하여 구독 상태를 실시간으로 데이터베이스에 반영합니다.

```
[Stripe Event]
    ├── checkout.session.completed → 신규 구독 생성
    ├── invoice.paid → 결제 성공, 구독 갱신
    ├── invoice.payment_failed → 결제 실패, past_due 상태
    └── customer.subscription.deleted → 구독 취소, free로 다운그레이드
```

데이터베이스 트리거를 통해 `subscriptions` 테이블의 상태 변경이 자동으로 `profiles.plan`에 반영되므로, 결제 상태와 사용자 플랜이 항상 동기화됩니다.

### API 레벨 접근 제어

이미지 생성 API에서는 다중 검증을 수행합니다:

1. **인증 확인** - 로그인 여부 (401)
2. **사용량 확인** - 일일 할당량 초과 여부 (429)
3. **티어 확인** - PRO 스타일 접근 권한 (403)

---

## 5. 26가지 아트 스타일 시스템

스타일 시스템은 5개 카테고리로 분류된 26가지 스타일로 구성됩니다.

### 카테고리 구조

- **Icons** - Flat Icon, Line Art, Pixel Art, SVG Vector, Minimalist, Logo
- **Characters** - Sticker, Kawaii, Chibi, Anime, Mascot
- **Illustrations** - Comic Book, Watercolor, Woodcut, Embroidery
- **Artistic** - Isometric 3D, Neon Glow, Clay 3D, Retrowave, Blueprint
- **Design** - Hero Banner, Infographic, Glassmorphism, Realistic

### 프리/프로 구분

Free 티어 사용자는 12가지 기본 스타일에 접근할 수 있고, 유료 구독자는 14가지 PRO 스타일을 추가로 사용할 수 있습니다. UI에서는 잠금 아이콘과 PRO 뱃지로 시각적으로 구분하여 업그레이드를 유도합니다.

```typescript
// 스타일 접근 제어
const isLocked = style.tier === "pro" && userPlan === "free";

// UI 표시
{isLocked && (
  <div className="absolute top-2 right-2">
    <Lock className="w-4 h-4" />
    <Badge>PRO</Badge>
  </div>
)}
```

---

## 6. UI/UX: shadcn/ui + Tailwind CSS 4

### 컴포넌트 시스템

**shadcn/ui**를 기반으로 일관된 디자인 시스템을 구축했습니다. New York 스타일 변형을 사용하며, CSS 변수를 통해 테마 커스터마이징이 가능합니다.

주요 컴포넌트:
- `SketchUploader` - 드래그 앤 드롭 이미지 업로드
- `StyleSelector` - 카테고리별 스타일 그리드
- `ImagePreview` - 생성 결과 미리보기 + 다운로드
- `UsageIndicator` - 일일 사용량 표시
- `LoginDialog` - 전역 로그인 모달 (Context API)

### 3단계 워크플로우

사용자 경험을 단순화하기 위해 3단계 프로세스로 설계했습니다:

```
Step 1: Upload    →    Step 2: Style    →    Step 3: Generate
(스케치 업로드)        (스타일 선택)         (결과 확인/다운로드)
```

각 단계는 시각적 인디케이터로 진행 상황을 표시하며, 이전 단계로 돌아가 수정할 수 있습니다.

### 다운로드 옵션

생성된 이미지는 다양한 포맷과 크기로 다운로드할 수 있습니다:
- **포맷**: PNG, JPG, ICO
- **크기**: 16x16 ~ 1024x1024 (10가지 옵션)
- ICO 포맷은 클라이언트 사이드에서 바이너리 헤더를 직접 생성하여 변환합니다

---

## 7. SEO 최적화

한국어/영어 이중 언어 지원과 함께 포괄적인 SEO 전략을 적용했습니다.

### 적용 항목

- **메타데이터**: Open Graph, Twitter Card 태그
- **JSON-LD**: 구조화된 데이터 (SoftwareApplication 스키마)
- **robots.txt**: 프로그래밍 방식 생성 (`app/robots.ts`)
- **Sitemap**: 동적 사이트맵 생성 (`app/sitemap.ts`)
- **다국어**: `hreflang` 태그로 한국어/영어 대응
- **Google Search Console**: 웹마스터 도구 인증

```typescript
export const metadata: Metadata = {
  title: "SketchTo - Transform Sketches into Stunning 2D Graphics with AI",
  description: "AI 기반 스케치 변환 서비스...",
  alternates: {
    languages: { ko: "/ko", en: "/en" },
  },
  openGraph: { ... },
};
```

---

## 8. 수익화 전략: 구독 + 광고

### 구독 모델

Stripe 기반의 월간 구독으로 주요 수익을 창출합니다. Free → Silver → Gold → Platinum으로 이어지는 자연스러운 업그레이드 경로를 설계했습니다. 무료 사용자가 일일 한도에 도달하면 업그레이드 다이얼로그를 노출하여 전환율을 높입니다.

### 광고 수익

**Kakao AdFit**을 통해 한국 시장 타겟 광고를 게재합니다:
- 모바일 상단 배너 (320x100)
- 데스크톱 좌측 사이드바 (160x600)
- 데스크톱 우측 사이드바 (160x600)

무료 사용자에게 노출하여 추가 수익원을 확보하면서도, 유료 사용자에게는 광고 없는 경험을 제공할 수 있는 구조입니다.

---

## 9. 배포 및 인프라

### Vercel 배포

Next.js와의 최적 호환성을 위해 **Vercel**을 배포 플랫폼으로 선택했습니다. Git push만으로 자동 배포되며, Edge Network를 통한 글로벌 CDN, 자동 HTTPS, 서버리스 함수 지원 등을 활용합니다.

### 환경 변수 관리

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase 공개 키
SUPABASE_SERVICE_ROLE_KEY         # Supabase 서비스 키 (서버 전용)
GEMINI_API_KEY                    # Google Gemini API 키
STRIPE_SECRET_KEY                 # Stripe 비밀 키
STRIPE_WEBHOOK_SECRET             # Stripe Webhook 시크릿
NEXT_PUBLIC_STRIPE_PRICE_*        # 각 플랜 가격 ID
```

`NEXT_PUBLIC_` 접두사가 붙은 변수만 클라이언트에 노출되며, 나머지는 서버 사이드에서만 접근 가능합니다.

---

## 10. 회고: 1인 개발에서 배운 것들

### 잘한 점

- **Supabase + Stripe 조합**: 인증, DB, 결제를 각각 SaaS로 위임하여 핵심 로직에 집중할 수 있었습니다.
- **프롬프트 엔지니어링 투자**: 26가지 스타일 프롬프트를 세밀하게 다듬은 덕분에 일관된 품질의 결과물을 얻을 수 있었습니다.
- **RLS 활용**: 데이터베이스 레벨의 접근 제어로 보안 실수를 원천 차단했습니다.
- **환경 독립적 설계**: `window.location.origin` 기반의 동적 URL 처리로 개발/프로덕션 환경 전환이 매끄럽습니다.

### 기술적 도전

- **ICO 포맷 변환**: 브라우저에서 직접 ICO 바이너리 헤더를 생성해야 했습니다. Canvas API로 리사이즈한 후 6바이트 ICO 헤더 + 16바이트 디렉토리 엔트리를 수동으로 조립합니다.
- **일일 사용량 추적**: `UPSERT`와 `UNIQUE(user_id, date)` 제약 조건을 활용하여 날짜별 카운트를 원자적으로 증가시킵니다.
- **Webhook 멱등성**: Stripe Webhook 이벤트가 중복 전달될 수 있으므로, 동일 이벤트를 여러 번 처리해도 안전한 구조로 설계했습니다.

---

## 마무리

SketchTo는 **Next.js + Supabase + Gemini AI + Stripe**라는 모던 스택 위에 구축된 AI SaaS 서비스입니다. 1인 개발자가 아이디어를 빠르게 프로덕션 레벨의 서비스로 만들 수 있음을 보여주는 사례이기도 합니다.

핵심은 "직접 구축하지 않아도 되는 것은 SaaS에 위임하고, 차별화되는 핵심 기능에 집중하는 것"이었습니다. 인증은 Supabase에, 결제는 Stripe에, 배포는 Vercel에 맡기고, 프롬프트 엔지니어링과 사용자 경험 설계에 시간을 투자한 것이 가장 효과적인 전략이었습니다.

---

**기술 스택 요약**

```
Frontend:  Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui
AI:        Google Gemini 2.5 Flash (멀티모달 이미지 생성)
Backend:   Supabase (PostgreSQL + Auth + RLS)
Payments:  Stripe (구독 결제 + Webhook)
Deploy:    Vercel (서버리스 + Edge CDN)
SEO:       JSON-LD · Open Graph · 다국어 지원
Ads:       Kakao AdFit
```
