#!/usr/bin/env node

/**
 * 수정된 이메일 수집 시스템 QA 테스트 스크립트
 * 
 * 수정사항:
 * - 연속된 점(.) 체크 추가
 * - HTML 태그 체크 추가
 * - XSS 시도 체크 추가
 * - IDN 도메인 체크 추가
 * - 길이 제한 추가
 * - 이메일 정규화 추가
 */

const fs = require('fs');
const path = require('path');

// 테스트 결과 저장
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  bugs: [],
  startTime: new Date(),
  endTime: null,
};

// 수정된 이메일 유효성 검증 함수
function validateEmail(email) {
  // 기본 이메일 정규식
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // 길이 제한 (RFC 5321: 320자)
  if (email.length > 320) {
    return false;
  }
  
  // 연속된 점(.) 체크
  if (email.includes('..')) {
    return false;
  }
  
  // HTML 태그 체크
  if (/<[^>]*>/.test(email)) {
    return false;
  }
  
  // XSS 시도 체크
  if (/javascript:|data:|vbscript:/i.test(email)) {
    return false;
  }
  
  // IDN 도메인 체크 (현재 미지원)
  if (/[^\x00-\x7F]/.test(email.split('@')[1] || '')) {
    return false;
  }
  
  return emailRegex.test(email);
}

// 이메일 정규화 함수
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

// 테스트 케이스 실행 함수
function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 테스트 실행: ${testName}`);
  
  try {
    const result = testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`✅ 통과: ${testName}`);
      if (result.message) {
        console.log(`   📝 ${result.message}`);
      }
    } else {
      testResults.failed++;
      testResults.bugs.push({
        test: testName,
        bug: result.bug,
        expected: result.expected,
        actual: result.actual,
        severity: result.severity || 'medium'
      });
      console.log(`❌ 실패: ${testName}`);
      console.log(`   🐛 버그: ${result.bug}`);
      console.log(`   📊 예상: ${result.expected}`);
      console.log(`   📊 실제: ${result.actual}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.bugs.push({
      test: testName,
      bug: `테스트 실행 중 오류: ${error.message}`,
      expected: '정상 실행',
      actual: `오류 발생: ${error.message}`,
      severity: 'high'
    });
    console.log(`💥 오류: ${testName} - ${error.message}`);
  }
}

