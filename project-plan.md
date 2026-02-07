```markdown
# 스케치 → 전문 아이콘 생성기 (Gemini API 가이드)
## MVP 프로젝트 문서 (2026.02 기준)

이 문서는 **손 스케치/그림판 doodle → 깔끔한 아이콘 변환** SaaS를 위한 Gemini Imagen img2img 프롬프트·코드 템플릿입니다. 
- **목표**: 사용자 스케치 사진 업로드 → 자동 아이콘 출력 (PNG/SVG).
- **API**: Gemini 2.0 Flash Image 또는 Imagen 4 Fast (비용 0.02~0.04$/장).[web:46][web:48]
- **수익 모델 연계**: 무료 1회 → 크레딧 100원/장 → 구독 무제한.

**사용법**: 이 MD를 AI(Claude/GPT 등)에 주고 "Next.js MVP 코드 생성" 요청하세요.

---

## 1. Gemini img2img 기본 원리

- **입력**: base64 이미지 + 텍스트 프롬프트.
- **출력**: 변환된 이미지 (512x512~1024x1024).
- **강점**: 원본 스케치 형태 80~90% 유지하면서 스타일 업그레이드.[web:44][web:46][web:49]
- **파라미터**: 
  | 파라미터 | 값 | 설명 |
  |----------|----|------|
  | strength | 0.7~0.9 | 원본 유사도 (높을수록 스케치 충실) |
  | steps | 20~50 | 품질 (MVP는 20으로 비용 절감) |
  | size | 512x512 | 아이콘 최적 |

---

## 2. 핵심 프롬프트 규칙 (모든 템플릿 공통)

```
"이 업로드된 [스케치/그림판] 이미지를 기반으로 [스타일] 아이콘으로 변환하세요.

📋 필수 요구사항:
- 원본 스케치의 **형태·라인·구성 정확히 유지** (변형 금지)
- [스타일 상세]: [e.g., 플랫 디자인, 미니멀 라인, 벡터 스타일]
- 배경: 투명 또는 흰색
- 해상도: 512x512 (또는 1024x1024)
- 상업용: 클린, 고품질, 왜곡/블러 없음
- Negative: blurry, deformed, low quality, extra details, text"

**Strength: 0.8 추천** (원본 형태 지키면서 스타일 적용)
```

---

## 3. 구체적 프롬프트 템플릿 (복사-붙여넣기 OK)

### A. 플랫 아이콘 (앱/웹 아이콘용)
```
이 손 스케치 이미지를 현대적 플랫 디자인 아이콘으로 변환하세요. 
- 단순 2~3색 팔레트 ([색상 지정 e.g., blue #007BFF, white])
- bold stroke 3px, no fill 또는 gradient
- 완벽한 대칭, rounded corners
- viewBox 스타일 (아이콘셋 호환)
- 512x512, 투명 배경
Negative: 복잡한 그림자, texture, 3D 효과
```

### B. 라인 아트 아이콘 (로고/미니멀)
```
이 doodle을 미니멀 라인 아트 아이콘으로 리파인하세요.
- single path stroke 2~4px, currentColor
- no fill, open paths OK
- Feather/Lucide Icons 스타일 (깔끔·단순)
- 512x512 정사각형, 흰 배경
Negative: fills, gradients, shadows
```

### C. 3D 아이콘 (제품/모더ン)
```
이 스케치를 3D isometric 아이콘으로 업그레이드.
- soft lighting, subtle shadow
- material: [e.g., matte plastic, glass]
- 45도 각도, floating 효과
- 1024x1024, 흰 배경
Negative: flat, cartoonish
```

### D. Kawaii/캐릭터 아이콘 (SNS·게임)
```
이 캐릭터 스케치를 귀여운 kawaii 아이콘으로 변환.
- big eyes, blush, rounded shapes
- vibrant pastel colors
- sticker style, bold outline 4px
- 원본 표정·포즈 100% 유지
- 512x512, 투명 배경
```

### E. SVG 벡터 출력 (프리미엄 기능)
```
이 스케치 기반으로 **SVG 코드** 생성 (이미지 아닌 코드 출력):
- viewBox="0 0 24 24"
- single optimized path
- stroke="currentColor" fill="none"
- 1KB 미만 크기 최적화
출력: 유효한 SVG 코드만 (설명 없음)
```

**테스트 예시 입력**: 커피 컵 스케치 → "플랫 디자인, brown/orange 팔레트" → 출력 아이콘.

---

## 4. Next.js API 코드 템플릿

```typescript
// app/api/sketch-to-icon/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export async function POST(request: Request) {
  const { imageBase64, promptTemplate = 'flat' } = await request.json();

  // 템플릿 선택
  const prompts = {
    flat: "이 손 스케치 이미지를 현대적 플랫 디자인 아이콘으로 변환... [위 템플릿 전체 붙여넣기]",
    // 다른 템플릿 추가
  };

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      temperature: 0.3  // 일관성 위해 낮춤
    }
  });

  const result = await model.generateContent([
    prompts[promptTemplate],
    { 
      inlineData: {
        data: imageBase64.split(','), [finout](https://www.finout.io/blog/claude-pricing-in-2026-for-individuals-organizations-and-developers)
        mimeType: 'image/png'
      }
    }
  ]);

  const imageData = result.response.candidates.content.parts.inlineData?.data;
  return Response.json({ image: `data:image/png;base64,${imageData}` });
}
```

**클라이언트 사용**:
```tsx
// 카메라 업로드 + 즉시 변환
const handleUpload = async (file: File) => {
  const base64 = await fileToBase64(file);
  const res = await fetch('/api/sketch-to-icon', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: base64, promptTemplate: 'flat' })
  });
};
```

---

## 5. 수익화 플로우

```
1. 무료: 1회 스케치 → 기본 플랫 아이콘 (훅)
2. 크레딧(100원): 라인/3D 스타일 선택
3. 구독(월 5천원): 무제한 + SVG 다운로드 + 컬렉션 저장
4. 프리미엄(추가): 배치 변환, custom 색상 팔레트
```

**UI 플로우**: 스케치 업로드 → 스타일 선택(드롭다운) → 3초 후 아이콘 출력 → 다운로드/재생성.

---

## 6. 테스트 체크리스트

- [ ] 스케치 사진(흐린 손그림) → 형태 유지 확인
- [ ] 배경 투명 PNG 출력
- [ ] 512x512 크기 고정
- [ ] 상업용 클린 퀄리티 (Figma 호환)
- [ ] 비용: 1회 30원 미만

**문제 해결**:
- 형태 왜곡: strength 0.9로 ↑
- 너무 단순: steps 50으로 ↑
- SVG 깨짐: "valid SVG code only" 강조

---

