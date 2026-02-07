# Sketch-to-Image Generator - Final Plan

> 대충 그린 스케치를 전문적인 2D 이미지로 변환하는 SaaS 웹앱

## 1. 프로젝트 개요

### 목표
사용자가 그림판, 손 스케치, Figma 등으로 대충 그린 이미지를 업로드하면,
Gemini API를 통해 **전문적인 2D 이미지**로 변환하여 다음 용도로 활용:

- **Favicon** (16x16 ~ 512x512, ICO 멀티사이즈)
- **Hero Section 배너 이미지** (1200x630, 1920x1080 등)
- **앱 아이콘** (iOS/Android 규격)
- **SNS 프로필/커버 이미지**

### 핵심 워크플로우

```
사용자 스케치 업로드 → 스타일 선택 → Gemini img2img 변환 → 미리보기 → 포맷/크기 선택 → 다운로드
```

---

## 2. 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| UI | React + Tailwind CSS | 19.x / 4.x |
| AI API | Google Gemini (img2img) | 2.0 Flash |
| 인증 | NextAuth.js | 5.x |
| 결제 | Stripe (또는 Toss Payments) | - |
| DB | Prisma + PostgreSQL (Supabase) | - |
| 배포 | Vercel | - |

### 핵심 패키지

```bash
npm install @google/generative-ai next-auth @prisma/client stripe
```

---

## 3. Gemini img2img 변환 전략

### 3.1 기본 원리

- **입력**: base64 이미지 + 스타일 프롬프트
- **출력**: 변환된 이미지 (512x512 ~ 1024x1024)
- **강점**: 원본 스케치 형태 80~90% 유지하면서 스타일 업그레이드

### 3.2 변환 파라미터

| 파라미터 | 값 | 설명 |
|----------|----|------|
| strength | 0.7~0.9 | 원본 유사도 (높을수록 스케치 충실) |
| steps | 20~50 | 품질 (MVP는 20으로 비용 절감) |
| size | 512x512 | 기본 출력 크기 |
| temperature | 0.3 | 일관성 위해 낮게 설정 |

### 3.3 비용

- 1회 생성: 약 0.02~0.04 USD (≈ 30 KRW)

---

## 4. 스타일 프롬프트 템플릿

### A. 플랫 아이콘 (앱/웹 아이콘)

```
이 손 스케치 이미지를 현대적 플랫 디자인 아이콘으로 변환하세요.
- 단순 2~3색 팔레트
- bold stroke 3px, rounded corners
- 완벽한 대칭, 깔끔한 라인
- 512x512, 투명 배경
Negative: 복잡한 그림자, texture, 3D 효과
```

### B. 라인 아트 (로고/미니멀)

```
이 doodle을 미니멀 라인 아트 아이콘으로 리파인하세요.
- single path stroke 2~4px
- no fill, Feather/Lucide Icons 스타일
- 512x512, 흰 배경
Negative: fills, gradients, shadows
```

### C. 3D 아이소메트릭 (제품/모던)

```
이 스케치를 3D isometric 아이콘으로 업그레이드.
- soft lighting, subtle shadow
- matte plastic material
- 45도 각도, floating 효과
- 1024x1024, 흰 배경
Negative: flat, cartoonish
```

### D. 카와이/캐릭터 (SNS/게임)

```
이 캐릭터 스케치를 귀여운 kawaii 아이콘으로 변환.
- big eyes, blush, rounded shapes
- vibrant pastel colors
- sticker style, bold outline 4px
- 512x512, 투명 배경
```

### E. 히어로 배너 (웹사이트 배너)

```
이 스케치를 웹사이트 히어로 섹션용 일러스트레이션으로 변환하세요.
- 모던 플랫 일러스트 스타일
- 넓은 가로 비율 (16:9)
- 밝고 세련된 컬러 팔레트
- 깔끔한 벡터 스타일, 웹 최적화
- 1200x630 또는 1920x1080
Negative: blurry, pixelated, noisy background
```

### F. SVG 벡터 출력 (프리미엄)

```
이 스케치 기반으로 SVG 코드 생성:
- viewBox="0 0 24 24"
- single optimized path
- stroke="currentColor" fill="none"
- 1KB 미만 크기 최적화
출력: 유효한 SVG 코드만
```

---

## 5. 출력 포맷

### 5.1 Favicon 세트

| 포맷 | 크기 | 용도 |
|------|------|------|
| `favicon.ico` | 16, 32, 48, 64, 128, 256 | 브라우저 탭, 북마크 |
| `favicon-16x16.png` | 16x16 | 브라우저 탭 |
| `favicon-32x32.png` | 32x32 | 작업표시줄 |
| `apple-touch-icon.png` | 180x180 | iOS 홈화면 |
| `android-chrome-192x192.png` | 192x192 | Android 홈화면 |
| `android-chrome-512x512.png` | 512x512 | Android 스플래시 |

