#!/usr/bin/env python3
"""
테스트 이미지 생성기
간단한 PNG 이미지를 생성하여 테스트용으로 사용
"""

import os
from PIL import Image, ImageDraw, ImageFont
import numpy as np

def create_test_image(character_name: str, output_dir: str = "test_images"):
    """테스트용 이미지 생성"""
    try:
        # 출력 디렉토리 생성
        os.makedirs(output_dir, exist_ok=True)
        
        # 이미지 크기 설정
        width, height = 400, 400
        
        # 흰색 배경 이미지 생성
        img = Image.new('RGB', (width, height), 'white')
        draw = ImageDraw.Draw(img)
        
        # 캐릭터별 기본 도형 그리기
        if '피카츄' in character_name or '포켓몬' in character_name:
            # 피카츄 스타일
            draw.ellipse([150, 100, 250, 200], outline='black', width=3)  # 머리
            draw.ellipse([120, 80, 140, 100], outline='black', width=3)   # 왼쪽 귀
            draw.ellipse([260, 80, 280, 100], outline='black', width=3)  # 오른쪽 귀
            draw.ellipse([170, 200, 230, 300], outline='black', width=3)  # 몸
            draw.line([(150, 150), (100, 200)], fill='black', width=3)    # 왼쪽 팔
            draw.line([(250, 150), (300, 200)], fill='black', width=3)     # 오른쪽 팔
            draw.line([(180, 300), (180, 350)], fill='black', width=3)    # 왼쪽 다리
            draw.line([(220, 300), (220, 350)], fill='black', width=3)    # 오른쪽 다리
            
        elif '미키' in character_name:
            # 미키마우스 스타일
            draw.ellipse([150, 100, 250, 200], outline='black', width=3)  # 머리
            draw.ellipse([120, 80, 140, 100], outline='black', width=3)     # 왼쪽 귀
            draw.ellipse([260, 80, 280, 100], outline='black', width=3)   # 오른쪽 귀
            draw.ellipse([170, 200, 230, 300], outline='black', width=3)   # 몸
            draw.line([(150, 150), (100, 200)], fill='black', width=3)    # 왼쪽 팔
            draw.line([(250, 150), (300, 200)], fill='black', width=3)     # 오른쪽 팔
            draw.line([(180, 300), (180, 350)], fill='black', width=3)    # 왼쪽 다리
            draw.line([(220, 300), (220, 350)], fill='black', width=3)    # 오른쪽 다리
            
        elif '키티' in character_name or '헬로' in character_name:
            # 헬로키티 스타일
            draw.ellipse([150, 100, 250, 200], outline='black', width=3)  # 머리
            # 귀 (삼각형 모양)
            draw.polygon([(150, 100), (140, 80), (160, 80)], outline='black', width=3)
            draw.polygon([(250, 100), (240, 80), (260, 80)], outline='black', width=3)
            draw.ellipse([170, 200, 230, 300], outline='black', width=3)   # 몸
            draw.line([(150, 150), (100, 200)], fill='black', width=3)    # 왼쪽 팔
            draw.line([(250, 150), (300, 200)], fill='black', width=3)     # 오른쪽 팔
            
        else:
            # 기본 캐릭터
            draw.ellipse([150, 100, 250, 200], outline='black', width=3)  # 머리
            draw.ellipse([170, 200, 230, 300], outline='black', width=3)   # 몸
            draw.line([(150, 150), (100, 200)], fill='black', width=3)    # 왼쪽 팔
            draw.line([(250, 150), (300, 200)], fill='black', width=3)     # 오른쪽 팔
            draw.line([(180, 300), (180, 350)], fill='black', width=3)    # 왼쪽 다리
            draw.line([(220, 300), (220, 350)], fill='black', width=3)    # 오른쪽 다리
        
        # 파일명 생성
        filename = f"{character_name}_test.png"
        filepath = os.path.join(output_dir, filename)
        
        # 이미지 저장
        img.save(filepath, 'PNG')
        
        print(f"✅ 테스트 이미지 생성 완료: {filename}")
        return filepath
        
    except Exception as e:
        print(f"❌ 테스트 이미지 생성 실패: {e}")
        return None

def create_multiple_test_images(characters: list, output_dir: str = "test_images"):
    """여러 캐릭터의 테스트 이미지 생성"""
    print(f"🎨 테스트 이미지 생성 시작 ({len(characters)}개)")
    
    created_files = []
    
    for character in characters:
        filepath = create_test_image(character, output_dir)
        if filepath:
            created_files.append(filepath)
    
    print(f"\n🎉 테스트 이미지 생성 완료!")
    print(f"📊 생성된 이미지: {len(created_files)}개")
    print(f"📁 저장 위치: {output_dir}/")
    
    return created_files

def main():
    """메인 실행 함수"""
    import sys
    
    if len(sys.argv) < 2:
        print("사용법: python create_test_images.py <character_name> [output_dir]")
        print("예시: python create_test_images.py '포켓몬 피카츄'")
        print("또는: python create_test_images.py all  # 모든 기본 캐릭터 생성")
        return
    
    character_name = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "test_images"
    
    if character_name.lower() == 'all':
        # 기본 캐릭터들 생성
        characters = [
            '포켓몬 피카츄',
            '미키마우스',
            '헬로키티',
            '도라에몽',
            '스폰지밥'
        ]
        create_multiple_test_images(characters, output_dir)
    else:
        create_test_image(character_name, output_dir)

if __name__ == "__main__":
    main()