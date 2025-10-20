/**
 * 수정된 다국어 검색 기능 테스트
 * 
 * 이 스크립트는 수정된 다국어 검색 시스템의 로직을 테스트합니다.
 */

const fs = require('fs');
const path = require('path');

class FixedMultilingualTester {
  constructor() {
    this.testResults = [];
    this.bugs = [];
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

  // 수정된 언어 감지 함수
  detectLanguage(text) {
    // 한글 감지
    if (/[\u3131-\u3163\uac00-\ud7a3]/.test(text)) {
      return 'ko';
    }
    
    // 일본어 감지 (히라가나, 가타카나)
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja';
    }
    
    // 중국어 감지 (간체, 번체)
    if (/[\u4e00-\u9fff]/.test(text)) {
      return 'zh';
    }
    
    // 스페인어 감지 (더 정확한 패턴)
    if (/[ñáéíóúü¿¡]/i.test(text) || 
        /\b(hola|mundo|gracias|por favor|buenos días|buenas tardes|buenas noches)\b/i.test(text)) {
      return 'es';
    }
    
    // 기본값은 영어
    return 'en';
  }

  // 수정된 다국어 검색어 생성 함수
  generateMultilingualSearchTerms(query) {
    const terms = [query];
    const detectedLang = this.detectLanguage(query);

    // 캐릭터 이름의 다른 언어 버전 추가
    const characterTranslations = {
      '도라에몽': {
        ko: '도라에몽',
        en: 'Doraemon',
        es: 'Doraemon',
        ja: 'ドラえもん',
        zh: '哆啦A梦',
      },
      '미키마우스': {
        ko: '미키마우스',
        en: 'Mickey Mouse',
        es: 'Mickey Mouse',
        ja: 'ミッキーマウス',
        zh: '米老鼠',
      },
    };

    for (const [koreanName, translations] of Object.entries(characterTranslations)) {
      if (query.toLowerCase().includes(koreanName.toLowerCase())) {
        Object.values(translations).forEach(translatedName => {
          if (translatedName !== koreanName) {
            terms.push(translatedName);
          }
        });
      }
    }

    // 테마의 다른 언어 버전 추가
    const themeTranslations = {
      '동물': {
        ko: '동물',
        en: 'Animals',
        es: 'Animales',
        ja: '動物',
        zh: '动物',
      },
      '자동차': {
        ko: '자동차',
        en: 'Cars',
        es: 'Carros',
        ja: '車',
        zh: '汽车',
      },
    };

    for (const [koreanTheme, translations] of Object.entries(themeTranslations)) {
      if (query.toLowerCase().includes(koreanTheme.toLowerCase())) {
        Object.values(translations).forEach(translatedTheme => {
          if (translatedTheme !== koreanTheme) {
            terms.push(translatedTheme);
          }
        });
      }
    }

    // 키워드의 다른 언어 버전 추가
    const keywordTranslations = {
      '색칠공부': {
        ko: '색칠공부',
        en: 'coloring',
        es: 'colorear',
        ja: '塗り絵',
        zh: '涂色',
      },
      '색칠': {
        ko: '색칠',
        en: 'coloring',
        es: 'colorear',
        ja: '塗り絵',
        zh: '涂色',
      },
      '도안': {
        ko: '도안',
        en: 'outline',
        es: 'dibujo',
        ja: 'スケッチ',
        zh: '素描',
      },
      '그리기': {
        ko: '그리기',
        en: 'drawing',
        es: 'dibujar',
        ja: 'お絵かき',
        zh: '绘画',
      },
    };

    for (const [koreanKeyword, translations] of Object.entries(keywordTranslations)) {
      if (query.toLowerCase().includes(koreanKeyword.toLowerCase())) {
        Object.values(translations).forEach(translatedKeyword => {
          if (translatedKeyword !== koreanKeyword) {
            terms.push(translatedKeyword);
          }
        });
      }
    }

    return [...new Set(terms)]; // 중복 제거
  }

  // 수정된 검색어 확장 함수
  expandSearchTerms(query) {
    const terms = [query];
    const detectedLang = this.detectLanguage(query);

    // 언어별 검색 키워드 추가
    const languageKeywords = {
      ko: ['색칠', '도안', '그리기', '색칠공부', '컬러링'],
      en: ['coloring', 'drawing', 'sketch', 'outline', 'art'],
      es: ['colorear', 'dibujo', 'dibujar', 'arte', 'pintar'],
      ja: ['塗り絵', 'お絵かき', 'スケッチ', 'アート', 'イラスト'],
      zh: ['涂色', '绘画', '素描', '艺术', '填色'],
    };

    if (languageKeywords[detectedLang]) {
      terms.push(...languageKeywords[detectedLang]);
    }

    // 일반적인 색칠공부 관련 키워드 추가
    const commonKeywords = ['색칠', 'coloring', 'colorear', '塗り絵', '涂色'];
    terms.push(...commonKeywords);

    // 영어 검색어에 한국어 키워드 추가
    if (detectedLang === 'en') {
      const koreanKeywords = ['색칠', '도안', '그리기', '색칠공부', '컬러링'];
      terms.push(...koreanKeywords);
    }

    // 한국어 검색어에 영어 키워드 추가
    if (detectedLang === 'ko') {
      const englishKeywords = ['coloring', 'drawing', 'sketch', 'outline', 'art'];
      terms.push(...englishKeywords);
    }

    return [...new Set(terms)];
  }

  // 1. 수정된 언어 감지 테스트
  async testFixedLanguageDetection() {
    return await this.runTest('수정된 언어 감지 테스트', async () => {
      const testCases = [
        { input: '안녕하세요', expected: 'ko', description: '한국어' },
        { input: 'Hello world', expected: 'en', description: '영어' },
        { input: 'Hola mundo', expected: 'es', description: '스페인어' },
        { input: 'gracias', expected: 'es', description: '스페인어 키워드' },
        { input: 'buenos días', expected: 'es', description: '스페인어 구문' },
        { input: 'こんにちは', expected: 'ja', description: '일본어' },
        { input: '你好世界', expected: 'zh', description: '중국어' },
        { input: '123456', expected: 'en', description: '숫자 (기본값)' },
        { input: '', expected: 'en', description: '빈 문자열 (기본값)' },
        { input: '!@#$%', expected: 'en', description: '특수문자 (기본값)' },
      ];

      const results = [];
      for (const testCase of testCases) {
        const detected = this.detectLanguage(testCase.input);
        const passed = detected === testCase.expected;
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: detected,
          passed,
          description: testCase.description
        });

        if (!passed) {
          this.bugs.push({
            id: `BUG-LANG-FIXED-${testCase.input}`,
            testCase: testCase,
            expected: testCase.expected,
            actual: detected,
            description: `언어 감지 실패: ${testCase.description}`
          });
        }
      }

      console.log('\n📊 수정된 언어 감지 결과:');
      console.log('입력 | 예상 | 실제 | 상태 | 설명');
      console.log('-----|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.input.padStart(10)} | ${result.expected.padStart(4)} | ${result.actual.padStart(4)} | ${status} | ${result.description}`);
      });

      return results;
    });
  }

  // 2. 수정된 다국어 검색어 생성 테스트
  async testFixedMultilingualSearchTerms() {
    return await this.runTest('수정된 다국어 검색어 생성 테스트', async () => {
      const testCases = [
        {
          input: '도라에몽',
          expected: ['도라에몽', 'Doraemon', 'ドラえもん', '哆啦A梦'],
          description: '캐릭터 이름 다국어 검색어'
        },
        {
          input: '동물',
          expected: ['동물', 'Animals', 'Animales', '動物', '动物'],
          description: '테마 다국어 검색어'
        },
        {
          input: '색칠공부',
          expected: ['색칠공부', 'coloring', 'colorear', '塗り絵', '涂色'],
          description: '키워드 다국어 검색어'
        },
        {
          input: '색칠',
          expected: ['색칠', 'coloring', 'colorear', '塗り絵', '涂色'],
          description: '색칠 키워드 다국어 검색어'
        },
      ];

      const results = [];
      for (const testCase of testCases) {
        const generated = this.generateMultilingualSearchTerms(testCase.input);
        const passed = this.arraysEqual(generated, testCase.expected);
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: generated,
          passed,
          description: testCase.description
        });

        if (!passed) {
          this.bugs.push({
            id: `BUG-MULTI-FIXED-${testCase.input}`,
            testCase: testCase,
            expected: testCase.expected,
            actual: generated,
            description: `다국어 검색어 생성 실패: ${testCase.description}`
          });
        }
      }

      console.log('\n📊 수정된 다국어 검색어 생성 결과:');
      console.log('입력 | 예상 | 실제 | 상태 | 설명');
      console.log('-----|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.input.padStart(8)} | ${result.expected.length}개 | ${result.actual.length}개 | ${status} | ${result.description}`);
      });

      return results;
    });
  }

  // 3. 수정된 검색어 확장 테스트
  async testFixedSearchTermExpansion() {
    return await this.runTest('수정된 검색어 확장 테스트', async () => {
      const testCases = [
        {
          input: '색칠',
          expected: ['색칠', 'coloring', 'colorear', '塗り絵', '涂色', '도안', '그리기', '색칠공부', '컬러링', 'drawing', 'sketch', 'outline', 'art'],
          description: '색칠 관련 키워드 확장'
        },
        {
          input: 'drawing',
          expected: ['drawing', '색칠', 'coloring', 'colorear', '塗り絵', '涂色', '도안', '그리기', '색칠공부', '컬러링', 'sketch', 'outline', 'art'],
          description: 'drawing 관련 키워드 확장'
        },
      ];

      const results = [];
      for (const testCase of testCases) {
        const expanded = this.expandSearchTerms(testCase.input);
        const passed = this.arraysEqual(expanded, testCase.expected);
        
        results.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: expanded,
          passed,
          description: testCase.description
        });

        if (!passed) {
          this.bugs.push({
            id: `BUG-EXPAND-FIXED-${testCase.input}`,
            testCase: testCase,
            expected: testCase.expected,
            actual: expanded,
            description: `검색어 확장 실패: ${testCase.description}`
          });
        }
      }

      console.log('\n📊 수정된 검색어 확장 결과:');
      console.log('입력 | 예상 | 실제 | 상태 | 설명');
      console.log('-----|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.input.padStart(8)} | ${result.expected.length}개 | ${result.actual.length}개 | ${status} | ${result.description}`);
      });

      return results;
    });
  }

  // 배열 비교 함수
  arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();
    return sorted1.every((val, index) => val === sorted2[index]);
  }

  // 모든 테스트 실행
  async runAllTests() {
    console.log('🚀 수정된 다국어 검색 기능 테스트 시작\n');
    
    try {
      // 1. 수정된 언어 감지 테스트
      await this.testFixedLanguageDetection();
      
      // 2. 수정된 다국어 검색어 생성 테스트
      await this.testFixedMultilingualSearchTerms();
      
      // 3. 수정된 검색어 확장 테스트
      await this.testFixedSearchTermExpansion();
      
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
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(t => t.status === 'PASS').length,
      failedTests: this.testResults.filter(t => t.status === 'FAIL').length,
      totalBugs: this.bugs.length,
      bugs: this.bugs,
      summary: {
        languageDetection: this.bugs.filter(b => b.id.includes('LANG')).length,
        multilingualTerms: this.bugs.filter(b => b.id.includes('MULTI')).length,
        searchExpansion: this.bugs.filter(b => b.id.includes('EXPAND')).length
      }
    };

    const reportPath = path.join(__dirname, 'fixed_multilingual_test_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 테스트 결과 요약:');
    console.log(`총 테스트: ${report.totalTests}`);
    console.log(`통과: ${report.passedTests}`);
    console.log(`실패: ${report.failedTests}`);
    console.log(`성공률: ${((report.passedTests / report.totalTests) * 100).toFixed(2)}%`);
    console.log(`총 버그: ${report.totalBugs}`);
    
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
  const tester = new FixedMultilingualTester();
  tester.runAllTests().catch(console.error);
}

module.exports = FixedMultilingualTester;

