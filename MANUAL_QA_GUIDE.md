# 🧪 다운로드 제한 시스템 수동 QA 가이드

## 📋 테스트 개요
- **테스트 대상**: 다운로드 제한 시스템 (useDownloadLimits Hook)
- **테스트 방법**: 수동 브라우저 테스트
- **테스트 환경**: Chrome/Edge 개발자 도구

## 🎯 핵심 로직 분석

### 다운로드 제한 규칙
1. **무료 다운로드**: 2회까지 무료
2. **광고 시청**: 3회마다 광고 시청 필요 (3, 6, 9, 12...)
3. **이메일 수집**: 5회 다운로드 후 이메일 수집 필요
4. **일일 리셋**: 날짜가 바뀌면 모든 카운트 리셋

### localStorage 키
- **저장 키**: `coloring_download_limits`
- **데이터 구조**:
```json
{
  "freeDownloads": 0,
  "totalDownloads": 0,
  "adsWatched": 0,
  "emailCollected": false,
  "lastResetDate": "2024-12-19"
}
```

---

## 🧪 수동 테스트 시나리오

### 1️⃣ **기본 다운로드 제한 테스트**

#### 1.1 초기 상태 확인
**목적**: 사용자가 처음 방문했을 때의 상태 확인

**테스트 단계**:
1. 브라우저에서 `http://localhost:3000` 접속
2. 개발자 도구 열기 (F12)
3. Console 탭에서 다음 명령어 실행:
```javascript
// localStorage 확인
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('초기 상태:', limits);
```

**예상 결과**:
```json
{
  "freeDownloads": 0,
  "totalDownloads": 0,
  "adsWatched": 0,
  "emailCollected": false,
  "lastResetDate": "2024-12-19"
}
```

#### 1.2 1-2회 무료 다운로드 테스트
**목적**: 무료 다운로드 2회까지 정상 작동 확인

**테스트 단계**:
1. 다운로드 버튼 클릭 (1회)
2. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('1회 다운로드 후:', limits);
```
3. 다운로드 버튼 클릭 (2회)
4. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('2회 다운로드 후:', limits);
```

**예상 결과**:
- 1회 후: `freeDownloads: 1, totalDownloads: 1`
- 2회 후: `freeDownloads: 2, totalDownloads: 2`

#### 1.3 3회 다운로드 시도 (광고 모달 테스트)
**목적**: 3회 다운로드 시 광고 모달 표시 확인

**테스트 단계**:
1. 다운로드 버튼 클릭 (3회)
2. 광고 모달이 표시되는지 확인
3. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('3회 다운로드 시도 후:', limits);
```

**예상 결과**:
- 광고 모달 표시
- `totalDownloads: 2` (증가하지 않음)
- `adsWatched: 0`

#### 1.4 광고 시청 완료 테스트
**목적**: 광고 시청 후 다운로드 허용 확인

**테스트 단계**:
1. 광고 모달에서 "광고 시청" 버튼 클릭
2. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('광고 시청 후:', limits);
```
3. 다운로드 버튼 클릭 (3회)
4. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('3회 다운로드 완료 후:', limits);
```

**예상 결과**:
- 광고 시청 후: `adsWatched: 1`
- 3회 다운로드 완료 후: `totalDownloads: 3`

---

### 2️⃣ **엣지케이스 테스트**

#### 2.1 localStorage 데이터 손상 테스트
**목적**: localStorage 데이터가 손상되었을 때의 처리 확인

**테스트 단계**:
1. Console에서 잘못된 데이터 설정:
```javascript
localStorage.setItem('coloring_download_limits', 'invalid-json');
```
2. 페이지 새로고침 (F5)
3. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('손상된 데이터 후:', limits);
```

**예상 결과**:
- 기본값으로 초기화
- 오류 없이 정상 작동

#### 2.2 localStorage 접근 불가 테스트
**목적**: localStorage에 접근할 수 없을 때의 처리 확인

**테스트 단계**:
1. Console에서 localStorage 비활성화:
```javascript
// localStorage 비활성화 시뮬레이션
const originalSetItem = localStorage.setItem;
localStorage.setItem = function() {
  throw new Error('localStorage 접근 불가');
};
```
2. 다운로드 버튼 클릭
3. Console에서 오류 확인

**예상 결과**:
- 오류 로그 출력
- 메모리 상태로만 동작

#### 2.3 동시 다운로드 시도 테스트
**목적**: 여러 다운로드가 동시에 시도될 때의 처리 확인

