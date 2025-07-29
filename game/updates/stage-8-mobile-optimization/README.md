# 8단계: 모바일 최적화

## 📋 개요
모바일 기기에서 네이티브 앱과 같은 경험을 제공하는 PWA(Progressive Web App) 기능과 모바일 최적화를 구현할 예정입니다.

## 🎯 주요 기능

### 1. PWA (Progressive Web App)
- **앱 설치**: 홈 화면에 앱으로 설치 가능
- **오프라인 지원**: 인터넷 없이도 기본 기능 사용
- **푸시 알림**: 모바일 푸시 알림 기능
- **앱 아이콘**: 커스텀 앱 아이콘 및 스플래시 화면

### 2. 모바일 UI/UX 최적화
- **터치 최적화**: 터치 친화적인 인터페이스
- **제스처 지원**: 스와이프, 핀치 등 제스처
- **반응형 디자인**: 다양한 화면 크기에 최적화
- **성능 최적화**: 모바일 기기 성능 최적화

### 3. 푸시 알림 시스템
- **실시간 알림**: 새 메시지, 멘션 알림
- **알림 설정**: 사용자별 알림 설정
- **백그라운드 동작**: 앱이 백그라운드일 때도 알림
- **알림 액션**: 알림에서 직접 액션 수행

## 🔧 기술적 구현 계획

### PWA 매니페스트
```json
// public/manifest.json
{
  "name": "실시간 온라인 채팅",
  "short_name": "채팅",
  "description": "실시간 온라인 채팅 애플리케이션",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007bff",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker 구현
```javascript
// public/sw.js
const CACHE_NAME = 'chat-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// 설치 시 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 요청 시 캐시에서 응답
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 캐시에서 찾으면 반환
        if (response) {
          return response;
        }
        
        // 네트워크에서 가져오기
        return fetch(event.request).then(
          (response) => {
            // 유효한 응답이 아니면 그대로 반환
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 응답을 복제하여 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// 푸시 알림 처리
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새 메시지가 도착했습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('실시간 채팅', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
```

### 모바일 최적화 컴포넌트
```javascript
// components/MobileOptimized.js
import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';

const MobileOptimized = ({ children }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // PWA 설치 프롬프트 처리
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  // 설치 버튼 클릭
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  // 터치 제스처 처리
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      // 왼쪽 스와이프 - 사이드바 닫기
      document.dispatchEvent(new CustomEvent('closeSidebar'));
    },
    onSwipedRight: () => {
      // 오른쪽 스와이프 - 사이드바 열기
      document.dispatchEvent(new CustomEvent('openSidebar'));
    },
    onSwipedUp: () => {
      // 위로 스와이프 - 채팅창 최소화
      document.dispatchEvent(new CustomEvent('minimizeChat'));
    },
    onSwipedDown: () => {
      // 아래로 스와이프 - 채팅창 최대화
      document.dispatchEvent(new CustomEvent('maximizeChat'));
    }
  });

  return (
    <div {...handlers} style={{ height: '100vh', overflow: 'hidden' }}>
      {/* 설치 프롬프트 */}
      {!isInstalled && deferredPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#007bff',
          color: 'white',
          padding: '12px',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <span>앱을 설치하시겠습니까?</span>
          <button 
            onClick={handleInstallClick}
            style={{
              marginLeft: '12px',
              padding: '4px 8px',
              background: 'white',
              color: '#007bff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            설치
          </button>
        </div>
      )}
      
      {children}
    </div>
  );
};
```

### 푸시 알림 시스템
```javascript
// services/NotificationService.js
class NotificationService {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // 알림 권한 요청
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await this.subscribeToPush();
    }
    
    return permission;
  }

  // 푸시 구독
  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
      });

      // 서버에 구독 정보 전송
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      throw error;
    }
  }

  // 알림 전송
  async sendNotification(userId, notification) {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            data: notification.data
          }
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // VAPID 키 변환
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}
```

## 🎨 UI/UX 설계

### 모바일 최적화 UI
- **터치 친화적**: 버튼 크기 최소 44px
- **제스처 지원**: 스와이프, 핀치 줌
- **반응형 레이아웃**: 다양한 화면 크기 대응
- **성능 최적화**: 이미지 지연 로딩, 코드 스플리팅

### PWA 기능
- **앱 아이콘**: 다양한 크기의 아이콘 제공
- **스플래시 화면**: 앱 시작 시 로딩 화면
- **오프라인 페이지**: 인터넷 없을 때 안내 페이지
- **설치 프롬프트**: 앱 설치 안내

### 푸시 알림 UI
- **알림 설정**: 사용자별 알림 설정
- **알림 액션**: 알림에서 직접 액션 수행
- **알림 히스토리**: 과거 알림 목록
- **알림 배지**: 읽지 않은 알림 수 표시

## 📊 구현 우선순위

### Phase 1: PWA 기본 기능 (2-3주)
1. 매니페스트 파일 생성
2. Service Worker 구현
3. 앱 아이콘 및 스플래시 화면

### Phase 2: 모바일 UI 최적화 (2-3주)
1. 터치 최적화
2. 제스처 지원
3. 반응형 디자인 개선

### Phase 3: 푸시 알림 (3-4주)
1. 푸시 알림 시스템
2. 알림 설정 관리
3. 백그라운드 동작

## 🧪 테스트 계획

### PWA 테스트
- [ ] 앱 설치 기능
- [ ] 오프라인 동작
- [ ] Service Worker 동작
- [ ] 다양한 기기 호환성

### 모바일 UI 테스트
- [ ] 터치 인터페이스 테스트
- [ ] 제스처 동작 테스트
- [ ] 반응형 레이아웃 테스트
- [ ] 성능 테스트

### 푸시 알림 테스트
- [ ] 알림 권한 요청
- [ ] 알림 전송 및 수신
- [ ] 백그라운드 알림
- [ ] 알림 액션 동작

## 🔄 예상 문제점 및 해결방안

### 1. iOS Safari 제한사항
**문제**: iOS Safari에서 PWA 기능 제한
**해결**: iOS 특화 최적화, 대체 기능 제공

### 2. 푸시 알림 권한
**문제**: 사용자가 알림 권한 거부
**해결**: 권한 요청 타이밍 최적화, 대체 알림 방법

### 3. 오프라인 동작
**문제**: 복잡한 오프라인 상태 관리
**해결**: 단계적 오프라인 기능, 동기화 전략

## 📝 코드 예시 (계획)

### 모바일 최적화 훅
```javascript
// hooks/useMobileOptimization.js
import { useState, useEffect } from 'react';

export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isStandaloneMode);
    };

    const checkOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    checkMobile();
    checkStandalone();
    checkOrientation();

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  return { isMobile, isStandalone, orientation };
};
```

## 🎯 완료 기준

### PWA 기능
- [ ] 앱 설치 기능
- [ ] 오프라인 지원
- [ ] Service Worker 구현
- [ ] 앱 아이콘 및 스플래시

### 모바일 최적화
- [ ] 터치 최적화
- [ ] 제스처 지원
- [ ] 반응형 디자인
- [ ] 성능 최적화

### 푸시 알림
- [ ] 푸시 알림 시스템
- [ ] 알림 설정 관리
- [ ] 백그라운드 동작
- [ ] 알림 액션

**예상 완료일**: 2024년 (8-10주 소요)
**상태**: 📋 계획 중 