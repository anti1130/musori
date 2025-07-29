# 6단계: 채팅 기능 확장

## 📋 개요
기본 텍스트 채팅을 넘어서 음성 채팅, 파일 공유, 이모티콘 등 다양한 미디어를 지원하는 고급 채팅 기능을 구현할 예정입니다.

## 🎯 주요 기능

### 1. 음성 채팅 (Voice Chat)
- **WebRTC 기반**: 실시간 음성 통화 기능
- **1:1 통화**: 두 사용자 간 음성 통화
- **그룹 통화**: 여러 사용자가 참여하는 음성 채팅
- **음성 품질 조정**: 네트워크 상황에 따른 품질 조정

#### 세부 계획
- **WebRTC 구현**: RTCPeerConnection, getUserMedia 활용
- **시그널링 서버**: Socket.io를 통한 연결 정보 교환
- **음성 품질**: Opus 코덱 사용으로 고품질 음성
- **네트워크 적응**: 네트워크 상황에 따른 비트레이트 조정

### 2. 파일 공유 (File Sharing)
- **다양한 파일 형식**: 이미지, 문서, 동영상, 오디오 파일
- **드래그 앤 드롭**: 파일을 채팅창에 드래그하여 업로드
- **파일 미리보기**: 이미지, PDF 등 미리보기 기능
- **다운로드**: 파일 다운로드 및 저장 기능

#### 세부 계획
- **Firebase Storage**: 파일 저장 및 관리
- **파일 크기 제한**: 최대 50MB까지 업로드 가능
- **지원 형식**: 
  - 이미지: JPG, PNG, GIF, WebP
  - 문서: PDF, DOC, DOCX, TXT
  - 동영상: MP4, WebM, MOV
  - 오디오: MP3, WAV, OGG
- **보안**: 파일 스캔 및 바이러스 검사

### 3. 이모티콘 시스템 (Emoji System)
- **기본 이모티콘**: Unicode 이모티콘 지원
- **커스텀 이모티콘**: 사용자 제작 이모티콘
- **이모티콘 팩**: 다양한 테마의 이모티콘 팩
- **최근 사용**: 자주 사용하는 이모티콘 빠른 접근

#### 세부 계획
- **이모티콘 선택기**: 클릭으로 이모티콘 선택
- **커스텀 이모티콘**: 사용자가 업로드한 이미지 기반
- **이모티콘 검색**: 키워드로 이모티콘 검색
- **이모티콘 통계**: 자주 사용하는 이모티콘 분석

## 🔧 기술적 구현 계획

### 음성 채팅 아키텍처
```javascript
// WebRTC 연결 관리
class VoiceChat {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.socket = io();
  }

  async startCall(targetUserId) {
    // 1. 로컬 스트림 가져오기
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    // 2. RTCPeerConnection 생성
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    // 3. 로컬 스트림 추가
    this.localStream.getTracks().forEach(track => {
      this.peerConnection.addTrack(track, this.localStream);
    });

    // 4. 원격 스트림 처리
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
    };

    // 5. 시그널링
    await this.createOffer();
  }
}
```

