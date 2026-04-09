# AI 코딩 도구로 만든 SaaS, 그리고 기술적 문제 해결 회고

## AI 코딩 도구로 이런 거 만들어봤어요

### SketchTo - AI 스케치 변환 SaaS

손으로 그린 러프 스케치를 업로드하면, Google Gemini AI가 23가지 아트 스타일(플랫 아이콘, 픽셀 아트, 수채화, 애니메 등)로 변환해주는 풀스택 SaaS 웹앱입니다. Freemium 구독 모델, OAuth 인증, Stripe 결제, 광고 수익화까지 서비스 운영에 필요한 전체 스택을 1인 개발로 구현했습니다.

**기술 스택**: Next.js 16 / React 19 / TypeScript / Tailwind CSS 4 / Supabase / Stripe / Google Gemini 2.5 Flash / Vercel

---

### AI 코딩 도구가 도움이 된 부분

**1. 프롬프트 엔지니어링 반복 작업**

23개 아트 스타일 각각에 200~300단어짜리 상세 프롬프트를 작성해야 했습니다. "역할 부여 → 기술 사양 → 네거티브 프롬프트 → 출력 형식"이라는 패턴을 잡은 뒤, AI 코딩 도구와 함께 빠르게 변형 프롬프트를 찍어냈습니다. 직접 한 땀 한 땀 쓰는 것 대비 속도가 압도적이었습니다.

**2. 보일러플레이트 구조 잡기**

Stripe Webhook 핸들러, Supabase RLS 정책, OAuth 콜백 라우트 같은 "정해진 패턴이 있지만 세팅이 번거로운" 코드를 빠르게 생성했습니다. 특히 Stripe의 4가지 Webhook 이벤트(checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted) 각각에 대한 핸들링 로직을 구조화하는 데 큰 도움이 됐습니다.

**3. Canvas API 그림판 기능**

브라우저 Canvas API로 직접 그림을 그릴 수 있는 드로잉 기능을 추가할 때, 마우스/터치 이벤트 핸들링, devicePixelRatio 보정, ResizeObserver 기반 반응형 캔버스, Undo 스택(ImageData 스냅샷 30개) 등 꽤 복잡한 구현을 AI와 함께 설계하고 코드를 작성했습니다. 특히 모바일 터치 드로잉에서 스크롤 방지를 위해 `addEventListener`에 `{ passive: false }` 옵션을 줘야 한다는 점을 빠르게 파악할 수 있었습니다.

**4. ICO 파일 바이너리 직접 조립**

외부 라이브러리 없이 브라우저에서 ICO 파일을 생성하는 코드가 필요했습니다. 6바이트 ICO 헤더 + 16바이트 디렉토리 엔트리를 ArrayBuffer/DataView로 직접 조립하는 코드를 AI와 함께 작성했습니다. 바이너리 포맷 스펙을 확인하면서 코드로 옮기는 작업을 AI가 가속해줬습니다.

**5. SEO 메타데이터 체계 구축**

Next.js Metadata API로 OG 태그, Twitter Card, JSON-LD 구조화 데이터(WebApplication 스키마), 동적 robots.txt, sitemap.xml까지 한 번에 세팅했습니다. 한국어/영어 이중 언어 키워드와 hreflang 설정도 AI의 도움으로 빠뜨리지 않고 설정할 수 있었습니다.

---

### AI 코딩 도구를 쓰면서 느낀 점

- **잘 되는 것**: 정해진 패턴이 있는 코드(CRUD, 인증 플로우, API 라우트), 반복적인 변형 작업(23개 프롬프트), 보일러플레이트 생성
- **주의해야 하는 것**: AI가 생성한 코드를 그대로 쓰면 안 됩니다. 특히 보안 관련 코드(RLS 정책, Webhook 서명 검증, 환경 변수 노출)는 반드시 직접 검증해야 합니다
- **가장 큰 가치**: "이걸 어떻게 시작하지?" 단계를 건너뛰게 해줍니다. ICO 바이너리 포맷 같은 생소한 영역도 빠르게 프로토타입을 만들고 검증할 수 있었습니다

---

## 이런 기술적 문제 이렇게 해결했어요

### 1. Gemini API 멀티모달 응답에서 이미지 추출 실패

**문제**: Gemini 2.5 Flash에 이미지+텍스트를 보내면 응답이 텍스트만 오거나, 이미지가 포함되어 있어도 어디에 있는지 파싱이 안 되는 경우가 있었습니다.

**원인**: `generationConfig`에 `responseModalities: ["TEXT", "IMAGE"]`를 명시하지 않으면 텍스트만 반환합니다. 또한 응답의 `candidates[0].content.parts`가 배열이라 이미지가 몇 번째 파트에 있는지 보장되지 않습니다.

**해결**:
```typescript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-image",
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],  // 반드시 명시
  },
});

// parts 배열을 순회하며 inlineData가 있는 파트를 찾는 방식
const parts = response.candidates[0].content.parts;
const imagePart = parts.find(p => p.inlineData);
```
- 문서에 명확히 안 나와 있던 부분이라 삽질 좀 했습니다. `responseModalities`를 빠뜨리면 아무 에러 없이 텍스트만 옵니다.

---

### 2. 모바일에서 Canvas 드로잉 시 화면 스크롤되는 문제

**문제**: Canvas 위에서 손가락으로 그림을 그리면 페이지 전체가 스크롤되면서 그림이 제대로 안 그려졌습니다.

**원인**: 모바일 브라우저의 기본 터치 동작(스크롤, 줌)이 Canvas의 터치 이벤트보다 우선합니다. React의 `onTouchStart`는 passive 이벤트라 `e.preventDefault()`가 무시됩니다.

**해결**:
```typescript
// React의 onTouchStart 대신 imperative addEventListener 사용
useEffect(() => {
  const canvas = canvasRef.current;
  canvas.addEventListener("touchstart", handler, { passive: false });
  canvas.addEventListener("touchmove", handler, { passive: false });
  // passive: false를 명시해야 preventDefault()가 동작
}, []);

// CSS도 함께 설정
<canvas style={{ touchAction: "none" }} />
```
- `{ passive: false }` 없이는 `preventDefault()`가 조용히 무시됩니다. 콘솔 경고도 안 뜨는 경우가 있어서 원인 파악이 어려웠습니다.

---

### 3. 모바일에서 스타일 카테고리 탭이 잘려 보이는 문제

**문제**: 5개 카테고리 탭(Icons, Characters, Illustrations, Artistic, Design)이 모바일 화면 너비에 다 안 들어가서 "Design" 탭 텍스트가 잘렸습니다.

**원인**: `flex`로 균등 분할하면 모바일에서 공간이 부족합니다. 단순히 `overflow-x-auto`만 적용하면 데스크탑에서도 스크롤이 생기고, 탭들이 좌측에 몰립니다.