### 5.2 배너/히어로 이미지

| 포맷 | 크기 | 용도 |
|------|------|------|
| PNG | 1200x630 | OG Image / SNS 공유 |
| PNG | 1920x1080 | 웹사이트 히어로 섹션 |
| JPG/JPEG | 자유 크기 | 블로그 썸네일 등 |

### 5.3 다운로드 옵션

- **PNG**: 투명 배경 지원, 웹 최적화
- **JPG/JPEG**: 배경 포함, 파일 크기 최소화
- **ICO**: 멀티사이즈 (16~256px 포함), 파비콘 전용
- **SVG**: 벡터 (프리미엄 전용)

---

## 6. 멤버십 & 요금제

### 6.1 등급 구조

| 등급 | 가격 (월) | 일일 생성 | 스타일 | 출력 포맷 | 기타 |
|------|-----------|-----------|--------|-----------|------|
| **Free** | 무료 | 2회 | 플랫, 라인아트 | PNG만 | 워터마크 포함 |
| **Silver** | 4,900원 | 20회 | 전체 스타일 | PNG, JPG | 워터마크 없음 |
| **Gold** | 9,900원 | 100회 | 전체 스타일 | PNG, JPG, ICO | 배너 생성, 히스토리 저장 |
| **Platinum** | 19,900원 | 무제한 | 전체 + SVG | 전체 포맷 | 배치 변환, API 접근, 커스텀 팔레트 |

### 6.2 기능 비교 상세

```
Free (무료)
├── 일 2회 생성
├── 플랫/라인아트 스타일만
├── PNG 다운로드만
├── 워터마크 포함
└── 512x512 고정

Silver (월 4,900원)
├── 일 20회 생성
├── 전체 스타일 (플랫, 라인, 3D, 카와이, 히어로)
├── PNG + JPG 다운로드
├── 워터마크 없음
├── 512x512 ~ 1024x1024
└── Favicon 세트 다운로드

Gold (월 9,900원)
├── 일 100회 생성
├── 전체 스타일
├── PNG + JPG + ICO 다운로드
├── 히어로 배너 생성 (1920x1080)
├── 생성 히스토리 30일 저장
├── 컬러 팔레트 커스텀
└── OG Image 자동 생성

Platinum (월 19,900원)
├── 무제한 생성
├── 전체 스타일 + SVG 벡터
├── 전체 포맷 다운로드
├── 배치 변환 (최대 10장 동시)
├── 생성 히스토리 무제한 저장
├── REST API 접근
├── 커스텀 프롬프트
└── 우선 처리 큐
```

---

## 7. 프로젝트 구조

```
icon-generator/
├── app/
│   ├── layout.tsx                    # 루트 레이아웃
│   ├── page.tsx                      # 랜딩 페이지
│   ├── globals.css                   # Tailwind 글로벌 스타일
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx            # 로그인
│   │   └── register/page.tsx         # 회원가입
│   │
│   ├── generate/
│   │   └── page.tsx                  # 메인 생성 페이지
│   │
│   ├── pricing/
│   │   └── page.tsx                  # 요금제 페이지
│   │
│   ├── history/
│   │   └── page.tsx                  # 생성 히스토리 (Gold+)
│   │
│   └── api/
│       ├── auth/[...nextauth]/
│       │   └── route.ts              # NextAuth 핸들러
│       ├── sketch-to-image/
│       │   └── route.ts              # Gemini 이미지 변환 API
│       ├── download/
│       │   └── route.ts              # 포맷 변환 & 다운로드 API
│       ├── webhook/
│       │   └── route.ts              # Stripe 웹훅
│       └── usage/
│           └── route.ts              # 사용량 조회 API
│
├── components/
│   ├── SketchUploader.tsx            # 스케치 업로드 (드래그앤드롭 + 카메라)
│   ├── StyleSelector.tsx             # 스타일 선택 UI
│   ├── ImagePreview.tsx              # 변환 결과 미리보기
│   ├── DownloadOptions.tsx           # 포맷/크기 선택 & 다운로드
│   ├── PricingCard.tsx               # 요금제 카드 컴포넌트
│   ├── UsageIndicator.tsx            # 남은 생성 횟수 표시
│   └── Header.tsx                    # 네비게이션 헤더
│
├── lib/
│   ├── gemini.ts                     # Gemini API 클라이언트
│   ├── prompts.ts                    # 스타일별 프롬프트 템플릿
│   ├── imageUtils.ts                 # 이미지 변환 유틸 (리사이즈, 포맷 변환, ICO 생성)
│   ├── auth.ts                       # NextAuth 설정
│   ├── stripe.ts                     # Stripe 결제 설정
│   └── usage.ts                      # 사용량 체크 & 제한 로직
│
├── prisma/
│   └── schema.prisma                 # DB 스키마
│
└── .env.local                        # 환경 변수
```

