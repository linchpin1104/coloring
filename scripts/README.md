# Scripts 디렉토리 사용법

이 디렉토리는 색칠놀이 플랫폼의 유틸리티 스크립트들을 포함합니다.

## 📁 파일 구조

```
scripts/
├── image_crawler_generator.py    # 메인 이미지 크롤링 및 생성기
├── extract_images.py             # JSON에서 이미지 추출
├── create_test_images.py         # 테스트 이미지 생성
├── check_images.py               # 이미지 품질 검사
├── outline_extractor.py          # 윤곽선 추출
├── setup-firebase.js             # Firebase 설정
└── requirements.txt              # Python 의존성
```

## 🚀 사용법

### 1. 환경 설정

```bash
# Python 의존성 설치
pip install -r requirements.txt

# 환경변수 설정 (.env 파일)
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

### 2. 메인 이미지 생성기

```bash
# 기본 실행 (테스트용)
python image_crawler_generator.py

# 특정 캐릭터 생성
python image_crawler_generator.py --character "포켓몬 피카츄" --age-group child --difficulty easy --count 10
```

**주요 기능:**
- 🔍 구글 이미지 검색으로 참조 이미지 다운로드
- ☁️ Firebase Storage에 이미지 업로드
- 🤖 제미나이 이미지 플래시로 색칠도안 생성
- 📝 연령별 프롬프트 최적화

### 3. 이미지 추출

```bash
# JSON에서 이미지 추출
python extract_images.py coloring_pages_포켓몬_피카츄_20250117_120000.json

# 출력 디렉토리 지정
python extract_images.py result.json extracted_images/
```

### 4. 테스트 이미지 생성

```bash
# 단일 캐릭터
python create_test_images.py "포켓몬 피카츄"

# 모든 기본 캐릭터
python create_test_images.py all

# 출력 디렉토리 지정
python create_test_images.py "미키마우스" test_images/
```

### 5. 이미지 품질 검사

```bash
# 디렉토리 내 모든 이미지 검사
python check_images.py extracted_images/

# 결과를 JSON 파일로 저장
python check_images.py test_images/ results.json
```

**검사 항목:**
- 📏 이미지 크기 및 해상도
- 🎨 포맷 및 색상 모드
- 💾 파일 크기
- 📐 윤곽선 밀도
- 🌟 밝기 및 대비

### 6. 윤곽선 추출

```bash
# 단일 이미지
python outline_extractor.py test.png

# 방법 지정
python outline_extractor.py test.png outline.png canny

# 디렉토리 일괄 처리
python outline_extractor.py images/ outlines/ sobel
```

**사용 가능한 방법:**
- `canny`: Canny 엣지 검출 (기본값)
- `sobel`: Sobel 엣지 검출
- `laplacian`: Laplacian 엣지 검출

### 7. Firebase 설정

```bash
# Firebase 초기화 및 설정
node setup-firebase.js
```

**설정 내용:**
- 🔧 Firebase Admin SDK 초기화
- 📦 Storage 버킷 설정
- 🗄️ Firestore 데이터베이스 설정
- 📝 샘플 데이터 생성

## 🔄 워크플로우

### 전체 색칠놀이 도안 생성 과정:

1. **이미지 검색 및 다운로드**
   ```bash
   python image_crawler_generator.py
   ```

2. **생성된 JSON에서 이미지 추출**
   ```bash
   python extract_images.py coloring_pages_*.json
   ```

3. **이미지 품질 검사**
   ```bash
   python check_images.py extracted_images/
   ```

4. **필요시 윤곽선 재추출**
   ```bash
   python outline_extractor.py extracted_images/ refined_outlines/
   ```

## 📊 출력 파일

### JSON 결과 파일
```json
{
  "character_name": "포켓몬 피카츄",
  "age_group": "child",
  "difficulty": "easy",
  "total_pages": 10,
  "generated_at": "2025-01-17T12:00:00",
  "prompt_used": "최적화된 프롬프트...",
  "reference_images": [...],
  "generated_pages": [...]
}
```

### 이미지 파일
- `extracted_images/`: JSON에서 추출된 PNG 이미지들
- `test_images/`: 테스트용 생성 이미지들
- `outlines/`: 윤곽선 추출된 이미지들

## ⚙️ 설정

### 환경변수 (.env)
```env
# Gemini API (필수)
GEMINI_API_KEY=your_gemini_api_key

# Google Search API (선택사항 - 없으면 모의 검색 사용)
GOOGLE_SEARCH_API_KEY=your_google_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Firebase 설정
FIREBASE_PROJECT_ID=coloring-98f0c
FIREBASE_STORAGE_BUCKET=coloring-98f0c.firebasestorage.app
```

### Firebase 서비스 계정
- `coloring-98f0c-firebase-adminsdk-fbsvc-c68fe8998e.json` 파일이 프로젝트 루트에 있어야 합니다.

## 🐛 문제 해결

### 일반적인 오류:

1. **Firebase 초기화 실패**
   - 서비스 계정 키 파일 경로 확인
   - Firebase 프로젝트 ID 확인

2. **Gemini API 오류**
   - API 키 유효성 확인
   - API 할당량 확인

3. **이미지 다운로드 실패**
   - 네트워크 연결 확인
   - 이미지 URL 유효성 확인

4. **의존성 설치 실패**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

## 📈 성능 최적화

- **배치 처리**: 여러 이미지를 한 번에 처리
- **캐싱**: 다운로드된 이미지 재사용
- **병렬 처리**: 여러 이미지 동시 처리
- **압축**: 이미지 크기 최적화

## 🔒 보안

- API 키는 환경변수로 관리
- Firebase 보안 규칙 설정
- 업로드된 이미지 검증
- 사용자 권한 관리