// 1. 이메일 유효성 검증 테스트
function testEmailValidation() {
  console.log('\n📧 이메일 유효성 검증 테스트');
  
  // 유효한 이메일 테스트
  runTest('TC-EMAIL-005: 유효한 이메일 주소', () => {
    const validEmails = [
      'user@example.com',
      'test.email@domain.co.kr',
      'user+tag@example.org',
      'user.name@sub.domain.com',
      '123@456.789'
    ];
    
    for (const email of validEmails) {
      if (!validateEmail(email)) {
        return {
          success: false,
          bug: `유효한 이메일이 거부됨: ${email}`,
          expected: 'true',
          actual: 'false'
        };
      }
    }
    
    return { success: true, message: '모든 유효한 이메일이 정상 처리됨' };
  });
  
  // 잘못된 이메일 테스트
  runTest('TC-EMAIL-006: 잘못된 이메일 형식', () => {
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'user@',
      'user@.com',
      'user..name@example.com', // 연속된 점
      'user@example..com', // 연속된 점
      'user@example',
      'user name@example.com'
    ];
    
    for (const email of invalidEmails) {
      if (validateEmail(email)) {
        return {
          success: false,
          bug: `잘못된 이메일이 통과됨: ${email}`,
          expected: 'false',
          actual: 'true'
        };
      }
    }
    
    return { success: true, message: '모든 잘못된 이메일이 정상 거부됨' };
  });
  
  // 빈 이메일 테스트
  runTest('TC-EMAIL-007: 빈 이메일 주소', () => {
    const emptyEmails = ['', '   ', '\t', '\n'];
    
    for (const email of emptyEmails) {
      if (validateEmail(email)) {
        return {
          success: false,
          bug: `빈 이메일이 통과됨: "${email}"`,
          expected: 'false',
          actual: 'true'
        };
      }
    }
    
    return { success: true, message: '모든 빈 이메일이 정상 거부됨' };
  });
  
  // 특수문자 이메일 테스트
  runTest('TC-EMAIL-008: 특수문자 이메일', () => {
    const specialEmails = [
      'user+tag@example.com',
      'user.name@example.com',
      'user_name@example.com',
      'user-name@example.com',
      'user123@example.com'
    ];
    
    for (const email of specialEmails) {
      if (!validateEmail(email)) {
        return {
          success: false,
          bug: `특수문자 이메일이 거부됨: ${email}`,
          expected: 'true',
          actual: 'false'
        };
      }
    }
    
    return { success: true, message: '모든 특수문자 이메일이 정상 처리됨' };
  });
  
  // 국제화 도메인 이메일 테스트
  runTest('TC-EMAIL-009: 국제화 도메인 이메일', () => {
    const idnEmails = [
      'user@한국.com',
      'user@中国.com',
      'user@日本.jp',
      'user@россия.ru'
    ];
    
    for (const email of idnEmails) {
      if (validateEmail(email)) {
        return {
          success: false,
          bug: `IDN 이메일이 통과됨 (현재 미지원): ${email}`,
          expected: 'false (미지원)',
          actual: 'true'
        };
      }
    }
    
    return { success: true, message: 'IDN 이메일이 정상적으로 거부됨 (현재 미지원)' };
  });
  
  // 긴 이메일 테스트
  runTest('TC-EMAIL-010: 긴 이메일 주소', () => {
    const longEmail = 'a'.repeat(300) + '@example.com';
    
    if (validateEmail(longEmail)) {
      return {
        success: false,
        bug: `긴 이메일이 통과됨: ${longEmail.length}자`,
        expected: 'false (길이 제한)',
        actual: 'true'
      };
    }
    
    return { success: true, message: '긴 이메일이 정상적으로 거부됨' };
  });
}

// 2. 이메일 정규화 테스트
function testEmailNormalization() {
  console.log('\n🔧 이메일 정규화 테스트');
  
  runTest('TC-EMAIL-027: 공백 포함 이메일 정규화', () => {
    const emailWithSpaces = '  user@example.com  ';
    const normalized = normalizeEmail(emailWithSpaces);
    
    if (normalized !== 'user@example.com') {
      return {
        success: false,
        bug: '공백 제거 실패',
        expected: 'user@example.com',
        actual: normalized
      };
    }
    
    return { success: true, message: '공백이 정상적으로 제거됨' };
  });
  
  runTest('TC-EMAIL-028: 대소문자 정규화', () => {
    const mixedCaseEmail = 'USER@EXAMPLE.COM';
    const normalized = normalizeEmail(mixedCaseEmail);
    
    if (normalized !== 'user@example.com') {
      return {
        success: false,
        bug: '소문자 변환 실패',
        expected: 'user@example.com',
        actual: normalized
      };
    }
    
    return { success: true, message: '대소문자가 정상적으로 변환됨' };
  });
}

