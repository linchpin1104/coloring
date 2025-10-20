# 색칠놀이 도안 제작 도구

재사용 가능한 프로덕션용 색칠놀이 도안 생성 도구입니다.

## 🛠️ 도구 목록

### 1. `production_generator.py` - 단일 제작 도구
개별 캐릭터의 색칠놀이 도안을 제작합니다.

### 2. `batch_generator.py` - 배치 제작 도구  
여러 캐릭터와 난이도를 한 번에 제작합니다.

### 3. `image_crawler_generator.py` - 핵심 생성 엔진
실제 색칠놀이 도안 생성 로직을 담당합니다.

## 🚀 사용법

### 단일 제작 (production_generator.py)

```bash
# 기본 사용법 (도라에몽 10개 생성)
python3 production_generator.py 도라에몽

# 옵션 지정
python3 production_generator.py 하츄핑 \
  --count 5 \
  --age-group child \
  --difficulty medium \
  --output-dir my_output \
  --extract-images

# Firebase 업로드 없이 로컬만 생성
python3 production_generator.py 미키마우스 --no-firebase
```

#### 옵션 설명
- `character`: 캐릭터 이름 (필수)
- `--count, -c`: 생성할 도안 개수 (기본값: 10)
- `--age-group, -a`: 연령대 (child/teen/adult, 기본값: child)
- `--difficulty, -d`: 난이도 (easy/medium/hard, 기본값: easy)
- `--output-dir, -o`: 출력 디렉토리 (기본값: production_output)
- `--no-firebase`: Firebase Storage 업로드 비활성화
- `--extract-images`: 생성 후 이미지 추출

### 배치 제작 (batch_generator.py)

```bash
# 기본 사용법 (character_config.json 사용)
python3 batch_generator.py

# 설정 파일 지정
python3 batch_generator.py --config my_config.json --output-dir batch_output

# Firebase 업로드 없이 로컬만 생성
python3 batch_generator.py --no-firebase --extract-images
```

#### 설정 파일 (character_config.json)
```json
{
  "characters": [
    {
      "name": "도라에몽",
      "age_groups": ["child"],
      "difficulties": ["easy", "medium"],
      "count": 5
    },
    {
      "name": "하츄핑", 
      "age_groups": ["child"],
      "difficulties": ["easy", "medium", "hard"],
      "count": 3
    },
    {
      "name": "미키마우스",
      "age_groups": ["child", "teen"],
      "difficulties": ["easy"],
      "count": 4
    }
  ]
}
```

## 📁 출력 구조

```
production_output/
├── coloring_pages_도라에몽_20251019_123456.json
├── extracted_images/
│   ├── 도라에몽_page_01.png
│   ├── 도라에몽_page_02.png
│   └── ...
└── batch_results_20251019_123456.json
```

## 🎯 연령대별 난이도 가이드

### Child (3-12세)
- **easy**: 3-6세용, 매우 두꺼운 선(5-6px), 큰 색칠 영역
- **medium**: 6-8세용, 중간 두께 선(3-4px), 적당한 복잡도
- **hard**: 8-12세용, 세밀한 선(2-3px), 복잡한 패턴

### Teen (13-18세)
- **easy**: 13-15세용, 깔끔한 선(3-4px), 청소년 친화적
- **medium**: 16-18세용, 정교한 선(2-3px), 고급 세부사항
- **hard**: 18세용, 매우 세밀한 선(1-2px), 복잡한 디자인

### Adult (19세+)
- **easy**: 기본 성인용, 우아한 선(2-3px)
- **medium**: 중급 성인용, 정교한 패턴(1-2px)
- **hard**: 고급 성인용, 만다라 스타일(1px)

## 🔧 환경 설정

### 필수 환경변수 (.env)
```bash
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_PRIVATE_KEY="your_private_key"
FIREBASE_CLIENT_EMAIL=your_client_email
```

### 선택적 환경변수
```bash
GOOGLE_SEARCH_API_KEY=your_search_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id
```

## 📊 성능 최적화

- **API 호출 간격**: 2초 (rate limiting 방지)
- **이미지 해상도**: 1024x1024 (고품질)
- **파일 형식**: PNG (투명 배경 지원)
- **압축**: 최적화된 Base64 인코딩

## 🚨 주의사항

1. **API 키 관리**: 환경변수에 안전하게 저장
2. **Rate Limiting**: 대량 생성 시 API 제한 고려
3. **저장 공간**: Firebase Storage 용량 모니터링
4. **네트워크**: 안정적인 인터넷 연결 필요

## 🆘 문제 해결

### 일반적인 오류
- **GEMINI_API_KEY 없음**: .env 파일 확인
- **Firebase 연결 실패**: 서비스 계정 키 확인
- **이미지 생성 실패**: API 할당량 확인

### 로그 확인
```bash
# 상세 로그와 함께 실행
python3 production_generator.py 도라에몽 --count 1
```

## 📈 확장 가능성

- **다중 캐릭터**: 그룹 캐릭터 검색 지원
- **테마별**: 계절, 이벤트별 테마 추가
- **커스텀 프롬프트**: 사용자 정의 프롬프트 지원
- **배치 최적화**: 병렬 처리로 속도 향상
