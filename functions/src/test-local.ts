/**
 * Cloud Functions 로컬 테스트 스크립트
 * 이 파일은 Cloud Functions를 로컬에서 테스트하기 위한 스크립트입니다.
 */

// 메타프롬프트 생성 테스트
async function testPromptGeneration() {
  console.log('\n📝 메타프롬프트 생성 테스트 시작...\n');

  try {
    const { PromptGenerator } = await import('./image-generator/promptGenerator');
    const promptGenerator = new PromptGenerator();

    const prompt = promptGenerator.generate({
      character: {
        name: 'Naruto',
        type: 'anime',
        originCountry: 'japan',
        keywords: ['ninja', 'orange', 'headband'],
      },
      ageGroup: 'teen',
      difficulty: 'medium',
      theme: 'action',
      activity: 'running',
      emotion: 'determined',
    });

    console.log('✅ 메타프롬프트 생성 성공!');
    console.log('📝 메인 프롬프트:', prompt.mainPrompt);
    console.log('🚫 네거티브 프롬프트:', prompt.negativePrompt);
    console.log('📊 메타데이터:', JSON.stringify(prompt.metadata, null, 2));
  } catch (error) {
    console.error('❌ 메타프롬프트 생성 실패:', error);
  }
}

// 이미지 처리 테스트
async function testImageProcessing() {
  console.log('\n🖼️ 이미지 처리 테스트 시작...\n');

  try {
    const { ImageProcessor } = await import('./image-generator/imageProcessor');
    const imageProcessor = new ImageProcessor();

    // 테스트용 Base64 이미지 (1x1 픽셀 PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    const result = await imageProcessor.extractOutline(testImageBase64, 'child', 'easy');

    console.log('✅ 이미지 처리 성공!');
    console.log('📊 결과:', JSON.stringify(result.metadata, null, 2));
  } catch (error) {
    console.error('❌ 이미지 처리 실패:', error);
  }
}

// Imagen 서비스 테스트
async function testImagenService() {
  console.log('\n🤖 Imagen 서비스 테스트 시작...\n');

  try {
    const { ImagenService } = await import('./image-generator/imagenService');
    const imagenService = new ImagenService('test-api-key');

    console.log('✅ Imagen 서비스 초기화 성공!');
    console.log('📝 API 키 설정됨:', imagenService ? 'Yes' : 'No');
  } catch (error) {
    console.error('❌ Imagen 서비스 초기화 실패:', error);
  }
}

// 모든 테스트 실행
async function runAllTests() {
  console.log('🚀 Cloud Functions 로컬 테스트 시작\n');
  console.log('='.repeat(50));

  await testPromptGeneration();
  await testImageProcessing();
  await testImagenService();

  console.log(`\n${  '='.repeat(50)}`);
  console.log('✨ 모든 테스트 완료!');
}

// 테스트 실행
if (require.main === module) {
  runAllTests().catch(console.error);
}

export {
  testPromptGeneration,
  testImageProcessing,
  testImagenService,
  runAllTests,
};