#!/usr/bin/env python3
"""
윤곽선 추출기
이미지에서 윤곽선을 추출하여 색칠놀이 도안으로 변환
"""

import cv2
import numpy as np
from PIL import Image, ImageFilter
import os

def extract_outline(image_path: str, output_path: str = None, method: str = 'canny') -> str:
    """이미지에서 윤곽선 추출"""
    try:
        # 이미지 읽기
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"이미지를 읽을 수 없습니다: {image_path}")
        
        # 그레이스케일 변환
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 노이즈 제거
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        if method == 'canny':
            # Canny 엣지 검출
            edges = cv2.Canny(blurred, 50, 150)
            
        elif method == 'sobel':
            # Sobel 엣지 검출
            sobel_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
            sobel_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
            edges = np.sqrt(sobel_x**2 + sobel_y**2)
            edges = np.uint8(edges / edges.max() * 255)
            
        elif method == 'laplacian':
            # Laplacian 엣지 검출
            laplacian = cv2.Laplacian(blurred, cv2.CV_64F)
            edges = np.uint8(np.absolute(laplacian))
            
        else:
            raise ValueError(f"지원하지 않는 방법입니다: {method}")
        
        # 윤곽선 강화
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
        
        # 흰색 배경에 검은색 윤곽선으로 변환
        outline_img = 255 - edges
        
        # 출력 파일명 생성
        if output_path is None:
            base_name = os.path.splitext(os.path.basename(image_path))[0]
            output_path = f"{base_name}_outline.png"
        
        # 이미지 저장
        cv2.imwrite(output_path, outline_img)
        
        print(f"✅ 윤곽선 추출 완료: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"❌ 윤곽선 추출 실패: {e}")
        return None

def extract_outline_pil(image_path: str, output_path: str = None) -> str:
    """PIL을 사용한 윤곽선 추출"""
    try:
        # 이미지 열기
        img = Image.open(image_path)
        
        # 그레이스케일 변환
        if img.mode != 'L':
            img = img.convert('L')
        
        # 엣지 검출 필터 적용
        edges = img.filter(ImageFilter.FIND_EDGES)
        
        # 대비 강화
        edges = edges.filter(ImageFilter.EDGE_ENHANCE_MORE)
        
        # 흰색 배경에 검은색 윤곽선으로 변환
        outline_img = Image.eval(edges, lambda x: 255 - x)
        
        # 출력 파일명 생성
        if output_path is None:
            base_name = os.path.splitext(os.path.basename(image_path))[0]
            output_path = f"{base_name}_outline_pil.png"
        
        # 이미지 저장
        outline_img.save(output_path, 'PNG')
        
        print(f"✅ PIL 윤곽선 추출 완료: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"❌ PIL 윤곽선 추출 실패: {e}")
        return None

def batch_extract_outlines(input_dir: str, output_dir: str = None, method: str = 'canny'):
    """디렉토리 내 모든 이미지의 윤곽선 추출"""
    if not os.path.exists(input_dir):
        print(f"❌ 입력 디렉토리가 존재하지 않습니다: {input_dir}")
        return
    
    if output_dir is None:
        output_dir = os.path.join(input_dir, "outlines")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # 이미지 파일 확장자
    image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp'}
    
    # 이미지 파일 찾기
    image_files = []
    for filename in os.listdir(input_dir):
        if any(filename.lower().endswith(ext) for ext in image_extensions):
            image_files.append(os.path.join(input_dir, filename))
    
    if not image_files:
        print(f"❌ 이미지 파일을 찾을 수 없습니다: {input_dir}")
        return
    
    print(f"📁 입력 디렉토리: {input_dir}")
    print(f"📁 출력 디렉토리: {output_dir}")
    print(f"📊 발견된 이미지: {len(image_files)}개")
    print(f"🔧 사용 방법: {method}")
    print("-" * 50)
    
    success_count = 0
    
    for i, image_path in enumerate(image_files, 1):
        filename = os.path.basename(image_path)
        base_name = os.path.splitext(filename)[0]
        output_path = os.path.join(output_dir, f"{base_name}_outline.png")
        
        print(f"{i:2d}. {filename}")
        
        result = extract_outline(image_path, output_path, method)
        if result:
            success_count += 1
    
    print(f"\n🎉 윤곽선 추출 완료!")
    print(f"📊 성공: {success_count}/{len(image_files)}개")
    print(f"📁 저장 위치: {output_dir}/")

def main():
    """메인 실행 함수"""
    import sys
    
    if len(sys.argv) < 2:
        print("사용법:")
        print("  python outline_extractor.py <image_file> [output_file] [method]")
        print("  python outline_extractor.py <directory> [output_dir] [method]")
        print("")
        print("방법: canny (기본), sobel, laplacian")
        print("")
        print("예시:")
        print("  python outline_extractor.py test.png")
        print("  python outline_extractor.py test.png outline.png canny")
        print("  python outline_extractor.py images/ outlines/ sobel")
        return
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    method = sys.argv[3] if len(sys.argv) > 3 else 'canny'
    
    if os.path.isfile(input_path):
        # 단일 파일 처리
        extract_outline(input_path, output_path, method)
    elif os.path.isdir(input_path):
        # 디렉토리 처리
        batch_extract_outlines(input_path, output_path, method)
    else:
        print(f"❌ 파일 또는 디렉토리를 찾을 수 없습니다: {input_path}")

if __name__ == "__main__":
    main()