---

## 8. DB 스키마

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  tier          Tier      @default(FREE)
  stripeId      String?   @unique
  createdAt     DateTime  @default(now())
  generations   Generation[]
}

model Generation {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  inputImage    String    // 원본 스케치 URL (S3/Cloudflare R2)
  outputImage   String    // 변환된 이미지 URL
  style         String    // 사용된 스타일 템플릿
  outputFormat  String    // png, jpg, ico
  outputSize    String    // 512x512 등
  createdAt     DateTime  @default(now())
}

enum Tier {
  FREE
  SILVER
  GOLD
  PLATINUM
}
```

---

## 9. 핵심 API 구현

### 9.1 이미지 변환 API

```typescript
// app/api/sketch-to-image/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { checkUsageLimit } from '@/lib/usage';
import { getPromptByStyle } from '@/lib/prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  // 1. 인증 확인
  const session = await getServerSession();
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 사용량 체크
  const canGenerate = await checkUsageLimit(session.user.id);
  if (!canGenerate) {
    return Response.json({ error: 'Daily limit reached' }, { status: 429 });
  }

  // 3. 요청 파싱
  const { imageBase64, style = 'flat' } = await request.json();

  // 4. Gemini 호출
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp-image-generation',
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      temperature: 0.3,
    },
  });

  const prompt = getPromptByStyle(style);

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: 'image/png',
      },
    },
  ]);

  // 5. 결과 반환
  const parts = result.response.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find((p) => p.inlineData);

  if (!imagePart?.inlineData) {
    return Response.json({ error: 'Generation failed' }, { status: 500 });
  }

  return Response.json({
    image: `data:image/png;base64,${imagePart.inlineData.data}`,
  });
}
```

### 9.2 사용량 제한 로직

```typescript
// lib/usage.ts
import { prisma } from './db';
import { Tier } from '@prisma/client';

const DAILY_LIMITS: Record<Tier, number> = {
  FREE: 2,
  SILVER: 20,
  GOLD: 100,
  PLATINUM: Infinity,
};

export async function checkUsageLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;

  const limit = DAILY_LIMITS[user.tier];
  if (limit === Infinity) return true;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.generation.count({
    where: {
      userId,
      createdAt: { gte: todayStart },
    },
  });

  return todayCount < limit;
}

export async function getRemainingGenerations(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const limit = DAILY_LIMITS[user.tier];
  if (limit === Infinity) return -1; // 무제한 표시

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayCount = await prisma.generation.count({
    where: {
      userId,
      createdAt: { gte: todayStart },
    },
  });

  return Math.max(0, limit - todayCount);
}
```

---

## 10. 이미지 후처리 (리사이즈 & 포맷 변환)

Gemini에서 생성된 이미지를 클라이언트에서 Canvas API로 후처리:

```typescript
// lib/imageUtils.ts

/** base64 이미지를 지정 크기로 리사이즈 */
export async function resizeImage(
  base64: string,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = base64;
  });
}

/** PNG를 JPG/JPEG로 변환 (배경색 적용) */
export async function convertToJpeg(
  base64: string,
  quality: number = 0.92,
  bgColor: string = '#FFFFFF'
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64;
  });
}

