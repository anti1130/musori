import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { doc, setDoc, deleteDoc, onSnapshot as onUserSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Resizable } from 're-resizable';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../firebase';
import Profile from './Profile';
import UserProfile from './UserProfile';
import RankDisplay from './RankDisplay';

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'musori-image');
  const res = await fetch('https://api.cloudinary.com/v1_1/dokzgwvob/image/upload', {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  return data.secure_url;
}

function Chat({ user, handleLogout, darkMode, setDarkMode, customThemeColor, setCustomThemeColor, notificationSettings, setNotificationSettings }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [newNickname, setNewNickname] = useState(user.nickname || '');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [newPhoto, setNewPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // 실시간 메시지 수신
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [user]);

  // 온라인 유저 실시간 감지 (모든 유저 표시)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onUserSnapshot(collection(db, 'onlineUsers'), (snapshot) => {
      const userList = [];
      
      snapshot.forEach((doc) => {
        const userData = { id: doc.id, ...doc.data() };
        userList.push(userData);
      });
      setOnlineUsers(userList);
    });

    return () => unsubscribe();
  }, [user]);

  // 사용자 온라인 상태 설정
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'onlineUsers', user.uid);
    
    // 온라인 상태 설정 (타임스탬프 업데이트)
    setDoc(userRef, {
      nickname: user.nickname,
      email: user.email,
      lastSeen: serverTimestamp(),
      isOnline: true
    });

    // 주기적으로 타임스탬프 업데이트 (활동 상태 유지)
    const updateTimestamp = () => {
      setDoc(userRef, {
        nickname: user.nickname,
        email: user.email,
        lastSeen: serverTimestamp(),
        isOnline: true
      }, { merge: true });
    };

    // 1분마다 타임스탬프 업데이트
    const timestampInterval = setInterval(updateTimestamp, 60000);



    // 브라우저 닫기 감지
    const handleBeforeUnload = () => {
      deleteDoc(userRef);
    };

    // 페이지 가시성 변경 감지
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        deleteDoc(userRef);
      } else {
        setDoc(userRef, {
          nickname: user.nickname,
          email: user.email,
          lastSeen: serverTimestamp(),
          isOnline: true
        });

      }
    };

    // 이벤트 리스너 추가
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 컴포넌트 언마운트 시 오프라인 상태로 변경
    return () => {
      deleteDoc(userRef);
      clearInterval(timestampInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // 메시지 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: input,
        userId: user.uid,
        nickname: user.nickname,
        photoURL: user.photoURL, // 프로필 사진 URL 저장
        createdAt: user.createdAt || serverTimestamp(), // 가입일 정보 추가
        timestamp: serverTimestamp()
      });
      setInput('');
    } catch (error) {
      console.error('메시지 전송 에러:', error);
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setNewPhoto(e.target.files[0]);
      setPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      let photoURL = user.photoURL;
      if (newPhoto) {
        // Storage에 업로드 (customMetadata 추가)
        const storageRef = ref(storage, `profileImages/${auth.currentUser.uid}`);
        await uploadBytes(storageRef, newPhoto, {
          customMetadata: {
            uploadedBy: auth.currentUser.uid,
            email: auth.currentUser.email
          }
        });
        photoURL = await getDownloadURL(storageRef);
      }
      await updateProfile(auth.currentUser, {
        displayName: newNickname,
        photoURL: photoURL,
      });
      await auth.currentUser.reload();
      setEditProfileOpen(false);
      setNewPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setEditError('프로필 수정 실패: ' + err.message);
    }
    setEditLoading(false);
  };

  // 다른 사용자 프로필 보기
  const handleUserProfileClick = (userData) => {
    console.log('Clicked user data:', userData); // 디버깅용
    
    // 본인 프로필은 기존 방식으로 처리
    if (userData.id === user.uid) {
      setShowProfile(true);
      return;
    }
    
    // onlineUsers에서 가져온 데이터를 올바른 형식으로 변환
    const formattedUserData = {
      uid: userData.id,
      nickname: userData.nickname,
      email: userData.email,
      photoURL: userData.photoURL,
      lastSeen: userData.lastSeen
    };
    
    console.log('Formatted user data:', formattedUserData); // 디버깅용
    setSelectedUser(formattedUserData);
    setShowUserProfile(true);
  };

  const [mainSidebarOpen, setMainSidebarOpen] = useState(false); // 왼쪽 메인 사이드바
  const [userSidebarOpen, setUserSidebarOpen] = useState(false); // 채팅창 내 유저 사이드바 상태

  // 스타일 색상 변수 (테마 색상 적용)
  const colors = {
    bg: darkMode ? '#181a1b' : '#f8f9fa',
    chatBg: darkMode ? '#181a1b' : '#fff',
    myMsg: darkMode ? '#2d3748' : '#e3f2fd',
    otherMsg: darkMode ? '#23272a' : '#fff',
    sidebarBg: darkMode ? '#23272a' : '#fff',
    sidebarText: darkMode ? '#eee' : '#333',
    sidebarBorder: darkMode ? '#333' : '#eee',
    burger: darkMode ? '#ffe066' : '#333',
    headerBg: darkMode ? '#23272a' : '#f8f9fa',
    headerText: darkMode ? '#ffe066' : '#333',
    inputBg: darkMode ? '#23272a' : '#fff',
    inputText: darkMode ? '#eee' : '#222',
    inputBorder: darkMode ? '#444' : '#ddd',
    inputPlaceholder: darkMode ? '#aaa' : '#888',
    underbarBg: darkMode ? '#23272a' : '#fff',
    underbarBorder: darkMode ? '#333' : '#eee',
    nickname: darkMode ? '#ffe066' : '#333',
    border: darkMode ? '#666' : '#ccc',
    buttonBg: darkMode ? '#444' : customThemeColor,
  };

  // 사용자 정보가 있으면 바로 채팅 표시
  if (user?.nickname) {
    return (
      <div style={{ 
        background: colors.bg, 
        height: '100vh', 
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* 메인 화면 텍스트 */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 500,
          textAlign: 'left',
          overflowY: 'auto',
          padding: '20px',
          paddingTop: '50px',
          paddingLeft: '240px'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: darkMode ? '#FFD700' : '#007bff',
            marginBottom: '20px'
          }}>
            1.0
          </div>
          <div style={{
            fontSize: '16px',
            color: darkMode ? '#FFFFFF' : '#000000',
            lineHeight: '1.6',
            marginBottom: '40px'
          }}>
            1. 다크모드시 채팅창 테두리 오류 수정<br/>
            2. 채팅창 유저 사이드바 다크모드 적용<br/>
            3. 음성채팅은 아직..
          </div>
          
          <div style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: darkMode ? '#FFD700' : '#007bff',
            marginBottom: '20px'
          }}>
            1.0.1
          </div>
                     <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             1. 온라인/오프라인 상태 개선<br/>
             2. 오프라인 유저 빨간점 표시<br/>
             3. 정확한 온라인 유저 수 카운트
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.2
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             1. 프로필 페이지 추가<br/>
              -활동 점수 추가<br/>
              -테마,알림,개인정보 관리 추가
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.3
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             1. 상태 메시지 기능 추가<br/>
             2. 자기소개 기능 추가<br/>
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.4
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             1. 입력창 ui 개선<br/>
             2. 테마 색 선택 기능 추가<br/>
             3. 알림 설정 ui 추가(기능은 아직 없음)<br/>
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.5
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             초초초 짱쩌는 업데이트 바로 상대 프로필 보!기!<br/>
              -이제 상대의 프로필사진과 마지막 활동을 관찰 할 수 있으며<br/>
               상대가 자신의 자기소개와 상태메세지를 볼 수 있게됩니다.!!!!!!
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.6
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             슈퍼슈퍼 짱짱 미친 업데이트 바로 랭크 시스템 도! 입!<br/>
              이제 가입일을 기준으로 자신의 랭크를 확인 할 수 있습니다.
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.7
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             내용은 추후 변경
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.8
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             내용은 추후 변경
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.0.9
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6',
             marginBottom: '40px'
           }}>
             내용은 추후 변경
           </div>
           
           <div style={{
             fontSize: '48px',
             fontWeight: 'bold',
             color: darkMode ? '#FFD700' : '#007bff',
             marginBottom: '20px'
           }}>
             1.1.0
           </div>
           <div style={{
             fontSize: '16px',
             color: darkMode ? '#FFFFFF' : '#000000',
             lineHeight: '1.6'
           }}>
             내용은 추후 변경
           </div>
         </div>

        {/* 왼쪽 메인 사이드바 햄버거 버튼 (헤더바 높이 50px에 맞춰 상단 0, 항상 보임) */}
        <button
          onClick={() => setMainSidebarOpen((open) => !open)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1300,
            background: 'none', // 배경 제거
            border: 'none',     // 테두리 제거
            borderRadius: 0,
            width: 50,
            height: 50,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: 'none', // 그림자도 제거
            cursor: 'pointer',
            padding: 0
          }}
        >
          <div style={{ width: 24, height: 3, background: colors.burger, margin: '3px 0', borderRadius: 2 }} />
          <div style={{ width: 24, height: 3, background: colors.burger, margin: '3px 0', borderRadius: 2 }} />
          <div style={{ width: 24, height: 3, background: colors.burger, margin: '3px 0', borderRadius: 2 }} />
        </button>

        {/* 왼쪽 메인 사이드바 */}
        {mainSidebarOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: 240,
              height: '100vh',
              background: colors.sidebarBg,
              zIndex: 1100,
              boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s',
              color: colors.sidebarText
            }}
          >
            {/* 상단: 프로필 */}
            <div style={{ padding: '32px 0 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: darkMode ? '#222' : '#e3f2fd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                color: darkMode ? '#ffe066' : '#1976d2',
                marginBottom: 8,
                overflow: 'hidden'
              }}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  user.nickname?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: 18 }}>{user.nickname}</div>
              <div style={{ fontSize: 12, color: darkMode ? '#aaa' : '#888', marginTop: 2 }}>{user.email}</div>
            </div>
            {/* 중간: 카테고리 버튼 자리 (비워둠) */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {/* 추후 카테고리 버튼 추가 가능 */}
            </div>
            {/* 하단: 로그아웃/프로필수정/다크모드 버튼 */}
            <div style={{ padding: 24, borderTop: `1px solid ${colors.sidebarBorder}` }}>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: 'pointer',
                  marginBottom: 8
                }}
              >
                로그아웃
              </button>
              <button
                onClick={() => setShowProfile(true)}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: darkMode ? '#333' : '#f5f5f5',
                  color: colors.sidebarText,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 8
                }}
              >
                프로필 보기
              </button>
              <button
                onClick={() => setEditProfileOpen(true)}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: darkMode ? '#333' : '#f5f5f5',
                  color: colors.sidebarText,
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                  marginBottom: 8
                }}
              >
                프로필 수정
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  background: darkMode ? '#222' : '#f5f5f5',
                  color: darkMode ? '#ffe066' : '#333',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {darkMode ? '☀️ 라이트모드' : '🌙 다크모드'}
              </button>
            </div>
          </div>
        )}

        {/* 채팅창 (Resizable) */}
        <Resizable
          defaultSize={{
            width: 400,
            height: 600,
          }}
          minWidth={300}
          minHeight={300}
          maxWidth={window.innerWidth}
          maxHeight={window.innerHeight}
          enable={{
            top: true,
            left: true,
            topLeft: true,
          }}
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            zIndex: 1001,
            background: colors.chatBg,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px 0 0 0',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* 헤더 */}
          <div style={{ 
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: colors.headerBg,
            color: colors.headerText,
            position: 'relative',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 0,
          }}>
            <h3 style={{ margin: 0, fontSize: 16, color: colors.headerText }}>채팅</h3>
            {/* 채팅창 내 헤더 오른쪽 햄버거 버튼 (항상 보임) */}
            <button
              onClick={() => setUserSidebarOpen((open) => !open)}
              style={{
                background: 'none',
                border: 'none',
                width: 32,
                height: 32,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                padding: 0,
                marginLeft: 8,
                zIndex: 1200
              }}
            >
              <div style={{ width: 20, height: 2, background: colors.burger, margin: '2px 0', borderRadius: 2 }} />
              <div style={{ width: 20, height: 2, background: colors.burger, margin: '2px 0', borderRadius: 2 }} />
              <div style={{ width: 20, height: 2, background: colors.burger, margin: '2px 0', borderRadius: 2 }} />
            </button>
          </div>
          {/* 메인 컨텐츠 */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* 채팅창 */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              maxWidth: '100%',
            }}>
              <div style={{ 
                flex: 1,
                overflowY: 'auto',
                padding: 8,
                backgroundColor: colors.chatBg,
                minWidth: 0,
                maxWidth: '100%',
              }}>
                {messages.map((msg) => {
                  // 타임스탬프 포맷팅
                  let timeStr = '';
                  if (msg.timestamp && msg.timestamp.toDate) {
                    const date = msg.timestamp.toDate();
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    timeStr = `${hours}:${minutes}`;
                  }
                  return (
                    <div key={msg.id} style={{ 
                      margin: '4px 0',
                      padding: '8px 12px',
                      backgroundColor: msg.userId === user.uid ? colors.myMsg : colors.otherMsg,
                      borderRadius: '12px',
                      maxWidth: '100%',
                      alignSelf: msg.userId === user.uid ? 'flex-end' : 'flex-start',
                      marginLeft: msg.userId === user.uid ? 'auto' : '0',
                      marginRight: msg.userId === user.uid ? '0' : 'auto',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {/* 프로필 사진 */}
                      <div style={{ width: 32, height: 32, minWidth: 32, minHeight: 32, maxWidth: 32, maxHeight: 32, flexShrink: 0, borderRadius: '50%', overflow: 'hidden', marginRight: 8, background: colors.myMsg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: colors.headerText }}>
                        {msg.photoURL ? (
                          <img src={msg.photoURL} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} />
                        ) : (
                          msg.nickname?.[0]?.toUpperCase() || 'U'
                        )}
                      </div>
                      <div style={{minWidth:0}}>
                        <div style={{ fontSize: '12px', color: colors.nickname, fontWeight: 'bold', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {msg.nickname}
                          <RankDisplay createdAt={msg.createdAt} size="small" />
                        </div>
                        <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-line', overflowWrap: 'break-word', color: darkMode ? '#fff' : '#000' }}>{msg.text}</div>
                        {timeStr && (
                          <div style={{ fontSize: '11px', color: '#bbb', marginTop: 2 }}>{timeStr}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSubmit} style={{ 
                display: 'flex', 
                padding: '8px',
                borderTop: `1px solid ${colors.underbarBorder}`,
                backgroundColor: colors.underbarBg
              }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  style={{ 
                    flex: 1, 
                    marginRight: 8,
                    padding: '8px 12px',
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: '20px',
                    outline: 'none',
                    background: colors.inputBg,
                    color: colors.inputText
                  }}
                  placeholder="메시지를 입력하세요"
                />
                <button type="submit" style={{
                  padding: '8px 16px',
                  backgroundColor: darkMode ? '#444' : '#007bff',
                  color: darkMode ? '#ffe066' : 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer'
                }}>전송</button>
              </form>
            </div>
          </div>
          {/* 온라인 유저 사이드바 (오버레이) */}
          {userSidebarOpen && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 180,
              height: '100%',
              background: darkMode ? colors.sidebarBg : '#f8f9fa',
              zIndex: 1100,
              boxShadow: '-2px 0 12px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px 12px 12px 12px',
              color: colors.sidebarText
            }}>
              <h4 style={{ margin: 8, fontSize: 14, color: colors.sidebarText, marginBottom: 20 }}>
                온라인 ({onlineUsers.filter(user => 
                  user.lastSeen && 
                  new Date().getTime() - user.lastSeen.toDate().getTime() < 5 * 60 * 1000
                ).length})
              </h4>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {onlineUsers.map((onlineUser) => (
                  <div 
                    key={onlineUser.id} 
                    onClick={() => handleUserProfileClick(onlineUser)}
                    style={{
                      padding: '8px 12px',
                      margin: '2px 0',
                      backgroundColor: onlineUser.id === user.uid ? '#007bff' : (darkMode ? '#444' : '#f5f5f5'),
                      color: onlineUser.id === user.uid ? 'white' : colors.sidebarText,
                      borderRadius: '8px',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (onlineUser.id !== user.uid) {
                        e.target.style.backgroundColor = darkMode ? '#555' : '#e0e0e0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (onlineUser.id !== user.uid) {
                        e.target.style.backgroundColor = darkMode ? '#444' : '#f5f5f5';
                      }
                    }}
                  >
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: (onlineUser.lastSeen && 
                        new Date().getTime() - onlineUser.lastSeen.toDate().getTime() < 5 * 60 * 1000) 
                        ? '#28a745' : '#dc3545',
                      borderRadius: '50%'
                    }}></div>
                    {onlineUser.id === user.uid ? '나' : onlineUser.nickname}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Resizable>
        {/* 프로필 수정 폼 (사이드바 내 모달) */}
        {editProfileOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 240,
            height: '100vh',
            background: 'rgba(255,255,255,0.98)',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 0 12px rgba(0,0,0,0.08)'
          }}>
            <form onSubmit={handleProfileUpdate} style={{ width: '90%' }}>
              <h3 style={{ textAlign: 'center', marginBottom: 16 }}>프로필 수정</h3>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>닉네임</label>
                <input
                  type="text"
                  value={newNickname}
                  onChange={e => setNewNickname(e.target.value)}
                  style={{ width: '95%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                  disabled={editLoading}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4 }}>프로필 사진</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ width: '100%' }}
                  disabled={editLoading}
                />
                {photoPreview && (
                  <img src={photoPreview} alt="미리보기" style={{ width: 64, height: 64, borderRadius: '50%', marginTop: 8 }} />
                )}
              </div>
              {editError && <div style={{ color: 'red', marginBottom: 8 }}>{editError}</div>}
              <button
                type="submit"
                style={{ width: '100%', padding: 10, background: '#1976d2', color: 'white', border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 16, cursor: 'pointer', marginBottom: 8 }}
                disabled={editLoading}
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => { setEditProfileOpen(false); setNewPhoto(null); setPhotoPreview(null); }}
                style={{ width: '100%', padding: 8, background: '#f5f5f5', color: '#333', border: 'none', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}
                disabled={editLoading}
              >
                취소
              </button>
            </form>
          </div>
        )}
        
        {/* 프로필 페이지 */}
        {showProfile && (
          <Profile 
            user={user} 
            onBack={() => setShowProfile(false)}
            darkMode={darkMode}
            customThemeColor={customThemeColor}
            setCustomThemeColor={setCustomThemeColor}
            notificationSettings={notificationSettings}
            setNotificationSettings={setNotificationSettings}
            onUserUpdate={(updatedUser) => {
              // 사용자 정보 업데이트
              // setUser는 App.js에서 관리되므로 여기서는 직접 업데이트하지 않음
              // 대신 Profile 컴포넌트 내부에서 상태를 관리하도록 수정
            }}
          />
        )}

        {/* 다른 사용자 프로필 페이지 */}
        {showUserProfile && selectedUser && (
          <UserProfile 
            userData={selectedUser}
            onBack={() => {
              setShowUserProfile(false);
              setSelectedUser(null);
            }}
            darkMode={darkMode}
            customThemeColor={customThemeColor}
          />
        )}
        
        {/* 다크모드용 드래그바 스타일 동적 삽입 */}
        {darkMode && (
          <style>{`
            .re-resizable-handle {
              background: ${colors.border} !important;
              border-color: ${colors.border} !important;
              opacity: 0.8 !important;
              z-index: 999 !important;
            }
            .re-resizable-handle:after {
              background: ${colors.border} !important;
            }
            .re-resizable-handle:hover {
              background: ${colors.headerText} !important;
              opacity: 1 !important;
            }
            .re-resizable {
              z-index: 1000 !important;
            }
          `}</style>
        )}
      </div>
    );
  }

  // 사용자 정보가 없으면 로딩 표시
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', marginTop: 40, textAlign: 'center' }}>
      <div>로딩 중...</div>
    </div>
  );
}

export default Chat; 