**해결**: 반응형 분기로 모바일/데스크탑 각각 최적화:
```tsx
// 모바일: 가로 스크롤 + shrink-0으로 텍스트 잘림 방지
<div className="overflow-x-auto scrollbar-hide sm:overflow-x-visible">
  <div className="flex w-max min-w-full sm:w-auto gap-1">
    <button className="shrink-0 sm:flex-1">Icons</button>
    // ...
  </div>
</div>
```
- Tailwind CSS 4에서는 `scrollbar-hide`를 `@utility` 디렉티브로 직접 정의해야 했습니다. v3의 플러그인 방식과 달라서 한 번 더 삽질했습니다.

---

### 4. Stripe Webhook과 Supabase 간 구독 상태 불일치

**문제**: Stripe에서 구독이 활성화됐는데 앱에서는 여전히 Free 플랜으로 표시되는 경우가 간헐적으로 발생했습니다.

**원인**: Webhook 핸들러에서 `subscriptions` 테이블만 업데이트하고, `profiles.plan`은 별도로 업데이트하지 않으면 사용자의 플랜 정보가 동기화되지 않습니다.

**해결**: PostgreSQL Trigger로 자동 동기화:
```sql
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
```
- 애플리케이션 코드에서 두 테이블을 동시에 업데이트하는 대신, DB Trigger로 "단일 진실 소스"를 만들었습니다. `SECURITY DEFINER`로 RLS를 우회해야 한다는 점이 포인트입니다.

---

### 5. PRO 스타일 접근 제어 우회 가능성

**문제**: 클라이언트에서 PRO 스타일을 잠금 표시해도, 브라우저 개발자 도구로 API 요청을 직접 보내면 우회할 수 있었습니다.

**원인**: UI 레벨 잠금만으로는 보안이 되지 않습니다.

**해결**: 3중 보안 레이어 구축:
```
1층: UI 잠금   → Lock 아이콘 + PRO 뱃지 + 클릭 비활성화
2층: API 검증  → 서버에서 사용자 플랜 vs 스타일 티어 교차 검증 (403)
3층: DB RLS    → 사용자는 자기 데이터만 조회 가능
```
- 클라이언트 사이드 검증은 UX를 위한 것이지 보안을 위한 것이 아닙니다. 실제 접근 제어는 반드시 서버에서.

---

### 6. ICO 파일 생성 시 256px 이상에서 깨지는 문제

**문제**: 256x256 이상 크기의 ICO 파일을 생성하면 일부 프로그램에서 파일이 깨져 보였습니다.

**원인**: ICO 포맷 스펙에서 256px 이상은 width/height 필드에 `0`을 써야 합니다. 실제 크기를 그대로 넣으면 오버플로가 발생합니다.

**해결**:
```typescript
// Directory Entry의 width/height 필드
entryView.setUint8(0, size >= 256 ? 0 : size);  // 0 = 256px 이상
entryView.setUint8(1, size >= 256 ? 0 : size);
```
- ICO 포맷이 1바이트(0~255)로 크기를 표현하기 때문에, 256 이상은 `0`이라는 특수값으로 표현합니다. 사소하지만 모르면 절대 못 찾는 버그입니다.

---

### 7. Supabase Auth 쿠키 세션 만료 시 무한 리다이렉트

**문제**: 로그인 후 시간이 지나면 페이지 접근 시 로그인 페이지로 무한 리다이렉트되는 현상이 발생했습니다.

**원인**: Supabase의 `@supabase/ssr` 패키지를 사용한 미들웨어에서 세션 갱신(refresh)이 제대로 되지 않으면, 만료된 세션으로 계속 인증 실패 → 리다이렉트 → 인증 실패 루프가 발생합니다.

**해결**: 미들웨어에서 매 요청마다 세션을 갱신하도록 설정:
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(/* ... */, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
  // 이 호출이 세션을 자동으로 refresh
  await supabase.auth.getUser();
}
```
- `getUser()`를 미들웨어에서 호출하는 것 자체가 세션 갱신 트리거입니다. 이걸 빠뜨리면 액세스 토큰 만료 후 리프레시가 안 됩니다.

---

### 8. HiDPI 디스플레이에서 Canvas 그림이 흐릿한 문제

**문제**: Retina 디스플레이에서 Canvas에 그린 선이 번져 보이고 흐릿했습니다.

**원인**: Canvas의 논리적 크기(CSS)와 물리적 크기(픽셀)가 1:1이면 HiDPI에서 업스케일링이 발생합니다.

**해결**: devicePixelRatio 배수로 Canvas 물리적 크기를 설정:
```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = width * dpr;     // 물리적 크기 (2배)
canvas.height = height * dpr;
canvas.style.width = `${width}px`;   // CSS 크기 (1배)
canvas.style.height = `${height}px`;
ctx.scale(dpr, dpr);  // 드로잉 좌표계를 CSS 크기에 맞춤
```
- `ctx.scale(dpr, dpr)`을 빠뜨리면 그림이 Canvas 좌상단 1/4 영역에만 그려집니다. 세 가지(물리 크기, CSS 크기, 좌표계 스케일)를 모두 맞춰야 합니다.

---

### 9. 다운로드 버튼 연속 클릭으로 중복 다운로드

**문제**: 이미지 다운로드 버튼을 빠르게 연속 클릭하면 같은 파일이 여러 번 다운로드됐습니다.

**원인**: Canvas API의 `toBlob()` + `URL.createObjectURL()` + 임시 `<a>` 태그 생성이 비동기라서, 처리 중에 추가 클릭이 들어올 수 있었습니다.

**해결**: 1.5초 쿨다운 타이머 추가:
```typescript
const [downloadCooldown, setDownloadCooldown] = useState(false);

const handleDownload = async () => {
  if (downloadCooldown) return;
  setDownloadCooldown(true);
  // ... 다운로드 로직
  setTimeout(() => setDownloadCooldown(false), 1500);
};
```
- 단순하지만 효과적. `isProcessing` 상태와 별개로 쿨다운을 둔 이유는, 처리 자체는 빠르게 끝나지만 브라우저의 다운로드 다이얼로그가 뜨기 전에 재클릭이 가능하기 때문입니다.

---

### 10. 환경별 OAuth 리다이렉트 URL 하드코딩 문제

**문제**: 로컬 개발 환경(localhost:3000)과 프로덕션(sketch-to.vercel.app)에서 OAuth 콜백 URL이 달라야 하는데, 하드코딩하면 환경마다 코드를 바꿔야 했습니다.

**해결**: `window.location.origin`으로 동적 URL 생성:
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```
- 환경 변수도, 조건 분기도 필요 없습니다. 브라우저가 알려주는 현재 origin을 그대로 사용합니다. 단, Supabase 대시보드와 Google Cloud Console에 두 URL 모두 등록해야 합니다.

---

## 정리

