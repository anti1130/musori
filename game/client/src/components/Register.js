import React, { useState } from 'react';

function Register({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 기본 유효성 검사
    if (!email || !password || !confirmPassword || !nickname) {
      setError('모든 필드를 입력해주세요.');
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

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      // 서버 API 호출
      const response = await fetch('https://musori.onrender.com/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, nickname }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 회원가입 성공
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onRegister(data.user);
      } else {
        // 회원가입 실패
        setError(data.error || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 에러:', error);
      setError('서버 연결에 실패했습니다.');
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
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>회원가입</h2>
      
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
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="이메일을 입력하세요"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="닉네임을 입력하세요"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>비밀번호</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="비밀번호를 입력하세요 (6자 이상)"
            disabled={loading}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
            placeholder="비밀번호를 다시 입력하세요"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '15px'
          }}
        >
          {loading ? '회원가입 중...' : '회원가입'}
        </button>
      </form>

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: '#666' }}>이미 계정이 있으신가요? </span>
        <button
          onClick={onSwitchToLogin}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: '#007bff',
            cursor: loading ? 'not-allowed' : 'pointer',
            textDecoration: 'underline'
          }}
        >
          로그인
        </button>
      </div>
    </div>
  );
}

export default Register; 
