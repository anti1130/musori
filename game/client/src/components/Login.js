import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function Login({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 기본 유효성 검사
    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('올바른 이메일 형식을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // Firebase 인증
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('Firebase 로그인 성공:', user);
      
      // 로그인 성공 시 사용자 정보 전달
      const userData = {
        email: user.email,
        nickname: user.displayName || user.email.split('@')[0],
        uid: user.uid
      };
      
      onLogin(userData);
    } catch (error) {
      console.error('Firebase 로그인 에러:', error);
      
      // Firebase 에러 메시지 한글화
      let errorMessage = '로그인에 실패했습니다.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = '존재하지 않는 이메일입니다.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = '비밀번호가 일치하지 않습니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식을 입력해주세요.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      maxWidth: 400, 
      margin: '100px auto', 
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>로그인</h2>
      
      {error && (
        <div style={{ 
          color: 'red', 
          backgroundColor: '#ffe6e6', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px' 
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>이메일</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '90%',
              maxWidth: '1000px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="이메일을 입력하세요"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '90%',
              maxWidth: '1000px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="비밀번호를 입력하세요"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '90%',
            maxWidth: '1000px',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#666' }}>계정이 없으신가요? </span>
        <button
          onClick={onSwitchToRegister}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: loading ? 'not-allowed' : 'pointer',
            textDecoration: 'underline'
          }}
        >
          회원가입
        </button>
      </div>
    </div>
  );
}

export default Login; 