| 카테고리 | 문제 | 핵심 교훈 |
|---------|------|----------|
| AI API | 멀티모달 응답 파싱 | 옵션 하나 빠뜨리면 에러 없이 다른 결과가 옴 |
| 모바일 | Canvas 터치 스크롤 | `passive: false`를 명시해야 `preventDefault()` 동작 |
| 반응형 | 탭 텍스트 잘림 | 모바일/데스크탑 분기 전략 필요 |
| 결제 | 상태 불일치 | DB Trigger로 단일 진실 소스 구축 |
| 보안 | 클라이언트 우회 | UI 잠금은 UX용, 실제 보안은 서버에서 |
| 바이너리 | ICO 256px 버그 | 포맷 스펙의 엣지 케이스 확인 필수 |
| 인증 | 세션 만료 루프 | 미들웨어에서 `getUser()` 호출이 세션 갱신 트리거 |
| Canvas | HiDPI 흐림 | 물리 크기 / CSS 크기 / 좌표계 세 가지 모두 맞춰야 함 |
| UX | 중복 다운로드 | 비동기 처리엔 쿨다운 타이머가 단순하고 효과적 |
| OAuth | 환경별 URL | `window.location.origin`으로 동적 해결 |

---

## 기술적 문제를 해결한 방안

### 1. PostgreSQL Trigger를 활용한 결제-구독 상태 자동 동기화

이 프로젝트에서 아키텍처적으로 가장 중요했던 결정은 Stripe 결제 상태와 사용자 플랜 정보의 동기화를 어디서 처리할 것인가의 문제였습니다. Stripe Webhook이 구독 관련 이벤트를 서버로 전달하면, 서버는 `subscriptions` 테이블에 해당 정보를 기록합니다. 그런데 실제로 사용자의 접근 권한을 판단하는 기준은 `profiles` 테이블의 `plan` 컬럼입니다. 초기에는 Webhook 핸들러 안에서 두 테이블을 동시에 업데이트하는 방식을 사용했지만, 코드가 분산되면서 한쪽만 업데이트되는 버그가 발생했습니다.

이 문제를 PostgreSQL의 `AFTER INSERT OR UPDATE` Trigger로 해결했습니다. `subscriptions` 테이블에 변경이 일어나면 `sync_profile_plan()` 함수가 자동으로 실행되어 `profiles.plan`을 갱신합니다. 구독 상태가 `active`이면 해당 플랜으로, `cancelled`이나 `expired`이면 `free`로 되돌립니다. 이렇게 하면 Webhook 핸들러는 `subscriptions` 테이블만 신경 쓰면 되고, 플랜 동기화 로직은 데이터베이스가 보장합니다. 트리거 함수에 `SECURITY DEFINER`를 적용해서 Row Level Security를 우회할 수 있도록 한 점도 중요한 설계 포인트였습니다. 결과적으로 "단일 진실 소스(Single Source of Truth)"를 데이터베이스 레벨에서 확보하게 되었고, 애플리케이션 코드의 어느 지점에서 구독 상태를 변경하더라도 플랜 정보가 항상 일관되게 유지됩니다.

> Stripe Webhook에서 `subscriptions` 테이블만 업데이트하면, PostgreSQL Trigger(`sync_profile_plan`)가 `profiles.plan`을 자동 동기화합니다. 애플리케이션 코드가 아닌 DB 레벨에서 단일 진실 소스를 보장하여, 어떤 경로로 구독 상태가 바뀌더라도 플랜 정보가 항상 일관됩니다. `SECURITY DEFINER`로 RLS를 우회하는 점이 핵심입니다.

---

### 2. UI-API-DB 3중 보안 레이어 설계

PRO 스타일에 대한 접근 제어를 구현하면서, 클라이언트 사이드 검증만으로는 보안이 불가능하다는 점을 구조적으로 해결해야 했습니다. 브라우저의 개발자 도구를 열면 누구든 API 요청을 직접 구성해 보낼 수 있으므로, UI에서 Lock 아이콘을 표시하고 클릭을 비활성화하는 것은 UX적 안내일 뿐 실제 보안 효과는 없습니다.

이를 해결하기 위해 세 겹의 방어 체계를 설계했습니다. 첫 번째 층은 클라이언트의 UI 잠금으로, 사용자 경험 측면에서 PRO 뱃지와 Lock 아이콘을 표시하여 유료 기능임을 안내합니다. 두 번째 층은 서버 사이드 API 검증으로, `/api/generate` 라우트에서 요청된 스타일의 `tier`와 사용자의 실제 `plan`을 교차 검증하여 Free 사용자가 PRO 스타일을 요청하면 403 응답을 반환합니다. 세 번째 층은 PostgreSQL의 Row Level Security 정책으로, 사용자가 자기 자신의 데이터만 조회할 수 있도록 데이터베이스 레벨에서 접근을 제한합니다. 특히 `subscriptions` 테이블에는 사용자 측 INSERT/UPDATE 정책을 설정하지 않아서, Service Role Key를 가진 서버만 기록할 수 있습니다. 이 3중 구조 덕분에 어느 한 층이 우회되더라도 다른 층에서 차단되는 방어 깊이(Defense in Depth)를 확보했습니다.

> PRO 스타일 접근 제어를 UI 잠금(Lock 아이콘) → 서버 API 검증(플랜 vs 티어 교차 검증, 403) → DB RLS(사용자 본인 데이터만 조회, subscriptions는 서버만 쓰기 가능)의 3중 레이어로 구현했습니다. 클라이언트 검증은 UX용이고, 실제 보안은 서버와 DB에서 담당하는 Defense in Depth 구조입니다.

---

### 3. 외부 라이브러리 없이 ICO 파일을 바이너리 레벨에서 직접 생성

아무리 AI를 사용한다고 하더라도 여러 기술적인 문제에 부딪히게 되고, 해당 문제에 대해서는 직접 문서나 웹 서치를 할 수밖에 없었습니다. 그중 대표적인 사례가 ICO 파일 생성이었습니다.

SketchTo는 러프 스케치를 AI로 변환하여 플랫 아이콘, 픽셀 아트 등 다양한 스타일의 이미지를 생성하는 서비스입니다. 사용자가 생성된 아이콘 이미지를 자신의 웹 프로젝트에서 파비콘으로 바로 사용할 수 있도록, PNG/JPG 외에 ICO 포맷 다운로드 기능을 제공합니다. 다운로드 옵션에서 포맷을 ICO로 선택하면 16x16부터 256x256까지 원하는 크기를 골라 ICO 파일로 받을 수 있습니다.

이 ICO 변환 기능을 구현할 때, 외부 라이브러리에 의존하지 않고 브라우저의 `ArrayBuffer`와 `DataView` API만으로 ICO 파일의 바이너리 구조를 직접 조립하는 방식을 선택했습니다.

**왜 ICO 다운로드 기능이 필요했는가?** 이 서비스의 주요 사용 시나리오 중 하나는 "러프 스케치를 Flat Icon이나 Minimalist 스타일로 변환한 뒤, 그 결과물을 자기 웹사이트의 파비콘으로 사용하는 것"입니다. PNG 파일을 받아서 별도의 변환 도구를 거치게 하면 사용자 경험이 끊기기 때문에, 서비스 안에서 바로 ICO 파일까지 다운로드할 수 있어야 했습니다. 실제로 다운로드 옵션의 크기 프리셋에도 "16x16 Favicon", "32x32 Standard icon", "48x48 Windows icon" 같은 용도별 설명을 붙여서, 어떤 크기가 어디에 쓰이는지 안내하고 있습니다.

