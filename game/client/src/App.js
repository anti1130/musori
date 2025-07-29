import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [customThemeColor, setCustomThemeColor] = useState('#007bff');
  const [notificationSettings, setNotificationSettings] = useState({
    messageNotifications: true,
    mentionNotifications: true,
    summaryNotifications: false
  });

  const fetchUserSettings = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // 다크모드 설정
        if (typeof userData.darkMode === 'boolean') {
          setDarkMode(userData.darkMode);
        } else {
          setDarkMode(false);
        }

        // 테마 색상 설정
        if (userData.customThemeColor) {
          setCustomThemeColor(userData.customThemeColor);
        } else {
          setCustomThemeColor('#007bff');
        }

        // 알림 설정
        if (userData.notificationSettings) {
          setNotificationSettings(userData.notificationSettings);
        } else {
          setNotificationSettings({
            messageNotifications: true,
            mentionNotifications: true,
            summaryNotifications: false
          });
        }

        // 사용자 정보 업데이트 (statusMessage, bio, createdAt 포함)
        setUser(prevUser => ({
          ...prevUser,
          statusMessage: userData.statusMessage || '',
          bio: userData.bio || '',
          createdAt: userData.createdAt || prevUser.createdAt
        }));
      } else {
        setDarkMode(false);
        setCustomThemeColor('#007bff');
        setNotificationSettings({
          messageNotifications: true,
          mentionNotifications: true,
          summaryNotifications: false
        });
      }
    } catch (e) {
      setDarkMode(false);
      setCustomThemeColor('#007bff');
      setNotificationSettings({
        messageNotifications: true,
        mentionNotifications: true,
        summaryNotifications: false
      });
    }
  };

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 로그인된 상태
        const userData = {
          email: firebaseUser.email,
          nickname: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          uid: firebaseUser.uid,
          photoURL: firebaseUser.photoURL,
          statusMessage: '',
          bio: ''
        };
        
        // users 컬렉션에 사용자 정보 저장 (기존 정보 유지)
        let userCreatedAt = serverTimestamp();
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            // 기존 사용자: 기존 정보 유지하면서 기본 정보만 업데이트
            const existingData = userDoc.data();
            userCreatedAt = existingData.createdAt || serverTimestamp();
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...userData,
              createdAt: userCreatedAt, // 기존 가입일 유지
              statusMessage: existingData.statusMessage || '',
              bio: existingData.bio || '',
              customThemeColor: existingData.customThemeColor || '#007bff',
              notificationSettings: existingData.notificationSettings || {
                messageNotifications: true,
                mentionNotifications: true,
                summaryNotifications: false
              },
              lastSeen: serverTimestamp()
            }, { merge: true });
          } else {
            // 새 사용자: 기본 정보로 초기화
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              ...userData,
              createdAt: userCreatedAt, // 가입일 설정
              lastSeen: serverTimestamp(),
              activityScore: 0
            }, { merge: true });
          }
        } catch (error) {
          console.error('Error saving user data:', error);
        }
        
        // createdAt 정보도 포함하여 사용자 정보 설정
        const userWithCreatedAt = {
          ...userData,
          createdAt: userCreatedAt
        };
        setUser(userWithCreatedAt);
        setIsLoggedIn(true);
        await fetchUserSettings(firebaseUser.uid);
      } else {
        // 로그아웃된 상태
        setUser(null);
        setIsLoggedIn(false);
        setCurrentPage('login');
        setDarkMode(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('chat');
  };

  const handleRegister = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('chat');
  };

  const handleLogout = async () => {
    try {
      // 온라인 유저 목록에서 제거
      if (user && user.uid) {
        const userRef = doc(db, 'onlineUsers', user.uid);
        await deleteDoc(userRef);
      }
      await signOut(auth);
    } catch (error) {}
  };

  const switchToRegister = () => {
    setCurrentPage('register');
  };

  const switchToLogin = () => {
    setCurrentPage('login');
  };

  // 다크모드 토글 시 Firestore에도 저장
  const handleSetDarkMode = async (value) => {
    setDarkMode(value);
    if (user && user.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), { darkMode: value }, { merge: true });
      } catch (e) {}
    }
  };

  // 테마 색상 업데이트
  const handleSetCustomThemeColor = async (color) => {
    setCustomThemeColor(color);
    if (user && user.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), { customThemeColor: color }, { merge: true });
      } catch (e) {}
    }
  };

  // 알림 설정 업데이트
  const handleSetNotificationSettings = async (settings) => {
    setNotificationSettings(settings);
    if (user && user.uid) {
      try {
        await setDoc(doc(db, 'users', user.uid), { notificationSettings: settings }, { merge: true });
      } catch (e) {}
    }
  };

  // 로그인된 경우 채팅 페이지 표시
  if (isLoggedIn && user) {
    return (
      <div className={darkMode ? 'dark-mode' : ''}>
        <div style={{ 
          padding: 0, 
          backgroundColor: '#f8f9fa', 
          borderBottom: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 0,
          minHeight: 0
        }}>
          {/* 헤더바 내용 비움 */}
        </div>
        <Chat 
          user={user} 
          key={user?.email || 'anonymous'} 
          handleLogout={handleLogout} 
          darkMode={darkMode} 
          setDarkMode={handleSetDarkMode}
          customThemeColor={customThemeColor}
          setCustomThemeColor={handleSetCustomThemeColor}
          notificationSettings={notificationSettings}
          setNotificationSettings={handleSetNotificationSettings}
        />
      </div>
    );
  }

  // 로그인되지 않은 경우 로그인/회원가입 페이지 표시
  return (
    <div>
      {currentPage === 'login' ? (
        <Login onLogin={handleLogin} onSwitchToRegister={switchToRegister} />
      ) : (
        <Register onRegister={handleRegister} onSwitchToLogin={switchToLogin} />
      )}
    </div>
  );
}

export default App; 