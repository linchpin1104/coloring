#!/usr/bin/env node

/**
 * 백엔드 API 테스트 스크립트
 * 
 * 테스트 범위:
 * - 색칠공부 도안 API
 * - 사용자 관리 API
 * - 뉴스레터 구독 API
 * - 다국어 검색 API
 * - 통계 API
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// 테스트 결과 저장
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  startTime: new Date(),
  endTime: null,
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

// 1. 헬스 체크 테스트
async function testHealthCheck() {
  console.log('\n🏥 헬스 체크 테스트');
  
  await runTest('TC-API-001: 헬스 체크 API', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '헬스 체크 API 응답 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '헬스 체크 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    return {
      success: true,
      message: '헬스 체크 API가 정상 작동함',
    };
  });
}

// 2. 색칠공부 도안 API 테스트
async function testColoringPagesAPI() {
  console.log('\n🎨 색칠공부 도안 API 테스트');
  
  await runTest('TC-API-002: 색칠공부 도안 목록 조회', async () => {
    const response = await axios.get(`${BASE_URL}/coloring-pages`);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '색칠공부 도안 목록 조회 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '색칠공부 도안 목록 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    if (!Array.isArray(response.data.data)) {
      return {
        success: false,
        error: '색칠공부 도안 데이터 형식 오류',
        expected: 'Array',
        actual: typeof response.data.data,
      };
    }
    
    return {
      success: true,
      message: `색칠공부 도안 ${response.data.data.length}개 조회 성공`,
    };
  });
  
  await runTest('TC-API-003: 색칠공부 도안 상세 조회', async () => {
    const response = await axios.get(`${BASE_URL}/coloring-pages/page_1`);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '색칠공부 도안 상세 조회 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '색칠공부 도안 상세 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    if (!response.data.data.id) {
      return {
        success: false,
        error: '색칠공부 도안 ID 누락',
        expected: 'ID 존재',
        actual: 'ID 누락',
      };
    }
    
    return {
      success: true,
      message: `색칠공부 도안 상세 조회 성공: ${response.data.data.characterName}`,
    };
  });
  
  await runTest('TC-API-004: 색칠공부 도안 다운로드', async () => {
    const response = await axios.post(`${BASE_URL}/coloring-pages/page_1/download`);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '색칠공부 도안 다운로드 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '색칠공부 도안 다운로드 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    if (!response.data.downloadUrl) {
      return {
        success: false,
        error: '다운로드 URL 누락',
        expected: 'downloadUrl 존재',
        actual: 'downloadUrl 누락',
      };
    }
    
    return {
      success: true,
      message: `색칠공부 도안 다운로드 성공: ${response.data.filename}`,
    };
  });
  
  await runTest('TC-API-005: 색칠공부 도안 필터링', async () => {
    const response = await axios.get(`${BASE_URL}/coloring-pages?difficulty=easy&ageGroup=child`);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '색칠공부 도안 필터링 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '색칠공부 도안 필터링 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    // 필터링 결과 검증
    const filteredPages = response.data.data;
    const hasInvalidDifficulty = filteredPages.some(page => page.difficulty !== 'easy');
    const hasInvalidAgeGroup = filteredPages.some(page => page.ageGroup !== 'child');
    
    if (hasInvalidDifficulty) {
      return {
        success: false,
        error: '난이도 필터링 실패',
        expected: '모든 도안이 easy',
        actual: '일부 도안이 easy가 아님',
      };
    }
    
    if (hasInvalidAgeGroup) {
      return {
        success: false,
        error: '연령대 필터링 실패',
        expected: '모든 도안이 child',
        actual: '일부 도안이 child가 아님',
      };
    }
    
    return {
      success: true,
      message: `색칠공부 도안 필터링 성공: ${filteredPages.length}개 도안`,
    };
  });
}

// 3. 사용자 관리 API 테스트
async function testUserAPI() {
  console.log('\n👤 사용자 관리 API 테스트');
  
  await runTest('TC-API-006: 사용자 생성', async () => {
    const userData = {
      email: 'test@example.com',
      name: '테스트 사용자',
      ageGroup: 'child',
      preferences: {
        favoriteCharacters: ['도라에몽'],
        difficultyPreference: 'easy',
      },
    };
    
    const response = await axios.post(`${BASE_URL}/users`, userData);
    
    if (response.status !== 201) {
      return {
        success: false,
        error: '사용자 생성 실패',
        expected: '201',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '사용자 생성 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    if (!response.data.data.id) {
      return {
        success: false,
        error: '사용자 ID 누락',
        expected: 'ID 존재',
        actual: 'ID 누락',
      };
    }
    
    return {
      success: true,
      message: `사용자 생성 성공: ${response.data.data.email}`,
    };
  });
  
  await runTest('TC-API-007: 중복 사용자 생성 시도', async () => {
    const userData = {
      email: 'test@example.com',
      name: '중복 사용자',
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/users`, userData);
      
      if (response.status === 409) {
        return {
          success: true,
          message: '중복 사용자 생성이 정상적으로 차단됨',
        };
      } else {
        return {
          success: false,
          error: '중복 사용자 생성이 차단되지 않음',
          expected: '409',
          actual: response.status.toString(),
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        return {
          success: true,
          message: '중복 사용자 생성이 정상적으로 차단됨',
        };
      } else {
        throw error;
      }
    }
  });
}

// 4. 뉴스레터 구독 API 테스트
async function testNewsletterAPI() {
  console.log('\n📧 뉴스레터 구독 API 테스트');
  
  await runTest('TC-API-008: 뉴스레터 구독', async () => {
    const subscriptionData = {
      email: 'newsletter@example.com',
      language: 'ko',
      source: 'website',
    };
    
    const response = await axios.post(`${BASE_URL}/newsletter/subscribe`, subscriptionData);
    
    if (response.status !== 201) {
      return {
        success: false,
        error: '뉴스레터 구독 실패',
        expected: '201',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '뉴스레터 구독 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    return {
      success: true,
      message: `뉴스레터 구독 성공: ${response.data.data.email}`,
    };
  });
  
  await runTest('TC-API-009: 중복 뉴스레터 구독 시도', async () => {
    const subscriptionData = {
      email: 'newsletter@example.com',
      language: 'ko',
      source: 'website',
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/newsletter/subscribe`, subscriptionData);
      
      if (response.status === 409) {
        return {
          success: true,
          message: '중복 뉴스레터 구독이 정상적으로 차단됨',
        };
      } else {
        return {
          success: false,
          error: '중복 뉴스레터 구독이 차단되지 않음',
          expected: '409',
          actual: response.status.toString(),
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        return {
          success: true,
          message: '중복 뉴스레터 구독이 정상적으로 차단됨',
        };
      } else {
        throw error;
      }
    }
  });
  
  await runTest('TC-API-010: 뉴스레터 구독 해지', async () => {
    const unsubscribeData = {
      email: 'newsletter@example.com',
    };
    
    const response = await axios.post(`${BASE_URL}/newsletter/unsubscribe`, unsubscribeData);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '뉴스레터 구독 해지 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '뉴스레터 구독 해지 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    return {
      success: true,
      message: '뉴스레터 구독 해지 성공',
    };
  });
}

// 5. 다국어 검색 API 테스트
async function testMultilingualSearchAPI() {
  console.log('\n🌍 다국어 검색 API 테스트');
  
  await runTest('TC-API-011: 다국어 검색', async () => {
    const searchData = {
      query: '도라에몽',
      searchTerms: ['Doraemon', 'ドラえもん', '哆啦A梦'],
      filters: {
        difficulty: 'easy',
        ageGroup: 'child',
      },
      page: 1,
      limit: 10,
    };
    
    const response = await axios.post(`${BASE_URL}/search/multilingual`, searchData);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '다국어 검색 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '다국어 검색 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    if (!Array.isArray(response.data.data)) {
      return {
        success: false,
        error: '다국어 검색 결과 데이터 형식 오류',
        expected: 'Array',
        actual: typeof response.data.data,
      };
    }
    
    return {
      success: true,
      message: `다국어 검색 성공: ${response.data.data.length}개 결과`,
    };
  });
  
  await runTest('TC-API-012: 빈 검색어 검색', async () => {
    const searchData = {
      query: '',
      searchTerms: [],
      filters: {},
      page: 1,
      limit: 10,
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/search/multilingual`, searchData);
      
      if (response.status === 400) {
        return {
          success: true,
          message: '빈 검색어가 정상적으로 차단됨',
        };
      } else {
        return {
          success: false,
          error: '빈 검색어가 차단되지 않음',
          expected: '400',
          actual: response.status.toString(),
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return {
          success: true,
          message: '빈 검색어가 정상적으로 차단됨',
        };
      } else {
        throw error;
      }
    }
  });
}

// 6. 통계 API 테스트
async function testStatsAPI() {
  console.log('\n📊 통계 API 테스트');
  
  await runTest('TC-API-013: 통계 조회', async () => {
    const response = await axios.get(`${BASE_URL}/stats`);
    
    if (response.status !== 200) {
      return {
        success: false,
        error: '통계 조회 실패',
        expected: '200',
        actual: response.status.toString(),
      };
    }
    
    if (!response.data.success) {
      return {
        success: false,
        error: '통계 조회 응답 데이터 오류',
        expected: 'success: true',
        actual: `success: ${response.data.success}`,
      };
    }
    
    const stats = response.data.data;
    const requiredFields = ['totalColoringPages', 'totalUsers', 'totalNewsletterSubscriptions', 'totalDownloads'];
    const missingFields = requiredFields.filter(field => !(field in stats));
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: '통계 필수 필드 누락',
        expected: '모든 필수 필드 존재',
        actual: `누락된 필드: ${missingFields.join(', ')}`,
      };
    }
    
    return {
      success: true,
      message: `통계 조회 성공: 도안 ${stats.totalColoringPages}개, 사용자 ${stats.totalUsers}명`,
    };
  });
}

// 7. 오류 처리 테스트
async function testErrorHandling() {
  console.log('\n⚠️ 오류 처리 테스트');
  
  await runTest('TC-API-014: 존재하지 않는 엔드포인트', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/nonexistent`);
      
      if (response.status === 404) {
        return {
          success: true,
          message: '존재하지 않는 엔드포인트가 정상적으로 404 응답',
        };
      } else {
        return {
          success: false,
          error: '존재하지 않는 엔드포인트 응답 오류',
          expected: '404',
          actual: response.status.toString(),
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return {
          success: true,
          message: '존재하지 않는 엔드포인트가 정상적으로 404 응답',
        };
      } else {
        throw error;
      }
    }
  });
  
  await runTest('TC-API-015: 잘못된 이메일 형식', async () => {
    const invalidEmailData = {
      email: 'invalid-email',
      language: 'ko',
      source: 'website',
    };
    
    try {
      const response = await axios.post(`${BASE_URL}/newsletter/subscribe`, invalidEmailData);
      
      if (response.status === 400) {
        return {
          success: true,
          message: '잘못된 이메일 형식이 정상적으로 차단됨',
        };
      } else {
        return {
          success: false,
          error: '잘못된 이메일 형식이 차단되지 않음',
          expected: '400',
          actual: response.status.toString(),
        };
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        return {
          success: true,
          message: '잘못된 이메일 형식이 정상적으로 차단됨',
        };
      } else {
        throw error;
      }
    }
  });
}

// 메인 테스트 실행
async function runAllTests() {
  console.log('🚀 백엔드 API 테스트 시작');
  console.log('=' * 50);
  
  await testHealthCheck();
  await testColoringPagesAPI();
  await testUserAPI();
  await testNewsletterAPI();
  await testMultilingualSearchAPI();
  await testStatsAPI();
  await testErrorHandling();
  
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
    console.log('\n🎉 모든 테스트가 통과했습니다!');
  }
  
  return testResults;
}

// 스크립트 실행
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testResults };

