# AI 아이콘 생성기 개발 가이드

스케치나 러프한 이미지를 입력받아 정교한 아이콘/파비콘으로 변환하는 웹앱 개발을 위한 가이드입니다.

## 개요

사용자가 대충 그린 스케치를 업로드하면, AI가 이를 분석하여 깔끔한 벡터 스타일의 아이콘을 생성합니다.

### 핵심 워크플로우

```
사용자 스케치 → AI 이미지 분석 → 도형/구조 파악 → Python/Pillow로 렌더링 → 다양한 크기 출력
```

## 기술 스택

### 필수 라이브러리

```python
# 이미지 처리
from PIL import Image, ImageDraw

# 웹 프레임워크 (선택)
# FastAPI, Flask, Django 등
```

### 설치

```bash
pip install Pillow
```

## 핵심 렌더링 기법

### 1. 고해상도 렌더링 후 축소 (안티앨리어싱)

```python
def create_icon(target_size):
    scale = 8  # 8배 크기로 그린 후 축소
    high_res_size = target_size * scale
    
    img = Image.new('RGBA', (high_res_size, high_res_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # ... 고해상도로 도형 그리기 ...
    
    # 안티앨리어싱 적용하여 축소
    img = img.resize((target_size, target_size), Image.LANCZOS)
    return img
```

### 2. 둥근 모서리 배경

```python
def draw_rounded_background(draw, size, color, corner_ratio=0.22):
    """iOS/Android 앱 아이콘 스타일의 둥근 배경"""
    corner_radius = int(size * corner_ratio)
    draw.rounded_rectangle(
        [0, 0, size - 1, size - 1],
        radius=corner_radius,
        fill=color
    )
```

### 3. 선 두께 비율 계산

```python
def calculate_stroke_width(size, ratio=0.045):
    """아이콘 크기에 비례하는 선 두께"""
    return max(2, int(size * ratio))
```

### 4. 다양한 크기 출력

```python
def generate_favicon_set(create_func):
    """파비콘에 필요한 모든 크기 생성"""
    sizes = [16, 32, 48, 64, 128, 256, 512]
    icons = {}
    
    for size in sizes:
        icons[size] = create_func(size)
    
    return icons
```

### 5. ICO 파일 생성 (멀티 사이즈)

```python
def save_as_ico(icons, filepath):
    """여러 크기를 포함한 ICO 파일 생성"""
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_images = [icons[s] for s in ico_sizes if s in icons]
    
    ico_images[0].save(
        filepath,
        format='ICO',
        sizes=[(s, s) for s in ico_sizes if s in icons]
    )
```

## 실제 구현 예시: 책 아이콘

```python
from PIL import Image, ImageDraw

def create_book_icon(size):
    """주황색 배경에 흰색 책 아이콘 생성"""
    
    # 고해상도 렌더링
    scale = 8
    high_res_size = size * scale
    
    # 투명 배경
    img = Image.new('RGBA', (high_res_size, high_res_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 색상 정의
    orange_color = (255, 149, 0, 255)  # 배경색
    white = (255, 255, 255, 255)        # 아이콘색
    
    # 둥근 배경
    corner_radius = int(high_res_size * 0.22)
    draw.rounded_rectangle(
        [0, 0, high_res_size - 1, high_res_size - 1],
        radius=corner_radius,
        fill=orange_color
    )
    
    # 중심점
    cx = high_res_size / 2
    cy = high_res_size / 2
    
    # 선 두께
    lw = max(3, int(high_res_size * 0.042))
    
    # 책 크기
    book_w = high_res_size * 0.58
    book_h = high_res_size * 0.40
    
    # 좌표 계산
    gap = lw * 0.8
    left = cx - book_w / 2
    right = cx + book_w / 2
    top = cy - book_h / 2
    bottom = cy + book_h / 2
    r = int(high_res_size * 0.02)
    
    # 왼쪽 페이지
    draw.rounded_rectangle(
        [left, top, cx - gap, bottom],
        radius=r,
        outline=white,
        width=lw
    )
    
    # 오른쪽 페이지
    draw.rounded_rectangle(
        [cx + gap, top, right, bottom],
        radius=r,
        outline=white,
        width=lw
    )
    
    # 중앙 책등
    spine_margin = book_h * 0.22
    draw.line(
        [(cx, top + spine_margin), (cx, bottom - spine_margin)],
        fill=white,
        width=lw
    )
    
    # 축소하여 반환
    img = img.resize((size, size), Image.LANCZOS)
    return img
```

