#!/usr/bin/env python3
"""
이미지 품질 검사기
생성된 이미지들의 품질과 속성을 확인
"""

import os
import cv2
import numpy as np
from PIL import Image
import json

def check_image_properties(image_path: str) -> dict:
    """이미지 속성 확인"""
    try:
        # PIL로 이미지 정보 확인
        with Image.open(image_path) as img:
            pil_info = {
                'format': img.format,
                'mode': img.mode,
                'size': img.size,
                'width': img.width,
                'height': img.height,
                'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info
            }
        
        # OpenCV로 이미지 분석
        cv_img = cv2.imread(image_path)
        if cv_img is not None:
            cv_info = {
                'channels': cv_img.shape[2] if len(cv_img.shape) == 3 else 1,
                'dtype': str(cv_img.dtype),
                'mean_brightness': float(np.mean(cv_img)),
                'std_brightness': float(np.std(cv_img)),
                'min_value': int(np.min(cv_img)),
                'max_value': int(np.max(cv_img))
            }
            
            # 윤곽선 검출
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            cv_info.update({
                'edge_count': len(contours),
                'total_edge_pixels': int(np.sum(edges > 0)),
                'edge_density': float(np.sum(edges > 0) / (img.width * img.height))
            })
        else:
            cv_info = {'error': 'OpenCV로 이미지를 읽을 수 없음'}
        
        # 파일 정보
        file_info = {
            'file_size_bytes': os.path.getsize(image_path),
            'file_size_mb': round(os.path.getsize(image_path) / (1024 * 1024), 2),
            'exists': os.path.exists(image_path)
        }
        
        return {
            'file_path': image_path,
            'pil_info': pil_info,
            'cv_info': cv_info,
            'file_info': file_info
        }
        
    except Exception as e:
        return {
            'file_path': image_path,
            'error': str(e)
        }

def check_images_in_directory(directory: str) -> dict:
    """디렉토리 내 모든 이미지 검사"""
    if not os.path.exists(directory):
        return {'error': f'디렉토리가 존재하지 않습니다: {directory}'}
    
    image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'}
    image_files = []
    
    # 이미지 파일 찾기
    for filename in os.listdir(directory):
        if any(filename.lower().endswith(ext) for ext in image_extensions):
            image_files.append(os.path.join(directory, filename))
    
    if not image_files:
        return {'error': f'이미지 파일을 찾을 수 없습니다: {directory}'}
    
    print(f"📁 디렉토리: {directory}")
    print(f"📊 발견된 이미지: {len(image_files)}개")
    print("-" * 60)
    
    results = []
    total_stats = {
        'total_files': len(image_files),
        'total_size_mb': 0,
        'formats': {},
        'sizes': [],
        'edge_densities': []
    }
    
    for i, image_path in enumerate(image_files, 1):
        print(f"\n{i:2d}. {os.path.basename(image_path)}")
        
        result = check_image_properties(image_path)
        results.append(result)
        
        if 'error' not in result:
            pil_info = result['pil_info']
            cv_info = result['cv_info']
            file_info = result['file_info']
            
            # 기본 정보 출력
            print(f"    📏 크기: {pil_info['width']}x{pil_info['height']}")
            print(f"    🎨 포맷: {pil_info['format']} ({pil_info['mode']})")
            print(f"    💾 파일크기: {file_info['file_size_mb']}MB")
            
            if 'error' not in cv_info:
                print(f"    🌟 밝기: {cv_info['mean_brightness']:.1f} ± {cv_info['std_brightness']:.1f}")
                print(f"    📐 윤곽선: {cv_info['edge_count']}개, 밀도: {cv_info['edge_density']:.3f}")
                
                # 통계 수집
                total_stats['total_size_mb'] += file_info['file_size_mb']
                total_stats['formats'][pil_info['format']] = total_stats['formats'].get(pil_info['format'], 0) + 1
                total_stats['sizes'].append((pil_info['width'], pil_info['height']))
                total_stats['edge_densities'].append(cv_info['edge_density'])
            else:
                print(f"    ❌ OpenCV 분석 실패: {cv_info['error']}")
        else:
            print(f"    ❌ 분석 실패: {result['error']}")
    
    # 전체 통계 출력
    print("\n" + "=" * 60)
    print("📊 전체 통계")
    print("=" * 60)
    print(f"📁 총 파일 수: {total_stats['total_files']}개")
    print(f"💾 총 용량: {total_stats['total_size_mb']:.2f}MB")
    
    if total_stats['formats']:
        print(f"🎨 포맷별 분포:")
        for format_name, count in total_stats['formats'].items():
            print(f"   - {format_name}: {count}개")
    
    if total_stats['sizes']:
        sizes = total_stats['sizes']
        widths = [s[0] for s in sizes]
        heights = [s[1] for s in sizes]
        print(f"📏 크기 범위: {min(widths)}x{min(heights)} ~ {max(widths)}x{max(heights)}")
    
    if total_stats['edge_densities']:
        densities = total_stats['edge_densities']
        print(f"📐 윤곽선 밀도: {min(densities):.3f} ~ {max(densities):.3f} (평균: {sum(densities)/len(densities):.3f})")
    
    return {
        'directory': directory,
        'total_files': total_stats['total_files'],
        'results': results,
        'statistics': total_stats
    }

def save_check_results(results: dict, output_file: str = None):
    """검사 결과를 JSON 파일로 저장"""
    if output_file is None:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"image_check_results_{timestamp}.json"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"\n💾 검사 결과 저장: {output_file}")
    except Exception as e:
        print(f"❌ 결과 저장 실패: {e}")

def main():
    """메인 실행 함수"""
    import sys
    
    if len(sys.argv) < 2:
        print("사용법: python check_images.py <directory> [output_file]")
        print("예시: python check_images.py extracted_images/")
        print("예시: python check_images.py test_images/ results.json")
        return
    
    directory = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    results = check_images_in_directory(directory)
    
    if 'error' not in results:
        save_check_results(results, output_file)
    else:
        print(f"❌ {results['error']}")

if __name__ == "__main__":
    main()