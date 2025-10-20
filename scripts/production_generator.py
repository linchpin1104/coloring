#!/usr/bin/env python3
"""
색칠놀이 도안 제작 스크립트
재사용 가능한 프로덕션용 색칠놀이 도안 생성 도구
"""

import argparse
import sys
import os
from datetime import datetime
from image_crawler_generator import ImageCrawlerGenerator

def main():
    parser = argparse.ArgumentParser(description='색칠놀이 도안 제작 도구')
    
    # 필수 인자
    parser.add_argument('character', help='캐릭터 이름 (예: 도라에몽, 하츄핑, 미키마우스)')
    parser.add_argument('--count', '-c', type=int, default=10, help='생성할 도안 개수 (기본값: 10)')
    
    # 연령대 선택
    parser.add_argument('--age-group', '-a', 
                       choices=['child', 'teen', 'adult'], 
                       default='child',
                       help='연령대 (child: 3-12세, teen: 13-18세, adult: 19세+)')
    
    # 난이도 선택
    parser.add_argument('--difficulty', '-d',
                       choices=['easy', 'medium', 'hard'],
                       default='easy',
                       help='난이도 (easy: 쉬움, medium: 보통, hard: 어려움)')
    
    # 출력 옵션
    parser.add_argument('--output-dir', '-o', 
                       default='production_output',
                       help='출력 디렉토리 (기본값: production_output)')
    
    # Firebase 업로드 옵션
    parser.add_argument('--no-firebase', action='store_true',
                       help='Firebase Storage 업로드 비활성화')
    
    # 이미지 추출 옵션
    parser.add_argument('--extract-images', action='store_true',
                       help='생성 후 이미지 추출')
    
    args = parser.parse_args()
    
    # 출력 디렉토리 생성
    os.makedirs(args.output_dir, exist_ok=True)
    
    print(f"🎨 색칠놀이 도안 제작 시작")
    print(f"=" * 50)
    print(f"캐릭터: {args.character}")
    print(f"연령대: {args.age_group}")
    print(f"난이도: {args.difficulty}")
    print(f"개수: {args.count}")
    print(f"출력 디렉토리: {args.output_dir}")
    print(f"Firebase 업로드: {'비활성화' if args.no_firebase else '활성화'}")
    print()
    
    try:
        # 생성기 초기화
        generator = ImageCrawlerGenerator()
        
        # Firebase 업로드 비활성화 (옵션)
        if args.no_firebase:
            generator.bucket = None
        
        # 색칠놀이 도안 생성
        result_file = generator.generate_coloring_pages(
            character_name=args.character,
            age_group=args.age_group,
            difficulty=args.difficulty,
            count=args.count
        )
        
        if result_file:
            print(f"\n✅ 색칠놀이 도안 생성 완료!")
            print(f"📁 결과 파일: {result_file}")
            
            # 결과 파일을 출력 디렉토리로 이동
            import shutil
            dest_file = os.path.join(args.output_dir, os.path.basename(result_file))
            shutil.move(result_file, dest_file)
            print(f"📁 이동 완료: {dest_file}")
            
            # 이미지 추출 (옵션)
            if args.extract_images:
                print(f"\n🖼️ 이미지 추출 중...")
                extract_dir = os.path.join(args.output_dir, 'extracted_images')
                os.makedirs(extract_dir, exist_ok=True)
                
                # extract_images.py 실행 (작업 디렉토리를 extract_dir로 변경)
                import subprocess
                result = subprocess.run([
                    'python3', 'utils/extract_images.py', dest_file
                ], cwd=extract_dir, capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"✅ 이미지 추출 완료: {extract_dir}")
                else:
                    print(f"❌ 이미지 추출 실패: {result.stderr}")
            
            print(f"\n🎉 제작 완료!")
            print(f"📊 생성된 도안: {args.count}개")
            print(f"📁 출력 위치: {args.output_dir}")
            
        else:
            print(f"\n❌ 색칠놀이 도안 생성 실패")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