### 파일 공유 시스템
```javascript
// 파일 업로드 컴포넌트
const FileUpload = ({ onFileUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (file) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB 제한
      alert('파일 크기는 50MB를 초과할 수 없습니다.');
      return;
    }

    setUploading(true);
    const storageRef = ref(storage, `files/${Date.now()}_${file.name}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onFileUpload({
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadURL
        });
        setUploading(false);
        setProgress(0);
      }
    );
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
        id="file-upload"
      />
      <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
        📎 파일 첨부
      </label>
      {uploading && (
        <div>
          업로드 중... {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};
```

### 이모티콘 시스템
```javascript
// 이모티콘 선택기 컴포넌트
const EmojiPicker = ({ onEmojiSelect }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const emojiCategories = [
    { name: '최근', emojis: recentEmojis },
    { name: '표정', emojis: smileyEmojis },
    { name: '동물', emojis: animalEmojis },
    { name: '음식', emojis: foodEmojis },
    { name: '활동', emojis: activityEmojis },
    { name: '여행', emojis: travelEmojis },
    { name: '객체', emojis: objectEmojis },
    { name: '심볼', emojis: symbolEmojis },
    { name: '깃발', emojis: flagEmojis }
  ];

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    // 최근 사용 이모티콘에 추가
    addToRecentEmojis(emoji);
    setShowPicker(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setShowPicker(!showPicker)}>
        😊
      </button>
      
      {showPicker && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          padding: '12px',
          width: '300px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <input
            type="text"
            placeholder="이모티콘 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginBottom: '12px',
              borderRadius: '4px',
              border: `1px solid ${colors.border}`
            }}
          />
          
          {emojiCategories.map(category => (
            <div key={category.name}>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '8px'
              }}>
                {category.name}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '4px'
              }}>
                {category.emojis
                  .filter(emoji => 
                    emoji.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(emoji => (
                    <button
                      key={emoji.unicode}
                      onClick={() => handleEmojiClick(emoji.unicode)}
                      style={{
                        fontSize: '20px',
                        padding: '4px',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background = colors.hover;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                      }}
                    >
                      {emoji.unicode}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🎨 UI/UX 설계

### 음성 채팅 UI
- **통화 버튼**: 음성 통화 시작/종료 버튼
- **음량 표시**: 실시간 음량 레벨 표시
- **통화 상태**: 연결 중, 통화 중, 종료 상태 표시
- **음소거 버튼**: 마이크 음소거/해제

### 파일 공유 UI
- **드래그 영역**: 파일을 드래그할 수 있는 영역
- **파일 미리보기**: 이미지, PDF 등 미리보기
- **진행률 바**: 파일 업로드 진행률 표시
- **파일 목록**: 공유된 파일 목록 표시

### 이모티콘 UI
- **이모티콘 버튼**: 이모티콘 선택기 열기
- **카테고리 탭**: 이모티콘 카테고리별 분류
- **검색 기능**: 이모티콘 검색
- **최근 사용**: 자주 사용하는 이모티콘

## 📊 구현 우선순위

### Phase 1: 이모티콘 시스템 (1-2주)
1. 기본 이모티콘 선택기 구현
2. 이모티콘 카테고리 분류
3. 최근 사용 이모티콘 기능

### Phase 2: 파일 공유 (2-3주)
1. 파일 업로드 시스템
2. 파일 미리보기 기능
3. 파일 다운로드 기능

### Phase 3: 음성 채팅 (4-6주)
1. WebRTC 기본 연결
2. 1:1 음성 통화
3. 그룹 음성 채팅

## 🧪 테스트 계획

### 기능 테스트
- [ ] 이모티콘 선택 및 전송
- [ ] 파일 업로드 및 다운로드
- [ ] 음성 통화 연결 및 통화
- [ ] 파일 형식별 미리보기

### 성능 테스트
- [ ] 대용량 파일 업로드 성능
- [ ] 음성 품질 및 지연시간
- [ ] 동시 사용자 처리 성능

### 보안 테스트
- [ ] 파일 업로드 보안 검증
- [ ] 음성 통화 암호화
- [ ] 악성 파일 차단

## 🔄 예상 문제점 및 해결방안

### 1. WebRTC 연결 문제
**문제**: NAT/방화벽으로 인한 연결 실패
**해결**: TURN 서버 구축, STUN 서버 활용

### 2. 파일 업로드 성능
**문제**: 대용량 파일 업로드 시 성능 저하
**해결**: 청크 업로드, 진행률 표시, 백그라운드 업로드

### 3. 브라우저 호환성
**문제**: 다양한 브라우저에서의 호환성 문제
**해결**: 폴리필 사용, 브라우저별 최적화

## 📝 코드 예시 (계획)

### 음성 채팅 컴포넌트
```javascript
const VoiceChat = ({ targetUser, onCallEnd }) => {
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const startCall = async () => {
    try {
      setIsCalling(true);
      // WebRTC 연결 시작
      await voiceChat.startCall(targetUser.uid);
    } catch (error) {
      console.error('Call failed:', error);
      setIsCalling(false);
    }
  };

  const endCall = () => {
    voiceChat.endCall();
    setIsCalling(false);
    onCallEnd();
  };

  const toggleMute = () => {
    voiceChat.toggleMute();
    setIsMuted(!isMuted);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      {isCalling ? (
        <div>
          <div>📞 {targetUser.nickname}와 통화 중</div>
          <div>⏱️ {formatDuration(callDuration)}</div>
          <button onClick={toggleMute}>
            {isMuted ? '🔇' : '🎤'} {isMuted ? '음소거 해제' : '음소거'}
          </button>
          <button onClick={endCall} style={{ color: 'red' }}>
            📞 통화 종료
          </button>
        </div>
      ) : (
        <button onClick={startCall}>
          📞 {targetUser.nickname}에게 전화
        </button>
      )}
    </div>
  );
};
```

## 🎯 완료 기준

### 이모티콘 시스템
- [ ] 기본 이모티콘 선택기
- [ ] 이모티콘 카테고리 분류
- [ ] 최근 사용 이모티콘
- [ ] 이모티콘 검색 기능

### 파일 공유
- [ ] 파일 업로드 시스템
- [ ] 파일 미리보기
- [ ] 파일 다운로드
- [ ] 드래그 앤 드롭

### 음성 채팅
- [ ] WebRTC 연결
- [ ] 1:1 음성 통화
- [ ] 음소거 기능
- [ ] 통화 상태 표시

**예상 완료일**: 2024년 (10-12주 소요)
**상태**: 📋 계획 중 