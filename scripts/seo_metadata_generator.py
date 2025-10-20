#!/usr/bin/env python3
"""
SEO 최적화된 다국어 메타데이터 생성기
5개 언어 지원: 한국어, 영어, 스페인어, 일본어, 중국어
"""

import json
import re
from typing import Dict, List, Any
from datetime import datetime
from image_crawler_generator import ImageCrawlerGenerator

class SEOMetadataGenerator:
    def __init__(self):
        self.generator = ImageCrawlerGenerator()
        self.languages = {
            'ko': '한국어',
            'en': 'English', 
            'es': 'Español',
            'ja': '日本語',
            'zh': '中文'
        }
        
        # 캐릭터별 다국어 키워드 매핑
        self.character_keywords = {
            '하츄핑': {
                'ko': ['하츄핑', '티니핑', '색칠놀이', '어린이', '캐릭터', '핑크', '하트', '마법소녀'],
                'en': ['Hachuping', 'TiniPing', 'coloring page', 'children', 'character', 'pink', 'heart', 'magical girl'],
                'es': ['Hachuping', 'TiniPing', 'página para colorear', 'niños', 'personaje', 'rosa', 'corazón', 'chica mágica'],
                'ja': ['ハチュピン', 'ティニピン', 'ぬりえ', '子供', 'キャラクター', 'ピンク', 'ハート', '魔法少女'],
                'zh': ['哈秋萍', '蒂尼萍', '涂色页', '儿童', '角色', '粉色', '心形', '魔法少女']
            },
            '아이언미야옹': {
                'ko': ['아이언미야옹', '운빨존만겜', '색칠놀이', '고양이', '게임', '행운', '아이언맨'],
                'en': ['Iron Meowong', 'Lucky Game', 'coloring page', 'cat', 'game', 'lucky', 'iron man'],
                'es': ['Iron Meowong', 'Juego de Suerte', 'página para colorear', 'gato', 'juego', 'suerte', 'hombre de hierro'],
                'ja': ['アイアンミャオング', 'ラッキーゲーム', 'ぬりえ', '猫', 'ゲーム', '幸運', 'アイアンマン'],
                'zh': ['铁喵王', '幸运游戏', '涂色页', '猫', '游戏', '幸运', '钢铁侠']
            },
            '도라에몽': {
                'ko': ['도라에몽', '색칠놀이', '로봇고양이', '만화', '일본', '22세기'],
                'en': ['Doraemon', 'coloring page', 'robot cat', 'manga', 'Japan', '22nd century'],
                'es': ['Doraemon', 'página para colorear', 'gato robot', 'manga', 'Japón', 'siglo 22'],
                'ja': ['ドラえもん', 'ぬりえ', 'ロボット猫', '漫画', '日本', '22世紀'],
                'zh': ['哆啦A梦', '涂色页', '机器猫', '漫画', '日本', '22世纪']
            },
            '미키마우스': {
                'ko': ['미키마우스', '디즈니', '색칠놀이', '마우스', '만화', '클래식'],
                'en': ['Mickey Mouse', 'Disney', 'coloring page', 'mouse', 'cartoon', 'classic'],
                'es': ['Mickey Mouse', 'Disney', 'página para colorear', 'ratón', 'dibujos animados', 'clásico'],
                'ja': ['ミッキーマウス', 'ディズニー', 'ぬりえ', 'ネズミ', 'アニメ', 'クラシック'],
                'zh': ['米老鼠', '迪士尼', '涂色页', '老鼠', '卡通', '经典']
            }
        }
    
    def generate_seo_metadata(self, character_name: str, age_group: str, difficulty: str, 
                            image_url: str, page_number: int = 1) -> Dict[str, Any]:
        """SEO 최적화된 다국어 메타데이터 생성"""
        
        # 기본 정보
        base_info = {
            'character_name': character_name,
            'age_group': age_group,
            'difficulty': difficulty,
            'page_number': page_number,
            'image_url': image_url,
            'generated_at': datetime.now().isoformat(),
            'print_size': 'A4',
            'resolution': '300DPI',
            'dimensions': {
                'width': 2480,  # A4 at 300DPI
                'height': 3508,
                'unit': 'pixels'
            }
        }
        
        # 다국어 메타데이터 생성
        multilingual_metadata = {}
        
        for lang_code, lang_name in self.languages.items():
            metadata = self._generate_language_metadata(
                character_name, age_group, difficulty, page_number, lang_code
            )
            multilingual_metadata[lang_code] = metadata
        
        return {
            'base_info': base_info,
            'multilingual_metadata': multilingual_metadata,
            'seo_optimized': True,
            'print_ready': True
        }
    
    def _generate_language_metadata(self, character_name: str, age_group: str, 
                                  difficulty: str, page_number: int, lang_code: str) -> Dict[str, Any]:
        """특정 언어의 메타데이터 생성"""
        
        # 캐릭터별 키워드 가져오기
        keywords = self.character_keywords.get(character_name, {}).get(lang_code, [character_name])
        
        # 연령대별 키워드 추가
        age_keywords = self._get_age_keywords(age_group, lang_code)
        difficulty_keywords = self._get_difficulty_keywords(difficulty, lang_code)
        
        # 모든 키워드 결합
        all_keywords = keywords + age_keywords + difficulty_keywords
        
        # 제목 생성
        title = self._generate_title(character_name, age_group, difficulty, page_number, lang_code)
        
        # 설명 생성
        description = self._generate_description(character_name, age_group, difficulty, lang_code)
        
        # SEO 메타데이터
        seo_metadata = {
            'title': title,
            'description': description,
            'keywords': all_keywords,
            'og_title': title,
            'og_description': description,
            'twitter_title': title,
            'twitter_description': description,
            'canonical_url': f"/coloring-pages/{character_name.lower()}-{page_number}",
            'meta_robots': 'index, follow',
            'language': lang_code,
            'content_type': 'coloring_page',
            'print_optimized': True
        }
        
        # 구조화된 데이터 (JSON-LD)
        structured_data = self._generate_structured_data(
            character_name, age_group, difficulty, page_number, lang_code, title, description
        )
        
        return {
            'seo_metadata': seo_metadata,
            'structured_data': structured_data,
            'alt_text': self._generate_alt_text(character_name, age_group, lang_code),
            'file_naming': self._generate_file_naming(character_name, page_number, lang_code)
        }
    
    def _get_age_keywords(self, age_group: str, lang_code: str) -> List[str]:
        """연령대별 키워드"""
        age_keywords = {
            'child': {
                'ko': ['어린이', '유아', '색칠공부', '교육'],
                'en': ['children', 'kids', 'educational', 'learning'],
                'es': ['niños', 'educativo', 'aprendizaje'],
                'ja': ['子供', '教育', '学習'],
                'zh': ['儿童', '教育', '学习']
            },
            'teen': {
                'ko': ['청소년', '중학생', '고등학생', '취미'],
                'en': ['teenager', 'teen', 'hobby', 'relaxation'],
                'es': ['adolescente', 'hobby', 'relajación'],
                'ja': ['ティーン', '趣味', 'リラックス'],
                'zh': ['青少年', '爱好', '放松']
            },
            'adult': {
                'ko': ['성인', '스트레스해소', '명상', '치료'],
                'en': ['adult', 'stress relief', 'meditation', 'therapy'],
                'es': ['adulto', 'alivio del estrés', 'meditación', 'terapia'],
                'ja': ['大人', 'ストレス解消', '瞑想', 'セラピー'],
                'zh': ['成人', '减压', '冥想', '治疗']
            }
        }
        
        return age_keywords.get(age_group, {}).get(lang_code, [])
    
    def _get_difficulty_keywords(self, difficulty: str, lang_code: str) -> List[str]:
        """난이도별 키워드"""
        difficulty_keywords = {
            'easy': {
                'ko': ['쉬운', '초급', '간단한', '기본'],
                'en': ['easy', 'beginner', 'simple', 'basic'],
                'es': ['fácil', 'principiante', 'simple', 'básico'],
                'ja': ['簡単', '初心者', 'シンプル', '基本'],
                'zh': ['简单', '初学者', '基础']
            },
            'medium': {
                'ko': ['중급', '보통', '적당한'],
                'en': ['medium', 'intermediate', 'moderate'],
                'es': ['medio', 'intermedio', 'moderado'],
                'ja': ['中級', '普通', '適度'],
                'zh': ['中级', '普通', '适中']
            },
            'hard': {
                'ko': ['어려운', '고급', '복잡한', '상세한'],
                'en': ['hard', 'advanced', 'complex', 'detailed'],
                'es': ['difícil', 'avanzado', 'complejo', 'detallado'],
                'ja': ['難しい', '上級', '複雑', '詳細'],
                'zh': ['困难', '高级', '复杂', '详细']
            }
        }
        
        return difficulty_keywords.get(difficulty, {}).get(lang_code, [])
    
    def _generate_title(self, character_name: str, age_group: str, 
                       difficulty: str, page_number: int, lang_code: str) -> str:
        """SEO 최적화된 제목 생성"""
        
        titles = {
            'ko': f"{character_name} 색칠놀이 도안 {page_number} - {age_group}용 {difficulty} 난이도",
            'en': f"{character_name} Coloring Page {page_number} - {age_group} {difficulty} difficulty",
            'es': f"Página para colorear {character_name} {page_number} - {age_group} dificultad {difficulty}",
            'ja': f"{character_name} ぬりえ {page_number} - {age_group} {difficulty} 難易度",
            'zh': f"{character_name} 涂色页 {page_number} - {age_group} {difficulty} 难度"
        }
        
        return titles.get(lang_code, titles['en'])
    
    def _generate_description(self, character_name: str, age_group: str, 
                            difficulty: str, lang_code: str) -> str:
        """SEO 최적화된 설명 생성"""
        
        descriptions = {
            'ko': f"{character_name} 캐릭터의 {age_group}을 위한 {difficulty} 난이도 색칠놀이 도안입니다. A4 사이즈로 프린트 가능하며, 창의력과 집중력을 기를 수 있습니다.",
            'en': f"High-quality {difficulty} difficulty coloring page featuring {character_name} character, perfect for {age_group}. A4 print-ready format for creative and educational activities.",
            'es': f"Página para colorear de alta calidad con el personaje {character_name}, perfecta para {age_group} con dificultad {difficulty}. Formato A4 listo para imprimir.",
            'ja': f"{character_name}キャラクターの{difficulty}難易度ぬりえです。{age_group}向けで、A4サイズで印刷可能です。創造性と集中力を育みます。",
            'zh': f"高质量{character_name}角色涂色页，适合{age_group}，{difficulty}难度。A4尺寸，可打印，培养创造力和专注力。"
        }
        
        return descriptions.get(lang_code, descriptions['en'])
    
    def _generate_alt_text(self, character_name: str, age_group: str, lang_code: str) -> str:
        """접근성을 위한 alt 텍스트 생성"""
        
        alt_texts = {
            'ko': f"{character_name} 캐릭터 {age_group}용 색칠놀이 도안",
            'en': f"{character_name} character coloring page for {age_group}",
            'es': f"Página para colorear del personaje {character_name} para {age_group}",
            'ja': f"{character_name}キャラクターの{age_group}向けぬりえ",
            'zh': f"{character_name}角色{age_group}涂色页"
        }
        
        return alt_texts.get(lang_code, alt_texts['en'])
    
    def _generate_file_naming(self, character_name: str, page_number: int, lang_code: str) -> Dict[str, str]:
        """다국어 파일명 생성"""
        
        # URL 친화적인 파일명
        safe_character = re.sub(r'[^\w\-]', '', character_name.lower())
        
        return {
            'filename': f"{safe_character}_page_{page_number:02d}_{lang_code}",
            'display_name': f"{character_name} Page {page_number} ({self.languages[lang_code]})",
            'url_slug': f"{safe_character}-page-{page_number}-{lang_code}"
        }
    
    def _generate_structured_data(self, character_name: str, age_group: str, 
                                difficulty: str, page_number: int, lang_code: str,
                                title: str, description: str) -> Dict[str, Any]:
        """JSON-LD 구조화된 데이터 생성"""
        
        return {
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            "name": title,
            "description": description,
            "inLanguage": lang_code,
            "creator": {
                "@type": "Organization",
                "name": "Coloring Platform"
            },
            "about": {
                "@type": "Thing",
                "name": character_name
            },
            "audience": {
                "@type": "Audience",
                "audienceType": age_group
            },
            "difficulty": difficulty,
            "printPageSize": "A4",
            "image": {
                "@type": "ImageObject",
                "contentUrl": f"/coloring-pages/{character_name.lower()}-{page_number}.png",
                "width": 2480,
                "height": 3508
            },
            "keywords": self.character_keywords.get(character_name, {}).get(lang_code, []),
            "dateCreated": datetime.now().isoformat(),
            "isAccessibleForFree": True,
            "learningResourceType": "coloring page",
            "educationalLevel": age_group
        }

