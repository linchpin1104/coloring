#!/usr/bin/env node

/**
 * 프론트엔드-백엔드 통합 테스트 스크립트
 * 
 * 테스트 범위:
 * - 프론트엔드 서버 실행
 * - 백엔드 API 연동
 * - 전체 시스템 통합 테스트
 * - 사용자 시나리오 테스트
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001/api';

// 테스트 결과 저장
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  startTime: new Date(),
  endTime: null,
  frontendProcess: null,
  backendProcess: null,
};

// 테스트 케이스 실행 함수
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 테스트 실행: ${testName}`);
  
  try {
    const result = await testFunction();
    if (result.success) {
      testResults.passed++;
      console.log(`✅ 통과: ${testName}`);
      if (result.message) {
        console.log(`   📝 ${result.message}`);
      }
    } else {
      testResults.failed++;
      testResults.errors.push({
        test: testName,
        error: result.error,
        expected: result.expected,
        actual: result.actual,
      });
      console.log(`❌ 실패: ${testName}`);
      console.log(`   🐛 오류: ${result.error}`);
      console.log(`   📊 예상: ${result.expected}`);
      console.log(`   📊 실제: ${result.actual}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({
      test: testName,
      error: `테스트 실행 중 오류: ${error.message}`,
      expected: '정상 실행',
      actual: `오류 발생: ${error.message}`,
    });
    console.log(`💥 오류: ${testName} - ${error.message}`);
  }
}

// 서버 상태 확인 함수
async function checkServerHealth(url, name) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.log(`   ⚠️ ${name} 서버 응답 없음: ${error.message}`);
    return false;
  }
}

// 1. 서버 실행 및 상태 확인
async function testServerStartup() {
  console.log('\n🚀 서버 실행 및 상태 확인');
  
  await runTest('TC-INT-001: 백엔드 서버 상태 확인', async () => {
    const isHealthy = await checkServerHealth(`${BACKEND_URL}/health`, '백엔드');
    
    if (!isHealthy) {
      return {
        success: false,
        error: '백엔드 서버가 실행되지 않음',
        expected: '서버 실행됨',
        actual: '서버 응답 없음',
      };
    }
    
    return {
      success: true,
      message: '백엔드 서버가 정상 실행됨',
    };
  });
  
  await runTest('TC-INT-002: 프론트엔드 서버 상태 확인', async () => {
    const isHealthy = await checkServerHealth(FRONTEND_URL, '프론트엔드');
    
    if (!isHealthy) {
      return {
        success: false,
        error: '프론트엔드 서버가 실행되지 않음',
        expected: '서버 실행됨',
        actual: '서버 응답 없음',
      };
    }
    
    return {
      success: true,
      message: '프론트엔드 서버가 정상 실행됨',
    };
  });
}

// 2. API 연동 테스트
async function testAPIIntegration() {
  console.log('\n🔗 API 연동 테스트');
  
  await runTest('TC-INT-003: 색칠공부 도안 API 연동', async () => {
    const response = await axios.get(`${BACKEND_URL}/coloring-pages`);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '색칠공부 도안 API 연동 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '색칠공부 도안 API 응답 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    return {
      success: true,
      message: `색칠공부 도안 API 연동 성공: ${response.data.data.length}개 도안`,
    };
  });
  
  await runTest('TC-INT-004: 뉴스레터 구독 API 연동', async () => {
    const subscriptionData = {
      email: 'integration@example.com',
      language: 'ko',
      source: 'integration-test',
    };
    
    const response = await axios.post(`${BACKEND_URL}/newsletter/subscribe`, subscriptionData);
    
    if (response.status !== 201) {
      return {
        success: false,
        error: '뉴스레터 구독 API 연동 실패',
        expected: '201',
        actual: response.status.toString(),
      };
    }
    
    return {
      success: true,
      message: '뉴스레터 구독 API 연동 성공',
    };
  });
  
  await runTest('TC-INT-005: 다국어 검색 API 연동', async () => {
    const searchData = {
      query: '미키마우스',
      searchTerms: ['Mickey Mouse', 'ミッキーマウス'],
      filters: {},
      page: 1,
      limit: 10,
    };
    
    const response = await axios.post(`${BACKEND_URL}/search/multilingual`, searchData);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '다국어 검색 API 연동 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    return {
      success: true,
      message: '다국어 검색 API 연동 성공',
    };
  });
}

// 3. 사용자 시나리오 테스트
async function testUserScenarios() {
  console.log('\n👤 사용자 시나리오 테스트');
  
  await runTest('TC-INT-006: 사용자 등록 시나리오', async () => {
    const userData = {
      email: 'scenario@example.com',
      name: '시나리오 사용자',
      ageGroup: 'child',
      preferences: {
        favoriteCharacters: ['도라에몽', '미키마우스'],
        difficultyPreference: 'easy',
      },
    };
    
    const response = await axios.post(`${BACKEND_URL}/users`, userData);
    
    if (response.status !== 201) {
      return {
        success: false,
        error: '사용자 등록 시나리오 실패',
        expected: '201',
        actual: response.status.toString(),
      };
    }
    
    return {
      success: true,
      message: '사용자 등록 시나리오 성공',
    };
  });
  
  await runTest('TC-INT-007: 색칠공부 도안 다운로드 시나리오', async () => {
    // 1. 도안 목록 조회
    const listResponse = await axios.get(`${BACKEND_URL}/coloring-pages`);
    
    if (listResponse.status !== 200 || !listResponse.data.success) {
      return {
        success: false,
        error: '도안 목록 조회 실패',
        expected: '성공',
        actual: '실패',
      };
    }
    
    const pages = listResponse.data.data;
    if (pages.length === 0) {
      return {
        success: false,
        error: '도안이 없음',
        expected: '도안 존재',
        actual: '도안 없음',
      };
    }
    
    // 2. 첫 번째 도안 다운로드
    const downloadResponse = await axios.post(`${BACKEND_URL}/coloring-pages/${pages[0].id}/download`);
    
    if (downloadResponse.status !== 200) {
      return {
        success: false,
        error: '도안 다운로드 실패',
        expected: '200',
        actual: downloadResponse.status.toString(),
      };
    }
    
    return {
      success: true,
      message: `색칠공부 도안 다운로드 시나리오 성공: ${downloadResponse.data.filename}`,
    };
  });
  
  await runTest('TC-INT-008: 뉴스레터 구독 시나리오', async () => {
    // 1. 구독
    const subscribeData = {
      email: 'scenario-newsletter@example.com',
      language: 'ko',
      source: 'scenario-test',
    };
    
    const subscribeResponse = await axios.post(`${BACKEND_URL}/newsletter/subscribe`, subscribeData);
    
    if (subscribeResponse.status !== 201) {
      return {
        success: false,
        error: '뉴스레터 구독 실패',
        expected: '201',
        actual: subscribeResponse.status.toString(),
      };
    }
    
    // 2. 구독 해지
    const unsubscribeData = {
      email: 'scenario-newsletter@example.com',
    };
    
    const unsubscribeResponse = await axios.post(`${BACKEND_URL}/newsletter/unsubscribe`, unsubscribeData);
    
    if (unsubscribeResponse.status !== 200) {
      return {
        success: false,
        error: '뉴스레터 구독 해지 실패',
        expected: '200',
        actual: unsubscribeResponse.status.toString(),
      };
    }
    
    return {
      success: true,
      message: '뉴스레터 구독 시나리오 성공',
    };
  });
}

// 4. 성능 테스트
async function testPerformance() {
  console.log('\n⚡ 성능 테스트');
  
  await runTest('TC-INT-009: API 응답 시간 테스트', async () => {
    const startTime = Date.now();
    
    const promises = [
      axios.get(`${BACKEND_URL}/health`),
      axios.get(`${BACKEND_URL}/coloring-pages`),
      axios.get(`${BACKEND_URL}/stats`),
    ];
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 1000) { // 1초 이상이면 성능 문제
      return {
        success: false,
        error: 'API 응답 시간이 너무 김',
        expected: '< 1000ms',
        actual: `${duration}ms`,
      };
    }
    
    return {
      success: true,
      message: `API 응답 시간 우수: ${duration}ms`,
    };
  });
  
  await runTest('TC-INT-010: 동시 요청 테스트', async () => {
    const concurrentRequests = 10;
    const startTime = Date.now();
    
    const promises = Array.from({ length: concurrentRequests }, () =>
      axios.get(`${BACKEND_URL}/coloring-pages`)
    );
    
    const responses = await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = responses.filter(response => response.status === 200).length;
    
    if (successCount !== concurrentRequests) {
      return {
        success: false,
        error: '동시 요청 처리 실패',
        expected: `${concurrentRequests}개 성공`,
        actual: `${successCount}개 성공`,
      };
    }
    
    return {
      success: true,
      message: `동시 요청 테스트 성공: ${concurrentRequests}개 요청, ${duration}ms`,
    };
  });
}

// 5. 오류 처리 테스트
async function testErrorHandling() {
  console.log('\n⚠️ 오류 처리 테스트');
  
  await runTest('TC-INT-011: 잘못된 API 요청 처리', async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/newsletter/subscribe`, {
        email: 'invalid-email',
      });
      
      if (response.status === 400) {
        return {
          success: true,
          message: '잘못된 API 요청이 정상적으로 처리됨',
        };
      } else {
        return {
          success: false,
          error: '잘못된 API 요청이 처리되지 않음',
          expected: '400',
          actual: response.status.toString(),
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return {
          success: true,
          message: '잘못된 API 요청이 정상적으로 처리됨',
        };
      } else {
        throw error;
      }
    }
  });
  
  await runTest('TC-INT-012: 존재하지 않는 리소스 처리', async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/coloring-pages/nonexistent`);
      
      if (response.status === 404) {
        return {
          success: true,
          message: '존재하지 않는 리소스가 정상적으로 처리됨',
        };
      } else {
        return {
          success: false,
          error: '존재하지 않는 리소스가 처리되지 않음',
          expected: '404',
          actual: response.status.toString(),
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: true,
          message: '존재하지 않는 리소스가 정상적으로 처리됨',
        };
      } else {
        throw error;
      }
    }
  });
}

// 6. 데이터 일관성 테스트
async function testDataConsistency() {
  console.log('\n📊 데이터 일관성 테스트');
  
  await runTest('TC-INT-013: 통계 데이터 일관성', async () => {
    const statsResponse = await axios.get(`${BACKEND_URL}/stats`);
    
    if (statsResponse.status !== 200) {
      return {
        success: false,
        error: '통계 조회 실패',
        expected: '200',
        actual: statsResponse.status.toString(),
      };
    }
    
    const stats = statsResponse.data.data;
    
    // 도안 수 확인
    const pagesResponse = await axios.get(`${BACKEND_URL}/coloring-pages`);
    const actualPageCount = pagesResponse.data.data.length;
    
    if (stats.totalColoringPages !== actualPageCount) {
      return {
        success: false,
        error: '도안 수 불일치',
        expected: actualPageCount,
        actual: stats.totalColoringPages,
      };
    }
    
    return {
      success: true,
      message: '통계 데이터 일관성 확인됨',
    };
  });
  
  await runTest('TC-INT-014: 다운로드 수 증가 확인', async () => {
    // 1. 초기 다운로드 수 확인
    const initialResponse = await axios.get(`${BACKEND_URL}/coloring-pages/page_1`);
    const initialDownloads = initialResponse.data.data.downloadCount;
    
    // 2. 다운로드 실행
    await axios.post(`${BACKEND_URL}/coloring-pages/page_1/download`);
    
    // 3. 다운로드 수 증가 확인
    const afterResponse = await axios.get(`${BACKEND_URL}/coloring-pages/page_1`);
    const afterDownloads = afterResponse.data.data.downloadCount;
    
    if (afterDownloads !== initialDownloads + 1) {
      return {
        success: false,
        error: '다운로드 수가 증가하지 않음',
        expected: initialDownloads + 1,
        actual: afterDownloads,
      };
    }
    
    return {
      success: true,
      message: '다운로드 수 증가가 정상적으로 반영됨',
    };
  });
}

// 메인 테스트 실행
async function runAllTests() {
  console.log('🚀 프론트엔드-백엔드 통합 테스트 시작');
  console.log('=' * 50);
  
  await testServerStartup();
  await testAPIIntegration();
  await testUserScenarios();
  await testPerformance();
  await testErrorHandling();
  await testDataConsistency();
  
  testResults.endTime = new Date();
  
  // 결과 출력
  console.log('\n' + '=' * 50);
  console.log('📊 통합 테스트 결과 요약');
  console.log('=' * 50);
  console.log(`총 테스트: ${testResults.total}`);
  console.log(`통과: ${testResults.passed} ✅`);
  console.log(`실패: ${testResults.failed} ❌`);
  console.log(`성공률: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`소요 시간: ${testResults.endTime - testResults.startTime}ms`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🐛 발견된 오류:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}`);
      console.log(`   오류: ${error.error}`);
      console.log(`   예상: ${error.expected}`);
      console.log(`   실제: ${error.actual}`);
      console.log('');
    });
  } else {
    console.log('\n🎉 모든 통합 테스트가 통과했습니다!');
  }
  
  // 결과를 파일로 저장
  const resultFile = path.join(__dirname, 'integration_test_results.json');
  fs.writeFileSync(resultFile, JSON.stringify(testResults, null, 2));
  console.log(`📁 상세 결과가 ${resultFile}에 저장되었습니다.`);
  
  return testResults;
}

// 스크립트 실행
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };

