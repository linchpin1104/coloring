/**
 * 다국어 검색 기능 QA 테스트 스크립트
 * 
 * 이 스크립트는 다국어 검색 시스템의 모든 기능을 테스트합니다.
 * - 언어 감지 및 번역 테스트
 * - 검색어 확장 테스트
 * - 자동완성 테스트
 * - 엣지케이스 테스트
 * - 성능 테스트
 */

const fs = require('fs');
const path = require('path');

class MultilingualSearchTester {
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

  // 1. 언어 감지 테스트
  async testLanguageDetection() {
    return await this.runTest('언어 감지 테스트', async () => {
      const testCases = [
        { input: '안녕하세요', expected: 'ko', description: '한국어' },
        { input: 'Hello world', expected: 'en', description: '영어' },
        { input: 'Hola mundo', expected: 'es', description: '스페인어' },
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
            id: `BUG-LANG-${testCase.input}`,
            testCase: testCase,
            expected: testCase.expected,
            actual: detected,
            description: `언어 감지 실패: ${testCase.description}`
          });
        }
      }

      console.log('\n📊 언어 감지 결과:');
      console.log('입력 | 예상 | 실제 | 상태 | 설명');
      console.log('-----|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.input.padStart(10)} | ${result.expected.padStart(4)} | ${result.actual.padStart(4)} | ${status} | ${result.description}`);
      });

      return results;
    });
  }

  // 언어 감지 함수 (실제 구현 시뮬레이션)
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
    
    // 스페인어 감지 (간단한 패턴)
    if (/[ñáéíóúü]/i.test(text)) {
      return 'es';
    }
    
    // 기본값은 영어
    return 'en';
  }

  // 2. 캐릭터 이름 번역 테스트
  async testCharacterTranslation() {
    return await this.runTest('캐릭터 이름 번역 테스트', async () => {
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
        '피카츄': {
          ko: '피카츄',
          en: 'Pikachu',
          es: 'Pikachu',
          ja: 'ピカチュウ',
          zh: '皮卡丘',
        },
        '배트맨': {
          ko: '배트맨',
          en: 'Batman',
          es: 'Batman',
          ja: 'バットマン',
          zh: '蝙蝠侠',
        },
      };

      const results = [];
      for (const [koreanName, translations] of Object.entries(characterTranslations)) {
        for (const [lang, translatedName] of Object.entries(translations)) {
          const translated = this.translateCharacterName(koreanName, lang);
          const passed = translated === translatedName;
          
          results.push({
            korean: koreanName,
            language: lang,
            expected: translatedName,
            actual: translated,
            passed
          });

          if (!passed) {
            this.bugs.push({
              id: `BUG-CHAR-${koreanName}-${lang}`,
              testCase: { koreanName, lang, expected: translatedName, actual: translated },
              expected: translatedName,
              actual: translated,
              description: `캐릭터 이름 번역 실패: ${koreanName} → ${lang}`
            });
          }
        }
      }

      console.log('\n📊 캐릭터 이름 번역 결과:');
      console.log('한국어 | 언어 | 예상 | 실제 | 상태');
      console.log('-------|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.korean.padStart(8)} | ${result.language.padStart(4)} | ${result.expected.padStart(8)} | ${result.actual.padStart(8)} | ${status}`);
      });

      return results;
    });
  }

  // 캐릭터 이름 번역 함수 (실제 구현 시뮬레이션)
  translateCharacterName(koreanName, targetLanguage) {
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
      '피카츄': {
        ko: '피카츄',
        en: 'Pikachu',
        es: 'Pikachu',
        ja: 'ピカチュウ',
        zh: '皮卡丘',
      },
      '배트맨': {
        ko: '배트맨',
        en: 'Batman',
        es: 'Batman',
        ja: 'バットマン',
        zh: '蝙蝠侠',
      },
    };

    return characterTranslations[koreanName]?.[targetLanguage] || koreanName;
  }

  // 3. 테마 번역 테스트
  async testThemeTranslation() {
    return await this.runTest('테마 번역 테스트', async () => {
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
        '꽃': {
          ko: '꽃',
          en: 'Flowers',
          es: 'Flores',
          ja: '花',
          zh: '花朵',
        },
        '음식': {
          ko: '음식',
          en: 'Food',
          es: 'Comida',
          ja: '食べ物',
          zh: '食物',
        },
      };

      const results = [];
      for (const [koreanTheme, translations] of Object.entries(themeTranslations)) {
        for (const [lang, translatedTheme] of Object.entries(translations)) {
          const translated = this.translateTheme(koreanTheme, lang);
          const passed = translated === translatedTheme;
          
          results.push({
            korean: koreanTheme,
            language: lang,
            expected: translatedTheme,
            actual: translated,
            passed
          });

          if (!passed) {
            this.bugs.push({
              id: `BUG-THEME-${koreanTheme}-${lang}`,
              testCase: { koreanTheme, lang, expected: translatedTheme, actual: translated },
              expected: translatedTheme,
              actual: translated,
              description: `테마 번역 실패: ${koreanTheme} → ${lang}`
            });
          }
        }
      }

      console.log('\n📊 테마 번역 결과:');
      console.log('한국어 | 언어 | 예상 | 실제 | 상태');
      console.log('-------|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.korean.padStart(8)} | ${result.language.padStart(4)} | ${result.expected.padStart(8)} | ${result.actual.padStart(8)} | ${status}`);
      });

      return results;
    });
  }

  // 테마 번역 함수 (실제 구현 시뮬레이션)
  translateTheme(koreanTheme, targetLanguage) {
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
      '꽃': {
        ko: '꽃',
        en: 'Flowers',
        es: 'Flores',
        ja: '花',
        zh: '花朵',
      },
      '음식': {
        ko: '음식',
        en: 'Food',
        es: 'Comida',
        ja: '食べ物',
        zh: '食物',
      },
    };

    return themeTranslations[koreanTheme]?.[targetLanguage] || koreanTheme;
  }

  // 4. 다국어 검색어 생성 테스트
  async testMultilingualSearchTerms() {
    return await this.runTest('다국어 검색어 생성 테스트', async () => {
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
            id: `BUG-MULTI-${testCase.input}`,
            testCase: testCase,
            expected: testCase.expected,
            actual: generated,
            description: `다국어 검색어 생성 실패: ${testCase.description}`
          });
        }
      }

      console.log('\n📊 다국어 검색어 생성 결과:');
      console.log('입력 | 예상 | 실제 | 상태 | 설명');
      console.log('-----|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.input.padStart(8)} | ${result.expected.length}개 | ${result.actual.length}개 | ${status} | ${result.description}`);
      });

      return results;
    });
  }

  // 다국어 검색어 생성 함수 (실제 구현 시뮬레이션)
  generateMultilingualSearchTerms(query) {
    const terms = [query];
    
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

    return [...new Set(terms)]; // 중복 제거
  }

  // 5. 검색어 확장 테스트
  async testSearchTermExpansion() {
    return await this.runTest('검색어 확장 테스트', async () => {
      const testCases = [
        {
          input: '색칠',
          expected: ['색칠', 'coloring', 'colorear', '塗り絵', '涂色', '도안', '그리기', '색칠공부', '컬러링'],
          description: '색칠 관련 키워드 확장'
        },
        {
          input: 'drawing',
          expected: ['drawing', '색칠', 'coloring', 'colorear', '塗り絵', '涂色', '도안', '그리기', '색칠공부', '컬러링'],
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
            id: `BUG-EXPAND-${testCase.input}`,
            testCase: testCase,
            expected: testCase.expected,
            actual: expanded,
            description: `검색어 확장 실패: ${testCase.description}`
          });
        }
      }

      console.log('\n📊 검색어 확장 결과:');
      console.log('입력 | 예상 | 실제 | 상태 | 설명');
      console.log('-----|------|------|------|------');
      results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${result.input.padStart(8)} | ${result.expected.length}개 | ${result.actual.length}개 | ${status} | ${result.description}`);
      });

      return results;
    });
  }

  // 검색어 확장 함수 (실제 구현 시뮬레이션)
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

    return [...new Set(terms)];
  }

  // 6. 엣지케이스 테스트
  async testEdgeCases() {
    return await this.runTest('엣지케이스 테스트', async () => {
      const testCases = [
        {
          input: '',
          description: '빈 문자열',
          shouldHandle: true
        },
        {
          input: '   ',
          description: '공백만 있는 문자열',
          shouldHandle: true
        },
        {
          input: '!@#$%',
          description: '특수문자만 있는 문자열',
          shouldHandle: true
        },
        {
          input: '123456',
          description: '숫자만 있는 문자열',
          shouldHandle: true
        },
        {
          input: '도라에몽 Doraemon ドラえもん',
          description: '혼합 언어 문자열',
          shouldHandle: true
        },
        {
          input: 'a'.repeat(1000),
          description: '매우 긴 문자열',
          shouldHandle: true
        },
      ];

      const results = [];
      for (const testCase of testCases) {
        try {
          const detected = this.detectLanguage(testCase.input);
          const expanded = this.expandSearchTerms(testCase.input);
          const handled = detected !== null && expanded.length > 0;
          
          results.push({
            input: testCase.input.substring(0, 20) + (testCase.input.length > 20 ? '...' : ''),
            description: testCase.description,
            handled,
            detected,
            expandedCount: expanded.length
          });

          if (!handled && testCase.shouldHandle) {
            this.bugs.push({
              id: `BUG-EDGE-${testCase.description}`,
              testCase: testCase,
              expected: 'handled',
              actual: 'not handled',
              description: `엣지케이스 처리 실패: ${testCase.description}`
            });
          }
        } catch (error) {
          results.push({
            input: testCase.input.substring(0, 20) + (testCase.input.length > 20 ? '...' : ''),
            description: testCase.description,
            handled: false,
            error: error.message
          });

          if (testCase.shouldHandle) {
            this.bugs.push({
              id: `BUG-EDGE-ERROR-${testCase.description}`,
              testCase: testCase,
              expected: 'no error',
              actual: error.message,
              description: `엣지케이스 오류: ${testCase.description}`
            });
          }
        }
      }

      console.log('\n📊 엣지케이스 처리 결과:');
      console.log('입력 | 설명 | 처리됨 | 감지된언어 | 확장개수');
      console.log('-----|------|--------|-----------|--------');
      results.forEach(result => {
        const status = result.handled ? '✅' : '❌';
        console.log(`${result.input.padStart(20)} | ${result.description.padStart(12)} | ${status.padStart(6)} | ${(result.detected || 'N/A').padStart(8)} | ${(result.expandedCount || 0).toString().padStart(6)}`);
      });

      return results;
    });
  }

  // 7. 성능 테스트
  async testPerformance() {
    return await this.runTest('성능 테스트', async () => {
      const iterations = 1000;
      const testQueries = [
        '도라에몽',
        'Doraemon',
        'ドラえもん',
        '哆啦A梦',
        '색칠공부',
        'coloring',
        'colorear',
        '塗り絵',
        '涂色',
        '동물',
        'Animals',
        'Animales',
        '動物',
        '动物'
      ];

      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const query = testQueries[i % testQueries.length];
        this.detectLanguage(query);
        this.generateMultilingualSearchTerms(query);
        this.expandSearchTerms(query);
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
    console.log('🚀 다국어 검색 기능 QA 테스트 시작\n');
    
    try {
      // 1. 언어 감지 테스트
      await this.testLanguageDetection();
      
      // 2. 캐릭터 이름 번역 테스트
      await this.testCharacterTranslation();
      
      // 3. 테마 번역 테스트
      await this.testThemeTranslation();
      
      // 4. 다국어 검색어 생성 테스트
      await this.testMultilingualSearchTerms();
      
      // 5. 검색어 확장 테스트
      await this.testSearchTermExpansion();
      
      // 6. 엣지케이스 테스트
      await this.testEdgeCases();
      
      // 7. 성능 테스트
      await this.testPerformance();
      
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
        characterTranslation: this.bugs.filter(b => b.id.includes('CHAR')).length,
        themeTranslation: this.bugs.filter(b => b.id.includes('THEME')).length,
        multilingualTerms: this.bugs.filter(b => b.id.includes('MULTI')).length,
        searchExpansion: this.bugs.filter(b => b.id.includes('EXPAND')).length,
        edgeCases: this.bugs.filter(b => b.id.includes('EDGE')).length,
        performance: this.bugs.filter(b => b.id.includes('PERF')).length
      }
    };

    const reportPath = path.join(__dirname, 'multilingual_search_test_report.json');
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
      console.log('\n✅ 발견된 버그 없음 - 모든 기능이 정상 작동');
    }
    
    console.log(`\n📄 상세 보고서: ${reportPath}`);

    return report;
  }
}

// 테스트 실행
if (require.main === module) {
  const tester = new MultilingualSearchTester();
  tester.runAllTests().catch(console.error);
}

module.exports = MultilingualSearchTester;

