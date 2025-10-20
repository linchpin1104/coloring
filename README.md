# 🎨 Coloring Platform

AI 기반 색칠놀이 도안 생성 플랫폼

## 🚀 빠른 시작

### 방법 1: 통합 서버 (권장 - 가장 간단)

프론트엔드와 백엔드를 **하나의 서버**에서 실행합니다.

```bash
# 1. 프론트엔드 빌드
cd frontend
npm run build

# 2. 통합 서버 실행
cd ../backend
npm run simple
```

이제 **http://localhost:3001** 로 접속하세요!

### 방법 2: 개발 모드 (개발할 때)

프론트엔드와 백엔드를 **별도로** 실행합니다 (HMR 지원).

```bash
# 터미널 1 - 프론트엔드
cd frontend
npm run dev

# 터미널 2 - 백엔드 (간단 버전)
cd backend
npm run simple
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:3001

### 방법 3: 루트에서 한 번에 실행

```bash
# 루트 디렉토리에서
npm install concurrently
npm run dev
```

## 📁 프로젝트 구조

```
coloring/
├── frontend/          # React + Vite 프론트엔드
│   ├── src/
│   └── dist/         # 빌드 결과물
├── backend/          # Express 백엔드
│   ├── src/
│   │   ├── index.ts       # 전체 기능 서버 (TypeScript 에러 있음)
│   │   └── simple-api.ts  # 간단한 통합 서버 (Mock 데이터)
│   └── dist/
├── functions/        # Firebase Functions
└── scripts/         # 유틸리티 스크립트
```

## 🛠️ 사용 가능한 명령어

### 루트 디렉토리
```bash
npm run dev          # 프론트엔드 + 백엔드 동시 실행
npm run build        # 프론트엔드 빌드
npm run start        # 통합 서버 실행
npm run prod         # 빌드 + 실행
```

### Backend
```bash
npm run simple       # 간단한 통합 서버 (Mock 데이터)
npm run dev          # 전체 기능 서버 (현재 TypeScript 에러)
npm run build        # TypeScript 컴파일
```

### Frontend
```bash
npm run dev          # 개발 서버 (HMR)
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 미리보기
```

## 🎯 현재 상태

### ✅ 작동하는 것
- 프론트엔드 UI (React + Vite)
- Mock 데이터로 색칠놀이 도안 표시
- 통합 서버 (simple-api.ts)
- Firebase 없이도 작동

### ⚠️ 작업 필요
- TypeScript 컴파일 에러 수정 (index.ts)
- Firebase 설정 (.env 파일)
- 실제 이미지 생성 API 연동

## 🔧 환경 설정

### Firebase (선택사항)

프론트엔드에 `.env` 파일 생성:

```bash
# frontend/.env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 📦 의존성 설치

```bash
# 전체 프로젝트
npm install

# 프론트엔드
cd frontend && npm install

# 백엔드
cd backend && npm install

# Functions (선택)
cd functions && npm install
```

## 🌐 배포

### Vercel / Netlify (프론트엔드만)
```bash
cd frontend
npm run build
# dist 폴더를 배포
```

### Heroku / Railway (통합 서버)
```bash
# 프론트엔드 빌드
cd frontend && npm run build

# 백엔드 시작
cd ../backend && npm run simple
```

## 📝 라이선스

MIT

## 👥 팀

Coloring Platform Development Team

