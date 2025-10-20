#!/usr/bin/env python3
"""
SEO 최적화 및 A4 프린트 최적화된 이미지 생성기
다국어 지원 (5개 언어) + A4 사이즈 최적화
"""

import os
import json
from datetime import datetime
from image_crawler_generator import ImageCrawlerGenerator
from seo_metadata_generator import SEOMetadataGenerator

class EnhancedImageGenerator:
    def __init__(self):
        self.image_generator = ImageCrawlerGenerator()
        self.seo_generator = SEOMetadataGenerator()
        
    def generate_enhanced_coloring_pages(self, character_name: str, age_group: str, 
                                       difficulty: str, count: int = 10) -> str:
        """SEO 최적화 및 A4 프린트 최적화된 색칠도안 생성"""
        
        print(f"🎨 SEO 최적화 + A4 프린트 최적화 색칠도안 생성")
        print(f"캐릭터: {character_name}, 연령대: {age_group}, 난이도: {difficulty}")
        print("=" * 70)
        
        # 1. 기존 이미지 생성
        result_file = self.image_generator.generate_coloring_pages(
            character_name=character_name,
            age_group=age_group,
            difficulty=difficulty,
            count=count
        )
        
        if not result_file:
            print("❌ 이미지 생성 실패")
            return None
        
        # 2. 생성된 결과 로드
        with open(result_file, 'r', encoding='utf-8') as f:
            result_data = json.load(f)
        
        # 3. 각 페이지에 대해 SEO 메타데이터 생성
        enhanced_pages = []
        
        for i, page in enumerate(result_data.get('generated_pages', []), 1):
            print(f"\\n📝 페이지 {i} SEO 메타데이터 생성 중...")
            
            # SEO 메타데이터 생성
            seo_metadata = self.seo_generator.generate_seo_metadata(
                character_name=character_name,
                age_group=age_group,
                difficulty=difficulty,
                image_url=page.get('firebase_url', ''),
                page_number=i
            )
            
            # 페이지 데이터에 SEO 메타데이터 추가
            enhanced_page = {
                **page,
                'seo_metadata': seo_metadata,
                'print_optimized': True,
                'a4_size': {
                    'width': 2480,
                    'height': 3508,
                    'dpi': 300,
                    'unit': 'pixels'
                },
                'multilingual_support': list(self.seo_generator.languages.keys())
            }
            
            enhanced_pages.append(enhanced_page)
            
            # 다국어 제목 출력
            print(f"  🇰🇷 한국어: {seo_metadata['multilingual_metadata']['ko']['seo_metadata']['title']}")
            print(f"  🇺🇸 English: {seo_metadata['multilingual_metadata']['en']['seo_metadata']['title']}")
            print(f"  🇪🇸 Español: {seo_metadata['multilingual_metadata']['es']['seo_metadata']['title']}")
            print(f"  🇯🇵 日本語: {seo_metadata['multilingual_metadata']['ja']['seo_metadata']['title']}")
            print(f"  🇨🇳 中文: {seo_metadata['multilingual_metadata']['zh']['seo_metadata']['title']}")
        
        # 4. 향상된 결과 데이터 구성
        enhanced_result = {
            'character_name': character_name,
            'age_group': age_group,
            'difficulty': difficulty,
            'generated_at': datetime.now().isoformat(),
            'total_pages': len(enhanced_pages),
            'seo_optimized': True,
            'print_optimized': True,
            'a4_compatible': True,
            'multilingual_support': list(self.seo_generator.languages.keys()),
            'generated_pages': enhanced_pages,
            'reference_images': result_data.get('reference_images', []),
            'seo_summary': self._generate_seo_summary(enhanced_pages)
        }
        
        # 5. 향상된 결과 저장
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        enhanced_filename = f"enhanced_coloring_pages_{character_name}_{timestamp}.json"
        
        with open(enhanced_filename, 'w', encoding='utf-8') as f:
            json.dump(enhanced_result, f, ensure_ascii=False, indent=2)
        
        print(f"\\n✅ 향상된 색칠도안 생성 완료!")
        print(f"📁 파일: {enhanced_filename}")
        print(f"📊 총 페이지: {len(enhanced_pages)}개")
        print(f"🌍 지원 언어: {len(self.seo_generator.languages)}개")
        print(f"🖨️ A4 프린트 최적화: ✅")
        print(f"🔍 SEO 최적화: ✅")
        
        return enhanced_filename
    
    def _generate_seo_summary(self, enhanced_pages: list) -> dict:
        """SEO 요약 정보 생성"""
        
        # 모든 키워드 수집
        all_keywords = set()
        for page in enhanced_pages:
            for lang_code in self.seo_generator.languages.keys():
                keywords = page['seo_metadata']['multilingual_metadata'][lang_code]['seo_metadata']['keywords']
                all_keywords.update(keywords)
        
        # 언어별 키워드 통계
        keyword_stats = {}
        for lang_code in self.seo_generator.languages.keys():
            lang_keywords = set()
            for page in enhanced_pages:
                keywords = page['seo_metadata']['multilingual_metadata'][lang_code]['seo_metadata']['keywords']
                lang_keywords.update(keywords)
            keyword_stats[lang_code] = list(lang_keywords)
        
        return {
            'total_keywords': len(all_keywords),
            'keywords_by_language': keyword_stats,
            'seo_features': [
                'Multilingual titles and descriptions',
                'Optimized keywords for each language',
                'Open Graph metadata',
                'Twitter Card metadata',
                'Structured data (JSON-LD)',
                'A4 print optimization',
                'Accessibility (Alt text)',
                'URL-friendly file naming'
            ],
            'print_features': [
                'A4 size (210x297mm)',
                '300 DPI resolution',
                '2480x3508 pixels',
                'Print-ready format',
                'Proper margins for printing'
            ]
        }
    
    def generate_sitemap_data(self, enhanced_pages: list) -> dict:
        """사이트맵 데이터 생성"""
        
        sitemap_entries = []
        
        for page in enhanced_pages:
            character_name = page['seo_metadata']['base_info']['character_name']
            page_number = page['seo_metadata']['base_info']['page_number']
            
            # 각 언어별 URL 생성
            for lang_code in self.seo_generator.languages.keys():
                file_naming = page['seo_metadata']['multilingual_metadata'][lang_code]['file_naming']
                
                sitemap_entry = {
                    'url': f"/coloring-pages/{file_naming['url_slug']}",
                    'lastmod': datetime.now().strftime('%Y-%m-%d'),
                    'changefreq': 'weekly',
                    'priority': 0.8,
                    'language': lang_code,
                    'title': page['seo_metadata']['multilingual_metadata'][lang_code]['seo_metadata']['title'],
                    'description': page['seo_metadata']['multilingual_metadata'][lang_code]['seo_metadata']['description']
                }
                
                sitemap_entries.append(sitemap_entry)
        
        return {
            'sitemap_entries': sitemap_entries,
            'total_urls': len(sitemap_entries),
            'languages': list(self.seo_generator.languages.keys()),
            'generated_at': datetime.now().isoformat()
        }