def main():
    """테스트 실행"""
    print("🎨 SEO 최적화된 다국어 메타데이터 생성기")
    print("=" * 60)
    
    generator = SEOMetadataGenerator()
    
    # 테스트 데이터
    test_cases = [
        ('하츄핑', 'child', 'easy', 'https://example.com/hachuping.jpg', 1),
        ('아이언미야옹', 'teen', 'medium', 'https://example.com/iron_meowong.jpg', 2),
        ('도라에몽', 'adult', 'hard', 'https://example.com/doraemon.jpg', 3)
    ]
    
    for character, age_group, difficulty, image_url, page_num in test_cases:
        print(f"\n🎯 {character} ({age_group}, {difficulty}) 메타데이터 생성 중...")
        
        metadata = generator.generate_seo_metadata(
            character, age_group, difficulty, image_url, page_num
        )
        
        # 결과 저장
        filename = f"seo_metadata_{character}_{page_num}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 메타데이터 생성 완료: {filename}")
        
        # 샘플 출력
        print(f"📝 한국어 제목: {metadata['multilingual_metadata']['ko']['seo_metadata']['title']}")
        print(f"📝 영어 제목: {metadata['multilingual_metadata']['en']['seo_metadata']['title']}")
        print(f"📝 일본어 제목: {metadata['multilingual_metadata']['ja']['seo_metadata']['title']}")

if __name__ == "__main__":
    main()
