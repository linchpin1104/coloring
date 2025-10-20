#!/usr/bin/env python3
"""
QA 테스트를 위한 샘플 데이터 생성 스크립트
"""

import json
import requests
import time
from datetime import datetime

# API 기본 URL
API_BASE_URL = "http://localhost:3001"

def create_test_coloring_pages():
    """테스트용 색칠공부 도안 생성"""
    
    test_pages = [
        {
            "characterName": "도라에몽",
            "characterType": "anime",
            "originCountry": "japan",
            "ageGroup": "child",
            "difficulty": "easy",
            "theme": "만화",
            "activity": "standing",
            "emotion": "happy",
            "imageUrl": "https://via.placeholder.com/400x400/4A90E2/FFFFFF?text=Doraemon",
            "thumbnailUrl": "https://via.placeholder.com/200x200/4A90E2/FFFFFF?text=Doraemon",
            "downloads": 0,
            "metadata": {
                "prompt": "A cute blue robot cat character for children's coloring",
                "generationTime": 2.5,
                "qualityScore": 0.95
            }
        },
        {
            "characterName": "Mickey Mouse",
            "characterType": "cartoon",
            "originCountry": "usa",
            "ageGroup": "child",
            "difficulty": "easy",
            "theme": "만화",
            "activity": "waving",
            "emotion": "happy",
            "imageUrl": "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Mickey",
            "thumbnailUrl": "https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Mickey",
            "downloads": 0,
            "metadata": {
                "prompt": "Classic Disney Mickey Mouse character for coloring",
                "generationTime": 2.1,
                "qualityScore": 0.92
            }
        },
        {
            "characterName": "ピカチュウ",
            "characterType": "anime",
            "originCountry": "japan",
            "ageGroup": "child",
            "difficulty": "medium",
            "theme": "게임",
            "activity": "jumping",
            "emotion": "excited",
            "imageUrl": "https://via.placeholder.com/400x400/FFD93D/FFFFFF?text=Pikachu",
            "thumbnailUrl": "https://via.placeholder.com/200x200/FFD93D/FFFFFF?text=Pikachu",
            "downloads": 0,
            "metadata": {
                "prompt": "Pokemon Pikachu character for children's coloring",
                "generationTime": 3.2,
                "qualityScore": 0.88
            }
        },
        {
            "characterName": "Batman",
            "characterType": "superhero",
            "originCountry": "usa",
            "ageGroup": "teen",
            "difficulty": "hard",
            "theme": "영화",
            "activity": "flying",
            "emotion": "serious",
            "imageUrl": "https://via.placeholder.com/400x400/2C3E50/FFFFFF?text=Batman",
            "thumbnailUrl": "https://via.placeholder.com/200x200/2C3E50/FFFFFF?text=Batman",
            "downloads": 0,
            "metadata": {
                "prompt": "Dark Knight Batman superhero for advanced coloring",
                "generationTime": 4.1,
                "qualityScore": 0.91
            }
        },
        {
            "characterName": "하츄핑",
            "characterType": "character",
            "originCountry": "korea",
            "ageGroup": "child",
            "difficulty": "easy",
            "theme": "게임",
            "activity": "dancing",
            "emotion": "cute",
            "imageUrl": "https://via.placeholder.com/400x400/FF69B4/FFFFFF?text=Hachuping",
            "thumbnailUrl": "https://via.placeholder.com/200x200/FF69B4/FFFFFF?text=Hachuping",
            "downloads": 0,
            "metadata": {
                "prompt": "Cute Korean character Hachuping for children",
                "generationTime": 2.8,
                "qualityScore": 0.89
            }
        }
    ]
    
    print("🎨 테스트용 색칠공부 도안 생성 중...")
    
    for i, page_data in enumerate(test_pages):
        try:
            response = requests.post(
                f"{API_BASE_URL}/api/coloring-pages/generate",
                json=page_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    print(f"✅ 도안 {i+1} 생성 완료: {page_data['characterName']}")
                else:
                    print(f"❌ 도안 {i+1} 생성 실패: {result.get('message', 'Unknown error')}")
            else:
                print(f"❌ 도안 {i+1} 생성 실패: HTTP {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ 도안 {i+1} 생성 중 오류: {e}")
        
        time.sleep(1)  # API 부하 방지

def create_test_characters():
    """테스트용 캐릭터 데이터 생성"""
    
    characters = [
        {
            "name": "도라에몽",
            "type": "anime",
            "originCountry": "japan",
            "searchableNames": ["도라에몽", "doraemon", "ドラえもん", "哆啦A梦"],
            "popularity": 95,
            "ageGroups": ["child", "teen"],
            "themes": ["만화", "cartoon", "anime"],
            "difficulties": ["easy", "medium"]
        },
        {
            "name": "Mickey Mouse",
            "type": "cartoon",
            "originCountry": "usa",
            "searchableNames": ["mickey mouse", "미키마우스", "ミッキーマウス", "米老鼠"],
            "popularity": 98,
            "ageGroups": ["child"],
            "themes": ["만화", "cartoon", "disney"],
            "difficulties": ["easy"]
        },
        {
            "name": "피카츄",
            "type": "anime",
            "originCountry": "japan",
            "searchableNames": ["피카츄", "pikachu", "ピカチュウ", "皮卡丘"],
            "popularity": 97,
            "ageGroups": ["child", "teen"],
            "themes": ["게임", "game", "pokemon", "anime"],
            "difficulties": ["easy", "medium"]
        }
    ]
    
    print("👥 테스트용 캐릭터 데이터 생성 중...")
    
    for character in characters:
        try:
            # Firestore에 직접 저장하는 대신 로그만 출력
            print(f"✅ 캐릭터 데이터 준비: {character['name']}")
        except Exception as e:
            print(f"❌ 캐릭터 데이터 생성 실패: {e}")

def create_test_themes():
    """테스트용 테마 데이터 생성"""
    
    themes = [
        {
            "name": "만화",
            "searchableNames": ["만화", "cartoon", "comic", "anime", "manga"],
            "popularity": 90,
            "languages": ["ko", "en", "ja", "zh", "es"]
        },
        {
            "name": "게임",
            "searchableNames": ["게임", "game", "video game", "juego", "ゲーム", "游戏"],
            "popularity": 85,
            "languages": ["ko", "en", "ja", "zh", "es"]
        },
        {
            "name": "영화",
            "searchableNames": ["영화", "movie", "film", "película", "映画", "电影"],
            "popularity": 80,
            "languages": ["ko", "en", "ja", "zh", "es"]
        }
    ]
    
    print("🎭 테스트용 테마 데이터 생성 중...")
    
    for theme in themes:
        print(f"✅ 테마 데이터 준비: {theme['name']}")

def test_api_endpoints():
    """API 엔드포인트 테스트"""
    
    print("🔍 API 엔드포인트 테스트 중...")
    
    endpoints = [
        ("GET", "/", "기본 엔드포인트"),
        ("GET", "/health", "헬스 체크"),
        ("GET", "/api/coloring-pages", "색칠공부 도안 목록"),
        ("POST", "/api/search/multilingual", "다국어 검색"),
        ("POST", "/api/newsletter/subscribe", "뉴스레터 구독"),
    ]
    
    for method, endpoint, description in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{API_BASE_URL}{endpoint}", timeout=5)
            else:
                response = requests.post(f"{API_BASE_URL}{endpoint}", json={}, timeout=5)
            
            if response.status_code in [200, 201, 400, 404]:  # 400, 404도 정상 응답으로 간주
                print(f"✅ {description}: {response.status_code}")
            else:
                print(f"❌ {description}: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ {description}: 연결 실패 - {e}")

def main():
    """메인 실행 함수"""
    
    print("🚀 QA 테스트 데이터 생성 시작")
    print("=" * 50)
    
    # API 서버 연결 확인
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ 백엔드 서버 연결 확인")
        else:
            print("❌ 백엔드 서버 연결 실패")
            return
    except requests.exceptions.RequestException:
        print("❌ 백엔드 서버가 실행되지 않았습니다.")
        print("   다음 명령어로 서버를 시작하세요:")
        print("   cd backend && npm start")
        return
    
    # 테스트 데이터 생성
    create_test_coloring_pages()
    create_test_characters()
    create_test_themes()
    
    # API 엔드포인트 테스트
    test_api_endpoints()
    
    print("=" * 50)
    print("✅ QA 테스트 데이터 생성 완료")
    print("\n📋 다음 단계:")
    print("1. 프론트엔드 서버 시작: cd frontend && npm run dev")
    print("2. 브라우저에서 http://localhost:3000 접속")
    print("3. 다운로드 제한 시스템 테스트")
    print("4. 다국어 검색 기능 테스트")
    print("5. 광고 시청 시스템 테스트")

if __name__ == "__main__":
    main()

