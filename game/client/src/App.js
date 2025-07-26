import React, { useState } from 'react';
import Chat from './components/Chat';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('login'); // 'login' or 'register'
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    // 로그인 성공 시 (나중에 서버 연동)
    setUser(userData);
    setIsLoggedIn(true);
    console.log('로그인 성공:', userData);
  };

  const handleRegister = (userData) => {
    // 회원가입 성공 시 (나중에 서버 연동)
    setUser(userData);
    setIsLoggedIn(true);
    console.log('회원가입 성공:', userData);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('login');
    // 로컬스토리지에서 토큰과 사용자 정보 삭제
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const switchToRegister = () => {
    setCurrentPage('register');
  };

  const switchToLogin = () => {
    setCurrentPage('login');
  };

  // 로그인된 경우 채팅 페이지 표시
  if (isLoggedIn) {
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
        <Chat user={user} />
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