// 3. 보안 테스트
function testSecurity() {
  console.log('\n🔒 보안 테스트');
  
  runTest('TC-EMAIL-030: HTML 태그 포함 이메일', () => {
    const maliciousEmails = [
      '<script>alert("xss")</script>@example.com',
      '<img src="x" onerror="alert(1)">@example.com',
      '<svg onload="alert(1)">@example.com'
    ];
    
    for (const email of maliciousEmails) {
      if (validateEmail(email)) {
        return {
          success: false,
          bug: `HTML 태그 포함 이메일이 통과됨: ${email}`,
          expected: 'false (보안 위험)',
          actual: 'true',
          severity: 'high'
        };
      }
    }
    
    return { success: true, message: 'HTML 태그 포함 이메일이 정상적으로 거부됨' };
  });
  
  runTest('TC-EMAIL-031: SQL 인젝션 시도', () => {
    const sqlInjectionEmails = [
      "'; DROP TABLE users; --@example.com",
      "' OR '1'='1'@example.com",
      "admin'--@example.com"
    ];
    
    for (const email of sqlInjectionEmails) {
      if (validateEmail(email)) {
        return {
          success: false,
          bug: `SQL 인젝션 시도가 통과됨: ${email}`,
          expected: 'false (보안 위험)',
          actual: 'true',
          severity: 'high'
        };
      }
    }
    
    return { success: true, message: 'SQL 인젝션 시도가 정상적으로 거부됨' };
  });
  
  runTest('TC-EMAIL-032: XSS 시도', () => {
    const xssEmails = [
      "javascript:alert('xss')@example.com",
      "data:text/html,<script>alert(1)</script>@example.com",
      "vbscript:msgbox('xss')@example.com"
    ];
    
    for (const email of xssEmails) {
      if (validateEmail(email)) {
        return {
          success: false,
          bug: `XSS 시도가 통과됨: ${email}`,
          expected: 'false (보안 위험)',
          actual: 'true',
          severity: 'high'
        };
      }
    }
    
    return { success: true, message: 'XSS 시도가 정상적으로 거부됨' };
  });
}

// 4. 엣지케이스 테스트
function testEdgeCases() {
  console.log('\n⚠️ 엣지케이스 테스트');
  
  runTest('TC-EMAIL-027: 공백 포함 이메일', () => {
    const emailWithSpaces = '  user@example.com  ';
    const isValid = validateEmail(emailWithSpaces);
    
    if (isValid) {
      return {
        success: false,
        bug: '공백 포함 이메일이 통과됨',
        expected: 'false (정규화 필요)',
        actual: 'true'
      };
    }
    
    return { success: true, message: '공백 포함 이메일이 정상적으로 거부됨' };
  });
  
  runTest('TC-EMAIL-028: 탭 문자 포함 이메일', () => {
    const emailWithTabs = '\tuser@example.com\t';
    const isValid = validateEmail(emailWithTabs);
    
    if (isValid) {
      return {
        success: false,
        bug: '탭 문자 포함 이메일이 통과됨',
        expected: 'false (정규화 필요)',
        actual: 'true'
      };
    }
    
    return { success: true, message: '탭 문자 포함 이메일이 정상적으로 거부됨' };
  });
  
  runTest('TC-EMAIL-029: 줄바꿈 문자 포함 이메일', () => {
    const emailWithNewlines = 'user@example.com\n';
    const isValid = validateEmail(emailWithNewlines);
    
    if (isValid) {
      return {
        success: false,
        bug: '줄바꿈 문자 포함 이메일이 통과됨',
        expected: 'false (정규화 필요)',
        actual: 'true'
      };
    }
    
    return { success: true, message: '줄바꿈 문자 포함 이메일이 정상적으로 거부됨' };
  });
  
  runTest('TC-EMAIL-015: 매우 긴 이름', () => {
    const longName = 'a'.repeat(150);
    const email = `${longName}@example.com`;
    const isValid = validateEmail(email);
    
    if (isValid) {
      return {
        success: false,
        bug: '매우 긴 이름 이메일이 통과됨',
        expected: 'false (길이 제한)',
        actual: 'true'
      };
    }
    
    return { success: true, message: '매우 긴 이름 이메일이 정상적으로 거부됨' };
  });
}

