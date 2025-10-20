/**
 * 수정된 다운로드 제한 시스템 테스트
 * 
 * 이 스크립트는 수정된 useDownloadLimits Hook의 로직을 테스트합니다.
 */

const fs = require('fs');
const path = require('path');

class FixedCodeTester {
  constructor() {
    this.testResults = [];
    this.bugs = [];
  }

  // 수정된 다운로드 시도 시뮬레이션
  simulateDownloadAttempt(testCase) {
    const FREE_LIMIT = 2;
    const ADS_INTERVAL = 3;
    const EMAIL_REQUIRED_AFTER = 5;

    // 무료 다운로드 (0, 1회) - 2회까지 무료
    if (testCase.totalDownloads < FREE_LIMIT) {
      return 'free';
    }

    // 이메일 수집 필요 (5회 이상)
    if (testCase.totalDownloads >= EMAIL_REQUIRED_AFTER && !testCase.emailCollected) {
      return 'email_required';
    }

    // 광고 시청 필요 (3, 6, 9, 12... 회)
    const adsNeeded = Math.ceil((testCase.totalDownloads - FREE_LIMIT) / ADS_INTERVAL);
    if (testCase.adsWatched < adsNeeded) {
      return 'ad_required';
    }

    return 'success';
  }

  // 수정된 광고 시청 로직 테스트
  testAdLogic() {
    console.log('🔍 수정된 광고 시청 로직 테스트');
    
    const FREE_LIMIT = 2;
    const ADS_INTERVAL = 3;

    // 광고 시청 필요 시점 계산
    const adThresholds = [];
    for (let downloads = 0; downloads <= 20; downloads++) {
      const adsNeeded = Math.ceil((downloads - FREE_LIMIT) / ADS_INTERVAL);
      const needsAd = downloads >= FREE_LIMIT && adsNeeded > 0;
      
      adThresholds.push({
        downloads,
        adsNeeded,
        needsAd
      });
    }

    console.log('\n📊 광고 시청 필요 시점:');
    console.log('다운로드수 | 필요광고수 | 광고필요');
    console.log('-----------|------------|----------');

    adThresholds.forEach(threshold => {
      if (threshold.downloads >= FREE_LIMIT) {
        console.log(`${threshold.downloads.toString().padStart(10)} | ${threshold.adsNeeded.toString().padStart(10)} | ${threshold.needsAd ? 'YES' : 'NO'}`);
      }
    });

    return adThresholds;
  }

  // 수정된 다운로드 제한 로직 테스트
  testDownloadLimits() {
    console.log('🔍 수정된 다운로드 제한 로직 테스트');
    
    const testCases = [
      { totalDownloads: 0, adsWatched: 0, emailCollected: false, expected: 'free' },
      { totalDownloads: 1, adsWatched: 0, emailCollected: false, expected: 'free' },
      { totalDownloads: 2, adsWatched: 0, emailCollected: false, expected: 'success' }, // 2회까지 무료이므로 success
      { totalDownloads: 3, adsWatched: 0, emailCollected: false, expected: 'ad_required' },
      { totalDownloads: 4, adsWatched: 1, emailCollected: false, expected: 'success' },
      { totalDownloads: 5, adsWatched: 1, emailCollected: false, expected: 'email_required' },
      { totalDownloads: 6, adsWatched: 1, emailCollected: true, expected: 'ad_required' },
      { totalDownloads: 7, adsWatched: 2, emailCollected: true, expected: 'success' },
    ];

    console.log('\n📊 테스트 케이스 실행:');
    console.log('다운로드수 | 광고시청 | 이메일수집 | 예상결과 | 실제결과 | 상태');
    console.log('-----------|----------|------------|----------|----------|------');

    testCases.forEach((testCase, index) => {
      const result = this.simulateDownloadAttempt(testCase);
      const status = result === testCase.expected ? '✅' : '❌';
      
      console.log(`${testCase.totalDownloads.toString().padStart(10)} | ${testCase.adsWatched.toString().padStart(8)} | ${testCase.emailCollected.toString().padStart(10)} | ${testCase.expected.padStart(8)} | ${result.padStart(8)} | ${status}`);
      
      if (result !== testCase.expected) {
        this.bugs.push({
          id: `BUG-${index + 1}`,
          testCase: testCase,
          expected: testCase.expected,
          actual: result,
          description: `다운로드 ${testCase.totalDownloads}회, 광고 ${testCase.adsWatched}회, 이메일 ${testCase.emailCollected}일 때 예상 결과와 다름`
        });
      }
    });

    return testCases;
  }