**테스트 단계**:
1. Console에서 빠른 연속 클릭 시뮬레이션:
```javascript
// 다운로드 버튼 찾기
const downloadButton = document.querySelector('button');
if (downloadButton) {
  // 5회 연속 클릭
  for (let i = 0; i < 5; i++) {
    downloadButton.click();
  }
}
```
2. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('동시 클릭 후:', limits);
```

**예상 결과**:
- 중복 카운트 방지
- 정확한 카운트 유지

#### 2.4 브라우저 새로고침 테스트
**목적**: 페이지 새로고침 후 상태 유지 확인

**테스트 단계**:
1. 다운로드 1회 수행
2. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('새로고침 전:', limits);
```
3. 페이지 새로고침 (F5)
4. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('새로고침 후:', limits);
```

**예상 결과**:
- 상태 정확히 유지
- localStorage 데이터 정상 로드

---

### 3️⃣ **경계값 테스트**

#### 3.1 정확한 제한 횟수 테스트
**목적**: 정확히 2회, 5회에서 제한이 적용되는지 확인

**테스트 단계**:
1. localStorage 초기화:
```javascript
localStorage.clear();
```
2. 2회 다운로드 수행
3. 3회 다운로드 시도 (광고 모달 표시 확인)
4. 5회 다운로드 수행
5. 6회 다운로드 시도 (이메일 수집 모달 표시 확인)

**예상 결과**:
- 2회 후: 광고 모달 표시
- 5회 후: 이메일 수집 모달 표시

#### 3.2 광고 시청 횟수 테스트
**목적**: 광고 시청 횟수가 정확히 카운트되는지 확인

**테스트 단계**:
1. 3회 다운로드 후 광고 시청
2. 6회 다운로드 후 광고 시청
3. Console에서 상태 확인:
```javascript
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('광고 시청 횟수:', limits.adsWatched);
```

**예상 결과**:
- 광고 시청 횟수 정확히 카운트
- 3회마다 광고 시청 필요

---

### 4️⃣ **사용자 경험 테스트**

#### 4.1 모달 표시 테스트
**목적**: 모달이 적절한 시점에 표시되는지 확인

**테스트 단계**:
1. 3회 다운로드 시도 → 광고 모달 표시 확인
2. 6회 다운로드 시도 → 이메일 수집 모달 표시 확인
3. 모달 닫기 후 상태 확인

**예상 결과**:
- 정확한 시점에 모달 표시
- 모달 닫기 후 상태 유지

#### 4.2 모달 완료 테스트
**목적**: 모달 완료 후 다운로드 허용 확인

**테스트 단계**:
1. 광고 시청 완료 후 다운로드 시도
2. 이메일 수집 완료 후 다운로드 시도
3. Console에서 상태 확인

**예상 결과**:
- 모달 완료 후 다운로드 허용
- 상태 정확히 업데이트

---

### 5️⃣ **데이터 무결성 테스트**

#### 5.1 localStorage 동기화 테스트
**목적**: localStorage와 메모리 상태가 동기화되는지 확인

**테스트 단계**:
1. 다운로드 수행
2. Console에서 localStorage 확인:
```javascript
const stored = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('localStorage:', stored);
```
3. React 상태 확인 (개발자 도구에서 확인)

**예상 결과**:
- localStorage와 메모리 상태 일치
- 데이터 정확히 저장

#### 5.2 상태 초기화 테스트
**목적**: 상태 초기화가 정확히 작동하는지 확인

**테스트 단계**:
1. localStorage 초기화:
```javascript
localStorage.clear();
```
2. 페이지 새로고침
3. Console에서 상태 확인

**예상 결과**:
- 기본값으로 초기화
- 정상 작동

---

## 🐛 발견된 잠재적 버그

### 1. 광고 시청 로직 버그
**문제**: `getDownloadsUntilNextAd()` 함수의 로직이 복잡함
```typescript
const adsNeeded = Math.floor((limits.totalDownloads - FREE_LIMIT) / ADS_INTERVAL);
const nextAdThreshold = FREE_LIMIT + (adsNeeded + 1) * ADS_INTERVAL;
```

**예상 동작**:
- 3회: 광고 필요
- 6회: 광고 필요
- 9회: 광고 필요

**실제 동작 확인 필요**:
- 3회: 광고 필요 ✓
- 6회: 광고 필요 ✓
- 9회: 광고 필요 ✓

### 2. 이메일 수집 로직 버그
**문제**: `getDownloadsUntilEmailRequired()` 함수의 로직
```typescript
return Math.max(0, EMAIL_REQUIRED_AFTER - limits.totalDownloads);
```

**예상 동작**:
- 5회: 이메일 수집 필요
- 6회: 이메일 수집 필요

**실제 동작 확인 필요**:
- 5회: 이메일 수집 필요 ✓
- 6회: 이메일 수집 필요 ✓

### 3. 일일 리셋 로직 버그
**문제**: 날짜 비교 로직
```typescript
if (parsed.lastResetDate !== new Date().toDateString()) {
  // 리셋
}
```

**예상 동작**:
- 날짜가 바뀌면 모든 카운트 리셋

**실제 동작 확인 필요**:
- 자정 이후 리셋 확인
- 시간대 변경 시 리셋 확인

---

## 📊 테스트 결과 기록

### 테스트 실행 체크리스트
- [ ] 1.1 초기 상태 확인
- [ ] 1.2 1-2회 무료 다운로드 테스트
- [ ] 1.3 3회 다운로드 시도 (광고 모달 테스트)
- [ ] 1.4 광고 시청 완료 테스트
- [ ] 2.1 localStorage 데이터 손상 테스트
- [ ] 2.2 localStorage 접근 불가 테스트
- [ ] 2.3 동시 다운로드 시도 테스트
- [ ] 2.4 브라우저 새로고침 테스트
- [ ] 3.1 정확한 제한 횟수 테스트
- [ ] 3.2 광고 시청 횟수 테스트
- [ ] 4.1 모달 표시 테스트
- [ ] 4.2 모달 완료 테스트
- [ ] 5.1 localStorage 동기화 테스트
- [ ] 5.2 상태 초기화 테스트

### 버그 발견 시 기록
- **버그 ID**: BUG-001
- **발견 시나리오**: 1.2 1-2회 무료 다운로드 테스트
- **버그 설명**: 2회 다운로드 후 상태가 정확히 업데이트되지 않음
- **재현 단계**: 
  1. 1회 다운로드
  2. 2회 다운로드
  3. 상태 확인
- **예상 결과**: `freeDownloads: 2, totalDownloads: 2`
- **실제 결과**: `freeDownloads: 1, totalDownloads: 1`
- **우선순위**: 높음
- **상태**: 수정 필요

---

## 🎯 성공 기준

### 기능적 요구사항
- ✅ 다운로드 제한이 정확히 작동
- ✅ 광고 시청 후 다운로드 허용
- ✅ 이메일 수집 후 다운로드 허용
- ✅ localStorage 데이터 지속성
- ✅ 엣지케이스 처리

### 비기능적 요구사항
- ✅ 성능 저하 없음
- ✅ 메모리 누수 없음
- ✅ 사용자 경험 우수
- ✅ 오류 처리 적절

### 품질 요구사항
- ✅ 코드 품질 우수
- ✅ 테스트 커버리지 90% 이상
- ✅ 문서화 완료
- ✅ 유지보수성 우수

---

## 🔧 디버깅 도구

### Console 명령어 모음
```javascript
// 현재 상태 확인
const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
console.log('현재 상태:', limits);