// 5. 성능 테스트
function testPerformance() {
  console.log('\n⚡ 성능 테스트');
  
  runTest('TC-EMAIL-047: 이메일 검증 성능', () => {
    const testEmails = Array.from({ length: 1000 }, (_, i) => `user${i}@example.com`);
    const startTime = Date.now();
    
    for (const email of testEmails) {
      validateEmail(email);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / testEmails.length;
    
    if (avgTime > 0.1) { // 0.1ms 이상이면 성능 문제
      return {
        success: false,
        bug: `이메일 검증 성능 저하: 평균 ${avgTime.toFixed(3)}ms`,
        expected: '< 0.1ms',
        actual: `${avgTime.toFixed(3)}ms`
      };
    }
    
    return { 
      success: true, 
      message: `이메일 검증 성능 우수: 평균 ${avgTime.toFixed(3)}ms (1000회 테스트)` 
    };
  });
}

// 6. 다운로드 제한 연동 테스트
function testDownloadLimitsIntegration() {
  console.log('\n📊 다운로드 제한 연동 테스트');
  
  // 다운로드 제한 로직 시뮬레이션
  function simulateDownloadLimits(totalDownloads, emailCollected) {
    const FREE_LIMIT = 2;
    const EMAIL_REQUIRED_AFTER = 5;
    
    if (totalDownloads < FREE_LIMIT) {
      return 'free_download';
    }
    
    if (totalDownloads >= EMAIL_REQUIRED_AFTER && !emailCollected) {
      return 'email_required';
    }
    
    return 'paid_download';
  }
  
  runTest('TC-EMAIL-001: 다운로드 5회 후 이메일 수집 모달 표시', () => {
    const result = simulateDownloadLimits(5, false);
    
    if (result !== 'email_required') {
      return {
        success: false,
        bug: '다운로드 5회 후 이메일 수집 요구 실패',
        expected: 'email_required',
        actual: result
      };
    }
    
    return { success: true, message: '다운로드 5회 후 이메일 수집이 정상 요구됨' };
  });
  
  runTest('TC-EMAIL-001-2: 다운로드 4회 후 이메일 수집 모달 미표시', () => {
    const result = simulateDownloadLimits(4, false);
    
    if (result !== 'paid_download') {
      return {
        success: false,
        bug: '다운로드 4회 후 이메일 수집 요구됨',
        expected: 'paid_download',
        actual: result
      };
    }
    
    return { success: true, message: '다운로드 4회 후 이메일 수집이 요구되지 않음' };
  });
  
  runTest('TC-EMAIL-001-3: 이메일 수집 후 다운로드 허용', () => {
    const result = simulateDownloadLimits(5, true);
    
    if (result !== 'paid_download') {
      return {
        success: false,
        bug: '이메일 수집 후 다운로드 허용 실패',
        expected: 'paid_download',
        actual: result
      };
    }
    
    return { success: true, message: '이메일 수집 후 다운로드가 정상 허용됨' };
  });
}

// 메인 테스트 실행
function runAllTests() {
  console.log('🚀 수정된 이메일 수집 시스템 QA 테스트 시작');
  console.log('=' * 50);
  
  testEmailValidation();
  testEmailNormalization();
  testSecurity();
  testEdgeCases();
  testPerformance();
  testDownloadLimitsIntegration();
  
  testResults.endTime = new Date();
  
  // 결과 출력
  console.log('\n' + '=' * 50);
  console.log('📊 테스트 결과 요약');
  console.log('=' * 50);
  console.log(`총 테스트: ${testResults.total}`);
  console.log(`통과: ${testResults.passed} ✅`);
  console.log(`실패: ${testResults.failed} ❌`);
  console.log(`성공률: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`소요 시간: ${testResults.endTime - testResults.startTime}ms`);
  
  if (testResults.bugs.length > 0) {
    console.log('\n🐛 발견된 버그:');
    testResults.bugs.forEach((bug, index) => {
      console.log(`${index + 1}. ${bug.test}`);
      console.log(`   버그: ${bug.bug}`);
      console.log(`   예상: ${bug.expected}`);
      console.log(`   실제: ${bug.actual}`);
      console.log(`   심각도: ${bug.severity}`);
      console.log('');
    });
  } else {
    console.log('\n🎉 모든 테스트가 통과했습니다!');
  }
  
  // 결과를 파일로 저장
  const resultFile = path.join(__dirname, 'fixed_email_collection_test_results.json');
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  console.log(`📁 상세 결과가 ${resultFile}에 저장되었습니다.`);
  
  return testResults;
}

// 스크립트 실행
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };

