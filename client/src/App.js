import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const fetchUserDarkMode = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && typeof userDoc.data().darkMode === 'boolean') {
        setDarkMode(userDoc.data().darkMode);
      } else {
        setDarkMode(false);
      }
    } catch (e) {
      setDarkMode(false);
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
          photoURL: firebaseUser.photoURL // 추가!
        };
        setUser(userData);
        setIsLoggedIn(true);
        await fetchUserDarkMode(firebaseUser.uid);
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
        <Chat user={user} key={user?.email || 'anonymous'} handleLogout={handleLogout} darkMode={darkMode} setDarkMode={handleSetDarkMode} />
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