def main():
    """테스트 실행"""
    print("🚀 SEO 최적화 + A4 프린트 최적화 이미지 생성기")
    print("=" * 70)
    
    generator = EnhancedImageGenerator()
    
    # 테스트 케이스
    test_cases = [
        ('하츄핑', 'child', 'easy', 3),
        ('아이언미야옹', 'teen', 'medium', 2),
        ('도라에몽', 'adult', 'hard', 2)
    ]
    
    for character, age_group, difficulty, count in test_cases:
        print(f"\\n🎯 {character} 테스트 시작")
        print("-" * 50)
        
        result_file = generator.generate_enhanced_coloring_pages(
            character, age_group, difficulty, count
        )
        
        if result_file:
            print(f"✅ {character} 생성 완료: {result_file}")
            
            # 사이트맵 데이터 생성
            with open(result_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            sitemap_data = generator.generate_sitemap_data(data['generated_pages'])
            sitemap_file = f"sitemap_{character}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            with open(sitemap_file, 'w', encoding='utf-8') as f:
                json.dump(sitemap_data, f, ensure_ascii=False, indent=2)
            
            print(f"🗺️ 사이트맵 생성: {sitemap_file}")
        else:
            print(f"❌ {character} 생성 실패")

if __name__ == "__main__":
    main()