**왜 외부 라이브러리를 쓰지 않았는가?** npm에 `ico-endec`, `png-to-ico` 같은 패키지가 존재하지만, 이 프로젝트에서 필요한 기능은 "AI가 생성한 PNG 이미지 하나를 ICO 컨테이너로 감싸는 것" 단 하나뿐이었습니다. 이를 위해 외부 라이브러리를 추가하면 번들 크기가 불필요하게 증가하고, 해당 라이브러리의 유지보수 상태나 보안 이슈에 의존하게 됩니다. ICO 파일 포맷 자체가 단순한 바이너리 구조(헤더 6바이트 + 디렉토리 엔트리 16바이트 + 이미지 데이터)이기 때문에, 직접 조립해도 코드량이 40줄 내외로 충분히 관리 가능하다고 판단했습니다.

**왜 ArrayBuffer/DataView를 선택했는가?** 브라우저에서 바이너리 데이터를 다루는 방법으로 `Uint8Array`에 직접 값을 넣는 방식과 `DataView`를 사용하는 방식이 있습니다. `DataView`를 선택한 이유는 ICO 포맷이 리틀 엔디안 바이트 오더를 사용하기 때문입니다. `DataView`의 `setUint16(offset, value, true)`에서 세 번째 인자로 엔디안을 명시적으로 지정할 수 있어, `Uint8Array`로 수동으로 바이트를 쪼개 넣는 것보다 가독성이 높고 실수 가능성이 적습니다.

ICO 파일은 세 부분으로 구성됩니다. 6바이트의 헤더에는 reserved(항상 0), type(1=ICO, 2=CUR), image count가 들어갑니다. 16바이트의 디렉토리 엔트리에는 width, height, color count, reserved, color planes, bits per pixel, 이미지 데이터 크기, 데이터 시작 오프셋이 들어갑니다. 그리고 마지막에 실제 이미지 데이터(이 경우 AI가 생성한 이미지를 Canvas API로 리사이즈한 PNG 바이너리)가 이어집니다.

이 과정에서 만난 가장 까다로운 문제는 256px 크기에서 파일이 깨지는 현상이었습니다. 32x32, 64x64, 128x128 크기에서는 정상 동작하는데 256x256에서 일부 프로그램이 파일을 인식하지 못했습니다. AI에게 물어봐도 "코드가 맞아 보인다"는 답변만 돌아왔고, 결국 Microsoft의 ICO 파일 포맷 스펙 문서를 직접 찾아 읽었습니다. 원인은 디렉토리 엔트리의 width와 height 필드가 각각 `BYTE`(1바이트, 0~255)로 정의되어 있어서, 256을 그대로 넣으면 1바이트 오버플로로 `0`이 저장되는데, ICO 스펙에서는 이 `0`이라는 값 자체가 "256px"을 의미하는 특수값으로 예약되어 있었습니다. `entryView.setUint8(0, size >= 256 ? 0 : size)`라는 한 줄의 조건 분기로 해결되었지만, 이 스펙을 직접 찾아보지 않았다면 디버깅이 매우 어려웠을 버그였습니다. 결과적으로 번들 크기에 영향을 주는 외부 의존성 없이, 16x16부터 256x256까지 모든 크기의 ICO 파일을 안정적으로 생성할 수 있게 되었습니다.

> SketchTo에서 AI가 변환한 아이콘 이미지를 사용자가 자기 웹 프로젝트의 파비콘으로 바로 쓸 수 있도록 ICO 다운로드 기능을 제공합니다. 외부 라이브러리 대신 `ArrayBuffer`/`DataView`로 ICO 바이너리를 직접 조립한 이유는 필요한 기능이 "PNG를 ICO 컨테이너로 감싸기" 하나뿐이고, 코드 40줄로 충분하며, 번들 크기와 외부 의존성을 줄이기 위해서입니다. `DataView`를 선택한 이유는 ICO의 리틀 엔디안 바이트 오더를 명시적으로 지정할 수 있기 때문입니다. 256px에서 파일이 깨지는 버그는 ICO 스펙 문서를 직접 찾아 읽어야만 발견할 수 있었던 엣지 케이스였습니다.

---

### 4. Canvas API의 HiDPI 대응

마찬가지로 AI만으로 해결이 어려웠던 문제가 Canvas API의 HiDPI 렌더링이었습니다.

SketchTo는 이미지 업로드 외에도 브라우저에서 직접 스케치를 그릴 수 있는 Canvas 드로잉 기능을 제공합니다. 사용자가 마우스나 터치로 러프한 스케치를 그리면, 그 결과물을 AI에게 넘겨서 아이콘이나 일러스트로 변환할 수 있습니다. 이 드로잉 기능을 구현하면서 Retina 디스플레이에서 Canvas에 그린 선이 흐릿하게 보이는 현상이 발생했습니다.

HTML Canvas는 CSS로 보이는 크기(논리적 크기)와 내부 픽셀 버퍼 크기(물리적 크기)가 분리되어 있는데, 두 값을 동일하게 설정하면 HiDPI 환경에서 저해상도 이미지를 확대하는 것과 같은 효과가 발생합니다. 예를 들어, CSS 크기와 버퍼 크기를 모두 400x300으로 설정하면, Retina 디스플레이(devicePixelRatio=2)에서는 400x300 픽셀을 800x600 물리 픽셀 영역에 뿌려야 하므로 브라우저가 2배로 업스케일링합니다. 이때 선이 번져 보이는 흐림 현상이 나타납니다.

**왜 CSS-only 해결책이 아닌 JavaScript 레벨 보정을 선택했는가?** Canvas의 흐림 문제를 해결하는 방법으로 CSS의 `image-rendering: pixelated`를 적용하는 간단한 방법도 있지만, 이 방식은 드로잉 앱에는 적합하지 않습니다. 픽셀 아트 스타일이 아닌 부드러운 선을 그려야 하는데, `pixelated` 속성은 안티앨리어싱을 제거하여 선이 계단 현상(aliasing)을 보이게 됩니다. 따라서 Canvas 자체의 물리적 해상도를 높이는 것이 올바른 접근이었습니다.

이를 해결하기 위해 세 단계 처리를 적용했습니다. 첫째, Canvas의 물리적 크기(내부 버퍼)를 `devicePixelRatio` 배수로 설정합니다. `canvas.width = width * dpr`로 Retina에서는 실제 2배 크기의 픽셀 버퍼를 확보합니다. 둘째, CSS 크기는 원래 의도한 크기를 유지합니다. `canvas.style.width = ${width}px`로 화면에 표시되는 크기는 변하지 않습니다. 셋째, 드로잉 컨텍스트의 좌표계를 `ctx.scale(dpr, dpr)`로 보정합니다. 이 스케일링이 없으면 좌표 (100, 100)에 점을 찍었을 때 실제로는 (100, 100)/(200, 200) 사이의 왼쪽 위 1/4 지점에만 그려지게 됩니다.

