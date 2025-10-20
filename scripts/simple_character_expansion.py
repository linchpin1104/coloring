#!/usr/bin/env python3
"""
간단한 연관 캐릭터 확장 시스템
기존 캐릭터 기반으로 관련 캐릭터들을 자동 생성
"""

import json
from typing import Dict, List

class SimpleCharacterExpansion:
    def __init__(self):
        self.character_groups = {
            'TiniPing': {
                'base_characters': ['하츄핑', '라라핑', '바로핑', '차차핑'],
                'patterns': {
                    '핑': 'cute character with unique design, magical girl style, TiniPing character',
                    '핑핑': 'cute character with special accessories, magical girl style, TiniPing character'
                }
            },
            '운빨존만겜': {
                'base_characters': ['아이언미야옹'],
                'patterns': {
                    '미야옹': 'cute cat character with special features, gambling game character, lucky theme',
                    '존만겜': 'lucky gambling character, game mascot style, playful expression'
                }
            },
            'DC_Comics': {
                'base_characters': ['배트맨'],
                'patterns': {
                    '맨': 'superhero character with cape, heroic pose, DC Comics character',
                    '우먼': 'superhero character with special powers, heroic pose, DC Comics character'
                }
            },
            'Disney': {
                'base_characters': ['미키마우스'],
                'patterns': {
                    '마우스': 'cute mouse character, Disney style, friendly expression',
                    '덕': 'cute duck character, Disney style, playful expression'
                }
            }
        }
        
        self.discovered_characters = {}
    
    def expand_from_known_character(self, character_name: str) -> Dict[str, str]:
        """알려진 캐릭터로부터 연관 캐릭터들 확장"""
        print(f"🔍 {character_name} 기반 캐릭터 확장")
        print("=" * 50)
        
        expanded_characters = {}
        
        # 캐릭터가 속한 그룹 찾기
        for group_name, group_data in self.character_groups.items():
            if character_name in group_data['base_characters']:
                print(f"📚 {group_name} 그룹에서 확장 중...")
                
                # 패턴 기반으로 새로운 캐릭터 생성
                for pattern, description in group_data['patterns'].items():
                    if pattern in character_name:
                        # 다양한 변형 생성
                        variations = self.generate_character_variations(character_name, pattern)
                        
                        for variation in variations:
                            if variation != character_name:
                                expanded_characters[variation] = {
                                    'name': variation,
                                    'description': description,
                                    'group': group_name,
                                    'discovered_from': character_name
                                }
                                print(f"  ✅ {variation} 생성")
        
        return expanded_characters
    
    def generate_character_variations(self, base_name: str, pattern: str) -> List[str]:
        """기본 캐릭터 이름으로부터 변형 생성"""
        variations = []
        
        if pattern == '핑':
            # 하츄핑 → 라라핑, 바로핑, 차차핑 등
            prefixes = ['라라', '바로', '차차', '토토', '코코', '모모', '루루', '뽀뽀']
            for prefix in prefixes:
                variations.append(f"{prefix}핑")
        
        elif pattern == '미야옹':
            # 아이언미야옹 → 다른 미야옹들
            prefixes = ['골드', '실버', '브론즈', '다이아', '루비', '사파이어', '에메랄드']
            for prefix in prefixes:
                variations.append(f"{prefix}미야옹")
        
        elif pattern == '맨':
            # 배트맨 → 다른 슈퍼히어로들
            prefixes = ['슈퍼', '스파이더', '아이언', '캡틴', '그린', '플래시', '아쿠아']
            for prefix in prefixes:
                variations.append(f"{prefix}맨")
        
        elif pattern == '마우스':
            # 미키마우스 → 다른 마우스들
            variations = ['미니마우스', '제리마우스', '스튜어트마우스']
        
        return variations
    
    def create_coloring_pages_for_expanded(self, expanded_characters: Dict[str, str]) -> None:
        """확장된 캐릭터들에 대한 색칠도안 생성"""
        print(f"\\n🎨 확장된 캐릭터들 색칠도안 생성")
        print("=" * 50)
        
        from image_crawler_generator import ImageCrawlerGenerator
        generator = ImageCrawlerGenerator()
        
        # 기존 character_descriptions에 추가
        if not hasattr(generator, 'character_descriptions'):
            generator.character_descriptions = {}
        
        for char_name, char_data in expanded_characters.items():
            try:
                print(f"\\n🎯 {char_name} 색칠도안 생성 중...")
                
                # 캐릭터 설명 추가
                generator.character_descriptions[char_name] = char_data['description']
                
                # 색칠도안 생성
                result_file = generator.generate_coloring_pages(
                    character_name=char_name,
                    age_group='child',
                    difficulty='easy',
                    count=2
                )
                
                if result_file:
                    print(f"✅ {char_name} 색칠도안 생성 완료")
                else:
                    print(f"❌ {char_name} 색칠도안 생성 실패")
                    
            except Exception as e:
                print(f"❌ {char_name} 처리 실패: {e}")
    
    def save_expanded_database(self, expanded_characters: Dict[str, str], filename: str = "expanded_characters.json"):
        """확장된 캐릭터 데이터베이스 저장"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(expanded_characters, f, ensure_ascii=False, indent=2)
        print(f"💾 확장된 캐릭터 데이터베이스 저장: {filename}")

def main():
    """메인 실행 함수"""
    print("🚀 간단한 연관 캐릭터 확장 시스템")
    print("=" * 60)
    
    # 시스템 초기화
    expansion = SimpleCharacterExpansion()
    
    # 테스트할 메인 캐릭터들
    main_characters = ['아이언미야옹', '하츄핑', '배트맨', '미키마우스']
    
    all_expanded = {}
    
    for main_char in main_characters:
        print(f"\\n🎯 {main_char} 기반 확장 시작")
        expanded = expansion.expand_from_known_character(main_char)
        all_expanded.update(expanded)
        
        print(f"📊 {main_char}에서 {len(expanded)}개 캐릭터 확장")
    
    print(f"\\n🎉 전체 확장 완료!")
    print(f"📊 총 확장된 캐릭터: {len(all_expanded)}개")
    
    # 확장된 캐릭터들 출력
    print("\\n📋 확장된 캐릭터들:")
    for char_name, char_data in all_expanded.items():
        print(f"  - {char_name} ({char_data['group']})")
    
    # 데이터베이스 저장
    expansion.save_expanded_database(all_expanded)
    
    # 색칠도안 생성 (선택사항)
    create_coloring = input("\\n🎨 확장된 캐릭터들에 대한 색칠도안을 생성하시겠습니까? (y/n): ")
    if create_coloring.lower() == 'y':
        expansion.create_coloring_pages_for_expanded(all_expanded)

if __name__ == "__main__":
    main()
