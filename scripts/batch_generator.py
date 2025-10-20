#!/usr/bin/env python3
"""
색칠놀이 도안 배치 제작 스크립트
여러 캐릭터와 난이도를 한 번에 제작하는 도구
"""

import argparse
import json
import os
from datetime import datetime
from production_generator import main as generate_single

def load_character_config(config_file):
    """캐릭터 설정 파일 로드"""
    if not os.path.exists(config_file):
        # 기본 설정 생성
        default_config = {
            "characters": [
                {
                    "name": "도라에몽",
                    "age_groups": ["child"],
                    "difficulties": ["easy", "medium"],
                    "count": 5
                },
                {
                    "name": "하츄핑", 
                    "age_groups": ["child"],
                    "difficulties": ["easy", "medium", "hard"],
                    "count": 3
                },
                {
                    "name": "미키마우스",
                    "age_groups": ["child", "teen"],
                    "difficulties": ["easy"],
                    "count": 4
                }
            ]
        }
        
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 기본 설정 파일 생성: {config_file}")
        return default_config
    
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)

def main():
    parser = argparse.ArgumentParser(description='색칠놀이 도안 배치 제작 도구')
    
    parser.add_argument('--config', '-c', 
                       default='character_config.json',
                       help='캐릭터 설정 파일 (기본값: character_config.json)')
    
    parser.add_argument('--output-dir', '-o',
                       default='batch_output',
                       help='출력 디렉토리 (기본값: batch_output)')
    
    parser.add_argument('--no-firebase', action='store_true',
                       help='Firebase Storage 업로드 비활성화')
    
    parser.add_argument('--extract-images', action='store_true',
                       help='생성 후 이미지 추출')
    
    args = parser.parse_args()
    
    # 설정 파일 로드
    config = load_character_config(args.config)
    
    print(f"🎨 색칠놀이 도안 배치 제작 시작")
    print(f"=" * 60)
    print(f"설정 파일: {args.config}")
    print(f"출력 디렉토리: {args.output_dir}")
    print(f"Firebase 업로드: {'비활성화' if args.no_firebase else '활성화'}")
    print()
    
    # 출력 디렉토리 생성
    os.makedirs(args.output_dir, exist_ok=True)
    
    total_generated = 0
    results = []
    
    # 각 캐릭터별로 제작
    for char_config in config['characters']:
        char_name = char_config['name']
        print(f"\n📚 {char_name} 제작 시작...")
        
        for age_group in char_config['age_groups']:
            for difficulty in char_config['difficulties']:
                count = char_config['count']
                
                print(f"  🎯 {age_group}/{difficulty} - {count}개 생성 중...")
                
                try:
                    # 개별 제작 실행
                    import sys
                    old_argv = sys.argv.copy()
                    
                    # production_generator.py 인자 설정
                    sys.argv = [
                        'production_generator.py',
                        char_name,
                        '--count', str(count),
                        '--age-group', age_group,
                        '--difficulty', difficulty,
                        '--output-dir', args.output_dir
                    ]
                    
                    if args.no_firebase:
                        sys.argv.append('--no-firebase')
                    
                    if args.extract_images:
                        sys.argv.append('--extract-images')
                    
                    # 제작 실행
                    generate_single()
                    
                    # 원래 argv 복원
                    sys.argv = old_argv
                    
                    total_generated += count
                    results.append({
                        'character': char_name,
                        'age_group': age_group,
                        'difficulty': difficulty,
                        'count': count,
                        'status': 'success'
                    })
                    
                    print(f"  ✅ {char_name} {age_group}/{difficulty} 완료")
                    
                except Exception as e:
                    print(f"  ❌ {char_name} {age_group}/{difficulty} 실패: {e}")
                    results.append({
                        'character': char_name,
                        'age_group': age_group,
                        'difficulty': difficulty,
                        'count': count,
                        'status': 'failed',
                        'error': str(e)
                    })
    
    # 결과 요약
    print(f"\n🎉 배치 제작 완료!")
    print(f"=" * 60)
    print(f"📊 총 생성된 도안: {total_generated}개")
    print(f"📁 출력 위치: {args.output_dir}")
    
    # 결과 상세
    print(f"\n📋 제작 결과 상세:")
    for result in results:
        status_icon = "✅" if result['status'] == 'success' else "❌"
        print(f"  {status_icon} {result['character']} ({result['age_group']}/{result['difficulty']}) - {result['count']}개")
        if result['status'] == 'failed':
            print(f"      오류: {result['error']}")
    
    # 결과 파일 저장
    result_file = os.path.join(args.output_dir, f"batch_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(result_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_generated': total_generated,
            'output_dir': args.output_dir,
            'results': results
        }, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 결과 파일: {result_file}")

if __name__ == "__main__":
    main()
