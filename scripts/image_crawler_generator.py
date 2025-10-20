#!/usr/bin/env python3
"""
이미지 크롤링 기반 색칠놀이 도안 생성기
- 구글 이미지 검색으로 참조 이미지 다운로드
- Firebase Storage에 업로드
- 제미나이 이미지 플래시로 색칠도안 생성
"""

import os
import json
import base64
import requests
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import firebase_admin
from firebase_admin import credentials, storage
from google.cloud import storage as gcs
from dotenv import load_dotenv
import time
from datetime import datetime

# 환경변수 로드
load_dotenv()

class ImageCrawlerGenerator:
    def __init__(self):
        """이미지 크롤러 생성기 초기화"""
        # 환경변수 로드 (상위 디렉토리의 .env 파일)
        load_dotenv('../.env')
        
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.google_search_api_key = os.getenv('GOOGLE_SEARCH_API_KEY')
        self.google_search_engine_id = os.getenv('GOOGLE_SEARCH_ENGINE_ID')
        
        # Firebase 초기화
        self.init_firebase()
        
        # 다운로드 디렉토리 생성
        self.download_dir = "downloaded_images"
        os.makedirs(self.download_dir, exist_ok=True)
        
    def init_firebase(self):
        """Firebase 초기화"""
        try:
            # Firebase Admin SDK 초기화
            if not firebase_admin._apps:
                cred = credentials.Certificate("../coloring-98f0c-firebase-adminsdk-fbsvc-32d62b5d72.json")
                firebase_admin.initialize_app(cred, {
                    'storageBucket': 'coloring-98f0c.firebasestorage.app'
                })
            
            self.bucket = storage.bucket()
            print("✅ Firebase Storage 초기화 완료")
            
        except Exception as e:
            print(f"❌ Firebase 초기화 실패: {e}")
            self.bucket = None
    
    def search_images(self, character_name: str, limit: int = 5) -> list:
        """구글 이미지 검색"""
        try:
            if not self.google_search_api_key or not self.google_search_engine_id:
                print("⚠️ Google Search API 키가 없어서 모의 이미지 검색을 사용합니다.")
                return self.mock_image_search(character_name, limit)
            
            # 검색 키워드 개선
            search_query = character_name
            if character_name == '아이언미야옹':
                search_query = "운빨존만겜 아이언미야옹"
            elif character_name == '운빨존만겜':
                search_query = "운빨존만겜 게임 캐릭터"
            
            search_url = "https://www.googleapis.com/customsearch/v1"
            params = {
                'key': self.google_search_api_key,
                'cx': self.google_search_engine_id,
                'q': f"{search_query} official art",
                'searchType': 'image',
                'num': limit,
                'safe': 'medium',
                'imgSize': 'large',
                'imgType': 'photo'
            }
            
            response = requests.get(search_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            image_urls = []
            
            for item in data.get('items', []):
                image_urls.append({
                    'url': item['link'],
                    'title': item['title'],
                    'thumbnail': item['image']['thumbnailLink']
                })
            
            print(f"✅ {character_name} 이미지 {len(image_urls)}개 검색 완료")
            return image_urls
            
        except Exception as e:
            print(f"❌ 이미지 검색 실패: {e}")
            return self.mock_image_search(character_name, limit)
    
    def mock_image_search(self, character_name: str, limit: int) -> list:
        """모의 이미지 검색 (API 키가 없을 때)"""
        mock_images = []
        
        # 테스트용 로컬 이미지 파일들
        test_images = {
            '피카츄': [
                'test_images/포켓몬 피카츄_test.png',
                'test_images/포켓몬 피카츄_test.png',
                'test_images/포켓몬 피카츄_test.png'
            ],
            '미키마우스': [
                'test_images/미키마우스_test.png',
                'test_images/미키마우스_test.png',
                'test_images/미키마우스_test.png'
            ],
            '헬로키티': [
                'test_images/헬로키티_test.png',
                'test_images/헬로키티_test.png',
                'test_images/헬로키티_test.png'
            ],
            '도라에몽': [
                'test_images/도라에몽_test.png',
                'test_images/도라에몽_test.png',
                'test_images/도라에몽_test.png'
            ],
            '하츄핑': [
                'test_images/하츄핑_test.png',
                'test_images/하츄핑_test.png',
                'test_images/하츄핑_test.png'
            ],
            '아이언미야옹': [
                'test_images/아이언미야옹_test.png',
                'test_images/아이언미야옹_test.png',
                'test_images/아이언미야옹_test.png'
            ]
        }
        
        # 캐릭터 이름에 따른 이미지 선택
        for key, urls in test_images.items():
            if key in character_name:
                for i, url in enumerate(urls[:limit]):
                    mock_images.append({
                        'url': url,
                        'title': f"{character_name} Official Art {i+1}",
                        'thumbnail': url
                    })
                break
        
        if not mock_images:
            # 기본 이미지 (로컬 테스트 이미지 사용)
            for i in range(limit):
                mock_images.append({
                    'url': f'test_images/도라에몽_test.png',
                    'title': f"{character_name} Official Art {i+1}",
                    'thumbnail': f'test_images/도라에몽_test.png'
                })
        
        print(f"✅ {character_name} 모의 이미지 {len(mock_images)}개 생성")
        return mock_images
    
    def download_image(self, image_url: str, filename: str, thumbnail_url: str = None) -> str:
        """이미지 다운로드 (썸네일 우선, 로컬 파일 지원)"""
        try:
            # 로컬 파일인 경우
            if image_url.startswith('test_images/') or not image_url.startswith('http'):
                if os.path.exists(image_url):
                    # 파일 복사
                    import shutil
                    filepath = os.path.join(self.download_dir, filename)
                    shutil.copy2(image_url, filepath)
                    print(f"✅ 로컬 이미지 복사 완료: {filename}")
                    return filepath
                else:
                    print(f"❌ 로컬 파일을 찾을 수 없습니다: {image_url}")
                    return None
            
            # 썸네일 이미지 우선 시도
            if thumbnail_url:
                try:
                    response = requests.get(thumbnail_url, timeout=10)
                    if response.status_code == 200:
                        filepath = os.path.join(self.download_dir, filename)
                        with open(filepath, 'wb') as f:
                            f.write(response.content)
                        print(f"✅ 썸네일 이미지 다운로드 완료: {filename}")
                        return filepath
                except Exception as e:
                    print(f"⚠️ 썸네일 다운로드 실패, 원본 시도: {e}")
            
            # 원본 이미지 시도
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            filepath = os.path.join(self.download_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ 이미지 다운로드 완료: {filename}")
            return filepath
            
        except Exception as e:
            print(f"❌ 이미지 다운로드 실패: {e}")
            return None
    
    def upload_to_firebase_storage(self, image_path: str, character_name: str) -> str:
        """Firebase Storage에 이미지 업로드 (로컬 모드)"""
        try:
            if not self.bucket:
                print("⚠️ Firebase Storage가 초기화되지 않아 로컬 모드로 작동합니다.")
                return f"file://{image_path}"
            
            # Firebase Storage 경로 생성
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            blob_name = f"reference_images/{character_name}/{timestamp}_{os.path.basename(image_path)}"
            
            # 파일 업로드
            blob = self.bucket.blob(blob_name)
            blob.upload_from_filename(image_path)
            
            # 공개 URL 생성
            blob.make_public()
            public_url = blob.public_url
            
            print(f"✅ Firebase Storage 업로드 완료: {public_url}")
            return public_url
            
        except Exception as e:
            print(f"❌ Firebase Storage 업로드 실패: {e}")
            return f"file://{image_path}"
    
    def upload_coloring_page_to_firebase(self, base64_image: str, character_name: str, age_group: str, difficulty: str, page_number: int) -> str:
        """색칠도안을 Firebase Storage에 업로드"""
        try:
            if not self.bucket:
                print("⚠️ Firebase Storage가 초기화되지 않아 로컬 모드로 작동합니다.")
                return f"local_coloring_page_{page_number}.png"
            
            # Base64를 이미지 파일로 변환
            import base64
            image_data = base64.b64decode(base64_image)
            
            # 파일명 생성
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{character_name}_page_{page_number:02d}_{timestamp}.png"
            
            # Firebase Storage에 업로드
            blob = self.bucket.blob(f"coloring_pages/{age_group}/{difficulty}/{character_name}/{filename}")
            blob.upload_from_string(image_data, content_type='image/png')
            
            # 공개 URL 생성
            blob.make_public()
            public_url = blob.public_url
            
            print(f"✅ 색칠도안 Firebase Storage 업로드 완료: {public_url}")
            return public_url
            
        except Exception as e:
            print(f"❌ 색칠도안 Firebase Storage 업로드 실패: {e}")
            return f"local_coloring_page_{page_number}.png"
    
    def generate_age_based_prompt(self, character_name: str, age_group: str, difficulty: str) -> str:
        """연령별 프롬프트 생성 (캐릭터별 특화, 영어 전용)"""
        
        # 프롬프트 생성 규칙:
        # 1. 모든 텍스트는 영어로만 작성
        # 2. 한글 캐릭터 이름이나 제목 사용 금지
        # 3. 영어로만 캐릭터 특징 설명
        
        # 캐릭터별 특화 설명 (영어만 사용)
        character_descriptions = {
            '하츄핑': "pink-haired character with heart decorations, crown tiara, pink dress with white top, cute chibi proportions, magical girl style, TiniPing character",
            '라라핑': "blue-haired character with star decorations, crown tiara, blue dress, cute chibi proportions, magical girl style, TiniPing character", 
            '바로핑': "yellow-haired character with sun decorations, crown tiara, yellow dress, cute chibi proportions, magical girl style, TiniPing character",
            '차차핑': "green-haired character with leaf decorations, crown tiara, green dress, cute chibi proportions, magical girl style, TiniPing character",
            '도라에몽': "blue robot cat with white belly, red collar with bell, round head, no ears, cute proportions, Doraemon character",
            '미키마우스': "black mouse with large round ears, red shorts, yellow shoes, white gloves, Disney character",
            '피카츄': "yellow electric mouse with red cheeks, brown stripes on back, black-tipped ears, Pokemon character",
            '배트맨': "dark superhero with black cape, bat symbol on chest, pointy bat ears, muscular build, intimidating presence, DC Comics character",
            '운빨존만겜': "lucky character with gambling theme, dice symbols, coin decorations, playful expression, game character style",
            '아이언미야옹': "lucky gambling game character, cute cat with iron armor, mechanical elements, futuristic design, playful expression, distinctive helmet design, chest reactor, gaming mascot style"
        }
        
        # 기본 캐릭터 설명 (특화 설명이 없는 경우)
        char_desc = character_descriptions.get(character_name, character_name)
        
        age_prompts = {
            'child': {
                'easy': f"{char_desc}, simple coloring page for children ages 3-6, thick bold outlines 5-6px, minimal details, large clear coloring areas, cute chibi proportions, friendly expression",
                'medium': f"{char_desc}, coloring page for children ages 6-8, medium line weight 3-4px, moderate details, balanced complexity, dynamic pose, cheerful expression",
                'hard': f"{char_desc}, detailed coloring page for children ages 8-10, fine line art 2-3px, intricate patterns, complex elements, expressive pose"
            },
            'teen': {
                'easy': f"{char_desc}, teen-friendly coloring page ages 9-12, medium line weight 3-4px, clear outlines, moderate details, cool pose",
                'medium': f"{char_desc}, detailed coloring page for teens ages 12-15, fine line art 2-3px, intricate details, dynamic composition, stylish pose",
                'hard': f"{char_desc}, complex coloring page for teens ages 15+, very fine line art 1-2px, highly detailed design, sophisticated composition, dramatic pose"
            },
            'adult': {
                'easy': f"{char_desc}, adult coloring page ages 16+, medium complexity, clean line art 2-3px, elegant design, sophisticated pose",
                'medium': f"{char_desc}, detailed adult coloring page, fine line art 1-2px, intricate patterns, complex composition, artistic pose",
                'hard': f"{char_desc}, highly detailed adult coloring page, very fine line art 1px, extremely intricate patterns, complex mandala-style elements, artistic masterpiece"
            }
        }
        
        return age_prompts.get(age_group, {}).get(difficulty, f"{char_desc}, coloring page")
    
    def optimize_prompt_with_gemini(self, prompt: str) -> str:
        """제미나이로 프롬프트 최적화"""
        try:
            if not self.gemini_api_key:
                print("⚠️ Gemini API 키가 없어서 원본 프롬프트를 사용합니다.")
                return prompt
            
            optimization_prompt = f"""
다음 색칠놀이 도안 생성 프롬프트를 최적화해주세요:

원본 프롬프트: {prompt}

최적화 요구사항:
1. 색칠놀이에 적합한 명확한 윤곽선 강조
2. 연령대에 맞는 복잡도 조정
3. 색칠하기 쉬운 영역 구분 (명확한 경계선)
4. 기술적 품질 향상 (인쇄 가능한 A4 크기)
5. 일관된 선 두께 유지
6. 겹치지 않는 선과 명확한 분리

색칠놀이 도안 최적화 규칙:
- 검은색 윤곽선만 사용
- 흰색 배경 유지
- 그라데이션이나 음영 금지
- 색칠 영역이 명확히 구분되도록
- 인쇄 시 선명하게 나오도록

최적화된 프롬프트만 반환해주세요 (설명 없이):
"""
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            data = {
                'contents': [{
                    'parts': [{'text': optimization_prompt}]
                }],
                'generationConfig': {
                    'temperature': 0.3,
                    'topK': 40,
                    'topP': 0.95,
                    'maxOutputTokens': 1024
                }
            }
            
            url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}'
            
            response = requests.post(
                url,
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'candidates' in result and len(result['candidates']) > 0:
                    optimized_prompt = result['candidates'][0]['content']['parts'][0]['text']
                    print(f"✅ 프롬프트 최적화 완료")
                    return optimized_prompt
                else:
                    print(f"⚠️ 응답 형식이 예상과 다릅니다: {result}")
                    return prompt
            else:
                print(f"❌ Gemini API 오류: {response.status_code}")
                return prompt
                
        except Exception as e:
            print(f"❌ 프롬프트 최적화 실패: {e}")
            return prompt
    
    def generate_coloring_page_with_gemini_image(self, prompt: str, reference_image_url: str, page_number: int = 1) -> str:
        """제미나이 이미지 플래시로 색칠도안 생성"""
        try:
            if not self.gemini_api_key:
                print("⚠️ Gemini API 키가 없어서 로컬 생성기를 사용합니다.")
                return self.generate_local_coloring_page(prompt)
            
            # 실제 이미지 생성 API 사용 (gemini-2.5-flash-image)
            headers = {
                'Content-Type': 'application/json'
            }
            
            # 참조 이미지를 Base64로 변환
            reference_base64 = self.image_to_base64(reference_image_url)
            if not reference_base64:
                print("❌ 참조 이미지 변환 실패")
                return self.generate_local_coloring_page(prompt)
            
            # 이미지 생성 프롬프트 (다양성을 위한 변형 추가)
            variations = [
                "cute and friendly expression",
                "happy and cheerful pose", 
                "playful and energetic stance",
                "calm and peaceful pose",
                "excited and joyful expression",
                "thoughtful and curious look",
                "adventurous and brave pose",
                "gentle and kind expression",
                "funny and silly pose",
                "confident and proud stance"
            ]
            
            # 페이지 번호에 따라 다른 변형 사용
            variation_index = (page_number - 1) % len(variations)
            selected_variation = variations[variation_index]
            
            image_generation_prompt = f"""
Create a coloring page based on the reference image:

Reference image: {reference_image_url}
Character description: {prompt}

Requirements:
- Convert the character from the reference image into a coloring page style
- Thick black outlines (3-5px)
- Simple and clear coloring areas
- Child-friendly design for easy coloring
- White background
- A4 print size (210x297mm at 300DPI = 2480x3508 pixels)
- High resolution for crisp printing
- Character should be in {selected_variation} pose
- Each image should have different poses or expressions
- Optimize for A4 paper printing
- Ensure character fits well within A4 proportions
- Leave appropriate margins for printing

Generate the coloring page image optimized for A4 printing.
"""
            
            data = {
                'contents': [{
                    'parts': [
                        {'text': image_generation_prompt},
                        {
                            'inline_data': {
                                'mime_type': 'image/png',
                                'data': reference_base64
                            }
                        }
                    ]
                }],
                'generationConfig': {
                    'temperature': 0.3,
                    'topK': 40,
                    'topP': 0.95,
                    'maxOutputTokens': 1024
                }
            }
            
            url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key={self.gemini_api_key}'
            
            response = requests.post(
                url,
                headers=headers,
                json=data,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ 제미나이 이미지 생성 API 호출 성공")
                
                # 응답에서 생성된 이미지 추출
                if 'candidates' in result and len(result['candidates']) > 0:
                    candidate = result['candidates'][0]
                    if 'content' in candidate and 'parts' in candidate['content']:
                        for part in candidate['content']['parts']:
                            if 'inlineData' in part and part['inlineData']['mimeType'].startswith('image/'):
                                generated_image_base64 = part['inlineData']['data']
                                print("✅ 제미나이로 색칠도안 생성 완료")
                                return generated_image_base64
                
                print("❌ 응답에서 이미지를 찾을 수 없습니다. 생성 실패.")
                return None
            else:
                print(f"❌ 제미나이 이미지 생성 오류: {response.status_code}")
                print(f"응답: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ 제미나이 이미지 생성 실패: {e}")
            return None
    
    def image_to_base64(self, image_url: str) -> str:
        """이미지 URL을 Base64로 변환"""
        try:
            if image_url.startswith('file://'):
                image_path = image_url[7:]  # file:// 제거
                with open(image_path, 'rb') as f:
                    return base64.b64encode(f.read()).decode('utf-8')
            else:
                response = requests.get(image_url)
                return base64.b64encode(response.content).decode('utf-8')
        except Exception as e:
            print(f"❌ 이미지 Base64 변환 실패: {e}")
            return ""
    
    def generate_local_coloring_page(self, prompt: str) -> str:
        """로컬에서 색칠도안 생성 (OpenCV 사용)"""
        try:
            # 간단한 색칠도안 생성 (실제로는 더 복잡한 로직 필요)
            img = np.ones((800, 600, 3), dtype=np.uint8) * 255  # 흰색 배경
            
            # 검은색 윤곽선 그리기
            cv2.rectangle(img, (50, 50), (550, 750), (0, 0, 0), 3)
            cv2.circle(img, (300, 200), 80, (0, 0, 0), 3)
            cv2.ellipse(img, (300, 400), (100, 150), 0, 0, 360, (0, 0, 0), 3)
            
            # Base64로 인코딩
            _, buffer = cv2.imencode('.png', img)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            print("✅ 로컬 색칠도안 생성 완료")
            return img_base64
            
        except Exception as e:
            print(f"❌ 로컬 색칠도안 생성 실패: {e}")
            return ""
    
    def generate_coloring_pages(self, character_name: str, age_group: str = 'child', difficulty: str = 'easy', count: int = 10):
        """색칠놀이 도안 생성 메인 함수"""
        print(f"\n🎨 {character_name} 색칠놀이 도안 생성 시작")
        print(f"연령대: {age_group}, 난이도: {difficulty}, 개수: {count}")
        
        # 1. 이미지 검색
        print("\n1️⃣ 이미지 검색 중...")
        image_urls = self.search_images(character_name, limit=5)
        
        # 2. 이미지 다운로드 및 Firebase Storage 업로드
        print("\n2️⃣ 이미지 다운로드 및 업로드 중...")
        uploaded_images = []
        
        for i, img_info in enumerate(image_urls):
            filename = f"{character_name}_{i+1}.jpg"
            thumbnail_url = img_info.get('thumbnail')
            local_path = self.download_image(img_info['url'], filename, thumbnail_url)
            
            if local_path:
                firebase_url = self.upload_to_firebase_storage(local_path, character_name)
                uploaded_images.append({
                    'local_path': local_path,
                    'firebase_url': firebase_url,
                    'title': img_info['title']
                })
        
        # 3. 연령별 프롬프트 생성
        print("\n3️⃣ 연령별 프롬프트 생성 중...")
        base_prompt = self.generate_age_based_prompt(character_name, age_group, difficulty)
        
        # 4. 제미나이로 프롬프트 최적화
        print("\n4️⃣ 제미나이로 프롬프트 최적화 중...")
        optimized_prompt = self.optimize_prompt_with_gemini(base_prompt)
        
        # 5. 색칠도안 생성
        print("\n5️⃣ 색칠도안 생성 중...")
        generated_pages = []
        
        for i in range(count):
            print(f"  생성 중: {i+1}/{count}")
            
            # 참조 이미지 선택 (순환)
            if uploaded_images:
                ref_image = uploaded_images[i % len(uploaded_images)]
            else:
                # 업로드된 이미지가 없는 경우 기본 이미지 사용
                ref_image = {'firebase_url': 'test_images/도라에몽_test.png'}
            
            # 제미나이 이미지 플래시로 색칠도안 생성
            coloring_page_base64 = self.generate_coloring_page_with_gemini_image(
                optimized_prompt, 
                ref_image['firebase_url'],
                i + 1  # 페이지 번호 전달
            )
            
            # 생성 실패한 경우 건너뛰기
            if not coloring_page_base64:
                print(f"  ❌ 페이지 {i+1} 생성 실패 - 건너뛰기")
                continue
            
            # 색칠도안을 Firebase Storage에 업로드
            coloring_page_url = self.upload_coloring_page_to_firebase(
                coloring_page_base64,
                character_name,
                age_group,
                difficulty,
                i + 1
            )
            
            generated_pages.append({
                'page_number': i + 1,
                'character_name': character_name,
                'age_group': age_group,
                'difficulty': difficulty,
                'prompt': optimized_prompt,
                'reference_image': ref_image['firebase_url'],
                'generated_image_base64': coloring_page_base64,
                'generated_image_url': coloring_page_url,
                'generated_at': datetime.now().isoformat()
            })
            
            # API 호출 간격 조절
            time.sleep(2)
        
        # 6. 결과 저장
        print("\n6️⃣ 결과 저장 중...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_file = f"coloring_pages_{character_name}_{timestamp}.json"
        
        result_data = {
            'character_name': character_name,
            'age_group': age_group,
            'difficulty': difficulty,
            'total_pages': count,
            'generated_at': datetime.now().isoformat(),
            'prompt_used': optimized_prompt,
            'reference_images': uploaded_images,
            'generated_pages': generated_pages
        }
        
        with open(result_file, 'w', encoding='utf-8') as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 색칠놀이 도안 생성 완료!")
        print(f"📁 결과 파일: {result_file}")
        print(f"📊 생성된 도안: {count}개")
        
        return result_file

def main():
    """메인 실행 함수"""
    generator = ImageCrawlerGenerator()
    
    # 테스트 실행
    characters = [
        {'name': '포켓몬 피카츄', 'age_group': 'child', 'difficulty': 'easy'},
        {'name': '미키마우스', 'age_group': 'child', 'difficulty': 'medium'},
        {'name': '헬로키티', 'age_group': 'teen', 'difficulty': 'easy'}
    ]
    
    for char in characters:
        try:
            result_file = generator.generate_coloring_pages(
                character_name=char['name'],
                age_group=char['age_group'],
                difficulty=char['difficulty'],
                count=3  # 테스트용으로 3개만 생성
            )
            print(f"✅ {char['name']} 생성 완료: {result_file}")
        except Exception as e:
            print(f"❌ {char['name']} 생성 실패: {e}")
        
        print("-" * 50)

if __name__ == "__main__":
    main()
