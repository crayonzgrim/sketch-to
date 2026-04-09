# SketchTo - 프로젝트 기반 개발자 이력서

## 프로젝트 개요

**SketchTo** — AI 기반 스케치-to-이미지 변환 SaaS 웹 애플리케이션

손으로 그린 스케치를 업로드하면 Google Gemini 멀티모달 AI가 23개 아트 스타일로 변환하는 풀스택 서비스.
Freemium 구독 모델, OAuth 인증, 결제 시스템, 광고 수익화까지 서비스 운영에 필요한 전체 스택을 1인 개발로 구현.

> 배포: Vercel | DB: Supabase (PostgreSQL) | 결제: Stripe | AI: Google Gemini 2.5 Flash

---

## 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| Framework | **Next.js 16** (App Router) | RSC, Route Handlers, 동적 메타데이터 |
| Language | **TypeScript 5** (Strict Mode) | 전체 코드베이스 타입 안정성 확보 |
| UI | **React 19**, Tailwind CSS 4, shadcn/ui | Radix UI 기반 14개+ 재사용 컴포넌트 |
| Auth | **Supabase Auth** | Google/GitHub OAuth, SSR 쿠키 세션 |
| Database | **PostgreSQL** (Supabase) | RLS, Trigger, Function, ENUM, 조건부 인덱스 |
| AI | **Google Gemini 2.5 Flash** | 멀티모달 입출력 (이미지+텍스트 → 이미지) |
| Payment | **Stripe** | Checkout Session, Webhook 서명 검증, 구독 라이프사이클 |
| Deploy | **Vercel** | Serverless Functions |
| Ad | **Kakao AdFit** | 반응형 광고 슬롯 3개 |

---

## 1. AI 멀티모달 파이프라인 & 프롬프트 엔지니어링

### 데이터 플로우

```
[스케치 업로드] → FileReader → Base64 인코딩
     → POST /api/generate (Auth + Usage + Tier 검증)
     → Gemini 2.5 Flash (inlineData + text prompt)
     → response.candidates[0].content.parts → inlineData 추출
     → Base64 디코딩 → Canvas 렌더링 → 다운로드
```

### Gemini API 연동 구현 (`lib/gemini.ts`)

```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],  // 멀티모달 출력 설정
  },
});

// 이미지 + 텍스트를 동시에 전송하는 멀티모달 요청
const result = await model.generateContent([
  { inlineData: { data: base64Image, mimeType } },  // 스케치 이미지
  { text: prompt },                                    // 스타일별 프롬프트
]);
```

- **멀티모달 입력**: 사용자 스케치 이미지(Base64)와 텍스트 프롬프트를 동시 전송
- **멀티모달 출력**: `responseModalities: ["TEXT", "IMAGE"]`로 이미지 응답 수신
- **응답 파싱**: `candidates[0].content.parts` 순회하여 `inlineData` 추출
- **에러 처리**: 응답에 이미지가 없는 경우, API 키 미설정 등 방어적 에러 핸들링

### 프롬프트 엔지니어링 설계 (`lib/prompts.ts`)

23개 스타일을 5개 카테고리로 분류하고, 각 프롬프트를 **역할 부여 → 상세 요구사항** 구조로 설계:

```
스타일 구성:
├── Icons (8): flat, lineart, pixel, sticker, minimalist, vector, blueprint, infographic
├── Characters (5): kawaii, chibi, anime, mascot, comic
├── Illustrations (4): isometric, watercolor, neon, clay3d
├── Artistic (3): woodcut, embroidery, retrowave
└── Design (3): hero, logo, glassmorphism
```

**프롬프트 설계 패턴** — 모든 프롬프트에 공통 적용한 구조:

```
1. 역할 부여 (Role Assignment)
   "You are a professional icon designer."
   "You are a pixel art specialist."
   → AI에게 전문가 페르소나를 부여하여 출력 품질 향상

2. 목표 명시 (Task Definition)
   "Transform the attached rough sketch into a polished, production-ready flat design icon."
   → 입력(rough sketch)과 출력(polished icon)의 기대치를 명확히 정의

3. 기술 사양 (Technical Specifications)
   "Use a cohesive palette of 3-5 solid, vibrant colors."
   "Each pixel must be clearly visible — no anti-aliasing."
   → 색상 팔레트, 해상도, 선 굵기 등 정량적 기술 요구사항

4. 네거티브 프롬프트 (Exclusion Rules)
   "No gradients, no shadows, no textures."
   "No fills, no colors, no gradients — pure monochrome linework only."
   → 원치 않는 요소를 명시적으로 배제하여 출력 정밀도 향상

5. 출력 형식 (Output Format)
   "White or transparent background."
   "Output a single, centered icon filling ~80% of the canvas."
   → 배경, 구도, 크기 비율 등 최종 출력물 형식 지정
```

