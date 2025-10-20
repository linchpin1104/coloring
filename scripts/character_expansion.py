#!/usr/bin/env python3
"""
연관 캐릭터 키워드 수집 및 동적 확장 시스템
"""

import requests
import json
import re
from typing import List, Dict, Set
from image_crawler_generator import ImageCrawlerGenerator

class CharacterExpansionSystem:
    def __init__(self):
        self.generator = ImageCrawlerGenerator()
        self.discovered_characters = set()
        self.character_database = {}
        
    def search_related_characters(self, main_character: str) -> List[str]:
        """메인 캐릭터로부터 연관 캐릭터들 검색"""
        print(f"🔍 {main_character} 연관 캐릭터 검색 중...")
        
        # 다양한 검색 쿼리 시도
        search_queries = [
            f"{main_character} characters",
            f"{main_character} friends",
            f"{main_character} related characters",
            f"{main_character} game characters",
            f"{main_character} cast"
        ]
        
        all_characters = set()
        
        for query in search_queries:
            try:
                # Google Search API로 검색
                search_url = "https://www.googleapis.com/customsearch/v1"
                params = {
                    'key': self.generator.google_search_api_key,
                    'cx': self.generator.google_search_engine_id,
                    'q': query,
                    'searchType': 'web',
                    'num': 10,
                    'safe': 'medium'
                }
                
                response = requests.get(search_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    characters = self.extract_characters_from_search(data, main_character)
                    all_characters.update(characters)
                    
            except Exception as e:
                print(f"⚠️ 검색 쿼리 실패: {query} - {e}")
                
        return list(all_characters)
    
    def extract_characters_from_search(self, search_data: dict, main_character: str) -> List[str]:
        """검색 결과에서 캐릭터 이름 추출"""
        characters = set()
        
        # 검색 결과에서 텍스트 추출
        for item in search_data.get('items', []):
            title = item.get('title', '')
            snippet = item.get('snippet', '')
            text = f"{title} {snippet}"
            
            # 캐릭터 이름 패턴 찾기
            character_patterns = [
                r'([A-Za-z가-힣]+핑)',  # 하츄핑, 라라핑 등
                r'([A-Za-z가-힣]+미야옹)',  # 아이언미야옹 등
                r'([A-Za-z가-힣]+맨)',  # 배트맨, 아이언맨 등
                r'([A-Za-z가-힣]+마우스)',  # 미키마우스 등
                r'([A-Za-z가-힣]+몬)',  # 도라에몽 등
            ]
            
            for pattern in character_patterns:
                matches = re.findall(pattern, text)
                for match in matches:
                    if match != main_character and len(match) > 2:
                        characters.add(match)
        
        return list(characters)
    
    def analyze_character_features(self, character_name: str) -> Dict[str, str]:
        """캐릭터 특징 자동 분석"""
        print(f"🔍 {character_name} 특징 분석 중...")
        
        # 이미지 검색으로 특징 파악
        try:
            image_results = self.generator.search_images(character_name, limit=3)
            if not image_results:
                return self.generate_default_description(character_name)
            
            # Gemini로 특징 분석
            analysis_prompt = f"""
            Analyze this character: {character_name}
            
            Based on the search results, describe the character's:
            1. Physical appearance (colors, clothing, accessories)
            2. Unique features (special items, symbols, design elements)
            3. Character type (superhero, magical girl, robot, etc.)
            4. Origin (game, anime, movie, etc.)
            
            Provide a detailed English description for AI image generation.
            """
            
            # Gemini API 호출 (텍스트 생성)
            if self.generator.gemini_api_key:
                try:
                    response = requests.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.generator.gemini_api_key}",
                        headers={'Content-Type': 'application/json'},
                        json={
                            'contents': [{'parts': [{'text': analysis_prompt}]}]
                        }
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if 'candidates' in result and len(result['candidates']) > 0:
                            description = result['candidates'][0]['content']['parts'][0]['text']
                            return {
                                'name': character_name,
                                'description': description,
                                'discovered_from': 'auto_analysis'
                            }
                except Exception as e:
                    print(f"⚠️ Gemini 분석 실패: {e}")
            
            return self.generate_default_description(character_name)
            
        except Exception as e:
            print(f"⚠️ {character_name} 분석 실패: {e}")
            return self.generate_default_description(character_name)
    
    def generate_default_description(self, character_name: str) -> Dict[str, str]:
        """기본 캐릭터 설명 생성"""
        # 이름 기반으로 기본 특징 추정
        if '핑' in character_name:
            return {
                'name': character_name,
                'description': f"cute character with unique design, playful expression, magical girl style, {character_name} character",
                'discovered_from': 'name_pattern'
            }
        elif '미야옹' in character_name:
            return {
                'name': character_name,
                'description': f"cute cat character with special features, playful expression, game character style, {character_name} character",
                'discovered_from': 'name_pattern'
            }
        else:
            return {
                'name': character_name,
                'description': f"unique character with distinctive features, {character_name} character",
                'discovered_from': 'generic'
            }
    
    def expand_character_database(self, main_character: str) -> Dict[str, Dict]:
        """캐릭터 데이터베이스 동적 확장"""
        print(f"🚀 {main_character} 기반 캐릭터 데이터베이스 확장 시작")
        print("=" * 60)
        
        # 1. 연관 캐릭터 검색
        related_characters = self.search_related_characters(main_character)
        print(f"📋 발견된 연관 캐릭터: {len(related_characters)}개")
        for char in related_characters:
            print(f"  - {char}")
        
        # 2. 각 캐릭터 분석
        expanded_database = {}
        for character in related_characters:
            if character not in self.character_database:
                features = self.analyze_character_features(character)
                expanded_database[character] = features
                print(f"✅ {character} 분석 완료")
            else:
                print(f"⏭️ {character} 이미 존재")
        
        # 3. 데이터베이스 업데이트
        self.character_database.update(expanded_database)
        
        return expanded_database
    
    def generate_coloring_pages_for_discovered(self, discovered_characters: Dict[str, Dict]) -> None:
        """발견된 캐릭터들에 대한 색칠도안 생성"""
        print(f"\n🎨 발견된 캐릭터들 색칠도안 생성")
        print("=" * 50)
        
        for char_name, char_data in discovered_characters.items():
            try:
                print(f"\n🎯 {char_name} 색칠도안 생성 중...")
                
                # 캐릭터 설명을 프롬프트에 추가
                self.generator.character_descriptions = getattr(self.generator, 'character_descriptions', {})
                self.generator.character_descriptions[char_name] = char_data['description']
                
                # 색칠도안 생성
                result_file = self.generator.generate_coloring_pages(
                    character_name=char_name,
                    age_group='child',
                    difficulty='easy',
                    count=2
                )
                
                if result_file:
                    print(f"✅ {char_name} 색칠도안 생성 완료: {result_file}")
                else:
                    print(f"❌ {char_name} 색칠도안 생성 실패")
                    
            except Exception as e:
                print(f"❌ {char_name} 처리 실패: {e}")
    
    def save_character_database(self, filename: str = "character_database.json"):
        """캐릭터 데이터베이스 저장"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.character_database, f, ensure_ascii=False, indent=2)
        print(f"💾 캐릭터 데이터베이스 저장: {filename}")

def main():
    """메인 실행 함수"""
    print("🚀 연관 캐릭터 키워드 수집 및 동적 확장 시스템")
    print("=" * 70)
    
    # 시스템 초기화
    expansion_system = CharacterExpansionSystem()
    
    # 메인 캐릭터로 확장 시작
    main_character = "아이언미야옹"
    
    # 1. 연관 캐릭터 검색 및 분석
    discovered_characters = expansion_system.expand_character_database(main_character)
    
    # 2. 발견된 캐릭터들 색칠도안 생성
    if discovered_characters:
        expansion_system.generate_coloring_pages_for_discovered(discovered_characters)
    
    # 3. 데이터베이스 저장
    expansion_system.save_character_database()
    
    print(f"\n🎉 캐릭터 확장 완료!")
    print(f"📊 총 발견된 캐릭터: {len(discovered_characters)}개")
    print(f"📊 전체 데이터베이스: {len(expansion_system.character_database)}개")

if __name__ == "__main__":
    main()
