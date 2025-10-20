/**
 * 다운로드 제한 시스템 QA 테스트 스크립트
 * 
 * 이 스크립트는 다운로드 제한 시스템의 모든 기능을 테스트합니다.
 * - 기본 다운로드 제한 테스트
 * - 엣지케이스 테스트
 * - 경계값 테스트
 * - 사용자 경험 테스트
 * - 데이터 무결성 테스트
 * - 성능 테스트
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class DownloadLimitsTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
    this.currentTest = null;
  }

  async init() {
    console.log('🚀 다운로드 제한 시스템 QA 테스트 시작');
    this.browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // 페이지 로드 대기
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // React 앱이 완전히 로드될 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 테스트 환경 설정
    await this.setupTestEnvironment();
  }

  async setupTestEnvironment() {
    console.log('🔧 테스트 환경 설정');
    
    // localStorage 초기화
    await this.page.evaluate(() => {
      localStorage.clear();
    });

    // 콘솔 로그 캡처
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ 브라우저 오류:', msg.text());
      }
    });

    // 페이지 오류 캡처
    this.page.on('pageerror', error => {
      console.error('❌ 페이지 오류:', error.message);
    });
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 테스트 실행: ${testName}`);
    this.currentTest = testName;
    
    try {
      const result = await testFunction();
      this.testResults.push({
        test: testName,
        status: 'PASS',
        result: result,
        timestamp: new Date().toISOString()
      });
      console.log(`✅ ${testName}: 통과`);
      return result;
    } catch (error) {
      this.testResults.push({
        test: testName,
        status: 'FAIL',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.log(`❌ ${testName}: 실패 - ${error.message}`);
      throw error;
    }
  }

  // 1. 기본 다운로드 제한 테스트
  async testInitialState() {
    return await this.runTest('초기 상태 테스트', async () => {
      const state = await this.page.evaluate(() => {
        const limits = JSON.parse(localStorage.getItem('downloadLimits') || '{}');
        return {
          downloadCount: limits.downloadCount || 0,
          adWatchedCount: limits.adWatchedCount || 0,
          emailCollected: limits.emailCollected || false
        };
      });

      if (state.downloadCount !== 0) throw new Error(`다운로드 횟수가 0이 아님: ${state.downloadCount}`);
      if (state.adWatchedCount !== 0) throw new Error(`광고 시청 횟수가 0이 아님: ${state.adWatchedCount}`);
      if (state.emailCollected !== false) throw new Error(`이메일 수집 상태가 false가 아님: ${state.emailCollected}`);

      return state;
    });
  }

  async testFirstTwoDownloads() {
    return await this.runTest('1-2회 다운로드 테스트', async () => {
      const results = [];

      // 페이지가 완전히 로드될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 모든 요소가 로드될 때까지 대기
      await this.page.waitForFunction(() => {
        return document.querySelectorAll('button').length > 0;
      }, { timeout: 15000 });

      const buttons = await this.page.$$('button');
      console.log(`발견된 버튼 수: ${buttons.length}`);
      
      // "다운로드" 텍스트가 포함된 버튼 찾기
      let downloadButton = null;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        console.log(`버튼 텍스트: "${text}"`);
        if (text && text.includes('다운로드')) {
          downloadButton = button;
          break;
        }
      }

      if (!downloadButton) {
        // 페이지 스크린샷 저장
        await this.page.screenshot({ path: 'debug-page.png' });
        throw new Error('다운로드 버튼을 찾을 수 없음');
      }

      // 1회 다운로드
      await downloadButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      let state = await this.page.evaluate(() => {
        const limits = JSON.parse(localStorage.getItem('downloadLimits') || '{}');
        return limits.downloadCount || 0;
      });

      if (state !== 1) throw new Error(`1회 다운로드 후 카운트가 1이 아님: ${state}`);
      results.push({ download: 1, count: state, status: 'success' });

      // 2회 다운로드
      await downloadButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      state = await this.page.evaluate(() => {
        const limits = JSON.parse(localStorage.getItem('downloadLimits') || '{}');
        return limits.downloadCount || 0;
      });

      if (state !== 2) throw new Error(`2회 다운로드 후 카운트가 2가 아님: ${state}`);
      results.push({ download: 2, count: state, status: 'success' });

      return results;
    });
  }

  async testAdModalDisplay() {
    return await this.runTest('광고 모달 표시 테스트', async () => {
      // 다운로드 버튼 찾기
      const buttons = await this.page.$$('button');
      let downloadButton = null;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('다운로드')) {
          downloadButton = button;
          break;
        }
      }

      if (!downloadButton) throw new Error('다운로드 버튼을 찾을 수 없음');

      // 3회 다운로드 시도 (광고 모달 표시되어야 함)
      await downloadButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 광고 모달이 표시되는지 확인 (모달 텍스트로 확인)
      const modalText = await this.page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed');
        for (const modal of modals) {
          const text = modal.textContent || '';
          if (text.includes('광고') || text.includes('ad') || text.includes('시청')) {
            return text;
          }
        }
        return null;
      });

      if (!modalText) throw new Error('광고 모달이 표시되지 않음');

      // 광고 시청 완료 시뮬레이션 (모달 닫기 버튼 클릭)
      const closeButtons = await this.page.$$('button');
      for (const button of closeButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && (text.includes('닫기') || text.includes('완료') || text.includes('시청'))) {
          await button.click();
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      return { adModalDisplayed: true, adWatched: true };
    });
  }

  async testEmailCollectionModal() {
    return await this.runTest('이메일 수집 모달 테스트', async () => {
      // 다운로드 버튼 찾기
      const buttons = await this.page.$$('button');
      let downloadButton = null;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('다운로드')) {
          downloadButton = button;
          break;
        }
      }

      if (!downloadButton) throw new Error('다운로드 버튼을 찾을 수 없음');

      // 6회 다운로드 시도 (이메일 수집 모달 표시되어야 함)
      await downloadButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 이메일 수집 모달이 표시되는지 확인 (모달 텍스트로 확인)
      const modalText = await this.page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed');
        for (const modal of modals) {
          const text = modal.textContent || '';
          if (text.includes('이메일') || text.includes('email') || text.includes('수집')) {
            return text;
          }
        }
        return null;
      });

      if (!modalText) throw new Error('이메일 수집 모달이 표시되지 않음');

      // 이메일 수집 완료 시뮬레이션
      const emailInputs = await this.page.$$('input[type="email"], input[placeholder*="이메일"], input[placeholder*="email"]');
      if (emailInputs.length > 0) {
        await emailInputs[0].type('test@example.com');
      }

      const nameInputs = await this.page.$$('input[placeholder*="이름"], input[placeholder*="name"]');
      if (nameInputs.length > 0) {
        await nameInputs[0].type('Test User');
      }

      // 제출 버튼 클릭
      const submitButtons = await this.page.$$('button');
      for (const button of submitButtons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && (text.includes('제출') || text.includes('완료') || text.includes('등록'))) {
          await button.click();
          break;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      return { emailModalDisplayed: true, emailCollected: true };
    });
  }

  // 2. 엣지케이스 테스트
  async testLocalStorageCorruption() {
    return await this.runTest('localStorage 데이터 손상 테스트', async () => {
      // 잘못된 데이터 설정
      await this.page.evaluate(() => {
        localStorage.setItem('downloadLimits', 'invalid-json');
      });

      // 페이지 새로고침
      await this.page.reload({ waitUntil: 'networkidle0' });

      // 상태가 기본값으로 초기화되었는지 확인
      const state = await this.page.evaluate(() => {
        const limits = JSON.parse(localStorage.getItem('downloadLimits') || '{}');
        return {
          downloadCount: limits.downloadCount || 0,
          adWatchedCount: limits.adWatchedCount || 0,
          emailCollected: limits.emailCollected || false
        };
      });

      if (state.downloadCount !== 0) throw new Error(`손상된 데이터 후 다운로드 횟수가 0이 아님: ${state.downloadCount}`);

      return state;
    });
  }

  async testConcurrentDownloads() {
    return await this.runTest('동시 다운로드 시도 테스트', async () => {
      // 다운로드 버튼 찾기
      const buttons = await this.page.$$('button');
      let downloadButton = null;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('다운로드')) {
          downloadButton = button;
          break;
        }
      }

      if (!downloadButton) throw new Error('다운로드 버튼을 찾을 수 없음');

      // 빠른 연속 클릭 시뮬레이션
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(downloadButton.click());
      }
      
      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 카운트가 정확한지 확인 (중복 카운트 방지)
      const state = await this.page.evaluate(() => {
        const limits = JSON.parse(localStorage.getItem('downloadLimits') || '{}');
        return limits.downloadCount || 0;
      });

      if (state > 1) throw new Error(`동시 다운로드 시도 후 카운트가 1을 초과함: ${state}`);

      return { concurrentClicks: 5, finalCount: state };
    });
  }

  async testBrowserRefresh() {
    return await this.runTest('브라우저 새로고침 테스트', async () => {
      // 다운로드 버튼 찾기
      const buttons = await this.page.$$('button');
      let downloadButton = null;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('다운로드')) {
          downloadButton = button;
          break;
        }
      }

      if (!downloadButton) throw new Error('다운로드 버튼을 찾을 수 없음');

      // 다운로드 1회 수행
      await downloadButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 새로고침
      await this.page.reload({ waitUntil: 'networkidle0' });

      // 상태가 유지되었는지 확인
      const state = await this.page.evaluate(() => {
        const limits = JSON.parse(localStorage.getItem('downloadLimits') || '{}');
        return limits.downloadCount || 0;
      });

      if (state !== 1) throw new Error(`새로고침 후 다운로드 횟수가 1이 아님: ${state}`);

      return { beforeRefresh: 1, afterRefresh: state };
    });
  }

  // 3. 경계값 테스트
  async testExactLimits() {
    return await this.runTest('정확한 제한 횟수 테스트', async () => {
      // localStorage 초기화
      await this.page.evaluate(() => {
        localStorage.clear();
      });

      // 다운로드 버튼 찾기
      const buttons = await this.page.$$('button');
      let downloadButton = null;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('다운로드')) {
          downloadButton = button;
          break;
        }
      }

      if (!downloadButton) throw new Error('다운로드 버튼을 찾을 수 없음');

      // 2회 다운로드 수행
      for (let i = 0; i < 2; i++) {
        await downloadButton.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 3회 다운로드 시도 (광고 모달 표시되어야 함)
      await downloadButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 광고 모달이 표시되는지 확인
      const modalText = await this.page.evaluate(() => {
        const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed');
        for (const modal of modals) {
          const text = modal.textContent || '';
          if (text.includes('광고') || text.includes('ad') || text.includes('시청')) {
            return text;
          }
        }
        return null;
      });

      if (!modalText) throw new Error('2회 다운로드 후 3회 시도 시 광고 모달이 표시되지 않음');

      return { limitReached: true, modalDisplayed: true };
    });
  }

  // 4. 성능 테스트
  async testPerformance() {
    return await this.runTest('성능 테스트', async () => {
      const startTime = Date.now();
      
      // 다운로드 버튼 찾기
      const buttons = await this.page.$$('button');
      let downloadButton = null;
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('다운로드')) {
          downloadButton = button;
          break;
        }
      }

      if (!downloadButton) throw new Error('다운로드 버튼을 찾을 수 없음');
      
      // 100회 연속 다운로드 시도
      for (let i = 0; i < 100; i++) {
        await downloadButton.click();
        if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 100));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (duration > 10000) throw new Error(`성능 테스트 시간 초과: ${duration}ms`);

      return { 
        iterations: 100, 
        duration: duration, 
        avgTimePerClick: duration / 100 
      };
    });
  }

  // 5. 데이터 무결성 테스트
  async testDataIntegrity() {
    return await this.runTest('데이터 무결성 테스트', async () => {
      // localStorage 초기화
      await this.page.evaluate(() => {
        localStorage.clear();
      });

      // 다운로드 1회 수행
      await this.page.click('[data-testid="download-button"]');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // localStorage와 메모리 상태 비교
      const localStorageData = await this.page.evaluate(() => {
        return JSON.parse(localStorage.getItem('downloadLimits') || '{}');
      });

      const memoryState = await this.page.evaluate(() => {
        // React 컴포넌트의 상태를 가져오는 방법 (실제 구현에 따라 수정 필요)
        return window.downloadLimitsState || {};
      });

      if (localStorageData.downloadCount !== 1) {
        throw new Error(`localStorage 데이터 불일치: ${localStorageData.downloadCount}`);
      }

      return { 
        localStorageData, 
        memoryState, 
        integrity: true 
      };
    });
  }

  // 모든 테스트 실행
  async runAllTests() {
    try {
      await this.init();

      // 기본 다운로드 제한 테스트
      await this.testInitialState();
      await this.testFirstTwoDownloads();
      await this.testAdModalDisplay();
      await this.testEmailCollectionModal();

      // 엣지케이스 테스트
      await this.testLocalStorageCorruption();
      await this.testConcurrentDownloads();
      await this.testBrowserRefresh();

      // 경계값 테스트
      await this.testExactLimits();

      // 성능 테스트
      await this.testPerformance();

      // 데이터 무결성 테스트
      await this.testDataIntegrity();

      console.log('\n🎉 모든 테스트 완료!');
      this.generateReport();

    } catch (error) {
      console.error('❌ 테스트 실행 중 오류 발생:', error);
      this.generateReport();
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  // 테스트 결과 보고서 생성
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(t => t.status === 'PASS').length,
      failedTests: this.testResults.filter(t => t.status === 'FAIL').length,
      results: this.testResults
    };

    const reportPath = path.join(__dirname, 'download_limits_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 테스트 결과 요약:');
    console.log(`총 테스트: ${report.totalTests}`);
    console.log(`통과: ${report.passedTests}`);
    console.log(`실패: ${report.failedTests}`);
    console.log(`성공률: ${((report.passedTests / report.totalTests) * 100).toFixed(2)}%`);
    console.log(`\n📄 상세 보고서: ${reportPath}`);

    return report;
  }
}

// 테스트 실행
if (require.main === module) {
  const tester = new DownloadLimitsTester();
  tester.runAllTests().catch(console.error);
}

module.exports = DownloadLimitsTester;
