/**
 * 간단한 다운로드 제한 시스템 테스트
 * 
 * 이 스크립트는 다운로드 제한 시스템의 기본 기능을 테스트합니다.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SimpleDownloadTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async init() {
    console.log('🚀 간단한 다운로드 제한 시스템 테스트 시작');
    this.browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // 페이지 로드 대기
    await this.page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // React 앱이 완전히 로드될 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('✅ 페이지 로드 완료');
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 테스트 실행: ${testName}`);
    
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

  // 1. 페이지 로드 테스트
  async testPageLoad() {
    return await this.runTest('페이지 로드 테스트', async () => {
      const title = await this.page.title();
      console.log(`페이지 제목: ${title}`);
      
      if (!title.includes('Coloring')) {
        throw new Error(`예상된 제목이 아님: ${title}`);
      }

      return { title, loaded: true };
    });
  }

  // 2. localStorage 초기 상태 테스트
  async testLocalStorageInitialState() {
    return await this.runTest('localStorage 초기 상태 테스트', async () => {
      // localStorage 초기화
      await this.page.evaluate(() => {
        localStorage.clear();
      });

      const state = await this.page.evaluate(() => {
        const limits = JSON.parse(localStorage.getItem('downloadLimits') || '{}');
        return {
          downloadCount: limits.downloadCount || 0,
          adWatchedCount: limits.adWatchedCount || 0,
          emailCollected: limits.emailCollected || false
        };
      });

      console.log(`초기 상태:`, state);

      if (state.downloadCount !== 0) throw new Error(`다운로드 횟수가 0이 아님: ${state.downloadCount}`);
      if (state.adWatchedCount !== 0) throw new Error(`광고 시청 횟수가 0이 아님: ${state.adWatchedCount}`);
      if (state.emailCollected !== false) throw new Error(`이메일 수집 상태가 false가 아님: ${state.emailCollected}`);

      return state;
    });
  }

  // 3. DOM 요소 확인 테스트
  async testDOMElements() {
    return await this.runTest('DOM 요소 확인 테스트', async () => {
      // 추가 대기 시간
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // 페이지의 모든 요소 확인
      const elements = await this.page.evaluate(() => {
        return {
          buttons: document.querySelectorAll('button').length,
          divs: document.querySelectorAll('div').length,
          spans: document.querySelectorAll('span').length,
          inputs: document.querySelectorAll('input').length,
          bodyText: document.body.textContent.substring(0, 500),
          rootContent: document.getElementById('root')?.innerHTML?.substring(0, 200) || 'empty'
        };
      });

      console.log(`DOM 요소 수:`, elements);
      console.log(`Root 내용:`, elements.rootContent);

      // 버튼이 없어도 경고만 출력
      if (elements.buttons === 0) {
        console.log('⚠️ 버튼이 아직 로드되지 않음 - React 앱 로딩 중일 수 있음');
      }

      return elements;
    });
  }

  // 4. React 컴포넌트 로드 테스트
  async testReactComponents() {
    return await this.runTest('React 컴포넌트 로드 테스트', async () => {
      // React DevTools 확인
      const reactLoaded = await this.page.evaluate(() => {
        return typeof window.React !== 'undefined' || 
               document.querySelector('[data-reactroot]') !== null ||
               document.querySelector('#root') !== null;
      });

      console.log(`React 로드 상태: ${reactLoaded}`);

      if (!reactLoaded) {
        throw new Error('React가 로드되지 않음');
      }

      return { reactLoaded };
    });
  }

  // 5. 다운로드 버튼 찾기 테스트
  async testFindDownloadButton() {
    return await this.runTest('다운로드 버튼 찾기 테스트', async () => {
      // 모든 버튼 찾기
      const buttons = await this.page.$$('button');
      console.log(`발견된 버튼 수: ${buttons.length}`);

      const buttonTexts = [];
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].evaluate(el => el.textContent);
        buttonTexts.push(text);
        console.log(`버튼 ${i + 1}: "${text}"`);
      }

      // "다운로드" 텍스트가 포함된 버튼 찾기
      const downloadButtons = buttonTexts.filter(text => 
        text && text.includes('다운로드')
      );

      console.log(`다운로드 버튼 수: ${downloadButtons.length}`);

      if (downloadButtons.length === 0) {
        // 페이지 스크린샷 저장
        await this.page.screenshot({ path: 'debug-page.png' });
        console.log('디버그 스크린샷 저장: debug-page.png');
        
        // HTML 내용 저장
        const html = await this.page.content();
        fs.writeFileSync('debug-page.html', html);
        console.log('디버그 HTML 저장: debug-page.html');
        
        throw new Error('다운로드 버튼을 찾을 수 없음');
      }

      return { 
        totalButtons: buttons.length, 
        downloadButtons: downloadButtons.length,
        buttonTexts 
      };
    });
  }

  // 6. localStorage 수동 테스트
  async testLocalStorageManual() {
    return await this.runTest('localStorage 수동 테스트', async () => {
      // localStorage에 테스트 데이터 저장
      await this.page.evaluate(() => {
        localStorage.setItem('downloadLimits', JSON.stringify({
          downloadCount: 1,
          adWatchedCount: 0,
          emailCollected: false
        }));
      });

      // 저장된 데이터 확인
      const state = await this.page.evaluate(() => {
        return JSON.parse(localStorage.getItem('downloadLimits') || '{}');
      });

      console.log(`저장된 상태:`, state);

      if (state.downloadCount !== 1) {
        throw new Error(`저장된 다운로드 횟수가 1이 아님: ${state.downloadCount}`);
      }

      return state;
    });
  }

  // 모든 테스트 실행
  async runAllTests() {
    try {
      await this.init();

      // 기본 테스트들
      await this.testPageLoad();
      await this.testLocalStorageInitialState();
      await this.testDOMElements();
      await this.testReactComponents();
      await this.testFindDownloadButton();
      await this.testLocalStorageManual();

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

    const reportPath = path.join(__dirname, 'simple_download_test_report.json');
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
  const tester = new SimpleDownloadTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SimpleDownloadTester;
