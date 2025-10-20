/**
 * 다운로드 제한 시스템 코드 분석 및 로직 테스트
 * 
 * 이 스크립트는 useDownloadLimits Hook의 로직을 분석하고
 * 잠재적 버그를 찾아 수정합니다.
 */

const fs = require('fs');
const path = require('path');

class CodeAnalysisTester {
  constructor() {
    this.testResults = [];
    this.bugs = [];
  }

  // 1. 다운로드 제한 로직 분석
  analyzeDownloadLimits() {
    console.log('🔍 다운로드 제한 로직 분석');
    
    const FREE_LIMIT = 2;
    const ADS_INTERVAL = 3;
    const EMAIL_REQUIRED_AFTER = 5;

    // 테스트 케이스들
    const testCases = [
      { totalDownloads: 0, adsWatched: 0, emailCollected: false, expected: 'free' },
      { totalDownloads: 1, adsWatched: 0, emailCollected: false, expected: 'free' },
      { totalDownloads: 2, adsWatched: 0, emailCollected: false, expected: 'free' },
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

  // 다운로드 시도 시뮬레이션
  simulateDownloadAttempt(testCase) {
    const FREE_LIMIT = 2;
    const ADS_INTERVAL = 3;
    const EMAIL_REQUIRED_AFTER = 5;

    // 무료 다운로드 체크
    if (testCase.totalDownloads < FREE_LIMIT) {
      return 'free';
    }

    // 이메일 수집 필요 체크
    if (testCase.totalDownloads >= EMAIL_REQUIRED_AFTER && !testCase.emailCollected) {
      return 'email_required';
    }

    // 광고 시청 필요 체크
    const adsNeeded = Math.floor((testCase.totalDownloads - FREE_LIMIT) / ADS_INTERVAL);
    if (testCase.adsWatched < adsNeeded) {
      return 'ad_required';
    }

    return 'success';
  }

  // 2. 광고 시청 로직 분석
  analyzeAdLogic() {
    console.log('\n🔍 광고 시청 로직 분석');
    
    const FREE_LIMIT = 2;
    const ADS_INTERVAL = 3;

    // 광고 시청 필요 시점 계산
    const adThresholds = [];
    for (let downloads = 0; downloads <= 20; downloads++) {
      const adsNeeded = Math.floor((downloads - FREE_LIMIT) / ADS_INTERVAL);
      const nextAdThreshold = FREE_LIMIT + (adsNeeded + 1) * ADS_INTERVAL;
      const downloadsUntilNextAd = nextAdThreshold - downloads;
      
      adThresholds.push({
        downloads,
        adsNeeded,
        nextAdThreshold,
        downloadsUntilNextAd,
        needsAd: downloads >= FREE_LIMIT && adsNeeded > 0
      });
    }

    console.log('\n📊 광고 시청 필요 시점:');
    console.log('다운로드수 | 필요광고수 | 다음광고임계값 | 남은다운로드수 | 광고필요');
    console.log('-----------|------------|----------------|----------------|----------');

    adThresholds.forEach(threshold => {
      if (threshold.downloads >= FREE_LIMIT) {
        console.log(`${threshold.downloads.toString().padStart(10)} | ${threshold.adsNeeded.toString().padStart(10)} | ${threshold.nextAdThreshold.toString().padStart(14)} | ${threshold.downloadsUntilNextAd.toString().padStart(14)} | ${threshold.needsAd ? 'YES' : 'NO'}`);
      }
    });

    // 잠재적 버그 확인
    const buggyThresholds = adThresholds.filter(t => 
      t.downloads >= FREE_LIMIT && 
      t.downloads % ADS_INTERVAL === 0 && 
      !t.needsAd
    );

    if (buggyThresholds.length > 0) {
      console.log('\n❌ 잠재적 버그 발견:');
      buggyThresholds.forEach(threshold => {
        console.log(`- 다운로드 ${threshold.downloads}회에서 광고가 필요해야 하는데 필요하지 않음`);
      });
    }

    return adThresholds;
  }

  // 3. 이메일 수집 로직 분석
  analyzeEmailLogic() {
    console.log('\n🔍 이메일 수집 로직 분석');
    
    const EMAIL_REQUIRED_AFTER = 5;

    // 이메일 수집 필요 시점 계산
    const emailThresholds = [];
    for (let downloads = 0; downloads <= 10; downloads++) {
      const downloadsUntilEmail = Math.max(0, EMAIL_REQUIRED_AFTER - downloads);
      const needsEmail = downloads >= EMAIL_REQUIRED_AFTER;
      
      emailThresholds.push({
        downloads,
        downloadsUntilEmail,
        needsEmail
      });
    }

    console.log('\n📊 이메일 수집 필요 시점:');
    console.log('다운로드수 | 남은다운로드수 | 이메일필요');
    console.log('-----------|----------------|----------');

    emailThresholds.forEach(threshold => {
      console.log(`${threshold.downloads.toString().padStart(10)} | ${threshold.downloadsUntilEmail.toString().padStart(14)} | ${threshold.needsEmail ? 'YES' : 'NO'}`);
    });

    return emailThresholds;
  }

  // 4. 일일 리셋 로직 분석
  analyzeDailyReset() {
    console.log('\n🔍 일일 리셋 로직 분석');
    
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

    console.log('\n📊 날짜 비교 테스트:');
    console.log(`오늘: ${today}`);
    console.log(`어제: ${yesterday}`);
    console.log(`내일: ${tomorrow}`);

    // 날짜 비교 로직 테스트
    const testCases = [
      { storedDate: today, shouldReset: false },
      { storedDate: yesterday, shouldReset: true },
      { storedDate: tomorrow, shouldReset: true },
      { storedDate: '2024-01-01', shouldReset: true },
      { storedDate: '', shouldReset: true },
      { storedDate: null, shouldReset: true }
    ];

    console.log('\n📊 날짜 비교 결과:');
    console.log('저장된날짜 | 리셋여부 | 예상결과 | 상태');
    console.log('-----------|----------|----------|------');

    testCases.forEach((testCase, index) => {
      const actualReset = testCase.storedDate !== today;
      const status = actualReset === testCase.shouldReset ? '✅' : '❌';
      
      console.log(`${(testCase.storedDate || 'null').padStart(10)} | ${actualReset ? 'YES' : 'NO'.padStart(8)} | ${testCase.shouldReset ? 'YES' : 'NO'.padStart(8)} | ${status}`);
      
      if (actualReset !== testCase.shouldReset) {
        this.bugs.push({
          id: `BUG-RESET-${index + 1}`,
          testCase: testCase,
          expected: testCase.shouldReset,
          actual: actualReset,
          description: `날짜 비교 로직 오류: ${testCase.storedDate}일 때 리셋 여부가 예상과 다름`
        });
      }
    });

    return testCases;
  }

  // 5. localStorage 오류 처리 분석
  analyzeLocalStorageErrorHandling() {
    console.log('\n🔍 localStorage 오류 처리 분석');
    
    const errorScenarios = [
      {
        name: '잘못된 JSON 형식',
        data: 'invalid-json',
        shouldHandle: true
      },
      {
        name: 'null 값',
        data: null,
        shouldHandle: true
      },
      {
        name: '빈 문자열',
        data: '',
        shouldHandle: true
      },
      {
        name: 'undefined',
        data: undefined,
        shouldHandle: true
      },
      {
        name: '부분적 데이터',
        data: '{"freeDownloads": 1}',
        shouldHandle: true
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
    return requiredFields.every(field => data.hasOwnProperty(field));
  }

  // 6. 성능 분석
  analyzePerformance() {
    console.log('\n🔍 성능 분석');
    
    const iterations = 1000;
    const startTime = Date.now();
    
    // 다운로드 시도 시뮬레이션
    for (let i = 0; i < iterations; i++) {
      this.simulateDownloadAttempt({
        totalDownloads: i % 10,
        adsWatched: Math.floor(i / 3),
        emailCollected: i % 2 === 0
      });
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const avgTime = duration / iterations;
    
    console.log(`\n📊 성능 테스트 결과:`);
    console.log(`반복 횟수: ${iterations}`);
    console.log(`총 시간: ${duration}ms`);
    console.log(`평균 시간: ${avgTime.toFixed(4)}ms`);
    console.log(`초당 처리: ${Math.round(1000 / avgTime)}회`);
    
    if (avgTime > 1) {
      this.bugs.push({
        id: 'BUG-PERF-1',
        testCase: { iterations, duration, avgTime },
        expected: 'avgTime < 1ms',
        actual: `${avgTime.toFixed(4)}ms`,
        description: '성능 저하: 평균 처리 시간이 1ms를 초과함'
      });
    }
    
    return { iterations, duration, avgTime };
  }

  // 모든 분석 실행
  runAllAnalysis() {
    console.log('🚀 다운로드 제한 시스템 코드 분석 시작\n');
    
    try {
      // 1. 다운로드 제한 로직 분석
      this.analyzeDownloadLimits();
      
      // 2. 광고 시청 로직 분석
      this.analyzeAdLogic();
      
      // 3. 이메일 수집 로직 분석
      this.analyzeEmailLogic();
      
      // 4. 일일 리셋 로직 분석
      this.analyzeDailyReset();
      
      // 5. localStorage 오류 처리 분석
      this.analyzeLocalStorageErrorHandling();
      
      // 6. 성능 분석
      this.analyzePerformance();
      
      console.log('\n🎉 모든 분석 완료!');
      this.generateReport();
      
    } catch (error) {
      console.error('❌ 분석 실행 중 오류 발생:', error);
      this.generateReport();
    }
  }

  // 분석 결과 보고서 생성
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalBugs: this.bugs.length,
      bugs: this.bugs,
      summary: {
        criticalBugs: this.bugs.filter(b => b.id.includes('BUG-')).length,
        performanceIssues: this.bugs.filter(b => b.id.includes('PERF')).length,
        storageIssues: this.bugs.filter(b => b.id.includes('STORAGE')).length,
        resetIssues: this.bugs.filter(b => b.id.includes('RESET')).length
      }
    };

    const reportPath = path.join(__dirname, 'code_analysis_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 분석 결과 요약:');
    console.log(`총 버그 수: ${report.totalBugs}`);
    console.log(`심각한 버그: ${report.summary.criticalBugs}`);
    console.log(`성능 이슈: ${report.summary.performanceIssues}`);
    console.log(`저장소 이슈: ${report.summary.storageIssues}`);
    console.log(`리셋 이슈: ${report.summary.resetIssues}`);
    
    if (report.totalBugs > 0) {
      console.log('\n❌ 발견된 버그:');
      report.bugs.forEach(bug => {
        console.log(`- ${bug.id}: ${bug.description}`);
      });
    } else {
      console.log('\n✅ 발견된 버그 없음');
    }
    
    console.log(`\n📄 상세 보고서: ${reportPath}`);

    return report;
  }
}

// 분석 실행
if (require.main === module) {
  const tester = new CodeAnalysisTester();
  tester.runAllAnalysis().catch(console.error);
}

module.exports = CodeAnalysisTester;