**왜 세 단계가 모두 필요한가?** 각 단계를 빠뜨렸을 때 발생하는 문제가 모두 다릅니다. 물리적 크기만 키우고 `ctx.scale`을 빠뜨리면, 그림이 Canvas 좌상단 1/4 영역에만 그려집니다(좌표계가 2배 크기 버퍼의 절대 좌표를 사용하므로). CSS 크기를 설정하지 않으면, Canvas가 물리적 크기 그대로 화면에 표시되어 의도한 크기의 2배로 보입니다. `ctx.scale`만 적용하고 물리적 크기를 키우지 않으면 아무 효과가 없습니다. 이 세 가지의 상호 관계를 MDN Canvas 문서와 여러 기술 블로그를 직접 대조하면서 이해해야 했습니다.

추가로 `ResizeObserver`를 활용하여 컨테이너 크기가 변할 때 Canvas 내용을 보존하면서 리사이즈하는 반응형 처리도 구현했습니다. 리사이즈 시 기존 Canvas 내용을 `getImageData`로 저장하고, 새 크기로 Canvas를 재설정한 뒤, 임시 Canvas에 복원한 이미지를 다시 그리는 방식입니다. Canvas의 width/height 속성을 변경하면 내부 버퍼가 초기화되기 때문에, 이 중간 저장-복원 과정이 반드시 필요합니다.

> Canvas HiDPI 해결에 CSS `image-rendering: pixelated` 대신 JavaScript 레벨 보정을 선택한 이유는 드로잉 앱에서 부드러운 안티앨리어싱 선이 필요하기 때문입니다. 물리적 크기(`canvas.width = width * dpr`), CSS 크기(`style.width`), 좌표계 보정(`ctx.scale(dpr, dpr)`) 세 단계가 모두 필요하며, 각각을 빠뜨렸을 때 발생하는 문제가 다릅니다. 이 세 가지의 상호 관계는 MDN 문서와 기술 블로그를 직접 대조하면서 이해해야 했습니다.

---

### 5. Gemini 멀티모달 API의 이미지 출력 설정과 응답 파싱

프로젝트의 핵심 기능인 스케치-이미지 변환을 구현하면서, Google Gemini 2.5 Flash 모델의 멀티모달 API를 통합하는 과정에서 예상치 못한 어려움이 있었습니다. 이미지를 입력으로 보내고 변환된 이미지를 출력으로 받아야 하는데, 처음에는 응답에서 텍스트 설명만 돌아오고 이미지가 포함되지 않는 현상이 반복되었습니다.

원인은 `generationConfig`에 `responseModalities: ["TEXT", "IMAGE"]` 옵션을 명시하지 않으면, Gemini가 기본적으로 텍스트만 반환한다는 점이었습니다. 이 설정이 누락되어도 에러가 발생하지 않고 텍스트 응답이 정상적으로 돌아오기 때문에, 문제의 원인을 파악하기가 쉽지 않았습니다. 또한 응답 구조에서 이미지 데이터의 위치가 고정되어 있지 않다는 점도 처리해야 했습니다. `candidates[0].content.parts`가 배열이고, 텍스트 파트와 이미지 파트가 순서 보장 없이 섞여서 오기 때문에, `parts.find(p => p.inlineData)`로 배열을 순회하며 이미지 데이터가 있는 파트를 동적으로 찾는 방식으로 구현했습니다. 여기에 이미지 파트가 아예 없는 경우에 대한 방어적 에러 핸들링까지 추가하여, 어떤 응답 형태가 오더라도 안정적으로 처리되도록 했습니다.

> Gemini 2.5 Flash에서 이미지 응답을 받으려면 `responseModalities: ["TEXT", "IMAGE"]`를 반드시 명시해야 합니다. 누락해도 에러 없이 텍스트만 오기 때문에 원인 파악이 어렵습니다. 응답의 `parts` 배열에서 이미지 위치가 보장되지 않으므로 `parts.find(p => p.inlineData)`로 동적 탐색하는 방식으로 구현했습니다.

---

### 6. Supabase SSR 미들웨어에서 세션 갱신 메커니즘 확보

서비스 운영 중 로그인한 사용자가 일정 시간이 지난 후 페이지에 접근하면 로그인 페이지로 무한 리다이렉트되는 현상이 발생했습니다. 원인은 Supabase의 JWT 액세스 토큰 만료와 리프레시 토큰 갱신 사이의 공백이었습니다. `@supabase/ssr` 패키지를 사용한 서버 사이드 인증에서는 미들웨어가 매 요청마다 세션을 갱신해주어야 하는데, 이 과정이 제대로 동작하지 않으면 만료된 토큰으로 인증 실패가 반복되면서 리다이렉트 루프에 빠집니다.

해결의 핵심은 미들웨어에서 `supabase.auth.getUser()`를 호출하는 것 자체가 세션 갱신 트리거라는 점을 이해하는 것이었습니다. 이 호출이 이루어지면 Supabase 클라이언트가 내부적으로 액세스 토큰의 만료 여부를 확인하고, 만료되었다면 리프레시 토큰을 사용해 새 토큰 쌍을 발급받은 뒤 응답 쿠키에 자동으로 설정합니다. 미들웨어의 쿠키 핸들러에서 `getAll`과 `setAll`을 올바르게 구현하여 요청 쿠키를 읽고 응답 쿠키를 쓸 수 있도록 해야 이 갱신 사이클이 정상 동작합니다. 이 처리를 통해 사용자는 명시적으로 로그아웃하지 않는 한 세션이 끊기는 경험을 하지 않게 되었습니다.

> 세션 만료 시 무한 리다이렉트 루프의 원인은 미들웨어에서 세션 갱신이 누락된 것이었습니다. `@supabase/ssr`의 미들웨어에서 `supabase.auth.getUser()`를 호출하면 내부적으로 리프레시 토큰으로 새 토큰 쌍을 발급받아 응답 쿠키에 설정합니다. 이 한 줄의 호출이 세션 갱신의 트리거입니다.

---

### 7. Tailwind CSS 4 환경에서 모바일/데스크탑 반응형 탭 레이아웃

5개 카테고리 탭(Icons, Characters, Illustrations, Artistic, Design)이 모바일 화면 너비에서 텍스트가 잘려 보이는 문제를 해결하면서, 단순한 CSS 수정이 아닌 반응형 전략 자체를 재설계해야 했습니다. 처음에는 `overflow-x-auto`만 추가했지만, 이렇게 하면 데스크탑에서도 탭들이 좌측에 몰리고 우측에 빈 공간이 생기는 새로운 문제가 발생했습니다.

