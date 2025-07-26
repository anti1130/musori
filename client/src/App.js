import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);

  // Firebase 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 로그인된 상태
        const userData = {
          email: firebaseUser.email,
          nickname: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          uid: firebaseUser.uid
        };
        setUser(userData);
        setIsLoggedIn(true);
        console.log('Firebase 인증 상태: 로그인됨', userData);
      } else {
        // 로그아웃된 상태
        setUser(null);
        setIsLoggedIn(false);
        setCurrentPage('login');
        console.log('Firebase 인증 상태: 로그아웃됨');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    console.log('로그인 성공:', userData);
    console.log('로그인 전 상태:', { isLoggedIn, user, currentPage });
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('chat');
    console.log('로그인 후 상태 설정 완료');
  };

  const handleRegister = (userData) => {
    console.log('회원가입 성공:', userData);
    console.log('회원가입 전 상태:', { isLoggedIn, user, currentPage });
    setUser(userData);
    setIsLoggedIn(true);
    setCurrentPage('chat');
    console.log('회원가입 후 상태 설정 완료');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('Firebase 로그아웃 성공');
    } catch (error) {
      console.error('Firebase 로그아웃 에러:', error);
    }
  };

  const switchToRegister = () => {
    setCurrentPage('register');
  };

  const switchToLogin = () => {
    setCurrentPage('login');
  };

  // 로그인된 경우 채팅 페이지 표시
  if (isLoggedIn && user) {
    console.log('채팅 페이지 렌더링:', { isLoggedIn, user, currentPage });
    return (
      <div>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>실시간 채팅</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#666' }}>
              {user?.nickname || user?.email}님 환영합니다!
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '5px 10px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              로그아웃
            </button>
          </div>
        </div>
        <Chat user={user} key={user?.email || 'anonymous'} />
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