# 실시간 온라인 채팅 애플리케이션

## 프로젝트 개요
Firebase와 React를 사용한 실시간 채팅 애플리케이션입니다.

## 주요 기능
- 실시간 채팅
- 다크모드/라이트모드 지원
- 프로필 사진 업로드
- 온라인 유저 목록
- Resizable 채팅창

## 기술 스택
- Frontend: React.js
- Backend: Node.js + Express.js
- Database: Firebase Firestore
- Authentication: Firebase Auth
- Storage: Firebase Storage
- Real-time: Socket.io

## 설치 및 실행
```bash
# 클라이언트 설치
cd client
npm install

# 서버 설치
cd ../server
npm install

# 실행
npm start
```

## 라이센스
MIT License 

-------

##버전 업데이트 내용

###1.0
- 다크모드시 채팅창 테두리 오류 수정
- 채팅창 유저 사이드바 다크모드 적용
- 음성채팅은 아직..