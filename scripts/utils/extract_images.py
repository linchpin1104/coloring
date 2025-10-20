#!/usr/bin/env python3
"""
이미지 추출 유틸리티
JSON 파일에서 Base64 이미지를 추출하여 PNG 파일로 저장
"""

import json
import base64
import os
from datetime import datetime

def extract_images_from_json(json_file: str, output_dir: str = "extracted_images"):
    """JSON 파일에서 이미지 추출"""
    try:
        # 출력 디렉토리 생성
        os.makedirs(output_dir, exist_ok=True)
        
        # JSON 파일 읽기
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        character_name = data.get('character_name', 'unknown')
        generated_pages = data.get('generated_pages', [])
        
        print(f"📁 {character_name} 이미지 추출 시작")
        print(f"📊 총 {len(generated_pages)}개 페이지")
        
        extracted_count = 0
        
        for page in generated_pages:
            page_number = page.get('page_number', 0)
            image_base64 = page.get('generated_image_base64', '')
            
            if image_base64:
                try:
                    # Base64 디코딩
                    image_data = base64.b64decode(image_base64)
                    
                    # 파일명 생성
                    filename = f"{character_name}_page_{page_number:02d}.png"
                    filepath = os.path.join(output_dir, filename)
                    
                    # 이미지 파일 저장
                    with open(filepath, 'wb') as f:
                        f.write(image_data)
                    
                    print(f"✅ 추출 완료: {filename}")
                    extracted_count += 1
                    
                except Exception as e:
                    print(f"❌ 페이지 {page_number} 추출 실패: {e}")
        
        print(f"\n🎉 이미지 추출 완료!")
        print(f"📊 추출된 이미지: {extracted_count}개")
        print(f"📁 저장 위치: {output_dir}/")
        
        return extracted_count
        
    except Exception as e:
        print(f"❌ 이미지 추출 실패: {e}")
        return 0

def main():
    """메인 실행 함수"""
    import sys
    
    if len(sys.argv) < 2:
        print("사용법: python extract_images.py <json_file> [output_dir]")
        print("예시: python extract_images.py coloring_pages_포켓몬_피카츄_20250117_120000.json")
        return
    
    json_file = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else "extracted_images"
    
    if not os.path.exists(json_file):
        print(f"❌ 파일을 찾을 수 없습니다: {json_file}")
        return
    
    extract_images_from_json(json_file, output_dir)

if __name__ == "__main__":
    main()