## AI 프롬프트 가이드

### 이미지 분석 프롬프트

```
이 스케치/이미지를 분석하여 다음 정보를 추출해주세요:

1. **도형 구성**: 어떤 기본 도형들로 구성되어 있는지
   - 사각형, 원, 선, 삼각형 등
   - 각 도형의 상대적 위치와 크기 비율

2. **색상 정보**:
   - 배경색 (RGB 값)
   - 전경색/아이콘색 (RGB 값)
   - 그라데이션 여부

3. **스타일**:
   - 선 두께 (아이콘 대비 비율)
   - 모서리 스타일 (둥근/각진)
   - fill/stroke 여부

4. **좌표 정보** (아이콘 크기 대비 비율로):
   - 각 도형의 중심점
   - 너비/높이 비율
   - 패딩/마진
```

### 코드 생성 프롬프트

```
위 분석 결과를 바탕으로 Python/Pillow 코드를 생성해주세요.

요구사항:
- 함수명: create_{아이콘명}_icon(size)
- 8배 스케일로 렌더링 후 LANCZOS 리샘플링으로 축소
- 모든 좌표는 size 대비 비율로 계산
- 선 두께는 최소값 보장: max(2, int(size * ratio))
- RGBA 모드, 투명 배경 지원
- 출력: PIL Image 객체
```

## Pillow 주요 API 레퍼런스

### ImageDraw 메서드

| 메서드 | 용도 | 예시 |
|--------|------|------|
| `rounded_rectangle()` | 둥근 모서리 사각형 | `draw.rounded_rectangle([x1,y1,x2,y2], radius=r, fill=color)` |
| `rectangle()` | 사각형 | `draw.rectangle([x1,y1,x2,y2], fill=color, outline=color)` |
| `ellipse()` | 원/타원 | `draw.ellipse([x1,y1,x2,y2], fill=color)` |
| `line()` | 직선 | `draw.line([(x1,y1), (x2,y2)], fill=color, width=w)` |
| `polygon()` | 다각형 | `draw.polygon([(x1,y1), (x2,y2), ...], fill=color)` |
| `arc()` | 호 | `draw.arc([x1,y1,x2,y2], start=0, end=180, fill=color)` |
| `pieslice()` | 파이 조각 | `draw.pieslice([x1,y1,x2,y2], start=0, end=90, fill=color)` |

### 리샘플링 필터

| 필터 | 품질 | 속도 | 용도 |
|------|------|------|------|
| `Image.LANCZOS` | 최고 | 느림 | 최종 출력 |
| `Image.BICUBIC` | 높음 | 보통 | 일반 리사이징 |
| `Image.BILINEAR` | 보통 | 빠름 | 실시간 미리보기 |
| `Image.NEAREST` | 낮음 | 매우 빠름 | 픽셀아트 |

## 웹앱 아키텍처 제안

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ 이미지 업로드 │  │ 실시간 미리보기│  │ 크기/포맷 선택  │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Backend                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ AI 이미지분석 │→│ 코드 생성    │→│ Pillow 렌더링   │ │
│  │ (Vision API) │  │ (LLM)       │  │                 │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                      Output                             │
│  PNG (16~512px) │ ICO (멀티사이즈) │ SVG (옵션)         │
└─────────────────────────────────────────────────────────┘
```

## 출력 포맷별 용도

| 포맷 | 크기 | 용도 |
|------|------|------|
| `favicon.ico` | 16, 32, 48, 64, 128, 256 | 브라우저 탭, 북마크 |
| `favicon-16x16.png` | 16x16 | 브라우저 탭 |
| `favicon-32x32.png` | 32x32 | 작업표시줄 |
| `apple-touch-icon.png` | 180x180 | iOS 홈화면 |
| `android-chrome-192x192.png` | 192x192 | Android 홈화면 |
| `android-chrome-512x512.png` | 512x512 | Android 스플래시 |

## 주의사항

1. **비율 기반 계산**: 모든 좌표와 크기는 절대값이 아닌 비율로 계산해야 다양한 출력 크기에서 일관된 결과 보장
2. **최소값 보장**: 작은 아이콘에서도 선이 보이도록 `max()` 함수로 최소 픽셀 보장
3. **투명 배경**: 'RGBA' 모드 사용, 배경을 `(0, 0, 0, 0)`으로 초기화
4. **안티앨리어싱**: 최종 출력 품질을 위해 반드시 고해상도 렌더링 후 축소