/** Favicon 세트 생성 (여러 크기) */
export async function generateFaviconSet(base64: string) {
  const sizes = [16, 32, 48, 64, 128, 180, 192, 256, 512];
  const result: Record<number, string> = {};

  for (const size of sizes) {
    result[size] = await resizeImage(base64, size, size);
  }

  return result;
}
```

---

## 11. 구현 순서 (Phase별)

### Phase 1: 핵심 기능 (MVP) - 1주

1. **Gemini API 연동**
   - `@google/generative-ai` 설치
   - `/api/sketch-to-image` 라우트 구현
   - 프롬프트 템플릿 6종 구성

2. **메인 생성 페이지**
   - `SketchUploader`: 드래그앤드롭 + 파일 선택 + 카메라 촬영
   - `StyleSelector`: 스타일 6종 선택 UI
   - `ImagePreview`: 변환 결과 미리보기 (Before/After)
   - `DownloadOptions`: PNG 다운로드

### Phase 2: 다운로드 & 포맷 - 3일

1. **포맷 변환**
   - PNG, JPG/JPEG 변환
   - ICO 멀티사이즈 생성
   - Favicon 세트 일괄 다운로드 (ZIP)
   - 히어로 배너 크기 (1200x630, 1920x1080)

2. **리사이즈 엔진**
   - Canvas API 기반 고품질 리사이즈
   - 안티앨리어싱 적용

### Phase 3: 인증 & 멤버십 - 1주

1. **NextAuth 설정**
   - Google / GitHub OAuth
   - 이메일 로그인

2. **사용량 제한**
   - 등급별 일일 생성 횟수 제한
   - 남은 횟수 UI 표시
   - 등급별 기능 잠금/해제

3. **Stripe 결제**
   - 구독 결제 페이지
   - 웹훅으로 등급 자동 변경
   - 구독 관리 (업/다운그레이드, 취소)

### Phase 4: 폴리싱 & 출시 - 3일

1. **랜딩 페이지**
   - 서비스 소개, 데모, 요금제 안내
   - SEO 최적화

2. **히스토리** (Gold+)
   - 생성 이력 저장 & 재다운로드

3. **UX 개선**
   - 로딩 애니메이션
   - 에러 핸들링
   - 모바일 반응형

---

## 12. 환경 변수

```env
# AI
GEMINI_API_KEY=your_gemini_api_key

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Storage (이미지 저장)
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=icon-generator
```

---

## 13. UI 플로우

```
[랜딩 페이지]
    │
    ├── 로그인/회원가입
    │
    ▼
[생성 페이지] ──────────────────────────────────────────────
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │ 1. 스케치     │  │ 2. 스타일     │  │ 3. 결과        │   │
│  │   업로드      │→│   선택        │→│   미리보기      │   │
│  │              │  │              │  │                │   │
│  │ 드래그앤드롭  │  │ ○ 플랫       │  │  Before/After  │   │
│  │ 카메라 촬영   │  │ ○ 라인아트    │  │                │   │
│  │ 파일 선택    │  │ ○ 3D         │  │ [재생성] [다운] │   │
│  └──────────────┘  │ ○ 카와이      │  └────────────────┘   │
│                    │ ○ 히어로 배너  │                       │
│  남은 횟수: 2/2    │ ○ SVG(Premium)│                       │
│                    └──────────────┘                        │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 다운로드 옵션                                        │   │
│  │                                                     │   │
│  │ 포맷: [PNG] [JPG] [ICO] [SVG🔒]                     │   │
│  │ 크기: [512x512] [1024x1024] [Favicon Set] [Banner]  │   │
│  │                                                     │   │
│  │ [다운로드]  [Favicon ZIP 다운로드]                    │   │
│  └─────────────────────────────────────────────────────┘   │
──────────────────────────────────────────────────────────────

[요금제 페이지]
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Free    │ │  Silver  │ │  Gold    │ │ Platinum │
│  무료    │ │ 4,900/월 │ │ 9,900/월 │ │19,900/월 │
│          │ │          │ │          │ │          │
│ 2회/일   │ │ 20회/일  │ │ 100회/일 │ │ 무제한   │
│ 2 스타일 │ │ 전체     │ │ 전체     │ │ 전체+SVG │
│ PNG만    │ │ PNG+JPG  │ │ +ICO     │ │ +API     │
│ 워터마크 │ │          │ │ +배너    │ │ +배치    │
│          │ │          │ │ +히스토리│ │ +무제한  │
│ [현재]   │ │ [구독]   │ │ [구독]   │ │ [구독]   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## 14. 테스트 체크리스트

- [ ] 스케치 사진 (흐린 손그림) → 형태 유지 확인
- [ ] 그림판 이미지 → 정상 변환 확인
- [ ] Figma 스크린샷 → 정상 변환 확인
- [ ] 배경 투명 PNG 출력
- [ ] JPG 변환 시 배경색 적용
- [ ] ICO 멀티사이즈 정상 생성
- [ ] Favicon 세트 ZIP 다운로드
- [ ] 히어로 배너 크기 (1200x630, 1920x1080) 출력
- [ ] Free 사용자 일 2회 제한 동작
- [ ] Silver/Gold/Platinum 등급별 제한 동작
- [ ] Stripe 결제 → 등급 자동 변경
- [ ] 모바일 반응형 UI
- [ ] 비용: 1회 생성 30원 미만

---

## 15. 문제 해결 가이드

| 문제 | 해결 |
|------|------|
| 형태 왜곡됨 | strength 0.9로 상향 |
| 너무 단순함 | steps 50으로 상향 |
| SVG 코드 깨짐 | "valid SVG code only" 프롬프트 강조 |
| 변환 실패 | 이미지 크기 확인 (최대 4MB), 포맷 확인 |
| ICO 생성 오류 | 서버사이드 sharp 라이브러리로 변환 |