최종적으로 Tailwind의 `sm:` 반응형 접두사를 활용한 분기 전략을 적용했습니다. 모바일(sm 미만)에서는 `overflow-x-auto`, `w-max`, `shrink-0`으로 가로 스크롤을 허용하되 각 탭의 텍스트가 축소되지 않게 하고, 데스크탑(sm 이상)에서는 `overflow-x-visible`, `w-auto`, `flex-1`로 전체 너비를 균등 분할하는 원래 레이아웃을 유지합니다. 부가적으로 Tailwind CSS 4에서는 v3에서 사용하던 `tailwindcss-scrollbar-hide` 플러그인이 동작하지 않아, `@utility scrollbar-hide` 디렉티브로 커스텀 유틸리티 클래스를 직접 정의해야 했습니다. 프레임워크 메이저 버전 업그레이드 시 이런 종류의 생태계 호환성 차이를 주의해야 한다는 교훈도 얻었습니다.

> 모바일에서 탭 텍스트가 잘리는 문제를 `sm:` 반응형 분기로 해결했습니다. 모바일은 `overflow-x-auto` + `shrink-0`으로 가로 스크롤, 데스크탑은 `flex-1`로 균등 분할합니다. Tailwind CSS 4에서는 v3의 플러그인 방식 대신 `@utility` 디렉티브로 `scrollbar-hide`를 직접 정의해야 했습니다.

---

### 8. 비동기 다운로드 처리의 중복 실행 방지

이미지 다운로드 기능에서 사용자가 버튼을 빠르게 연속 클릭하면 동일한 파일이 여러 번 다운로드되는 현상이 있었습니다. 다운로드 과정은 Canvas의 `toBlob()`으로 이미지 데이터를 생성하고, `URL.createObjectURL()`로 임시 URL을 만든 뒤, 동적으로 `<a>` 태그를 생성하여 프로그래밍적으로 클릭하는 비동기 흐름입니다. 이미 `isProcessing` 상태로 버튼을 비활성화하고 있었지만, 처리 자체는 수십 밀리초 내에 완료되어 상태가 금방 풀리는 반면 브라우저의 다운로드 다이얼로그는 그보다 늦게 나타나기 때문에, 사용자 입장에서는 "아직 반응이 없다"고 느끼고 다시 클릭하게 됩니다.

이를 1.5초의 쿨다운 타이머로 해결했습니다. `isProcessing`과는 별개의 `downloadCooldown` 상태를 두어, 다운로드가 트리거된 후 1.5초 동안은 추가 클릭을 무시합니다. 기술적으로는 단순하지만, 복잡한 디바운스 로직이나 요청 취소 메커니즘 대신 가장 적은 코드로 문제를 확실히 해결하는 실용적인 접근이었습니다.

> 다운로드 버튼의 중복 클릭 문제를 `isProcessing`과 별개의 1.5초 `downloadCooldown` 상태로 해결했습니다. 처리 자체는 빠르게 끝나지만 브라우저 다운로드 다이얼로그가 늦게 뜨는 시간차를 쿨다운으로 커버하는 실용적 접근입니다.

---

### 9. 환경 독립적인 OAuth 리다이렉트 URL 처리

로컬 개발 환경(localhost:3000)과 프로덕션 환경(sketch-to.vercel.app)에서 OAuth 콜백 URL이 달라야 하는 문제를 환경 변수나 조건 분기 없이 해결했습니다. `window.location.origin`을 사용하면 브라우저가 현재 접속 중인 도메인과 포트를 자동으로 반환하므로, 동일한 코드가 어떤 환경에서든 올바른 콜백 URL을 생성합니다. 다만 이 방식이 제대로 동작하려면 Supabase 대시보드의 Redirect URLs 설정과 Google Cloud Console의 Authorized redirect URIs에 로컬과 프로덕션 URL을 모두 등록해 두어야 합니다. 코드 레벨에서는 변경이 전혀 필요 없으면서 새로운 환경(스테이징 서버 등)이 추가되더라도 해당 외부 서비스 설정에만 URL을 등록하면 되는 확장성 있는 구조입니다.

> OAuth 리다이렉트 URL을 `window.location.origin`으로 동적 생성하여 localhost와 프로덕션 환경을 코드 변경 없이 대응합니다. 환경 변수나 조건 분기가 불필요하며, 새 환경 추가 시 외부 서비스(Supabase, Google Console) 설정에만 URL을 등록하면 됩니다.

---

## AI 실무 개발 사례

> 지원 요건: "AI(Claude Code, Codex 등)를 실무 개발에 활용한 사례"

아래는 SketchTo 프로젝트를 1인 개발하면서 **Claude Code**를 주력 AI 코딩 도구로 활용한 구체적인 사례들입니다. 단순히 "AI를 썼다"가 아니라, **어떤 상황에서 어떻게 활용했고, 어디서 AI의 한계를 만났으며, 그때 어떻게 대응했는지**를 중심으로 정리했습니다.

---

### 사례 1. Canvas 드로잉 기능 — 설계부터 구현까지 AI와 페어 프로그래밍

**상황**: 이미지 업로드 외에 브라우저에서 직접 스케치를 그릴 수 있는 Canvas 드로잉 기능을 추가해야 했습니다. 마우스/터치 이벤트 핸들링, Undo 스택, HiDPI 보정, 반응형 리사이즈 등 여러 기술이 결합된 복잡한 기능이었습니다.

**AI 활용 방식**:
- Claude Code에 "Canvas 기반 드로잉 컴포넌트가 필요하다. 마우스와 터치를 모두 지원하고, Undo 기능과 Clear 기능이 있어야 한다"는 요구사항을 전달하고, 컴포넌트 전체 골격을 함께 설계했습니다
- AI가 생성한 초기 코드에서 `useRef`로 Canvas 엘리먼트와 드로잉 상태를 관리하는 구조, `mousedown/mousemove/mouseup` 이벤트 핸들링 패턴, `ImageData` 스냅샷 기반 Undo 스택(최대 30개)의 기본 구조를 빠르게 잡을 수 있었습니다
- "ResizeObserver로 컨테이너 크기 변화를 감지하고, Canvas 내용을 보존하면서 리사이즈하는 로직을 추가해줘"처럼 단계적으로 기능을 확장해 나갔습니다

**AI의 한계와 직접 해결한 부분**:
- 모바일 터치 드로잉에서 화면이 스크롤되는 문제: AI가 처음 생성한 코드는 React의 `onTouchStart`를 사용했는데, 이는 passive 이벤트라 `preventDefault()`가 무시됩니다. "터치하면 스크롤이 된다"고 피드백하자 AI가 `addEventListener`에 `{ passive: false }` 옵션을 제안했고, 이 방식으로 해결되었습니다
- HiDPI 흐림 문제: AI가 `devicePixelRatio` 보정 코드를 생성했지만, 물리적 크기 / CSS 크기 / `ctx.scale()` 세 가지가 모두 맞아야 하는 이유를 이해하기 위해 MDN 문서를 직접 읽어야 했습니다. AI는 "이렇게 하면 된다"는 코드는 주지만 "왜 세 단계가 각각 필요한지"에 대한 설명은 부족했습니다

**결과**: 약 300줄의 `sketch-canvas.tsx` 컴포넌트를 반나절 만에 완성했습니다. AI 없이 Canvas API 문서를 처음부터 읽으며 구현했다면 이틀은 걸렸을 작업입니다.