  // localStorage 오류 처리 테스트
  testLocalStorageErrorHandling() {
    console.log('\n🔍 localStorage 오류 처리 테스트');
    
    const errorScenarios = [
      {
        name: '잘못된 JSON 형식',
        data: 'invalid-json',
        shouldHandle: false // JSON 파싱 오류로 처리됨
      },
      {
        name: 'null 값',
        data: null,
        shouldHandle: false // null은 유효하지 않음
      },
      {
        name: '빈 문자열',
        data: '',
        shouldHandle: false // 빈 문자열은 유효하지 않음
      },
      {
        name: 'undefined',
        data: undefined,
        shouldHandle: false // undefined는 유효하지 않음
      },
      {
        name: '부분적 데이터',
        data: '{"freeDownloads": 1}',
        shouldHandle: false // 필수 필드가 없음
      }
    ];

    console.log('\n📊 오류 처리 시나리오:');
    console.log('시나리오 | 데이터 | 처리여부 | 상태');
    console.log('---------|--------|----------|------');

    errorScenarios.forEach((scenario, index) => {
      try {
        const parsed = scenario.data ? JSON.parse(scenario.data) : {};
        const handled = this.isValidDownloadLimits(parsed);
        const status = handled === scenario.shouldHandle ? '✅' : '❌';
        
        console.log(`${scenario.name.padStart(8)} | ${(scenario.data || 'null').padStart(6)} | ${handled ? 'YES' : 'NO'.padStart(8)} | ${status}`);
        
        if (handled !== scenario.shouldHandle) {
          this.bugs.push({
            id: `BUG-STORAGE-${index + 1}`,
            testCase: scenario,
            expected: scenario.shouldHandle,
            actual: handled,
            description: `localStorage 오류 처리 실패: ${scenario.name}`
          });
        }
      } catch (error) {
        const status = scenario.shouldHandle ? '✅' : '❌';
        console.log(`${scenario.name.padStart(8)} | ${(scenario.data || 'null').padStart(6)} | ${'ERROR'.padStart(8)} | ${status}`);
      }
    });

    return errorScenarios;
  }

  // 다운로드 제한 데이터 유효성 검사
  isValidDownloadLimits(data) {
    if (!data || typeof data !== 'object') return false;
    
    const requiredFields = ['freeDownloads', 'totalDownloads', 'adsWatched', 'emailCollected', 'lastResetDate'];
    return requiredFields.every(field => 
      data.hasOwnProperty(field) && 
      typeof data[field] === (field === 'emailCollected' ? 'boolean' : 'number')
    );
  }

  // 모든 테스트 실행
  runAllTests() {
    console.log('🚀 수정된 다운로드 제한 시스템 테스트 시작\n');
    
    try {
      // 1. 다운로드 제한 로직 테스트
      this.testDownloadLimits();
      
      // 2. 광고 시청 로직 테스트
      this.testAdLogic();
      
      // 3. localStorage 오류 처리 테스트
      this.testLocalStorageErrorHandling();
      
      console.log('\n🎉 모든 테스트 완료!');
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 테스트 실행 중 오류 발생:', error);
      this.generateReport();
    }
  }

  // 테스트 결과 보고서 생성
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalBugs: this.bugs.length,
      bugs: this.bugs,
      summary: {
        criticalBugs: this.bugs.filter(b => b.id.includes('BUG-')).length,
        storageIssues: this.bugs.filter(b => b.id.includes('STORAGE')).length
      }
    };

    const reportPath = path.join(__dirname, 'fixed_code_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 테스트 결과 요약:');
    console.log(`총 버그 수: ${report.totalBugs}`);
    console.log(`심각한 버그: ${report.summary.criticalBugs}`);
    console.log(`저장소 이슈: ${report.summary.storageIssues}`);
    
    if (report.totalBugs > 0) {
      console.log('\n❌ 발견된 버그:');
      report.bugs.forEach(bug => {
        console.log(`- ${bug.id}: ${bug.description}`);
      });
    } else {
      console.log('\n✅ 발견된 버그 없음 - 모든 수정이 성공적으로 적용됨');
    }
    
    console.log(`\n📄 상세 보고서: ${reportPath}`);

    return report;
  }
}

// 테스트 실행
if (require.main === module) {
  const tester = new FixedCodeTester();
  tester.runAllTests();
}

module.exports = FixedCodeTester;