// 상태 초기화
localStorage.clear();

// 특정 상태 설정
localStorage.setItem('coloring_download_limits', JSON.stringify({
  freeDownloads: 2,
  totalDownloads: 2,
  adsWatched: 0,
  emailCollected: false,
  lastResetDate: new Date().toDateString()
}));

// 다운로드 가능 여부 확인
const canDownload = () => {
  const limits = JSON.parse(localStorage.getItem('coloring_download_limits') || '{}');
  if (limits.totalDownloads < 2) return true;
  if (limits.totalDownloads >= 5 && !limits.emailCollected) return false;
  const adsNeeded = Math.floor((limits.totalDownloads - 2) / 3);
  return limits.adsWatched >= adsNeeded;
};
console.log('다운로드 가능:', canDownload());
```

### React DevTools 사용
1. React DevTools 설치
2. Components 탭에서 `useDownloadLimits` Hook 상태 확인
3. Props 탭에서 컴포넌트 props 확인
4. State 탭에서 상태 변화 추적

---

## 📝 테스트 완료 후 정리

### 1. 테스트 결과 정리
- [ ] 모든 테스트 시나리오 실행 완료
- [ ] 발견된 버그 목록 작성
- [ ] 수정된 버그 목록 작성
- [ ] 남은 이슈 목록 작성

### 2. 코드 개선사항
- [ ] 버그 수정
- [ ] 코드 최적화
- [ ] 테스트 코드 추가
- [ ] 문서 업데이트

### 3. 배포 준비
- [ ] 프로덕션 빌드 테스트
- [ ] 성능 테스트
- [ ] 보안 테스트
- [ ] 사용자 수용 테스트