**스타일별 프롬프트 차별화 예시**:

| 스타일 | 핵심 지시사항 | 기술 키워드 |
|--------|--------------|------------|
| **Flat Icon** | 3-5 솔리드 컬러, 그라데이션 금지, 64px~512px 가독성 확보 | pixel-perfect, geometric |
| **Pixel Art** | 8-16색 제한, 안티앨리어싱 금지, 디더링 패턴, 32x32~64x64 논리 픽셀 | dithering, grid-aligned |
| **Neon Glow** | 다크 배경(#0a0a0f), 네온 색상 코드 지정(#00f0ff, #ff00aa), 글로우 물리 시뮬레이션 | bloom, ambient glow |
| **Watercolor** | 습식-습식 효과, 안료 입자화, 종이 흰색 보존, 레이어 워시 | wet-on-wet, granulation |
| **ICO 파일** | BMP 헤더 직접 바이너리 조립, 디렉토리 엔트리 구조 | DataView, ArrayBuffer |
| **Woodcut** | 순수 2톤 대비, 크로스해칭/평행선/스티플링, 양각/음각 공간 | cross-hatching, relief print |

**티어 분류 전략**:
- **Free (12종)**: 범용적이고 인지도 높은 스타일 (flat, lineart, pixel, kawaii 등)
- **PRO (11종)**: 전문 아티스트 수준의 세밀한 렌더링 필요 (anime, watercolor, retrowave 등)
- 분류 기준: 프롬프트 복잡도 + AI 처리 비용 + 시장 차별성

---

## 2. SEO 최적화 상세 구현

### 2-1. Next.js Metadata API 활용 (`app/layout.tsx`)

Next.js의 타입 안전한 `Metadata` 객체를 사용하여 서버 사이드에서 메타데이터를 생성:

```typescript
export const metadata: Metadata = {
  // 1. Title Template — 하위 페이지에서 "페이지명 | SketchTo" 형태로 자동 생성
  title: {
    default: "SketchTo - Sketch to Professional Image",
    template: "%s | SketchTo",
  },

  // 2. 다국어 키워드 — 영문/한국어 검색 모두 커버
  keywords: [
    "sketch to image", "AI image generator", "sketch converter",
    "스케치 변환", "AI 이미지 생성", "아이콘 생성기",
  ],

  // 3. metadataBase — 모든 상대 URL의 기준 도메인
  metadataBase: new URL(siteUrl),

  // 4. Canonical + hreflang — 중복 콘텐츠 방지 + 다국어 지원
  alternates: {
    canonical: "/",
    languages: { en: "/", ko: "/" },
  },
};
```

### 2-2. Open Graph & Twitter Card

소셜 미디어 공유 시 미리보기 최적화:

```typescript
openGraph: {
  type: "website",
  locale: "en_US",
  alternateLocale: "ko_KR",     // 한국어 로케일 대체
  images: [{
    url: `${siteUrl}/og-image.png`,
    width: 1200, height: 630,    // Facebook/LinkedIn 권장 크기
    alt: "SketchTo - Transform sketches into professional images with AI",
  }],
},
twitter: {
  card: "summary_large_image",   // 큰 이미지 미리보기 카드
},
```

### 2-3. Google 크롤러 세부 제어

```typescript
robots: {
  index: true,
  follow: true,
  googleBot: {
    "max-video-preview": -1,      // 동영상 미리보기 무제한
    "max-image-preview": "large",  // 이미지 미리보기 최대 크기
    "max-snippet": -1,             // 텍스트 스니펫 길이 무제한
  },
},
```

### 2-4. JSON-LD 구조화 데이터 (`WebApplication` 스키마)

검색엔진이 "이 사이트가 무엇인지" 기계적으로 이해할 수 있도록 스키마 마크업:

```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SketchTo",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  inLanguage: ["en", "ko"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free tier available",
  },
};

// <head>에 스크립트 태그로 주입
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

**구조화 데이터 효과**:
- Google 검색 결과에 리치 스니펫(가격, 카테고리, 지원 언어) 표시 가능
- `WebApplication` 타입으로 앱 마켓플레이스 검색에도 노출 가능
- `offers.price: "0"`으로 "무료 앱" 필터 검색에 포함

### 2-5. 동적 robots.txt (`app/robots.ts`)

Next.js `MetadataRoute.Robots` 타입으로 프로그래밍 방식 생성:

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/pricing/success", "/pricing/cancel"],
      // API 엔드포인트, OAuth 콜백, 결제 결과 페이지 크롤링 차단
    }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

### 2-6. 동적 Sitemap (`app/sitemap.ts`)

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
    // 인증/결제 페이지는 의도적으로 제외
  ];
}
```

### SEO 최적화 요약

| 기법 | 구현 방식 | 목적 |
|------|----------|------|
| Title Template | `%s \| SketchTo` | 일관된 브랜딩 + 개별 페이지 SEO |
| 다국어 키워드 | 영문 9개 + 한국어 3개 | 영/한 검색 양쪽 커버 |
| Canonical URL | `alternates.canonical` | 중복 콘텐츠 패널티 방지 |
| hreflang | `languages: { en, ko }` | 다국어 검색 결과 연결 |
| OG Image | 1200x630 고정 크기 | Facebook/LinkedIn 미리보기 최적화 |
| Twitter Card | `summary_large_image` | 트위터 공유 시 큰 이미지 노출 |
| JSON-LD | `WebApplication` 스키마 | 검색엔진 리치 스니펫 |
| robots.txt | API/Auth 경로 차단 | 불필요한 크롤링 방지 |
| sitemap.xml | 우선순위/빈도 설정 | 검색엔진 크롤링 효율화 |
| GoogleBot 제어 | max-image-preview: large | 이미지 검색 노출 극대화 |

---

## 3. 인증 & 보안 아키텍처

### 인증 플로우

```
[Google/GitHub 로그인 버튼]
  → Supabase OAuth (PKCE Flow)
  → /auth/callback (서버 사이드 코드 교환)
  → 세션 쿠키 발급 (httpOnly)
  → handle_new_user() Trigger → profiles 레코드 자동 생성
  → 클라이언트 Auth 리스너 → UI 상태 갱신
```

### 이중 접근 제어 시스템

**클라이언트 사이드** (`components/style-selector.tsx`):
```typescript
// 사용자 이메일/플랜 조회 후 UI 레벨 잠금
const isStyleAccessible = (tier: "free" | "pro") => {
  if (isAdmin) return true;     // 관리자: 전체 해금
  if (hasPaidPlan) return true;  // 유료 플랜: 전체 해금
  return tier === "free";        // 무료: free 티어만
};

// 잠긴 스타일 → 클릭 비활성화 + Lock 아이콘 + PRO 뱃지 + 툴팁
```

**서버 사이드** (`app/api/generate/route.ts`):
```typescript
// 클라이언트 우회 방지를 위한 서버 검증
if (styleOption.tier === "pro" && !isAdmin && !hasPaidPlan) {
  return NextResponse.json(
    { error: "This style requires a PRO plan." },
    { status: 403 }
  );
}
```

**데이터베이스 레벨** (RLS):
```sql
-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "select own" ON profiles FOR SELECT USING (auth.uid() = id);
-- subscriptions: INSERT/UPDATE/DELETE 정책 없음 → Service Role Key만 쓰기 가능
```

**3중 보안 레이어**: UI 잠금 → API 검증 → DB RLS

---

## 4. 결제 시스템 (Stripe Webhook 아키텍처)

### Webhook 이벤트 라이프사이클

```
Stripe                           서버                          DB
  │                               │                            │
  ├─ checkout.session.completed ──→ 서명 검증 ──→ subscriptions INSERT (active)
  │                               │                            │
  ├─ invoice.paid ────────────────→ 서명 검증 ──→ status = 'active', period 갱신
  │                               │                            │
  ├─ invoice.payment_failed ──────→ 서명 검증 ──→ status = 'past_due'
  │                               │                            │
  └─ customer.subscription.deleted→ 서명 검증 ──→ status = 'cancelled'
                                                               │
                                                    sync_profile_plan() Trigger
                                                               │
                                                    profiles.plan 자동 갱신
```

### 핵심 구현 포인트

```typescript
// 1. Webhook 서명 검증 — 위변조 방지
const event = stripe.webhooks.constructEvent(
  body, signature, process.env.STRIPE_WEBHOOK_SECRET!
);

// 2. Service Role Key로 RLS 우회 — Webhook은 사용자 세션 없이 동작
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!  // RLS 우회
  );
}

// 3. 메타데이터로 Stripe ↔ Supabase 사용자 연결
const userId = session.metadata?.supabase_user_id;
const plan = session.metadata?.plan;
```

### DB 자동 동기화 Trigger

```sql
-- 구독 상태 변경 시 profiles.plan 자동 업데이트
CREATE FUNCTION sync_profile_plan() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE profiles SET plan = NEW.plan::text WHERE id = NEW.user_id;
  ELSIF NEW.status IN ('cancelled', 'expired') THEN
    UPDATE profiles SET plan = 'free' WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 활성 구독은 사용자당 1개만 허용 (조건부 유니크 인덱스)
CREATE UNIQUE INDEX uniq_active_subscription
  ON subscriptions (user_id)
  WHERE status IN ('pending', 'active', 'past_due');
```

---

## 5. 사용량 추적 & Rate Limiting

### 요청 처리 흐름 (`app/api/generate/route.ts`)

```
POST /api/generate
  │
  ├─ 1. Auth Check     → supabase.auth.getUser() → 401 if 미인증
  ├─ 2. Usage Check    → checkUsageAllowed() → 429 if 한도 초과
  ├─ 3. Input Validate → style 유효성, 이미지 크기(4MB), API 키 확인
  ├─ 4. Tier Check     → PRO 스타일 + Free 플랜 → 403
  ├─ 5. Generate       → Gemini API 호출
  └─ 6. Increment      → 성공 시에만 카운트 증가 (실패 시 미차감)
```

### 사용량 관리 (`lib/usage.ts`)

```typescript
// 날짜 기반 자동 리셋 — 별도 크론 작업 불필요
const today = new Date().toISOString().split('T')[0];

// UPSERT 패턴: 오늘 첫 요청이면 INSERT, 이후는 count + 1
if (existing) {
  await supabase.from('daily_usage')
    .update({ count: existing.count + 1 }).eq('id', existing.id);
} else {
  await supabase.from('daily_usage')
    .insert({ user_id: userId, date: today, count: 1 });
}

// 플랜별 한도: Free(2) / Silver(10) / Gold(30) / Platinum(100)
```

---

## 6. 클라이언트 사이드 이미지 처리

### ICO 파일 바이너리 직접 생성 (`lib/image-utils.ts`)

외부 라이브러리 없이 ICO 파일 포맷을 바이너리 레벨에서 직접 조립:

```typescript
// ICO 파일 구조: Header(6B) + Directory Entry(16B) + PNG 데이터
export async function generateIco(base64: string, mimeType: string, size: number): Promise<Blob> {
  // 1. 리사이징 + PNG 변환
  const resizedBase64 = await resizeImage(base64, mimeType, size, size);
  const pngBytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));

  // 2. ICO Header (6 bytes)
  const header = new ArrayBuffer(6);
  const headerView = new DataView(header);
  headerView.setUint16(0, 0, true);  // reserved
  headerView.setUint16(2, 1, true);  // type: ICO
  headerView.setUint16(4, 1, true);  // image count

  // 3. Directory Entry (16 bytes)
  const entry = new ArrayBuffer(16);
  const entryView = new DataView(entry);
  entryView.setUint8(0, size >= 256 ? 0 : size);  // width (0 = 256+)
  entryView.setUint8(1, size >= 256 ? 0 : size);  // height
  entryView.setUint16(6, 32, true);                 // 32bpp
  entryView.setUint32(8, pngBytes.length, true);     // data size
  entryView.setUint32(12, 6 + 16, true);             // data offset

  // 4. Blob 조립
  return new Blob([new Uint8Array(header), new Uint8Array(entry), pngBytes],
    { type: "image/x-icon" });
}
```

### Canvas API 활용

```typescript
// 리사이징: 10개 프리셋 (16x16 ~ 1024x1024) + 원본
const canvas = document.createElement("canvas");
canvas.width = width; canvas.height = height;
ctx.drawImage(img, 0, 0, width, height);

// JPEG 변환 시 알파 채널 → 흰색 배경 처리
if (targetFormat === "jpeg") {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
ctx.drawImage(img, 0, 0);
```

---

## 7. 데이터베이스 설계

### ERD

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────────┐
│    auth.users     │     │     profiles      │     │    subscriptions     │
│ (Supabase 관리)    │     │                  │     │                      │
├──────────────────┤     ├──────────────────┤     ├──────────────────────┤
│ id (UUID) PK     │◄────│ id (UUID) FK/PK  │◄────│ user_id (UUID) FK    │
│ email            │     │ plan (text)       │     │ plan (ENUM)          │
│ raw_user_meta    │     │ email (text)      │     │ provider (ENUM)      │
│ ...              │     │ name (text)       │     │ status (ENUM)        │
└──────────────────┘     │ created_at        │     │ external_customer_id │
        │                │ updated_at        │     │ external_sub_id      │
        │                └──────────────────┘     │ current_period_*     │
        │                        ▲                │ cancelled_at         │
        │  handle_new_user()     │                │ created_at           │
        │  Trigger ──────────────┘                └──────────────────────┘
        │                        ▲                         │
        │                        │  sync_profile_plan()    │
        │                        │  Trigger ───────────────┘
        │
        │                ┌──────────────────┐
        └───────────────→│   daily_usage    │
                         ├──────────────────┤
                         │ id (SERIAL) PK   │
                         │ user_id (UUID) FK │
                         │ date (DATE)       │
                         │ count (INTEGER)   │
                         │ UNIQUE(user_id,   │
                         │        date)      │
                         └──────────────────┘
```

### 주요 설계 결정

| 설계 | 구현 | 이유 |
|------|------|------|
| **조건부 유니크 인덱스** | `WHERE status IN ('pending','active','past_due')` | 취소된 구독 이력은 보존하면서 활성 구독 중복 방지 |
| **ENUM 타입** | `subscription_plan`, `subscription_status`, `payment_provider` | 잘못된 값 삽입 방지 + 쿼리 자동완성 |
| **SECURITY DEFINER** | `sync_profile_plan()` 함수에 적용 | 트리거 함수가 RLS를 우회하여 profiles 테이블 직접 업데이트 가능 |
| **CASCADE 삭제** | `REFERENCES profiles(id) ON DELETE CASCADE` | 사용자 삭제 시 관련 데이터 자동 정리 |
| **복합 인덱스** | `daily_usage(user_id, date)` | 일일 사용량 조회 성능 최적화 (매 API 호출마다 실행) |
| **Write 정책 없음** | subscriptions 테이블 INSERT/UPDATE 불가 | Service Role Key(서버)만 쓰기 가능 → 클라이언트 조작 방지 |

---

## 8. 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React 19 + TypeScript)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Sketch   │  │ Style    │  │ Image    │  │ Download   │  │
│  │ Uploader │  │ Selector │  │ Preview  │  │ Options    │  │
│  │ (D&D)    │  │ (티어잠금) │  │(Before/  │  │(Canvas API │  │
│  │ FileReader│  │ 5카테고리  │  │ After)   │  │ ICO 생성)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └──────────────┴────────────┴───────────────┘         │
│                          │ Base64 + Style                    │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│              Next.js API Routes (Serverless)                │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────┐      │
│  │           /api/generate (POST)                     │      │
│  │  1. Auth Check (Supabase getUser)                  │      │
│  │  2. Usage Check (daily_usage 조회)                  │      │
│  │  3. Input Validate (크기, MIME, 스타일)              │      │
│  │  4. Tier Check (PRO 스타일 + Free 플랜 차단)        │      │
│  │  5. Gemini API 호출 (멀티모달)                      │      │
│  │  6. Usage Increment (성공 시에만)                   │      │
│  └───────────────────────┬───────────────────────────┘      │
│                          │                                   │
│  ┌────────────────┐  ┌───┴──────────┐  ┌─────────────────┐  │
│  │/api/payments/  │  │              │  │/api/subscriptions│  │
│  │stripe/checkout │  │              │  │/cancel           │  │
│  │(Checkout 세션)  │  │              │  │                  │  │
│  │                │  │              │  │                  │  │
│  │/api/payments/  │  │              │  │                  │  │
│  │stripe/webhook  │  │              │  │                  │  │
│  │(서명 검증+동기화)│  │              │  │                  │  │
│  └───────┬────────┘  │              │  └────────┬────────┘  │
└──────────┼───────────┼──────────────┼───────────┼───────────┘
           │           │              │           │
     ┌─────┴─────┐    │         ┌────┴────┐     │
     │  Stripe   │    │         │ Gemini  │     │
     │  API      │    │         │ 2.5     │     │
     │  (결제)    │    │         │ Flash   │     │
     └───────────┘    │         └─────────┘     │
                      │                         │
                ┌─────┴─────────────────────────┴─────┐
                │         Supabase (PostgreSQL)         │
                │  ┌──────────┐ ┌───────┐ ┌─────────┐ │
                │  │ profiles │ │ daily │ │  subs   │ │
                │  │ (플랜)    │ │_usage │ │criptions│ │
                │  │ RLS ✓    │ │ RLS ✓ │ │ RLS ✓   │ │
                │  └────┬─────┘ └───────┘ └────┬────┘ │
                │       │  sync_profile_plan()  │      │
                │       │◄─────── Trigger ──────┘      │
                │       │  handle_new_user()           │
                │       │◄─────── Trigger (Auth)       │
                └──────────────────────────────────────┘
```

---

## 9. 기술적 의사결정 & 트레이드오프

| 결정 | 선택 | 이유 |
|------|------|------|
| 상태 관리 | React Context + useState | 글로벌 상태가 로그인 다이얼로그뿐, 외부 라이브러리 불필요 |
| 이미지 처리 위치 | 클라이언트 사이드 (Canvas API) | 서버 비용 절감, 리사이징/포맷 변환은 Canvas로 충분 |
| ICO 생성 방식 | ArrayBuffer/DataView 직접 조립 | 외부 라이브러리 의존성 0, 번들 크기 최소화 |
| 인증 방식 | Supabase Auth (쿠키 기반) | SSR 호환 + OAuth 통합 + RLS 연동을 한 번에 해결 |
| DB 접근 제어 | RLS > 미들웨어 | DB 레벨 보안으로 API 우회 시에도 데이터 보호 |
| 결제 아키텍처 | Stripe Webhook (비동기) | 서버리스 환경에서 안정적, 실패 시 Stripe가 자동 재시도 |
| 구독 상태 동기화 | PostgreSQL Trigger | 애플리케이션 코드에서 동기화 로직 분리, 단일 진실 소스 |
| 프롬프트 관리 | 코드 내 상수 (TypeScript) | 타입 안전성 확보, 배포 주기와 업데이트 주기 동일 |
| 사용량 리셋 | 날짜 컬럼 기반 자동 리셋 | 크론 작업 불필요, 서버리스 환경에 적합 |
| 광고 배치 | CSS 미디어 쿼리 (Tailwind) | 서버 사이드 디바이스 감지 불필요 |

---

## 10. 프로젝트 디렉토리 구조

```
sketch-to/
├── app/
│   ├── layout.tsx                # 루트 레이아웃 (Metadata, JSON-LD, LoginDialogProvider)
│   ├── page.tsx                  # 메인 페이지 (스케치 업로드 + 변환 + 광고)
│   ├── globals.css               # Tailwind v4 @theme 변수
│   ├── robots.ts                 # 동적 robots.txt (API/Auth 경로 차단)
│   ├── sitemap.ts                # 동적 sitemap.xml (우선순위/빈도)
│   ├── api/
│   │   ├── generate/route.ts     # AI 이미지 생성 (Auth+Usage+Tier+Gemini)
│   │   ├── payments/stripe/
│   │   │   ├── checkout/route.ts # Stripe Checkout Session 생성
│   │   │   └── webhook/route.ts  # Stripe Webhook (4개 이벤트 처리)
│   │   └── subscriptions/
│   │       └── cancel/route.ts   # 구독 취소
│   ├── auth/
│   │   ├── callback/             # OAuth PKCE 콜백
│   │   └── login/                # 로그인 페이지
│   └── pricing/
│       ├── page.tsx              # 요금제 비교 + 관심 등록 배너
│       ├── success/              # 결제 성공
│       └── cancel/               # 결제 취소
├── components/
│   ├── ui/                       # shadcn/ui (Button, Card, Dialog, Tabs 등 14개+)
│   ├── auth/                     # LoginDialog (Context), LoginForm (OAuth)
│   ├── pricing/                  # PricingCards (Stripe Checkout 연동)
│   ├── header.tsx                # 네비게이션 (사용자 메뉴, 사용량 표시)
│   ├── footer.tsx                # 문의 정보
│   ├── sketch-uploader.tsx       # 파일 업로드 (Drag & Drop + Click)
│   ├── style-selector.tsx        # 스타일 선택 (5탭 + 그리드 + 티어 잠금 + 툴팁)
│   ├── image-preview.tsx         # Before/After 비교
│   ├── download-options.tsx      # 크기(10종)/포맷(3종) 선택 + 다운로드
│   └── usage-indicator.tsx       # 일일 사용량 잔여 표시
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # 브라우저용 Supabase 클라이언트
│   │   └── server.ts             # 서버용 Supabase 클라이언트 (쿠키 핸들링)
│   ├── prompts.ts                # 23개 스타일 정의 + 프롬프트 (StyleType, StyleOption)
│   ├── gemini.ts                 # Gemini API 래퍼 (멀티모달 입출력)
│   ├── usage.ts                  # 사용량 추적 (check, increment, getUserPlan)
│   ├── constants.ts              # 플랜 한도, 가격 상수
│   ├── image-utils.ts            # Base64, Canvas 리사이즈, ICO 바이너리 생성
│   └── utils.ts                  # cn() — clsx + tailwind-merge
├── supabase/
│   └── migrations/
│       ├── 001_*.sql             # profiles, daily_usage 테이블 + RLS
│       ├── 002_subscriptions.sql # subscriptions + ENUM + Trigger
│       └── 003_*.sql             # email/name 컬럼 추가 + 인덱스
└── middleware.ts                  # Supabase 세션 쿠키 갱신
```

---

## 이력서 작성 예시

### 한 줄 요약
> AI 스케치 변환 SaaS 풀스택 개발 (Next.js 16 / Gemini AI / Stripe / Supabase)

### 상세 서술

**AI 스케치 변환 SaaS 웹앱 — SketchTo** (개인 프로젝트)

- Next.js 16 App Router + TypeScript 기반 풀스택 SaaS 애플리케이션 설계 및 1인 개발
- Google Gemini 2.5 Flash 멀티모달 API 연동으로 스케치→이미지 변환 엔진 구축
- 23개 아트 스타일 프롬프트 엔지니어링 (역할 부여, 기술 사양, 네거티브 프롬프트 패턴 설계)
- Supabase Auth 기반 OAuth(Google/GitHub) 인증, PostgreSQL RLS/Trigger로 3중 보안 레이어 구현
- Stripe Checkout + Webhook 기반 구독 결제 시스템 (4개 이벤트 핸들링, 서명 검증, DB 자동 동기화)
- 플랜별 일일 Rate Limiting, 서버/클라이언트 이중 티어 접근 제어, ENUM + 조건부 유니크 인덱스 설계
- Canvas API 기반 이미지 리사이징, ICO 파일 바이너리 직접 생성 (ArrayBuffer/DataView)
- Next.js Metadata API 활용 SEO 최적화 (OG, JSON-LD WebApplication 스키마, 동적 robots/sitemap)
- 카카오 애드핏 반응형 광고 수익화 (모바일/데스크탑 3슬롯)
- Vercel 서버리스 배포, shadcn/ui + Tailwind CSS 4 반응형 UI

---

## 키워드 (ATS 최적화)

```
Next.js · React · TypeScript · Tailwind CSS · shadcn/ui · Supabase · PostgreSQL
Stripe · Google Gemini AI · Prompt Engineering · OAuth · REST API · Webhook
Serverless · Vercel · SaaS · Freemium · Rate Limiting · RLS · Canvas API
App Router · SSR · SEO · JSON-LD · Open Graph · Multimodal AI · ArrayBuffer
```