---

### 사례 2. 23개 아트 스타일 프롬프트 — AI로 반복 작업 가속화

**상황**: Gemini API에 전달할 23개 아트 스타일(Flat Icon, Pixel Art, Watercolor, Anime 등) 각각에 대해 200~300단어짜리 상세 프롬프트를 작성해야 했습니다.

**AI 활용 방식**:
- 먼저 Flat Icon 스타일 하나에 대해 "역할 부여 → 기술 사양(색상 팔레트, 선 두께, 그림자 처리) → 네거티브 프롬프트(하지 말아야 할 것) → 출력 형식"이라는 4단계 구조를 직접 잡았습니다
- 이 구조를 Claude Code에 전달하고 "이 패턴을 기반으로 Pixel Art 스타일 프롬프트를 만들어줘. 8-bit 색상 제한, 안티앨리어싱 없음, 그리드 정렬 등의 특성을 반영해줘"처럼 스타일별 특성을 지시하며 변형했습니다
- 각 프롬프트를 받은 뒤 실제 Gemini API로 테스트하면서, "선이 너무 두꺼운 결과가 나온다 → 프롬프트에 'thin clean outlines' 강조를 추가해줘" 같은 피드백 루프를 반복했습니다

**결과**: 23개 프롬프트를 이틀 안에 완성하고 품질 검증까지 마쳤습니다. 각 스타일의 시각적 특성을 텍스트로 정확히 표현하는 건 AI가 잘하는 영역이었고, 저는 실제 결과물을 보며 품질을 판단하는 역할에 집중할 수 있었습니다.

---

### 사례 3. Stripe + Supabase 결제 통합 — 보일러플레이트 생성과 아키텍처 결정

**상황**: Freemium 구독 모델을 위해 Stripe 결제와 Supabase 사용자 DB를 연동해야 했습니다. Webhook 핸들러, 구독 상태 관리, 플랜별 접근 제어가 필요했습니다.

**AI 활용 방식**:
- "Stripe Webhook에서 `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` 4가지 이벤트를 처리하는 Next.js Route Handler를 만들어줘"라는 구체적인 요구사항으로 초기 코드를 생성했습니다
- Webhook 서명 검증(`stripe.webhooks.constructEvent`) 코드도 AI가 생성했지만, 환경 변수명이 올바른지, raw body 파싱이 Next.js App Router에서 제대로 동작하는지는 직접 확인했습니다
- Supabase RLS 정책 SQL도 AI와 함께 작성했으나, "subscriptions 테이블은 사용자가 직접 수정할 수 없어야 한다"는 보안 요건은 제가 판단하고 지시한 부분입니다

**AI의 한계와 직접 해결한 부분**:
- `subscriptions` 테이블과 `profiles.plan` 사이의 상태 불일치 문제가 발생했을 때, AI는 "두 테이블을 동시에 업데이트하라"는 해결책을 제시했습니다. 하지만 코드가 분산되면 한쪽만 업데이트되는 버그가 재발할 수 있다고 판단하여, 직접 PostgreSQL Trigger를 설계해 DB 레벨에서 자동 동기화하는 방식을 선택했습니다
- `SECURITY DEFINER`로 RLS를 우회해야 한다는 점은 Supabase 문서를 직접 확인한 후 적용했습니다

**결과**: 결제 시스템 전체를 3일 만에 통합했습니다. Webhook 핸들러의 반복적인 이벤트 분기 코드는 AI가 생성하고, "상태 동기화를 어디서 보장할 것인가"라는 아키텍처 결정은 제가 내렸습니다.

---

### 사례 4. ICO 바이너리 생성 — AI의 한계를 경험하고 직접 스펙을 읽은 사례

**상황**: 외부 라이브러리 없이 브라우저에서 ICO 파일을 생성해야 했습니다.

**AI 활용 방식**:
- "ArrayBuffer와 DataView로 ICO 파일 헤더와 디렉토리 엔트리를 직접 조립하는 코드를 만들어줘"라고 요청하여 초기 구현을 받았습니다
- AI가 생성한 코드는 ICO 파일의 3단계 구조(6바이트 헤더 + 16바이트 디렉토리 엔트리 + 이미지 데이터)를 정확히 반영하고 있었고, `DataView`의 리틀 엔디안 설정도 올바르게 적용되어 있었습니다

**AI가 해결하지 못한 결정적 버그**:
- 32x32, 64x64에서는 정상인데 **256x256에서 파일이 깨지는** 현상이 발생했습니다
- AI에게 "256px ICO가 깨진다"고 물었을 때 "코드가 맞아 보인다"는 답변만 돌아왔습니다
- 결국 Microsoft의 ICO 파일 포맷 스펙 문서를 직접 찾아 읽었고, 디렉토리 엔트리의 width/height 필드가 `BYTE`(1바이트, 0~255)라서 256을 넣으면 오버플로로 0이 되는데, ICO 스펙에서 0은 "256px"을 의미하는 **예약된 특수값**이라는 사실을 발견했습니다
- `entryView.setUint8(0, size >= 256 ? 0 : size)` 한 줄로 해결되었지만, AI가 이 엣지 케이스를 알지 못했기 때문에 직접 스펙 문서를 읽는 과정이 필수였습니다

**교훈**: AI는 일반적인 패턴의 코드를 빠르게 생성하는 데 탁월하지만, **바이너리 포맷 스펙의 엣지 케이스** 같은 영역에서는 공식 문서를 직접 확인하는 과정을 생략할 수 없습니다.

---

### 사례 5. SEO 메타데이터 체계 구축 — AI가 가장 효율적이었던 작업

**상황**: Next.js Metadata API로 OG 태그, Twitter Card, JSON-LD, robots.txt, sitemap.xml을 한 번에 세팅해야 했습니다.

**AI 활용 방식**:
- "Next.js App Router의 Metadata API로 OG 태그, Twitter Card, JSON-LD(WebApplication 스키마)를 설정하고, 한국어/영어 이중 언어 키워드와 hreflang도 추가해줘"라고 요청했습니다
- AI가 한 번에 생성한 메타데이터 코드에서 누락된 항목이 거의 없었습니다. `generateMetadata` 함수 구조, `openGraph` 객체의 필드, `twitter` 카드 설정, JSON-LD의 `@type: WebApplication` 스키마까지 정확했습니다
- 추가로 "robots.txt에서 /api/ 경로를 차단하고, sitemap.xml을 동적으로 생성하는 코드도 만들어줘"라고 확장 요청을 하여 한 세션 안에 SEO 관련 설정을 모두 완료했습니다

**결과**: SEO 메타데이터 체계 전체를 1시간 이내에 세팅했습니다. 정해진 규격이 명확한 작업(OG 프로토콜, JSON-LD 스키마 등)은 AI가 가장 정확하고 빠르게 처리하는 영역입니다.

---

### 사례 6. 디버깅 — AI와의 대화로 원인을 좁혀나간 과정

**상황**: 여러 버그를 수정하는 과정에서 Claude Code를 디버깅 파트너로 활용했습니다.

**구체적 사례들**:

**Gemini API 이미지 응답 누락**: "이미지를 보내는데 텍스트만 돌아온다"고 설명하자, AI가 `responseModalities` 설정 누락 가능성을 즉시 짚어줬습니다. 이 설정이 빠져도 에러가 나지 않고 텍스트만 조용히 반환되기 때문에, AI 없이는 원인 파악에 더 오래 걸렸을 것입니다.

**Supabase 세션 만료 무한 리다이렉트**: "로그인 후 시간이 지나면 무한 리다이렉트가 발생한다"고 상황을 설명하자, AI가 미들웨어에서 `getUser()` 호출이 세션 갱신 트리거라는 점을 알려줬습니다. 다만 `@supabase/ssr`의 쿠키 핸들러에서 `getAll`/`setAll`을 올바르게 구현하는 구체적인 코드는 Supabase 공식 문서의 SSR 가이드를 직접 참고했습니다.

**Tailwind CSS 4 scrollbar-hide 미동작**: `tailwindcss-scrollbar-hide` 플러그인이 동작하지 않는다고 했을 때, AI가 "Tailwind CSS 4에서는 플러그인 방식이 바뀌었다"는 방향은 잡아줬지만, `@utility` 디렉티브 문법의 정확한 사용법은 Tailwind CSS 4 공식 문서에서 확인했습니다.

---

### AI 활용에 대한 실무적 판단 기준

| 구분 | AI가 효과적인 영역 | 직접 해야 하는 영역 |
|------|-------------------|-------------------|
| **코드 생성** | 정해진 패턴의 보일러플레이트(CRUD, 인증 플로우, Webhook 핸들러, SEO 메타데이터) | 보안 정책 결정(RLS, 접근 제어), 아키텍처 선택(DB Trigger vs 애플리케이션 로직) |
| **반복 작업** | 프롬프트 변형(23개 스타일), 메타데이터 필드 채우기, 타입 정의 | 각 프롬프트의 실제 출력 품질 검증, 스타일별 미세 조정 |
| **디버깅** | 에러 메시지 해석, 설정 누락 후보 제시, 코드 리뷰에서 논리 오류 발견 | 바이너리 포맷 스펙 확인, 프레임워크 메이저 버전 차이 대응, 재현이 어려운 엣지 케이스 |
| **학습** | 새로운 API/라이브러리의 사용법 빠르게 파악, 코드 예제 생성 | "왜 이렇게 동작하는지" 근본적 이해가 필요한 경우(HiDPI 원리, ICO 스펙 등) |

**핵심 원칙**: AI가 생성한 코드는 "초안"입니다. 특히 보안 관련 코드(RLS 정책, Webhook 서명 검증, 환경 변수 처리)는 반드시 직접 검증합니다. AI의 가장 큰 가치는 "어디서부터 시작해야 할지 모르는" 상황에서 빠르게 작동하는 프로토타입을 만들어주는 것이고, 개발자의 역할은 그 프로토타입을 프로덕션 수준으로 끌어올리는 판단을 내리는 것입니다.

---

## AI 실무 개발 사례 (서술형)

SketchTo라는 AI 스케치 변환 SaaS를 1인 개발하면서 Claude Code를 주력 AI 코딩 도구로 활용했습니다. AI를 어떻게 활용했고, 어디서 한계를 만났으며, 그때 어떤 판단을 내렸는지를 정리했습니다.

### Canvas 드로잉 기능 — AI와 페어 프로그래밍

브라우저에서 직접 스케치를 그릴 수 있는 Canvas 드로잉 기능을 구현할 때, Claude Code에 요구사항을 전달하고 컴포넌트 골격을 함께 잡았습니다. `useRef` 기반 상태 관리, 이벤트 핸들링, `ImageData` 스냅샷 Undo 스택까지 기본 구조를 빠르게 생성한 뒤, "ResizeObserver로 기존 그림을 보존하며 리사이즈하는 로직을 추가해줘"처럼 단계적으로 확장했습니다.

다만 모바일 터치 스크롤 문제(React의 `onTouchStart`가 passive라 `preventDefault()` 무시)는 AI에게 피드백을 주고 `{ passive: false }` 해결책을 받았지만, Retina HiDPI 흐림 문제에서는 AI가 보정 코드는 생성해줘도 물리적 크기·CSS 크기·`ctx.scale()` 세 가지가 **왜** 모두 필요한지는 설명하지 못해서 MDN 문서를 직접 읽어야 했습니다. AI는 "이렇게 하면 된다"는 코드는 주지만, "왜 이래야 하는지"까지는 부족한 경우가 있습니다. 결과적으로 300줄 컴포넌트를 반나절에 완성했고, AI 없이는 이틀 걸렸을 작업이었습니다.

### ICO 바이너리 생성 — AI가 못 찾은 버그를 직접 스펙에서 발견

외부 라이브러리 없이 `ArrayBuffer`/`DataView`로 ICO 파일을 생성하는 코드를 AI와 함께 작성했습니다. 32x32, 64x64에서는 정상이었지만 256x256에서 파일이 깨졌고, AI에게 물어도 "코드가 맞아 보인다"는 답변뿐이었습니다.

결국 Microsoft ICO 스펙 문서를 직접 읽고 원인을 찾았습니다. width/height 필드가 `BYTE`(0~255)라서 256은 오버플로로 0이 되는데, ICO 스펙에서 0이 곧 "256px"을 의미하는 예약값이었습니다. 한 줄의 조건 분기로 해결됐지만, AI의 학습 데이터에 없는 엣지 케이스는 공식 문서를 직접 확인할 수밖에 없다는 걸 체감한 경험이었습니다.

### Stripe 결제 통합 — 보일러플레이트는 AI가, 아키텍처 결정은 직접

Stripe Webhook 핸들러와 RLS 정책 같은 보일러플레이트는 AI가 빠르게 생성해줬습니다. 하지만 운영 중 `subscriptions` 테이블은 업데이트됐는데 `profiles.plan`이 동기화되지 않는 버그가 발생했을 때, AI는 "두 테이블을 동시에 업데이트하라"고 답했습니다. 코드가 분산되면 같은 버그가 재발할 거라고 판단하여 직접 PostgreSQL Trigger를 설계해 DB 레벨에서 자동 동기화하는 구조를 만들었습니다. "상태 동기화를 애플리케이션에서 할 것인가, DB에서 할 것인가"라는 아키텍처 결정은 AI가 대신 내릴 수 없는 영역이었습니다.

### 느낀 점

AI가 잘하는 영역은 명확합니다. 정해진 패턴의 보일러플레이트, 반복 변형 작업(23개 프롬프트), 디버깅 시 원인 후보 좁히기. 반면 보안 정책 결정, 아키텍처 선택, 바이너리 스펙 엣지 케이스, 최신 프레임워크 변경사항 대응은 직접 해야 합니다. AI가 생성한 코드는 "초안"이고, 그 초안을 프로덕션 수준으로 끌어올리는 판단이 개발자의 역할이라고 생각합니다.
